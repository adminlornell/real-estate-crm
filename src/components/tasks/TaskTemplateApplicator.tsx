'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { ActivityLogger } from '@/lib/activityLogger'
import { 
  CheckSquare, 
  User, 
  Home, 
  FileText, 
  Clock, 
  Play,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Database } from '@/types/database'

type TaskTemplate = Database['public']['Tables']['task_templates']['Row']

interface TaskItem {
  title: string
  description: string
  due_days_offset: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  task_type: 'follow_up' | 'showing' | 'document' | 'administrative'
}

interface TaskTemplateApplicatorProps {
  agentId: string
  entityType: 'client' | 'property'
  entityId: string
  entityName: string
  onTasksCreated?: () => void
}

function TaskTemplateApplicator({ 
  agentId, 
  entityType, 
  entityId, 
  entityName,
  onTasksCreated 
}: TaskTemplateApplicatorProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)


  useEffect(() => {
    const initializeComponent = async () => {
      if (!agentId) {
        setLoading(false)
        return
      }
      
      try {
        await cleanupDuplicateTemplates()
        await fetchTemplates()
      } catch (error) {
        console.error('Error initializing TaskTemplateApplicator:', error)
        // Still try to fetch templates even if cleanup fails
        try {
          await fetchTemplates()
        } catch (fetchError) {
          console.error('Failed to fetch templates as fallback:', fetchError)
          setLoading(false)
        }
      }
    }
    
    initializeComponent()
  }, [agentId]) // Add agentId as dependency in case it changes

  const cleanupDuplicateTemplates = async () => {
    try {
      console.log('Checking for duplicate templates to clean up...')
      
      if (!supabase) {
        console.error('Supabase client not initialized')
        return
      }
      
      // Check if we have the required environment variables
      if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
        console.error('Missing Supabase environment variables')
        return
      }
      
      // Get all active templates
      const { data: allTemplates, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('is_active', true)
        .order('workflow_type', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching templates for cleanup:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return
      }

      if (!allTemplates || allTemplates.length === 0) {
        console.log('No templates found for cleanup')
        return
      }

      // Group by workflow_type
      const templatesByWorkflow = new Map<string, typeof allTemplates>()
      
      allTemplates.forEach(template => {
        const workflowType = template.workflow_type
        if (!workflowType) {
          console.warn('Template found with no workflow_type:', template.id, template.name)
          return // Skip templates without workflow_type
        }
        
        if (!templatesByWorkflow.has(workflowType)) {
          templatesByWorkflow.set(workflowType, [])
        }
        templatesByWorkflow.get(workflowType)!.push(template)
      })

      // Find duplicates to deactivate
      const templatesToDeactivate: string[] = []
      
      templatesByWorkflow.forEach((templates, workflowType) => {
        if (templates.length > 1) {
          console.log(`Found ${templates.length} templates for workflow_type: ${workflowType}`)
          
          // Keep the most recent (first in our sorted array), deactivate the rest
          const [keepTemplate, ...duplicateTemplates] = templates
          console.log(`Keeping template: ${keepTemplate.name} (${keepTemplate.id})`)
          
          duplicateTemplates.forEach(template => {
            console.log(`Marking for deactivation: ${template.name} (${template.id})`)
            templatesToDeactivate.push(template.id)
          })
        }
      })

      // Deactivate duplicate templates if any found
      if (templatesToDeactivate.length > 0) {
        console.log(`Deactivating ${templatesToDeactivate.length} duplicate templates...`)
        console.log('Template IDs to deactivate:', templatesToDeactivate)
        
        // Validate all IDs are valid UUIDs
        const validIds = templatesToDeactivate.filter(id => {
          const isValid = typeof id === 'string' && id.length > 0
          if (!isValid) {
            console.warn('Invalid template ID found:', id)
          }
          return isValid
        })
        
        if (validIds.length === 0) {
          console.warn('No valid template IDs to deactivate')
          return
        }
        
        try {
          const { error: updateError, data: updateData } = await supabase
            .from('task_templates')
            .update({ is_active: false })
            .in('id', validIds)
            .select('id, name')

          if (updateError) {
            console.error('Error deactivating duplicate templates:', {
              message: updateError.message,
              details: updateError.details,
              hint: updateError.hint,
              code: updateError.code,
              templateIds: validIds
            })
            // Don't throw here - log and continue
            console.warn('Continuing despite deactivation error...')
          } else {
            console.log('Successfully deactivated duplicate templates:', updateData?.map(t => `${t.name} (${t.id})`))
          }
        } catch (dbError) {
          console.error('Database operation failed:', dbError)
          console.warn('Failed to deactivate templates, continuing...')
        }
      } else {
        console.log('No duplicate templates found')
      }
    } catch (error) {
      console.error('Error during template cleanup:', error)
      // Don't rethrow here - this is cleanup that shouldn't break the component
    }
  }


  const fetchTemplates = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('is_active', true)
        .order('workflow_type', { ascending: true })
        .order('created_at', { ascending: false }) // Get most recent first

      if (error) {
        console.error('Supabase error fetching templates:', error)
        throw error
      }
      
      // Get unique templates per workflow_type (most recent for each type)
      const uniqueTemplatesByWorkflow = new Map<string, typeof data[0]>()
      
      data?.forEach(template => {
        const workflowType = template.workflow_type
        if (!uniqueTemplatesByWorkflow.has(workflowType)) {
          // Since we ordered by created_at desc, this will be the most recent
          uniqueTemplatesByWorkflow.set(workflowType, template)
        }
      })
      
      const uniqueTemplates = Array.from(uniqueTemplatesByWorkflow.values())
      
      console.log(`Found ${uniqueTemplates.length} unique templates for workflow types:`, 
        uniqueTemplates.map(t => t.workflow_type))
      
      setTemplates(uniqueTemplates)
    } catch (error) {
      console.error('Error fetching templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const applyTemplate = async (template: TaskTemplate) => {
    try {
      setApplying(template.id)
      
      // Get the current authenticated user for verification
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        throw new Error(`Authentication error: ${sessionError.message}`)
      }
      if (!session?.user?.id) {
        throw new Error('User not authenticated. Please sign in again.')
      }
      
      // Safely parse the tasks JSON
      let tasks: TaskItem[] = []
      
      if (!template.tasks) {
        throw new Error('Template has no tasks defined')
      }

      try {
        if (typeof template.tasks === 'string') {
          tasks = JSON.parse(template.tasks)
        } else if (Array.isArray(template.tasks)) {
          tasks = template.tasks as unknown as TaskItem[]
        } else if (typeof template.tasks === 'object') {
          tasks = template.tasks as unknown as TaskItem[]
        } else {
          throw new Error(`Unexpected tasks format: ${typeof template.tasks}`)
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error(`Invalid template data format`)
      }

      if (!Array.isArray(tasks) || tasks.length === 0) {
        throw new Error('Template has no valid tasks defined')
      }

      // Validate task structure
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        if (!task.title || typeof task.due_days_offset !== 'number') {
          console.error('Invalid task at index', i, task)
          throw new Error(`Invalid task structure at index ${i}: missing required fields`)
        }
      }

      const now = new Date()
      
      // Create task inserts with proper data structure
      const taskInserts = tasks.map((task) => {
        const dueDate = new Date(now.getTime() + (task.due_days_offset * 24 * 60 * 60 * 1000))
        
        return {
          title: task.title,
          description: task.description || '',
          assigned_to: agentId,
          created_by: agentId, // Use agent ID as per foreign key constraint
          due_date: dueDate.toISOString(),
          priority: task.priority || 'medium',
          status: 'pending',
          task_type: task.task_type || 'follow_up',
          related_entity_type: entityType,
          related_entity_id: entityId,
          template_id: template.id
        }
      })

      console.log('Attempting to create tasks with agent ID:', agentId)
      console.log('First task insert:', taskInserts[0])

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskInserts)
        .select()

      if (error) {
        console.error('Supabase insert error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        console.error('Task inserts that failed:', JSON.stringify(taskInserts, null, 2))
        
        // Provide more specific error messages
        if (error.code === '23503') {
          throw new Error('Database constraint violation. Please check that all referenced data exists.')
        } else if (error.code === '42501') {
          throw new Error('Permission denied. Please check your access rights.')
        } else if (error.message?.includes('RLS')) {
          throw new Error('Security policy violation. Please ensure you have proper permissions.')
        } else if (error.message?.includes('assigned_to')) {
          throw new Error('Invalid agent assignment. Please refresh the page and try again.')
        } else {
          throw new Error(`Database error: ${error.message}`)
        }
      }

      console.log('Tasks created successfully:', data?.length, 'tasks')
      
      // Log the activity
      await ActivityLogger.templateApplied(
        agentId,
        template.name,
        entityType,
        entityId,
        entityName
      )
      
      alert(`Successfully created ${tasks.length} tasks from template "${template.name}"`)
      
      if (onTasksCreated) {
        onTasksCreated()
      }
    } catch (error) {
      console.error('Error applying template:', error)
      
      let errorMessage = 'Failed to apply template. Please try again.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setApplying(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border border-green-200'
      default: return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const getWorkflowIcon = (workflowType: string) => {
    switch (workflowType) {
      case 'new_client_onboarding':
      case 'buyer_process':
      case 'seller_process':
        return <User className="w-5 h-5" />
      case 'property_listing':
        return <Home className="w-5 h-5" />
      case 'closing_process':
        return <FileText className="w-5 h-5" />
      case 'follow_up_sequence':
        return <Clock className="w-5 h-5" />
      default:
        return <CheckSquare className="w-5 h-5" />
    }
  }

  const getWorkflowLabel = (workflowType: string) => {
    switch (workflowType) {
      case 'new_client_onboarding': return 'New Client Onboarding'
      case 'property_listing': return 'Property Listing'
      case 'buyer_process': return 'Buyer Process'
      case 'seller_process': return 'Seller Process'
      case 'closing_process': return 'Closing Process'
      case 'follow_up_sequence': return 'Follow-up Sequence'
      default: return workflowType
    }
  }

  const parseTasksForPreview = (template: TaskTemplate): TaskItem[] => {
    try {
      if (!template.tasks) return []
      
      if (typeof template.tasks === 'string') {
        return JSON.parse(template.tasks)
      } else if (Array.isArray(template.tasks)) {
        return template.tasks as unknown as TaskItem[]
      } else if (typeof template.tasks === 'object') {
        return template.tasks as unknown as TaskItem[]
      }
      
      return []
    } catch (error) {
      console.error('Error parsing template tasks for preview:', error)
      return []
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Apply Task Template</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-2"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
          </Button>
        </div>
        
        {!isCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={`template-applicator-skeleton-${i}`} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Apply Task Template</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700">
            For: <span className="font-semibold text-gray-900">{entityName}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-2"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {templates.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates available</h3>
                <p className="text-gray-700 font-medium">
                  Create task templates to streamline your workflow
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => {
                const tasks = parseTasksForPreview(template)
                
                return (
                  <Card key={`template-${template.id}`} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getWorkflowIcon(template.workflow_type)}
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applyTemplate(template)}
                          disabled={applying === template.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {applying === template.id ? (
                            <>
                              <Spinner size="sm" color="white" className="mr-2" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Apply
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-gray-800">
                          <strong className="text-gray-900">Type:</strong> {getWorkflowLabel(template.workflow_type)}
                        </div>
                        
                        {template.description && (
                          <div className="text-sm text-gray-800 font-medium">
                            {template.description}
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-800">
                          <strong className="text-gray-900">Tasks:</strong> {tasks.length}
                        </div>

                        {/* Task Preview */}
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-gray-900">Tasks Preview:</div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {tasks.slice(0, 3).map((task, index) => (
                              <div key={`task-${template.id}-${index}`} className="flex items-center justify-between text-xs">
                                <span className="truncate mr-2 font-medium text-gray-800">{task.title}</span>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                  <span className="text-gray-700 font-medium">
                                    {task.due_days_offset === 0 ? 'Today' : `+${task.due_days_offset}d`}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {tasks.length > 3 && (
                              <div className="text-xs text-gray-700 text-center font-medium">
                                +{tasks.length - 3} more tasks
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TaskTemplateApplicator 