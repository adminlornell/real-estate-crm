'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import MainNavigation from '@/components/navigation/MainNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { useBrowserBackButton } from '@/hooks/useBrowserBackButton'
import { 
  Activity,
  Home,
  User,
  CheckSquare,
  MessageSquare,
  Calendar,
  FileText,
  Plus,
  Edit,
  Trash2,
  MessageCircle,
  Clock,
  Filter,
  Search,
  TrendingUp,
  Mail
} from 'lucide-react'
import BackNavigation from '@/components/navigation/BackNavigation'

type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

interface ActivityWithMetadata extends ActivityLog {
  metadata: {
    address?: string
    price?: number
    property_type?: string
    name?: string
    email?: string
    client_type?: string
    title?: string
    priority?: string
    task_type?: string
    status?: string
    task_title?: string
    comment_preview?: string
    client_name?: string
    type?: string
    subject?: string
    property_address?: string
    showing_date?: string
    [key: string]: any
  } | null
}

export default function RecentActivitiesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityWithMetadata[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityWithMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  
  // Handle browser back button for intuitive navigation
  useBrowserBackButton()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchActivities()
    }
  }, [user, authLoading, router])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) return;

      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!agent) return

      const { data: activitiesData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(100) // Get last 100 activities

      if (activitiesData) {
        setActivities(activitiesData as ActivityWithMetadata[])
        setFilteredActivities(activitiesData as ActivityWithMetadata[])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = activities

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by activity type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.activity_type === typeFilter)
    }

    // Filter by entity type
    if (entityFilter !== 'all') {
      filtered = filtered.filter(activity => activity.entity_type === entityFilter)
    }

    setFilteredActivities(filtered)
  }, [searchTerm, typeFilter, entityFilter, activities])

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'property_created':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'property_updated':
        return <Edit className="w-4 h-4 text-blue-600" />
      case 'property_deleted':
        return <Trash2 className="w-4 h-4 text-red-600" />
      case 'client_created':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'client_updated':
        return <Edit className="w-4 h-4 text-blue-600" />
      case 'client_deleted':
        return <Trash2 className="w-4 h-4 text-red-600" />
      case 'task_created':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'task_updated':
        return <Edit className="w-4 h-4 text-blue-600" />
      case 'task_completed':
        return <CheckSquare className="w-4 h-4 text-green-600" />
      case 'task_cancelled':
        return <Trash2 className="w-4 h-4 text-red-600" />
      case 'task_comment_added':
        return <MessageSquare className="w-4 h-4 text-blue-600" />
      case 'communication_logged':
        return <MessageCircle className="w-4 h-4 text-purple-600" />
      case 'showing_scheduled':
        return <Calendar className="w-4 h-4 text-orange-600" />
      case 'showing_completed':
        return <CheckSquare className="w-4 h-4 text-green-600" />
      case 'document_uploaded':
        return <FileText className="w-4 h-4 text-indigo-600" />
      case 'template_applied':
        return <Activity className="w-4 h-4 text-teal-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getEntityIcon = (entityType: string | null) => {
    switch (entityType) {
      case 'property':
        return <Home className="w-3 h-3 text-gray-500" />
      case 'client':
        return <User className="w-3 h-3 text-gray-500" />
      case 'task':
        return <CheckSquare className="w-3 h-3 text-gray-500" />
      case 'communication':
        return <MessageCircle className="w-3 h-3 text-gray-500" />
      case 'showing':
        return <Calendar className="w-3 h-3 text-gray-500" />
      case 'document':
        return <FileText className="w-3 h-3 text-gray-500" />
      default:
        return null
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getActivityColor = (activityType: string) => {
    if (activityType.includes('created')) return 'border-l-green-500'
    if (activityType.includes('updated')) return 'border-l-blue-500'
    if (activityType.includes('deleted') || activityType.includes('cancelled')) return 'border-l-red-500'
    if (activityType.includes('completed')) return 'border-l-green-500'
    if (activityType.includes('comment')) return 'border-l-purple-500'
    if (activityType.includes('communication')) return 'border-l-indigo-500'
    if (activityType.includes('showing')) return 'border-l-orange-500'
    return 'border-l-gray-500'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation title="Recent Activities" />
      
      <main className="p-6">
        {/* Header */}
        <div className="mb-6">
          <BackNavigation />
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Activity className="w-6 h-6" />
                <span>Recent Activities</span>
              </h1>
              <p className="text-gray-600 mt-1">Track all activities and changes in your CRM</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Activities</option>
                  <option value="property_created">Properties Created</option>
                  <option value="property_updated">Properties Updated</option>
                  <option value="client_created">Clients Created</option>
                  <option value="client_updated">Clients Updated</option>
                  <option value="task_completed">Tasks Completed</option>
                  <option value="communication_logged">Communications</option>
                  <option value="showing_scheduled">Showings Scheduled</option>
                </select>
                <select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Entities</option>
                  <option value="property">Properties</option>
                  <option value="client">Clients</option>
                  <option value="task">Tasks</option>
                  <option value="communication">Communications</option>
                  <option value="showing">Showings</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No activities found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm || typeFilter !== 'all' || entityFilter !== 'all'
                    ? 'Try adjusting your filters' 
                    : 'Your activities will appear here'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredActivities.map((activity) => (
              <Card
                key={activity.id}
                className={`hover:shadow-lg transition-shadow duration-200 border-l-4 ${getActivityColor(activity.activity_type)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        {getEntityIcon(activity.entity_type)}
                        <p className="text-base font-medium text-gray-900">
                          {activity.description}
                        </p>
                      </div>
                      
                      {/* Metadata display */}
                      {activity.metadata && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          {activity.metadata.address && (
                            <div className="flex items-center space-x-1">
                              <Home className="w-3 h-3" />
                              <span>{activity.metadata.address}</span>
                            </div>
                          )}
                          {activity.metadata.name && (
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{activity.metadata.name}</span>
                            </div>
                          )}
                          {activity.metadata.client_name && (
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{activity.metadata.client_name}</span>
                            </div>
                          )}
                          {activity.metadata.property_address && (
                            <div className="flex items-center space-x-1">
                              <Home className="w-3 h-3" />
                              <span>{activity.metadata.property_address}</span>
                            </div>
                          )}
                          {activity.metadata.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>{activity.metadata.email}</span>
                            </div>
                          )}
                          {activity.metadata.price && (
                            <div className="flex items-center space-x-1">
                              <span className="text-green-600 font-medium">
                                ${activity.metadata.price.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {activity.metadata.task_title && (
                            <div className="flex items-center space-x-1">
                              <CheckSquare className="w-3 h-3" />
                              <span>{activity.metadata.task_title}</span>
                            </div>
                          )}
                          {activity.metadata.priority && (
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-3 h-3" />
                              <span className="capitalize">{activity.metadata.priority} priority</span>
                            </div>
                          )}
                          {activity.metadata.comment_preview && (
                            <div className="col-span-full flex items-center space-x-1">
                              <MessageSquare className="w-3 h-3" />
                              <span className="italic">"{activity.metadata.comment_preview}"</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {activity.created_at ? formatTimeAgo(activity.created_at) : 'Unknown time'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {activity.entity_type && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full capitalize">
                              {activity.entity_type}
                            </span>
                          )}
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {activity.activity_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
} 