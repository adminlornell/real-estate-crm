const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read environment variables or use defaults for local development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key';

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'your_supabase_url') {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.error('Or update this script with your actual Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync('./migration_property_client_relationships.sql', 'utf8');
    
    console.log('Applying migration to database...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration failed:', error);
      return;
    }
    
    console.log('Migration applied successfully!');
    console.log('The client_property_interests table has been created.');
    
  } catch (err) {
    console.error('Error applying migration:', err.message);
  }
}

applyMigration();