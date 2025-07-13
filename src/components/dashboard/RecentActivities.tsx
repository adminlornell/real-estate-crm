'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
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
  Phone,
  Mail,
  MessageCircle,
  Clock
} from 'lucide-react'

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

export default function RecentActivities() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityWithMetadata[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchRecentActivities()
    }
  }, [user])

  const fetchRecentActivities = async () => {
    try {
      setLoading(true)
      
      // Get agent ID
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (!agent) return

      // Fetch recent activities
      const { data: activitiesData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (activitiesData) {
        setActivities(activitiesData as ActivityWithMetadata[])
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-700" />
            <span>Recent Activities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={`recent-activities-skeleton-${i}`} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">
          <Link href="/dashboard/recent-activities" className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
            <Activity className="w-5 h-5" />
            <span>Recent Activities</span>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent activities</p>
            <p className="text-sm text-gray-400">Your actions will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border-l-4 bg-gray-50 ${getActivityColor(activity.activity_type)}`}
              >
                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                  {getActivityIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getEntityIcon(activity.entity_type)}
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                  </div>
                  
                  {/* Additional metadata display */}
                  {activity.metadata && (
                    <div className="text-xs text-gray-600 space-y-1">
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
                      {activity.metadata.price && (
                        <div className="flex items-center space-x-1">
                          <span className="text-green-600 font-medium">
                            ${activity.metadata.price.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {activity.metadata.comment_preview && (
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-3 h-3" />
                          <span className="italic">"{activity.metadata.comment_preview}"</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(activity.created_at)}
                      </span>
                    </div>
                    {activity.entity_type && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full capitalize">
                        {activity.entity_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 