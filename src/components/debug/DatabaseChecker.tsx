'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function DatabaseChecker() {
  const [results, setResults] = useState<any[]>([])
  const [isChecking, setIsChecking] = useState(false)

  const runChecks = async () => {
    setIsChecking(true)
    const checkResults = []

    // Check 1: client_property_interests table exists
    try {
      const { data, error } = await supabase
        .from('client_property_interests')
        .select('count(*)')
        .limit(1)
      
      checkResults.push({
        name: 'client_property_interests table',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Table exists and accessible',
        details: error || data
      })
    } catch (err) {
      checkResults.push({
        name: 'client_property_interests table',
        status: 'error',
        message: 'Table check failed',
        details: err
      })
    }

    // Check 2: List all tables
    try {
      const { data, error } = await supabase
        .rpc('get_table_names')
      
      checkResults.push({
        name: 'List all tables',
        status: error ? 'warning' : 'success',
        message: error ? 'Could not list tables' : 'Tables listed successfully',
        details: error || data
      })
    } catch (err) {
      // Try alternative approach
      try {
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
        
        checkResults.push({
          name: 'List public tables',
          status: error ? 'error' : 'success',
          message: error ? 'Could not list public tables' : 'Public tables listed',
          details: error || data
        })
      } catch (err2) {
        checkResults.push({
          name: 'List tables',
          status: 'error',
          message: 'Failed to list tables',
          details: err2
        })
      }
    }

    // Check 3: Test properties table
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('count(*)')
        .limit(1)
      
      checkResults.push({
        name: 'properties table',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Properties table accessible',
        details: error || data
      })
    } catch (err) {
      checkResults.push({
        name: 'properties table',
        status: 'error',
        message: 'Properties table check failed',
        details: err
      })
    }

    // Check 4: Test clients table
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('count(*)')
        .limit(1)
      
      checkResults.push({
        name: 'clients table',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Clients table accessible',
        details: error || data
      })
    } catch (err) {
      checkResults.push({
        name: 'clients table',
        status: 'error',
        message: 'Clients table check failed',
        details: err
      })
    }

    setResults(checkResults)
    setIsChecking(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
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
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Connection Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runChecks} 
          disabled={isChecking}
          className="w-full"
        >
          {isChecking ? 'Running Checks...' : 'Run Database Checks'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(result.status)}
                  <h4 className="font-medium">{result.name}</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                {result.details && (
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {results.some(r => r.status === 'error' && r.name === 'client_property_interests table') && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 className="font-medium text-blue-900 mb-2">Migration Required</h4>
            <p className="text-sm text-blue-800 mb-2">
              The client_property_interests table doesn't exist. You need to run the migration:
            </p>
            <code className="text-xs bg-blue-100 p-2 rounded block">
              migration_property_client_relationships.sql
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  )
}