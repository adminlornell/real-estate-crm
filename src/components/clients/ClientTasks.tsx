'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  ChevronDown,
  Filter,
  X,
  MessageSquare,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Home
} from 'lucide-react'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskComment = Database['public']['Tables']['task_comments']['Row']
type Client = Database['public']['Tables']['clients']['Row']
type Property = Database['public']['Tables']['properties']['Row']

interface TaskWithDetails extends Task {
  task_comments: TaskComment[]
  client?: Client
  property?: Property
}

interface ClientTasksProps {
  clientId: string
  agentId: string
  clientName: string
}

export default function ClientTasks({ clientId, agentId, clientName }: ClientTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all')
  const [recencyFilter, setRecencyFilter] = useState<'all' | 'today' | 'week' | 'month' | 'quarter'>('all')

  // Comment modal state
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [comment, setComment] = useState('')
  const [isUpdatingTask, setIsUpdatingTask] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [taskToCancel, setTaskToCancel] = useState<Task | null>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskWithDetails | null>(null)
  const [isLoadingTaskDetail, setIsLoadingTaskDetail] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [clientId, agentId])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('related_entity_type', 'client')
        .eq('related_entity_id', clientId)
        .order('created_at', { ascending: false })

      if (tasksError) {
        throw tasksError
      }

      setTasks(data || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError('Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: Task['status'], taskComment?: string) => {
    try {
      setIsUpdatingTask(true)
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      } else if (newStatus === 'in_progress') {
        updateData.completed_at = null
      }

      // Add comment to the task if provided
      if (taskComment?.trim()) {
        updateData.comments = taskComment.trim()
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error

      // Add comment to task_comments table if provided
      if (taskComment?.trim()) {
        const { error: commentError } = await supabase
          .from('task_comments')
          .insert({
            task_id: taskId,
            agent_id: agentId,
            comment: taskComment.trim()
          })

        if (commentError) {
          console.error('Error adding comment:', commentError)
        }
      }

      // Refresh tasks
      await fetchTasks()
    } catch (err) {
      console.error('Error updating task status:', err)
    } finally {
      setIsUpdatingTask(false)
    }
  }

  const handleStartTask = (task: Task) => {
    setSelectedTask(task)
    setComment('')
    setIsAddingComment(false)
    setShowCommentModal(true)
  }

  const handleAddComment = (task: Task) => {
    setSelectedTask(task)
    setComment('')
    setIsAddingComment(true)
    setShowCommentModal(true)
  }

  const handleStartTaskWithComment = async () => {
    if (!selectedTask) return

    if (isAddingComment) {
      // Just add a comment without changing status
      if (comment.trim()) {
        try {
          setIsUpdatingTask(true)
          const { error: commentError } = await supabase
            .from('task_comments')
            .insert({
              task_id: selectedTask.id,
              agent_id: agentId,
              comment: comment.trim()
            })

          if (commentError) {
            console.error('Error adding comment:', commentError)
          } else {
            // Refresh tasks to show updated comments
            await fetchTasks()
          }
        } catch (err) {
          console.error('Error adding comment:', err)
        } finally {
          setIsUpdatingTask(false)
        }
      }
    } else {
      // Start task with optional comment
      await updateTaskStatus(selectedTask.id, 'in_progress', comment)
    }
    
    setShowCommentModal(false)
    setSelectedTask(null)
    setComment('')
    setIsAddingComment(false)
  }

  const handleCancelTask = (task: Task) => {
    setTaskToCancel(task)
    setShowCancelConfirmation(true)
  }

  const confirmCancelTask = async () => {
    if (!taskToCancel) return
    
    await updateTaskStatus(taskToCancel.id, 'cancelled')
    setShowCancelConfirmation(false)
    setTaskToCancel(null)
  }

  const fetchTaskDetails = async (taskId: string) => {
    try {
      setIsLoadingTaskDetail(true)
      
      // Fetch task with all related data
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (!taskData) return

      // Fetch comments for this task
      const { data: commentsData } = await supabase
        .from('task_comments')
        .select(`
          *,
          agents (
            agent_name
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })

      // Fetch related client if applicable
      let clientData = null
      if (taskData.related_entity_type === 'client' && taskData.related_entity_id) {
        const { data } = await supabase
          .from('clients')
          .select('*')
          .eq('id', taskData.related_entity_id)
          .single()
        clientData = data
      }

      // Fetch related property if applicable
      let propertyData = null
      if (taskData.related_entity_type === 'property' && taskData.related_entity_id) {
        const { data } = await supabase
          .from('properties')
          .select('*')
          .eq('id', taskData.related_entity_id)
          .single()
        propertyData = data
      }

      const taskWithDetails: TaskWithDetails = {
        ...taskData,
        task_comments: commentsData || [],
        client: clientData,
        property: propertyData
      }

      setSelectedTaskDetail(taskWithDetails)
      setShowTaskDetail(true)
    } catch (error) {
      console.error('Error fetching task details:', error)
    } finally {
      setIsLoadingTaskDetail(false)
    }
  }

  const handleTaskCardClick = (task: Task) => {
    fetchTaskDetails(task.id)
  }

  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false)
    setSelectedTaskDetail(null)
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    if (diffDays === -1) return 'Due yesterday'
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`
    if (diffDays <= 7) return `Due in ${diffDays} days`
    
    return date.toLocaleDateString()
  }

  const getRecencyFilterLabel = () => {
    switch (recencyFilter) {
      case 'today': return 'today'
      case 'week': return 'in the last week'
      case 'month': return 'in the last month'
      case 'quarter': return 'in the last quarter'
      default: return 'for this client'
    }
  }

  const getFilteredTasks = () => {
    let filtered = tasks

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Apply recency filter
    if (recencyFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (recencyFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3)
          break
      }
      
      filtered = filtered.filter(task => new Date(task.created_at) >= filterDate)
    }

    return filtered
  }

  const filteredTasks = getFilteredTasks()
  const completedCount = tasks.filter(task => task.status === 'completed').length
  const pendingCount = tasks.filter(task => task.status === 'pending').length
  const inProgressCount = tasks.filter(task => task.status === 'in_progress').length
  const cancelledCount = tasks.filter(task => task.status === 'cancelled').length

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading tasks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchTasks} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <>
      <div>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-normal text-gray-600">
                ({tasks.length} total)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-center space-x-1">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={recencyFilter}
                  onChange={(e) => setRecencyFilter(e.target.value as typeof recencyFilter)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                </select>
              </div>
              {(statusFilter !== 'all' || recencyFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all')
                    setRecencyFilter('all')
                  }}
                  className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />
                  <span>Clear Filters</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Task Summary */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{pendingCount} Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{inProgressCount} In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{completedCount} Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{cancelledCount} Cancelled</span>
              </div>
            </div>
            {(statusFilter !== 'all' || recencyFilter !== 'all') && (
              <div className="text-xs text-gray-500">
                Showing {statusFilter !== 'all' ? statusFilter : 'all'} tasks {getRecencyFilterLabel()}
              </div>
            )}
          </div>
        </div>
        
        <div>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {tasks.length === 0 
                  ? `No tasks found for ${clientName}`
                  : `No tasks found with current filters`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleTaskCardClick(task)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(task.status)}
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        {task.priority && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      
                      {task.comments && (
                        <div className="mb-2 p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center space-x-1 mb-1">
                            <FileText className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-700 font-medium">Comment:</span>
                          </div>
                          <p className="text-gray-600">{task.comments}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(task.due_date)}</span>
                        </div>
                        {task.task_type && (
                          <div className="flex items-center space-x-1">
                            <span className="capitalize">{task.task_type.replace('_', ' ')}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      {task.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStartTask(task)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Start
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddComment(task)}
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Add Comment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelTask(task)}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {task.status === 'in_progress' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddComment(task)}
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Add Comment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelTask(task)}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {task.status === 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          >
                            Reopen
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddComment(task)}
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Add Comment
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isAddingComment ? `Add Comment: ${selectedTask.title}` : `Start Task: ${selectedTask.title}`}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isAddingComment ? 'Comment' : 'Add a comment (optional)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={isAddingComment ? "Enter your comment..." : "Enter any notes or comments about starting this task..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCommentModal(false)
                  setSelectedTask(null)
                  setComment('')
                }}
                disabled={isUpdatingTask}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartTaskWithComment}
                disabled={isUpdatingTask}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdatingTask 
                  ? (isAddingComment ? 'Adding Comment...' : 'Starting...') 
                  : (isAddingComment ? 'Add Comment' : 'Start Task')
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmation && taskToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Task
            </h3>
            
            <p className="text-gray-800 mb-6">
              Are you sure you want to cancel the task "{taskToCancel.title}"? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelConfirmation(false)
                  setTaskToCancel(null)
                }}
              >
                Keep Task
              </Button>
              <Button
                onClick={confirmCancelTask}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Cancel Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetail && selectedTaskDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTaskDetail.title}</h2>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedTaskDetail.priority || '')}`}>
                      {selectedTaskDetail.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedTaskDetail.status || '')}`}>
                      {selectedTaskDetail.status}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleCloseTaskDetail}
                  className="p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Details</h3>
                    <div className="space-y-3">
                      {selectedTaskDetail.description && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <p className="text-gray-800">{selectedTaskDetail.description}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <p className="text-gray-800">{formatDate(selectedTaskDetail.due_date)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <p className="text-gray-800">{selectedTaskDetail.task_type || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                        <p className="text-gray-800">{new Date(selectedTaskDetail.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Related Client */}
                  {selectedTaskDetail.client && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Client</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-5 h-5 text-blue-600" />
                          <h4 className="font-medium text-gray-900">
                            {selectedTaskDetail.client.first_name} {selectedTaskDetail.client.last_name}
                          </h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-800">{selectedTaskDetail.client.email}</span>
                          </div>
                          {selectedTaskDetail.client.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-600" />
                              <span className="text-gray-800">{selectedTaskDetail.client.phone}</span>
                            </div>
                          )}
                          {selectedTaskDetail.client.client_type && (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">Type:</span>
                              <span className="text-gray-800 capitalize">{selectedTaskDetail.client.client_type}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Related Property */}
                  {selectedTaskDetail.property && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Property</h3>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Home className="w-5 h-5 text-green-600" />
                          <h4 className="font-medium text-gray-900">
                            {selectedTaskDetail.property.address}
                          </h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-800">
                              {selectedTaskDetail.property.city}, {selectedTaskDetail.property.state} {selectedTaskDetail.property.zip_code}
                            </span>
                          </div>
                          {selectedTaskDetail.property.price && (
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-gray-600" />
                              <span className="text-gray-800">
                                ${selectedTaskDetail.property.price.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {selectedTaskDetail.property.property_type && (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">Type:</span>
                              <span className="text-gray-800 capitalize">{selectedTaskDetail.property.property_type.replace('_', ' ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Comments</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedTaskDetail.task_comments.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No comments yet</p>
                    ) : (
                      selectedTaskDetail.task_comments.map((comment: any) => (
                        <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {comment.agents?.agent_name || 'Agent'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-800">{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 