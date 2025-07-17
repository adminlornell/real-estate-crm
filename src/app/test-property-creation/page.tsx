'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestPropertyCreationPage() {
  const { user } = useAuth()
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (test: string, result: any, error?: any) => {
    setTestResults(prev => [...prev, { test, result, error, timestamp: new Date().toISOString() }])
  }

  const runTests = async () => {
    setLoading(true)
    setTestResults([])

    try {
      // Test 1: Check current session
      const { data: { session } } = await supabase.auth.getSession()
      addResult('Current Session', { 
        user_id: session?.user?.id, 
        email: session?.user?.email,
        context_user_id: user?.id,
        context_email: user?.email
      })

      // Test 2: Check if agent exists
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user?.id || '')
        .single()

      addResult('Agent Query', agent, agentError)

      if (!agent) {
        addResult('Test Result', 'FAILED: No agent record found')
        return
      }

      // Test 3: Check RLS policies by trying to select from properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .limit(1)

      addResult('Properties SELECT Test', properties, propertiesError)

      // Test 4: Test property creation with minimal data
      const testPropertyData = {
        property_id: `TEST-${Date.now()}`,
        address: '123 Test Street',
        city: 'Test City',
        state: 'CA',
        zip_code: '12345',
        created_by: agent.id,
        assigned_agent_id: agent.id,
        listing_date: new Date().toISOString()
      }

      addResult('Test Property Data', testPropertyData)

      const { data: newProperty, error: createError } = await supabase
        .from('properties')
        .insert(testPropertyData)
        .select()
        .single()

      addResult('Property Creation Test', newProperty, createError)

      // Test 5: If creation succeeded, clean up
      if (newProperty) {
        const { error: deleteError } = await supabase
          .from('properties')
          .delete()
          .eq('id', newProperty.id)

        addResult('Cleanup Test Property', 'Deleted', deleteError)
      }

      // Test 6: Check RLS policies directly
      try {
        const { data: policies, error: policiesError } = await supabase
          .rpc('get_policies', { schema_name: 'public', table_name: 'properties' })
        
        addResult('RLS Policies Check', policies, policiesError)
      } catch (policyError) {
        addResult('RLS Policies Check', null, policyError)
      }

    } catch (error) {
      addResult('Test Suite Error', null, error)
    } finally {
      setLoading(false)
    }
  }

  const testAgentCreation = async () => {
    if (!user) return

    try {
      // Check if agent already exists
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (existingAgent) {
        addResult('Agent Already Exists', existingAgent)
        return
      }

      // Create agent record
      const { data: newAgent, error } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          agent_name: user.email || 'Test Agent',
          email: user.email || 'test@example.com',
          status: 'active',
          hire_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      addResult('Agent Creation', newAgent, error)

    } catch (error) {
      addResult('Agent Creation Error', null, error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Property Creation Debug Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Button onClick={runTests} disabled={loading}>
                {loading ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <Button onClick={testAgentCreation} variant="outline">
                Create Agent Record
              </Button>
              <Button onClick={() => setTestResults([])} variant="outline">
                Clear Results
              </Button>
            </div>

            {testResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Test Results:</h3>
                {testResults.map((result, index) => (
                  <Card key={`test-result-${index}`} className={result.error ? 'border-red-200' : 'border-green-200'}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{result.test}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {result.result && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1">Result:</p>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(result.result, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {result.error && (
                        <div className="mt-2">
                          <p className="text-sm text-red-600 mb-1">Error:</p>
                          <pre className="bg-red-50 p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(result.error, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 