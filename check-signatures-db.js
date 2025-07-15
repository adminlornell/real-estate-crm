#!/usr/bin/env node
/**
 * Simple script to check if signature-related database tables exist
 * Run with: node check-signatures-db.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSignatureTables() {
  console.log('🔍 Checking signature-related database tables...\n');

  const tablesToCheck = [
    'signature_requests',
    'signature_audit_log',
    'document_signatures'
  ];

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count(*)')
        .limit(1);

      if (error) {
        console.error(`❌ Table '${tableName}' - Error: ${error.message}`);
        if (error.code === '42P01') {
          console.error(`   Table '${tableName}' does not exist`);
        }
      } else {
        console.log(`✅ Table '${tableName}' - Accessible (${data?.[0]?.count || 0} rows)`);
      }
    } catch (err) {
      console.error(`❌ Table '${tableName}' - Unexpected error:`, err.message);
    }
  }

  // Check if the signing token generation function exists
  console.log('\n🔍 Checking database functions...');
  
  try {
    const { data, error } = await supabase.rpc('generate_signing_token');
    
    if (error) {
      console.error(`❌ Function 'generate_signing_token' - Error: ${error.message}`);
    } else {
      console.log(`✅ Function 'generate_signing_token' - Working (generated: ${data?.substring(0, 10)}...)`);
    }
  } catch (err) {
    console.error(`❌ Function 'generate_signing_token' - Error:`, err.message);
  }

  // Test signature requests API endpoint
  console.log('\n🔍 Testing API endpoints...');
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/test-signature-db`);
    const result = await response.json();
    
    if (result.tableExists) {
      console.log('✅ API endpoint /api/test-signature-db - Working');
    } else {
      console.error('❌ API endpoint /api/test-signature-db - Failed:', result.error);
    }
  } catch (err) {
    console.error('❌ API endpoint test failed:', err.message);
    console.log('   Make sure the development server is running (npm run dev)');
  }

  console.log('\n📋 Summary:');
  console.log('If you see errors above, you may need to run the signature migration:');
  console.log('1. Copy the contents of migration_signature_enhancements.sql');
  console.log('2. Run it in your Supabase SQL editor');
  console.log('3. Or use: psql -d your_db_url -f migration_signature_enhancements.sql');
}

checkSignatureTables().catch(console.error);