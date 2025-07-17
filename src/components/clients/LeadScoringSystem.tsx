'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Database } from '@/types/database'
import { 
  Target, TrendingUp, Star, CheckCircle, 
  Phone, Calendar, DollarSign, Activity,
  Filter, Minus
} from 'lucide-react'
import { parseISO, differenceInDays } from 'date-fns'

type Client = Database['public']['Tables']['clients']['Row']
type Communication = Database['public']['Tables']['communications']['Row']
type Showing = Database['public']['Tables']['showings']['Row']

interface ScoredClient extends Client {
  score: number
  scoreBreakdown: {
    engagement: number
    recency: number
    budget: number
    activity: number
    profile: number
  }
  priority: 'hot' | 'warm' | 'cold'
  lastActivity: string | null
  totalCommunications: number
  scheduledShowings: number
  recommendedActions: string[]
}

interface LeadScoringConfig {
  weights: {
    engagement: number
    recency: number
    budget: number
    activity: number
    profile: number
  }
  thresholds: {
    hot: number
    warm: number
  }
}

const DEFAULT_CONFIG: LeadScoringConfig = {
  weights: {
    engagement: 0.25,
    recency: 0.20,
    budget: 0.20,
    activity: 0.20,
    profile: 0.15
  },
  thresholds: {
    hot: 80,
    warm: 60
  }
}

export default function LeadScoringSystem() {
  const { user } = useAuth()
  const [scoredClients, setScoredClients] = useState<ScoredClient[]>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<LeadScoringConfig>(DEFAULT_CONFIG)
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'lastActivity'>('score')
  const [filterBy, setFilterBy] = useState<'all' | 'hot' | 'warm' | 'cold'>('all')
  const [showConfig, setShowConfig] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAndScoreClients()
    }
  }, [user, config])

  const calculateLeadScore = (
    client: Client, 
    communications: Communication[], 
    showings: Showing[]
  ): ScoredClient => {
    const clientComms = communications.filter(c => c.client_id === client.id)
    const clientShowings = showings.filter(s => s.client_id === client.id)
    
    // Engagement Score (0-100)
    const totalInteractions = clientComms.length + clientShowings.length
    const engagementScore = Math.min(100, totalInteractions * 10)
    
    // Recency Score (0-100) - based on last communication
    let recencyScore = 0
    if (clientComms.length > 0) {
      const lastComm = clientComms
        .filter(c => c.created_at)
        .sort((a, b) => 
          new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
        )[0]
      if (lastComm?.created_at) {
        const daysSinceLastComm = differenceInDays(new Date(), parseISO(lastComm.created_at))
        recencyScore = Math.max(0, 100 - (daysSinceLastComm * 3))
      }
    }
    
    // Budget Score (0-100) - based on budget range
    let budgetScore = 50 // Default
    if (client.budget_range) {
      const budget = client.budget_range as { min?: number; max?: number }
      if (budget.max && budget.max > 500000) budgetScore = 100
      else if (budget.max && budget.max > 300000) budgetScore = 80
      else if (budget.max && budget.max > 150000) budgetScore = 60
      else budgetScore = 40
    }
    
    // Activity Score (0-100) - based on recent activity
    const recentComms = clientComms.filter(c => 
      c.created_at && differenceInDays(new Date(), parseISO(c.created_at)) <= 7
    ).length
    const recentShowings = clientShowings.filter(s => 
      s.showing_date && differenceInDays(new Date(), parseISO(s.showing_date)) <= 7
    ).length
    const activityScore = Math.min(100, (recentComms + recentShowings) * 25)
    
    // Profile Score (0-100) - based on client completeness and type
    let profileScore = 0
    if (client.email) profileScore += 20
    if (client.phone) profileScore += 20
    if (client.client_type) profileScore += 20
    if (client.preferences) profileScore += 20
    if (client.source) profileScore += 20
    
    // Calculate weighted score
    const scoreBreakdown = {
      engagement: engagementScore,
      recency: recencyScore,
      budget: budgetScore,
      activity: activityScore,
      profile: profileScore
    }
    
    const totalScore = Math.round(
      engagementScore * config.weights.engagement +
      recencyScore * config.weights.recency +
      budgetScore * config.weights.budget +
      activityScore * config.weights.activity +
      profileScore * config.weights.profile
    )
    
    // Determine priority
    let priority: 'hot' | 'warm' | 'cold'
    if (totalScore >= config.thresholds.hot) priority = 'hot'
    else if (totalScore >= config.thresholds.warm) priority = 'warm'
    else priority = 'cold'
    
    // Generate recommended actions
    const recommendedActions = []
    if (recencyScore < 50) {
      recommendedActions.push('Follow up - no recent contact')
    }
    if (activityScore > 75) {
      recommendedActions.push('Schedule showing - high engagement')
    }
    if (budgetScore > 80 && engagementScore > 60) {
      recommendedActions.push('Priority lead - high budget & engagement')
    }
    if (totalScore < 40) {
      recommendedActions.push('Re-qualify or consider nurture campaign')
    }
    
    // Get last activity
    const lastActivity = clientComms.length > 0 
      ? clientComms
          .filter(c => c.created_at)
          .sort((a, b) => 
            new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
          )[0]?.created_at || null
      : null
    
    return {
      ...client,
      score: totalScore,
      scoreBreakdown,
      priority,
      lastActivity,
      totalCommunications: clientComms.length,
      scheduledShowings: clientShowings.filter(s => s.status === 'scheduled').length,
      recommendedActions
    }
  }

  const fetchAndScoreClients = async () => {
    try {
      setLoading(true)
      
      // Get agent ID
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id || '')
        .single()

      if (!agent) return

      // Fetch all data
      const [clientsResult, communicationsResult, showingsResult] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('assigned_agent_id', agent.id)
          .eq('status', 'active'),
        supabase
          .from('communications')
          .select('*')
          .eq('agent_id', agent.id),
        supabase
          .from('showings')
          .select('*')
          .eq('agent_id', agent.id)
      ])

      const clients = clientsResult.data || []
      const communications = communicationsResult.data || []
      const showings = showingsResult.data || []

      // Score all clients
      const scored = clients.map(client => 
        calculateLeadScore(client, communications, showings)
      )

      setScoredClients(scored)
    } catch (error) {
      console.error('Error fetching and scoring clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedClients = scoredClients
    .filter(client => {
      if (filterBy === 'all') return true
      return client.priority === filterBy
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        case 'lastActivity':
          if (!a.lastActivity && !b.lastActivity) return 0
          if (!a.lastActivity) return 1
          if (!b.lastActivity) return -1
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        default:
          return 0
      }
    })

  const getPriorityIcon = (priority: 'hot' | 'warm' | 'cold') => {
    switch (priority) {
      case 'hot':
        return <Star className="h-4 w-4 text-red-600" />
      case 'warm':
        return <TrendingUp className="h-4 w-4 text-orange-600" />
      case 'cold':
        return <Minus className="h-4 w-4 text-gray-700" />
    }
  }

  const getPriorityColor = (priority: 'hot' | 'warm' | 'cold') => {
    switch (priority) {
      case 'hot':
        return 'bg-red-100 text-red-800'
      case 'warm':
        return 'bg-orange-100 text-orange-800'
      case 'cold':
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={`lead-scoring-skeleton-${i}`} className="animate-pulse">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Scoring System</h2>
          <p className="text-gray-800 font-medium">AI-powered lead prioritization and recommendations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowConfig(!showConfig)} 
            variant="outline"
            className="flex items-center gap-2 border-gray-300 text-gray-900 hover:bg-gray-50"
          >
            <Target className="h-4 w-4 text-gray-800" />
            Configure
          </Button>
          <Button onClick={fetchAndScoreClients} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Activity className="h-4 w-4 text-white" />
            Refresh Scores
          </Button>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Scoring Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-gray-900">Score Weights</h4>
                <div className="space-y-3">
                  {Object.entries(config.weights).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-sm text-gray-900 font-medium capitalize">{key}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={value}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          weights: { ...prev.weights, [key]: parseFloat(e.target.value) }
                        }))}
                        className="w-24"
                      />
                      <span className="text-sm font-medium w-12 text-gray-900">{Math.round(value * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3 text-gray-900">Priority Thresholds</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-900 font-medium">Hot Lead</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={config.thresholds.hot}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        thresholds: { ...prev.thresholds, hot: parseInt(e.target.value) }
                      }))}
                      className="w-20 px-2 py-1 border rounded text-sm text-gray-900"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-900 font-medium">Warm Lead</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={config.thresholds.warm}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        thresholds: { ...prev.thresholds, warm: parseInt(e.target.value) }
                      }))}
                      className="w-20 px-2 py-1 border rounded text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-medium">Hot Leads</p>
                <p className="text-2xl font-bold text-red-600">
                  {scoredClients.filter(c => c.priority === 'hot').length}
                </p>
              </div>
              <Star className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-medium">Warm Leads</p>
                <p className="text-2xl font-bold text-orange-600">
                  {scoredClients.filter(c => c.priority === 'warm').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-medium">Cold Leads</p>
                <p className="text-2xl font-bold text-gray-800">
                  {scoredClients.filter(c => c.priority === 'cold').length}
                </p>
              </div>
              <Minus className="h-8 w-8 text-gray-700" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 font-medium">Avg Score</p>
                <p className="text-2xl font-bold text-blue-600">
                  {scoredClients.length > 0 
                    ? Math.round(scoredClients.reduce((sum, c) => sum + c.score, 0) / scoredClients.length)
                    : 0
                  }
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-800" />
          <select 
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
          >
            <option value="all">All Leads</option>
            <option value="hot">Hot Leads</option>
            <option value="warm">Warm Leads</option>
            <option value="cold">Cold Leads</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900 font-medium">Sort by:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
          >
            <option value="score">Score</option>
            <option value="name">Name</option>
            <option value="lastActivity">Last Activity</option>
          </select>
        </div>
      </div>

      {/* Clients List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAndSortedClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(client.priority)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(client.priority)}`}>
                      {client.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{client.score}</div>
                  <div className="text-xs text-gray-800 font-medium">Lead Score</div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-lg text-gray-900">
                  {client.first_name} {client.last_name}
                </h3>
                <p className="text-sm text-gray-900">{client.email}</p>
                <p className="text-sm text-gray-900">{client.client_type}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-700" />
                  <span className="text-gray-900">{client.totalCommunications} communications</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-700" />
                  <span className="text-gray-900">{client.scheduledShowings} showings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-700" />
                  <span className="text-gray-900">
                    {client.lastActivity 
                      ? `${differenceInDays(new Date(), parseISO(client.lastActivity))}d ago`
                      : 'No activity'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-700" />
                  <span className="text-gray-900">
                    {client.budget_range 
                      ? `$${(client.budget_range as { min?: number; max?: number })?.max?.toLocaleString() || 'N/A'}`
                      : 'No budget'
                    }
                  </span>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2 text-gray-900">Score Breakdown</h4>
                <div className="grid grid-cols-5 gap-1 text-xs">
                  {Object.entries(client.scoreBreakdown).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-gray-900 capitalize font-medium">{key.slice(0, 3)}</div>
                      <div className="font-medium text-gray-900">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              {client.recommendedActions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-900">Recommended Actions</h4>
                  <div className="space-y-1">
                    {client.recommendedActions.map((action, index) => (
                      <div key={`${client.id}-action-${index}-${action.slice(0, 10)}`} className="flex items-start gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-900">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedClients.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-900">
              {filterBy === 'all' 
                ? 'No active clients to score' 
                : `No ${filterBy} leads found`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 