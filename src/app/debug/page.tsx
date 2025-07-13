'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useClientStore } from '@/stores/useClientStore'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const { user, agent, loading } = useAuth()
  const { clients, fetchClients } = useClientStore()
  const [testResult, setTestResult] = useState('')
  const [supabaseTest, setSupabaseTest] = useState('')

  useEffect(() => {
    console.log('Debug page - testing auth and supabase')
    
    // Test Supabase connection
    const testSupabase = async () => {
      try {
        console.log('Testing Supabase connection...')
        const { data, error } = await supabase.from('agents').select('count').limit(1)
        if (error) {
          console.error('Supabase error:', error)
          setSupabaseTest('Error: ' + error.message)
        } else {
          console.log('Supabase connection successful:', data)
          setSupabaseTest('Connection successful')
        }
      } catch (error) {
        console.error('Supabase connection failed:', error)
        setSupabaseTest('Connection failed: ' + (error instanceof Error ? error.message : String(error)))
      }
    }
    
    testSupabase()
    
    // Test the client store directly
    const testClientStore = async () => {
      try {
        console.log('Calling fetchClients with hardcoded agent ID')
        await fetchClients('e249dbe5-02f3-467b-a8ec-0a6d0fedca8c')
        console.log('fetchClients completed')
        setTestResult('fetchClients called successfully')
      } catch (error) {
        console.error('Error in fetchClients:', error)
        setTestResult('Error in fetchClients: ' + (error instanceof Error ? error.message : String(error)))
      }
    }
    
    testClientStore()
  }, [fetchClients])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Supabase Connection Test:</h2>
          <p>Result: {supabaseTest}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Auth State:</h2>
          <p>Loading: {loading ? 'true' : 'false'}</p>
          <p>User: {user ? user.email : 'null'}</p>
          <p>User ID: {user?.id || 'null'}</p>
          <p>Agent: {agent ? agent.agent_name : 'null'}</p>
          <p>Agent ID: {agent?.id || 'null'}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Client Store Test:</h2>
          <p>Test Result: {testResult}</p>
          <p>Clients count: {clients.length}</p>
          <div className="mt-2">
            {clients.map((client, index) => (
              <div key={index} className="text-sm">
                {client.first_name} {client.last_name} - {client.email}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 