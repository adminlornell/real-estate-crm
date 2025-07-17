'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar,
  Plus,
  Edit3,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

// Define Communication type manually since it might not be in the generated types yet
interface Communication {
  id: string
  client_id: string
  agent_id: string
  type: string
  subject: string
  content: string
  notes: string | null
  status: string
  direction: string
  created_at: string
  updated_at: string
}

interface CommunicationTimelineProps {
  clientId: string
  agentId: string
}

interface CommunicationFormData {
  type: string
  subject: string
  content: string
  notes: string
}

export default function CommunicationTimeline({ clientId, agentId }: CommunicationTimelineProps) {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [formData, setFormData] = useState<CommunicationFormData>({
    type: 'email',
    subject: '',
    content: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCommunications()
  }, [clientId])

  const fetchCommunications = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCommunications(data || [])
    } catch (error) {
      console.error('Error fetching communications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject.trim() || !formData.content.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      const communicationData = {
        client_id: clientId,
        agent_id: agentId,
        type: formData.type,
        subject: formData.subject,
        content: formData.content,
        notes: formData.notes || null,
        status: 'sent',
        direction: 'outbound'
      }

      const { data, error } = await supabase
        .from('communications')
        .insert([communicationData])
        .select()
        .single()

      if (error) throw error

      setCommunications(prev => [data, ...prev])
      setShowForm(false)
      setFormData({
        type: 'email',
        subject: '',
        content: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error creating communication:', error)
      alert('Failed to log communication. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'phone':
        return <Phone className="w-4 h-4" />
      case 'text':
        return <MessageSquare className="w-4 h-4" />
      case 'meeting':
        return <Calendar className="w-4 h-4" />
      default:
        return <MessageCircle className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Communication History</h3>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Communication
          </Button>
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
          {/* Communication Form */}
          {showForm && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900">Log New Communication</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowForm(false)}
                    className="text-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                        required
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone Call</option>
                        <option value="text">Text Message</option>
                        <option value="meeting">Meeting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Subject *
                      </label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Communication subject"
                        required
                        className="text-gray-900 font-medium"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Communication details..."
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 font-medium"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 font-medium"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="text-gray-700 font-medium"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      {isSubmitting ? 'Logging...' : 'Log Communication'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Communications List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={`loading-comm-skeleton-${clientId}-${i}`} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : communications.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No communications yet</h3>
                <p className="text-gray-700 font-medium mb-4">
                  Start tracking your client interactions by logging your first communication.
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log First Communication
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {communications.map((comm) => (
                <Card key={comm.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {getTypeIcon(comm.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-base font-bold text-gray-900 truncate">
                            {comm.subject}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(comm.status)}`}>
                              {comm.status}
                            </span>
                            {getStatusIcon(comm.status)}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-700 font-medium mb-3">
                          <div className="flex items-center space-x-1">
                            {getTypeIcon(comm.type)}
                            <span className="capitalize font-semibold">{comm.type}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-semibold">{formatDate(comm.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="text-gray-800 font-medium mb-3">
                          {comm.content}
                        </div>
                        
                        {comm.notes && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="text-xs font-bold text-gray-700 mb-1">Notes:</div>
                            <div className="text-sm text-gray-800 font-medium">{comm.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
} 