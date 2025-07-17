'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  CheckSquare, 
  Clock,
  AlertCircle,
  FileText,
  Users,
  Home,
  Handshake
} from 'lucide-react'

type TaskTemplate = Database['public']['Tables']['task_templates']['Row']
type TaskTemplateInsert = Database['public']['Tables']['task_templates']['Insert']

interface TaskItem {
  title: string
  description: string
  due_days_offset: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  task_type: 'follow_up' | 'showing' | 'document' | 'administrative'
}

interface TaskTemplateManagerProps {
  agentId: string
}

const WORKFLOW_TYPES = [
  { value: 'new_client_onboarding', label: 'New Client Onboarding', icon: Users },
  { value: 'property_listing', label: 'Property Listing', icon: Home },
  { value: 'buyer_process', label: 'Buyer Process', icon: Users },
  { value: 'seller_process', label: 'Seller Process', icon: Users },
  { value: 'closing_process', label: 'Closing Process', icon: Handshake },
  { value: 'follow_up_sequence', label: 'Follow-up Sequence', icon: Clock }
] as const

const DEFAULT_TEMPLATES = {
  new_client_onboarding: [
    {
      title: 'Welcome call with new client',
      description: 'Schedule and conduct welcome call to understand client needs',
      due_days_offset: 0,
      priority: 'high' as const,
      task_type: 'follow_up' as const
    },
    {
      title: 'Send welcome packet',
      description: 'Email welcome packet with agency information and next steps',
      due_days_offset: 1,
      priority: 'medium' as const,
      task_type: 'administrative' as const
    },
    {
      title: 'Set up client preferences',
      description: 'Review and document client preferences and requirements',
      due_days_offset: 2,
      priority: 'medium' as const,
      task_type: 'administrative' as const
    },
    {
      title: 'First follow-up call',
      description: 'Check in with client and address any questions',
      due_days_offset: 7,
      priority: 'medium' as const,
      task_type: 'follow_up' as const
    }
  ],
  buyer_process: [
    {
      title: 'Pre-approval consultation',
      description: 'Discuss financing options and connect with lender',
      due_days_offset: 0,
      priority: 'high' as const,
      task_type: 'administrative' as const
    },
    {
      title: 'Schedule property showings',
      description: 'Arrange showings based on client preferences',
      due_days_offset: 1,
      priority: 'high' as const,
      task_type: 'showing' as const
    },
    {
      title: 'Follow up after showings',
      description: 'Collect feedback and schedule additional showings if needed',
      due_days_offset: 1,
      priority: 'medium' as const,
      task_type: 'follow_up' as const
    },
    {
      title: 'Prepare offer documents',
      description: 'Draft and review offer documents with client',
      due_days_offset: 3,
      priority: 'high' as const,
      task_type: 'document' as const
    }
  ],
  seller_process: [
    {
      title: 'Property evaluation',
      description: 'Conduct comparative market analysis and property evaluation',
      due_days_offset: 0,
      priority: 'high' as const,
      task_type: 'administrative' as const
    },
    {
      title: 'Prepare listing documents',
      description: 'Gather all necessary documents for listing',
      due_days_offset: 1,
      priority: 'high' as const,
      task_type: 'document' as const
    },
    {
      title: 'Schedule professional photos',
      description: 'Arrange professional photography and staging if needed',
      due_days_offset: 2,
      priority: 'medium' as const,
      task_type: 'administrative' as const
    },
    {
      title: 'List property on MLS',
      description: 'Create and publish MLS listing',
      due_days_offset: 5,
      priority: 'high' as const,
      task_type: 'administrative' as const
    }
  ],
  closing_process: [
    {
      title: 'Order home inspection',
      description: 'Schedule and coordinate home inspection',
      due_days_offset: 0,
      priority: 'high' as const,
      task_type: 'administrative' as const
    },
    {
      title: 'Review inspection report',
      description: 'Review inspection report with client and negotiate repairs',
      due_days_offset: 3,
      priority: 'high' as const,
      task_type: 'document' as const
    },
    {
      title: 'Coordinate closing date',
      description: 'Schedule closing date with all parties',
      due_days_offset: 7,
      priority: 'high' as const,
      task_type: 'administrative' as const
    },
    {
      title: 'Final walkthrough',
      description: 'Conduct final walkthrough with client',
      due_days_offset: 14,
      priority: 'medium' as const,
      task_type: 'showing' as const
    }
  ]
}

export default function TaskTemplateManager({ agentId }: TaskTemplateManagerProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    description: string
    workflow_type: 'new_client_onboarding' | 'property_listing' | 'buyer_process' | 'seller_process' | 'closing_process' | 'follow_up_sequence'
    tasks: TaskItem[]
  }>({
    name: '',
    description: '',
    workflow_type: 'new_client_onboarding',
    tasks: []
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      description: '',
      workflow_type: 'new_client_onboarding',
      tasks: []
    })
    setShowForm(true)
  }

  const handleEditTemplate = (template: TaskTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      workflow_type: template.workflow_type,
      tasks: (template.tasks as unknown) as TaskItem[]
    })
    setShowForm(true)
  }

  const handleSaveTemplate = async () => {
    try {
      if (!formData.name.trim()) {
        alert('Please enter a template name')
        return
      }

      if (formData.tasks.length === 0) {
        alert('Please add at least one task')
        return
      }

      // Check for existing template with same workflow_type (only for new templates)
      if (!editingTemplate) {
        const { data: existingTemplate, error: checkError } = await supabase
          .from('task_templates')
          .select('id, name')
          .eq('workflow_type', formData.workflow_type)
          .eq('is_active', true)
          .single()

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking for existing template:', checkError)
          alert('Error checking for existing templates. Please try again.')
          return
        }

        if (existingTemplate) {
          const shouldReplace = confirm(
            `A template already exists for "${WORKFLOW_TYPES.find(wt => wt.value === formData.workflow_type)?.label}": "${existingTemplate.name}"\n\n` +
            'Creating a new template will deactivate the existing one. Do you want to continue?'
          )
          
          if (!shouldReplace) return

          // Deactivate the existing template
          const { error: deactivateError } = await supabase
            .from('task_templates')
            .update({ is_active: false })
            .eq('id', existingTemplate.id)

          if (deactivateError) {
            console.error('Error deactivating existing template:', deactivateError)
            alert('Error updating existing template. Please try again.')
            return
          }
        }
      }

      const templateData: TaskTemplateInsert = {
        name: formData.name,
        description: formData.description || null,
        workflow_type: formData.workflow_type,
        tasks: formData.tasks as any,
        created_by: agentId
      }

      if (editingTemplate) {
        const { error } = await supabase
          .from('task_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('task_templates')
          .insert([templateData])

        if (error) throw error
      }

      setShowForm(false)
      fetchTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template. Please try again.')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // Check for dependent tasks
      const { data: dependentTasks, error: checkError } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('template_id', templateId)
        .limit(5) // Just get a few for display

      if (checkError) {
        console.error('Error checking task dependencies:', checkError)
        alert('Error checking dependencies. Please try again.')
        return
      }

      const dependentTaskCount = dependentTasks?.length || 0
      
      let confirmMessage = 'Are you sure you want to delete this template?'
      if (dependentTaskCount > 0) {
        confirmMessage = `This template has ${dependentTaskCount} associated task(s). ` +
          'Deleting it will not affect existing tasks, but they will lose their template reference.\n\n' +
          'Are you sure you want to continue?'
      }

      if (!confirm(confirmMessage)) return

      const { error } = await supabase
        .from('task_templates')
        .update({ is_active: false })
        .eq('id', templateId)

      if (error) throw error
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template. Please try again.')
    }
  }

  const handleUseDefaultTemplate = (workflowType: string) => {
    const defaultTasks = DEFAULT_TEMPLATES[workflowType as keyof typeof DEFAULT_TEMPLATES]
    if (defaultTasks) {
      setFormData(prev => ({
        ...prev,
        tasks: defaultTasks
      }))
    }
  }

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        title: '',
        description: '',
        due_days_offset: 0,
        priority: 'medium',
        task_type: 'administrative'
      }]
    }))
  }

  const updateTask = (index: number, field: keyof TaskItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }))
  }

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getWorkflowIcon = (workflowType: string) => {
    const workflow = WORKFLOW_TYPES.find(w => w.value === workflowType)
    if (workflow) {
      const Icon = workflow.icon
      return <Icon className="w-5 h-5 text-gray-800" />
    }
    return <FileText className="w-5 h-5 text-gray-800" />
  }

  const getWorkflowLabel = (workflowType: string) => {
    const workflow = WORKFLOW_TYPES.find(w => w.value === workflowType)
    return workflow?.label || workflowType
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Task Templates</h2>
        <Button
          onClick={handleCreateTemplate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2 text-white" />
          Create Template
        </Button>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={`task-template-skeleton-${i}`} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getWorkflowIcon(template.workflow_type)}
                    <CardTitle className="text-lg text-gray-900">{template.name}</CardTitle>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      className="hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4 text-gray-800" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="hover:bg-gray-100"
                    >
                      <Trash2 className="w-4 h-4 text-gray-800" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-900 font-medium">
                    <strong>Type:</strong> {getWorkflowLabel(template.workflow_type)}
                  </div>
                  {template.description && (
                    <div className="text-sm text-gray-900">
                      {template.description}
                    </div>
                  )}
                  <div className="text-sm text-gray-900 font-medium">
                    <strong>Tasks:</strong> {((template.tasks as unknown) as TaskItem[]).length}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-gray-900">
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForm(false)}
                    className="hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 text-gray-800" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Template Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Workflow Type *
                    </label>
                    <select
                      value={formData.workflow_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, workflow_type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      {WORKFLOW_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter template description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                {/* Use Default Template */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleUseDefaultTemplate(formData.workflow_type)}
                      className="border-gray-300 text-gray-900 hover:bg-gray-50"
                    >
                      Use Default Tasks
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTask}
                      className="border-gray-300 text-gray-900 hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4 mr-2 text-gray-800" />
                      Add Task
                    </Button>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                  {formData.tasks.map((task, index) => (
                    <Card key={`form-task-${index}-${task.title?.slice(0, 10) || 'task'}`} className="border-2 border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Task {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(index)}
                            className="hover:bg-gray-100"
                          >
                            <Trash2 className="w-4 h-4 text-gray-800" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              Title *
                            </label>
                            <Input
                              value={task.title}
                              onChange={(e) => updateTask(index, 'title', e.target.value)}
                              placeholder="Enter task title"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              Due Days Offset
                            </label>
                            <Input
                              type="number"
                              value={task.due_days_offset}
                              onChange={(e) => updateTask(index, 'due_days_offset', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              Priority
                            </label>
                            <select
                              value={task.priority}
                              onChange={(e) => updateTask(index, 'priority', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              Task Type
                            </label>
                            <select
                              value={task.task_type}
                              onChange={(e) => updateTask(index, 'task_type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            >
                              <option value="administrative">Administrative</option>
                              <option value="follow_up">Follow-up</option>
                              <option value="showing">Showing</option>
                              <option value="document">Document</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-900 mb-1">
                            Description
                          </label>
                          <textarea
                            value={task.description}
                            onChange={(e) => updateTask(index, 'description', e.target.value)}
                            placeholder="Enter task description"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="border-gray-300 text-gray-900 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveTemplate}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2 text-white" />
                    Save Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
} 