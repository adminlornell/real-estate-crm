'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { User, UserCheck, UserX, AlertTriangle } from 'lucide-react'

type Property = Database['public']['Tables']['properties']['Row']
type Agent = Database['public']['Tables']['agents']['Row']

interface PropertyAgentManagerProps {
  property: Property
  currentAgentId: string
  onAgentChanged?: () => void
}

export default function PropertyAgentManager({ 
  property, 
  currentAgentId, 
  onAgentChanged 
}: PropertyAgentManagerProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .eq('status', 'active')
        .order('agent_name')

      if (agentsError) throw agentsError

      setAgents(data || [])
    } catch (err) {
      console.error('Error fetching agents:', err)
      setError('Failed to load agents')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignAgent = async (agentId: string) => {
    try {
      setIsUpdating(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          assigned_agent_id: agentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', property.id)

      if (updateError) throw updateError

      onAgentChanged?.()
    } catch (err) {
      console.error('Error assigning agent:', err)
      setError('Failed to assign agent')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUnassignAgent = async () => {
    try {
      setIsUpdating(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          assigned_agent_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', property.id)

      if (updateError) throw updateError

      onAgentChanged?.()
    } catch (err) {
      console.error('Error unassigning agent:', err)
      setError('Failed to unassign agent')
    } finally {
      setIsUpdating(false)
    }
  }

  const currentAgent = agents.find(agent => agent.id === property.assigned_agent_id)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Assigned Agent</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading agents...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <span>Assigned Agent</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Current Assignment */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Current Assignment</h4>
          {currentAgent ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-3">
                <UserCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">{currentAgent.agent_name}</p>
                  <p className="text-sm text-gray-600">{currentAgent.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnassignAgent}
                disabled={isUpdating}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <UserX className="w-4 h-4 mr-1" />
                Unassign
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <UserX className="w-5 h-5 text-gray-500" />
              <span className="text-gray-600">No agent assigned</span>
            </div>
          )}
        </div>

        {/* Available Agents */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Available Agents</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {agents.filter(agent => agent.id !== property.assigned_agent_id).map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{agent.agent_name}</p>
                    <p className="text-sm text-gray-600">{agent.email}</p>
                    {agent.specialties && agent.specialties.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Specialties: {agent.specialties.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAssignAgent(agent.id)}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdating ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            ))}
          </div>
          
          {agents.filter(agent => agent.id !== property.assigned_agent_id).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No other agents available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}