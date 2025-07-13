'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugSupabasePage() {
  const [status, setStatus] = useState<string>('Testing connection...');
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
          setStatus(`Auth error: ${authError.message}`);
          return;
        }

        // Test if document_templates table exists
        const { data, error } = await supabase
          .from('document_templates')
          .select('id, name, document_type, is_active')
          .limit(1);

        if (error) {
          setStatus(`Table error: ${error.message} (Code: ${error.code})`);
          setTableExists(false);
          return;
        }

        setTableExists(true);
        setStatus('Connection successful!');

        // Try to fetch all templates
        const { data: allTemplates, error: templatesError } = await supabase
          .from('document_templates')
          .select('*')
          .eq('is_active', true);

        if (templatesError) {
          setStatus(`Templates fetch error: ${templatesError.message}`);
        } else {
          setTemplates(allTemplates || []);
        }

      } catch (error) {
        setStatus(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className={`text-lg ${status.includes('successful') ? 'text-green-600' : status.includes('error') || status.includes('failed') ? 'text-red-600' : 'text-blue-600'}`}>
            {status}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Table Status</h2>
          <p>document_templates table exists: {tableExists === null ? 'Testing...' : tableExists ? 'Yes' : 'No'}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Templates Found ({templates.length})</h2>
          {templates.length > 0 ? (
            <div className="space-y-2">
              {templates.map((template) => (
                <div key={template.id} className="border p-3 rounded">
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-gray-600">Type: {template.document_type}</p>
                  <p className="text-sm text-gray-600">Active: {template.is_active ? 'Yes' : 'No'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No templates found</p>
          )}
        </div>
      </div>
    </div>
  );
}