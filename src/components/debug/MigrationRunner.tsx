'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function MigrationRunner() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const migrationSQL = `
-- Create client_property_interests table for tracking properties that clients are interested in
CREATE TABLE IF NOT EXISTS client_property_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    interest_level VARCHAR(20) CHECK (interest_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
    notes TEXT,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'purchased', 'not_interested')) DEFAULT 'active',
    added_by UUID REFERENCES agents(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(client_id, property_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_interests_client ON client_property_interests(client_id);
CREATE INDEX IF NOT EXISTS idx_client_interests_property ON client_property_interests(property_id);
CREATE INDEX IF NOT EXISTS idx_client_interests_status ON client_property_interests(status);
CREATE INDEX IF NOT EXISTS idx_client_interests_level ON client_property_interests(interest_level);
  `.trim()

  const runMigration = async () => {
    setIsRunning(true)
    const migrationResults = []

    try {
      // Split migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      for (const [index, statement] of statements.entries()) {
        try {
          console.log(`Running statement ${index + 1}:`, statement)
          
          const { data, error } = await supabase.rpc('execute_sql', { 
            sql: statement 
          })

          if (error) {
            // Try alternative approach with direct query
            const { data: altData, error: altError } = await supabase
              .from('__temp__')
              .select('*')
              .limit(0)

            // If that fails too, try with raw sql function if available
            throw error
          }

          migrationResults.push({
            statement: statement.substring(0, 100) + (statement.length > 100 ? '...' : ''),
            status: 'success',
            message: 'Statement executed successfully',
            details: data
          })
        } catch (err) {
          migrationResults.push({
            statement: statement.substring(0, 100) + (statement.length > 100 ? '...' : ''),
            status: 'error',
            message: err?.message || 'Statement failed',
            details: err
          })
        }
      }

      // Test the table was created
      try {
        const { data, error } = await supabase
          .from('client_property_interests')
          .select('count(*)')
          .limit(1)

        migrationResults.push({
          statement: 'Table verification',
          status: error ? 'error' : 'success',
          message: error ? 'Table not accessible' : 'Table created and accessible',
          details: error || 'Table is ready for use'
        })
      } catch (err) {
        migrationResults.push({
          statement: 'Table verification',
          status: 'error',
          message: 'Could not verify table creation',
          details: err
        })
      }

    } catch (err) {
      migrationResults.push({
        statement: 'Migration process',
        status: 'error',
        message: 'Migration failed to start',
        details: err
      })
    }

    setResults(migrationResults)
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>Migration Runner</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="font-medium text-blue-900 mb-2">
            Client Property Interests Migration
          </h4>
          <p className="text-sm text-blue-800">
            This will create the client_property_interests table and required indexes.
            The migration uses IF NOT EXISTS clauses to avoid conflicts.
          </p>
        </div>

        <Button 
          onClick={runMigration} 
          disabled={isRunning}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isRunning ? 'Running Migration...' : 'Run Migration'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Migration Results:</h4>
            {results.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(result.status)}
                  <h5 className="font-medium text-sm">{result.statement}</h5>
                </div>
                <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                {result.details && (
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {typeof result.details === 'string' 
                      ? result.details 
                      : JSON.stringify(result.details, null, 2)
                    }
                  </pre>
                )}
              </div>
            ))}
            
            {results.some(r => r.status === 'success' && r.statement === 'Table verification') && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <h4 className="font-medium text-green-900 mb-2">✅ Migration Complete!</h4>
                <p className="text-sm text-green-800">
                  The client_property_interests table has been created successfully. 
                  You can now refresh the client and property pages to use the new features.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <h4 className="font-medium text-gray-900 mb-2">Manual Migration</h4>
          <p className="text-sm text-gray-700 mb-2">
            If the automatic migration doesn't work, you can run this SQL manually in your Supabase dashboard:
          </p>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {migrationSQL}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}