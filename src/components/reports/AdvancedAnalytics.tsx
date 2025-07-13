'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList
} from 'recharts'
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Clock, Target, Zap, Brain, Activity
} from 'lucide-react'
import { format, subDays, parseISO, differenceInDays } from 'date-fns'

interface AdvancedMetrics {
  leadVelocity: {
    averageTimeToConversion: number
    fastestConversion: number
    slowestConversion: number
    conversionTrend: 'up' | 'down' | 'stable'
  }
  performanceScore: {
    overall: number
    communication: number
    efficiency: number
    conversion: number
    activity: number
  }
  predictiveInsights: {
    expectedSalesThisMonth: number
    hotLeads: number
    atRiskClients: number
    recommendedActions: string[]
  }
  competitiveAnalysis: {
    marketPosition: string
    averageDaysOnMarket: number
    priceAccuracy: number
    marketShare: number
  }
  clientSatisfactionMetrics: {
    responseTime: number
    followUpRate: number
    communicationFrequency: number
    satisfactionScore: number
  }
}

export default function AdvancedAnalytics() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAdvancedMetrics()
    }
  }, [user])

  const fetchAdvancedMetrics = async () => {
    try {
      setLoading(true)
      
      // Get agent ID
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (!agent) return

      // Fetch data for analysis
      const [
        propertiesResult,
        clientsResult,
        communicationsResult,
        tasksResult,
        showingsResult
      ] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .eq('assigned_agent_id', agent.id),
        supabase
          .from('clients')
          .select('*')
          .eq('assigned_agent_id', agent.id),
        supabase
          .from('communications')
          .select('*')
          .eq('agent_id', agent.id),
        supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', agent.id),
        supabase
          .from('showings')
          .select('*')
          .eq('agent_id', agent.id)
      ])

      const properties = propertiesResult.data || []
      const clients = clientsResult.data || []
      const communications = communicationsResult.data || []
      const tasks = tasksResult.data || []
      const showings = showingsResult.data || []

      // Calculate lead velocity
      const convertedClients = clients.filter(c => c.status === 'converted')
      const conversionTimes = convertedClients.map(client => {
        const createdDate = parseISO(client.created_at)
        const lastComm = communications
          .filter(c => c.client_id === client.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        
        if (lastComm) {
          return differenceInDays(parseISO(lastComm.created_at), createdDate)
        }
        return 30 // Default if no communications
      })

      const averageTimeToConversion = conversionTimes.length > 0 
        ? conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length 
        : 0
      const fastestConversion = conversionTimes.length > 0 ? Math.min(...conversionTimes) : 0
      const slowestConversion = conversionTimes.length > 0 ? Math.max(...conversionTimes) : 0

      // Calculate performance scores (0-100)
      const totalClients = clients.length
      const activeClients = clients.filter(c => c.status === 'active').length
      const completedTasks = tasks.filter(t => t.status === 'completed').length
      const totalTasks = tasks.length
      const recentComms = communications.filter(c => 
        differenceInDays(new Date(), parseISO(c.created_at)) <= 7
      ).length

      const communicationScore = Math.min(100, (recentComms / Math.max(1, activeClients)) * 20)
      const efficiencyScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      const conversionScore = totalClients > 0 ? (convertedClients.length / totalClients) * 100 : 0
      const activityScore = Math.min(100, recentComms * 2)
      const overallScore = (communicationScore + efficiencyScore + conversionScore + activityScore) / 4

      // Predictive insights
      const hotLeads = clients.filter(c => {
        const recentActivity = communications.filter(comm => 
          comm.client_id === c.id && 
          differenceInDays(new Date(), parseISO(comm.created_at)) <= 3
        ).length
        return recentActivity >= 2 && c.status === 'active'
      }).length

      const atRiskClients = clients.filter(c => {
        const lastComm = communications
          .filter(comm => comm.client_id === c.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        
        if (!lastComm) return true
        return differenceInDays(new Date(), parseISO(lastComm.created_at)) > 14 && c.status === 'active'
      }).length

      const recommendedActions = []
      if (atRiskClients > 0) {
        recommendedActions.push(`Follow up with ${atRiskClients} clients who haven't been contacted recently`)
      }
      if (hotLeads > 0) {
        recommendedActions.push(`Schedule showings for ${hotLeads} hot leads`)
      }
      if (efficiencyScore < 70) {
        recommendedActions.push('Focus on completing pending tasks to improve efficiency')
      }
      if (communicationScore < 60) {
        recommendedActions.push('Increase communication frequency with active clients')
      }

      // Market analysis (simplified)
      const activeListings = properties.filter(p => p.listing_status === 'active')
      const soldProperties = properties.filter(p => p.listing_status === 'sold')
      const averageDaysOnMarket = soldProperties.length > 0 
        ? soldProperties.reduce((sum, p) => {
            if (p.listing_date && p.sold_date) {
              return sum + differenceInDays(parseISO(p.sold_date), parseISO(p.listing_date))
            }
            return sum + 45 // Default
          }, 0) / soldProperties.length
        : 45

      // Client satisfaction metrics
      const totalComms = communications.length
      const avgResponseTime = 4 // hours (simplified)
      const followUpRate = totalClients > 0 ? (communications.length / totalClients) : 0
      const commFrequency = activeClients > 0 ? (recentComms / activeClients) : 0

      setMetrics({
        leadVelocity: {
          averageTimeToConversion,
          fastestConversion,
          slowestConversion,
          conversionTrend: 'stable' // Simplified
        },
        performanceScore: {
          overall: Math.round(overallScore),
          communication: Math.round(communicationScore),
          efficiency: Math.round(efficiencyScore),
          conversion: Math.round(conversionScore),
          activity: Math.round(activityScore)
        },
        predictiveInsights: {
          expectedSalesThisMonth: Math.round(hotLeads * 0.3),
          hotLeads,
          atRiskClients,
          recommendedActions
        },
        competitiveAnalysis: {
          marketPosition: overallScore > 80 ? 'Top Performer' : overallScore > 60 ? 'Above Average' : 'Needs Improvement',
          averageDaysOnMarket: Math.round(averageDaysOnMarket),
          priceAccuracy: 95, // Simplified
          marketShare: 12 // Simplified percentage
        },
        clientSatisfactionMetrics: {
          responseTime: avgResponseTime,
          followUpRate: Math.round(followUpRate),
          communicationFrequency: Math.round(commFrequency * 10) / 10,
          satisfactionScore: Math.round(overallScore * 0.9) // Derived from performance
        }
      })
    } catch (error) {
      console.error('Error fetching advanced metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={`advanced-analytics-skeleton-${i}`} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-700">Unable to load advanced analytics</p>
      </div>
    )
  }

  const performanceData = [
    { subject: 'Communication', A: metrics.performanceScore.communication, fullMark: 100 },
    { subject: 'Efficiency', A: metrics.performanceScore.efficiency, fullMark: 100 },
    { subject: 'Conversion', A: metrics.performanceScore.conversion, fullMark: 100 },
    { subject: 'Activity', A: metrics.performanceScore.activity, fullMark: 100 }
  ]

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Overall Performance</CardTitle>
            <Brain className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics.performanceScore.overall}/100</div>
            <p className="text-xs text-gray-700 font-medium">
              {metrics.competitiveAnalysis.marketPosition}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Lead Velocity</CardTitle>
            <Zap className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics.leadVelocity.averageTimeToConversion}d</div>
            <p className="text-xs text-gray-700 font-medium">
              Average time to conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Hot Leads</CardTitle>
            <Target className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.predictiveInsights.hotLeads}</div>
            <p className="text-xs text-gray-700 font-medium">
              High engagement clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">At Risk Clients</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.predictiveInsights.atRiskClients}</div>
            <p className="text-xs text-gray-700 font-medium">
              Need immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Performance Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={performanceData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Client Satisfaction Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">Response Time</span>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-gray-900">{metrics.clientSatisfactionMetrics.responseTime}h</div>
                  <Clock className="h-4 w-4 text-green-500" />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">Follow-up Rate</span>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-gray-900">{metrics.clientSatisfactionMetrics.followUpRate}/client</div>
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">Communication Frequency</span>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-gray-900">{metrics.clientSatisfactionMetrics.communicationFrequency}/week</div>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 font-medium">Satisfaction Score</span>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-gray-900">{metrics.clientSatisfactionMetrics.satisfactionScore}/100</div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">AI-Powered Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {metrics.predictiveInsights.expectedSalesThisMonth}
              </div>
              <p className="text-sm text-gray-700 font-medium">Expected Sales This Month</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {metrics.competitiveAnalysis.averageDaysOnMarket}
              </div>
              <p className="text-sm text-gray-700 font-medium">Avg Days on Market</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {metrics.competitiveAnalysis.marketShare}%
              </div>
              <p className="text-sm text-gray-700 font-medium">Market Share</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-gray-900">Recommended Actions:</h4>
            <div className="space-y-2">
              {metrics.predictiveInsights.recommendedActions.map((action, index) => (
                <div key={`action-${index}-${action.slice(0, 10)}`} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800 font-medium">{action}</p>
                </div>
              ))}
              {metrics.predictiveInsights.recommendedActions.length === 0 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-800 font-medium">Great work! No immediate actions required.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Velocity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Lead Velocity Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {metrics.leadVelocity.fastestConversion}d
              </div>
              <p className="text-sm text-gray-700 font-medium">Fastest Conversion</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {metrics.leadVelocity.averageTimeToConversion}d
              </div>
              <p className="text-sm text-gray-700 font-medium">Average Conversion</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {metrics.leadVelocity.slowestConversion}d
              </div>
              <p className="text-sm text-gray-700 font-medium">Slowest Conversion</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 