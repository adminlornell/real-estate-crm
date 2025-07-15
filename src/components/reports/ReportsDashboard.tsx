'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Database } from '@/types/database'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { 
  DollarSign, Home, Users, Phone, 
  Target, Award, Clock, Filter, Download, RefreshCw
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import AdvancedAnalytics from './AdvancedAnalytics'

type Property = Database['public']['Tables']['properties']['Row']
type Client = Database['public']['Tables']['clients']['Row']
type Communication = Database['public']['Tables']['communications']['Row']
type Task = Database['public']['Tables']['tasks']['Row']
type Showing = Database['public']['Tables']['showings']['Row']

interface ReportsData {
  salesMetrics: {
    totalSales: number
    totalCommission: number
    averageSalePrice: number
    salesThisMonth: number
    salesLastMonth: number
    conversionRate: number
  }
  activityMetrics: {
    totalCommunications: number
    completedTasks: number
    scheduledShowings: number
    newClients: number
    activeListings: number
  }
  performanceData: Array<{
    month: string
    sales: number
    listings: number
    clients: number
    commission: number
  }>
  communicationData: Array<{
    type: string
    count: number
    color: string
  }>
  pipelineData: Array<{
    stage: string
    value: number
    count: number
  }>
  clientTypeData: Array<{
    type: string
    count: number
    percentage: number
  }>
  activityTimeline: Array<{
    date: string
    communications: number
    showings: number
    tasks: number
  }>
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export default function ReportsDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m'>('6m')
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'advanced'>('overview')

  useEffect(() => {
    if (user) {
      fetchReportsData()
    }
  }, [user, timeRange])

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      
      // Get agent ID
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (!agent) return

      // Calculate date range
      const monthsBack = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12
      const startDate = startOfMonth(subMonths(new Date(), monthsBack))
      const endDate = endOfMonth(new Date())

      // Fetch all data in parallel
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
          .eq('agent_id', agent.id)
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', agent.id)
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('showings')
          .select('*')
          .eq('agent_id', agent.id)
          .gte('showing_date', startDate.toISOString().split('T')[0])
      ])

      const properties = propertiesResult.data || []
      const clients = clientsResult.data || []
      const communications = communicationsResult.data || []
      const tasks = tasksResult.data || []
      const showings = showingsResult.data || []

      // Calculate sales metrics
      const soldProperties = properties.filter(p => p.listing_status === 'sold')
      const totalSales = soldProperties.length
      const totalRevenue = soldProperties.reduce((sum, p) => sum + (p.price || 0), 0)
      const totalCommission = totalRevenue * 0.03 // 3% commission rate
      const averageSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0

      const thisMonth = new Date()
      const lastMonth = subMonths(thisMonth, 1)
      
      const salesThisMonth = soldProperties.filter(p => 
        p.sold_date && parseISO(p.sold_date).getMonth() === thisMonth.getMonth()
      ).length
      
      const salesLastMonth = soldProperties.filter(p => 
        p.sold_date && parseISO(p.sold_date).getMonth() === lastMonth.getMonth()
      ).length

      const totalInquiries = clients.length // Simplified conversion rate
      const conversionRate = totalInquiries > 0 ? (totalSales / totalInquiries) * 100 : 0

      // Calculate activity metrics
      const completedTasks = tasks.filter(t => t.status === 'completed').length
      const scheduledShowings = showings.filter(s => s.status === 'scheduled').length
      const newClients = clients.filter(c => 
        parseISO(c.created_at).getTime() >= startDate.getTime()
      ).length
      const activeListings = properties.filter(p => p.listing_status === 'active').length

      // Generate performance data by month
      const performanceData = []
      for (let i = monthsBack - 1; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i)
        const monthStart = startOfMonth(monthDate)
        const monthEnd = endOfMonth(monthDate)
        
        const monthSales = soldProperties.filter(p => {
          if (!p.sold_date) return false
          const saleDate = parseISO(p.sold_date)
          return saleDate >= monthStart && saleDate <= monthEnd
        }).length

        const monthListings = properties.filter(p => {
          if (!p.listing_date) return false
          const listDate = parseISO(p.listing_date)
          return listDate >= monthStart && listDate <= monthEnd
        }).length

        const monthClients = clients.filter(c => {
          const createDate = parseISO(c.created_at)
          return createDate >= monthStart && createDate <= monthEnd
        }).length

        const monthRevenue = soldProperties
          .filter(p => {
            if (!p.sold_date) return false
            const saleDate = parseISO(p.sold_date)
            return saleDate >= monthStart && saleDate <= monthEnd
          })
          .reduce((sum, p) => sum + (p.price || 0), 0)

        performanceData.push({
          month: format(monthDate, 'MMM yyyy'),
          sales: monthSales,
          listings: monthListings,
          clients: monthClients,
          commission: monthRevenue * 0.03
        })
      }

      // Communication breakdown
      const commTypes = communications.reduce((acc, comm) => {
        acc[comm.communication_type || 'other'] = (acc[comm.communication_type || 'other'] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const communicationData = Object.entries(commTypes).map(([type, count], index) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count: count as number,
        color: COLORS[index % COLORS.length]
      }))

      // Pipeline data (simplified)
      const pipelineData = [
        { stage: 'Leads', value: clients.filter(c => c.status === 'active').length, count: clients.filter(c => c.status === 'active').length },
        { stage: 'Qualified', value: clients.filter(c => c.client_type === 'buyer').length, count: clients.filter(c => c.client_type === 'buyer').length },
        { stage: 'Showing', value: showings.filter(s => s.status === 'scheduled').length, count: showings.filter(s => s.status === 'scheduled').length },
        { stage: 'Negotiating', value: properties.filter(p => p.listing_status === 'pending').length, count: properties.filter(p => p.listing_status === 'pending').length },
        { stage: 'Closed', value: soldProperties.length, count: soldProperties.length }
      ]

      // Client type breakdown
      const clientTypes = clients.reduce((acc, client) => {
        acc[client.client_type || 'other'] = (acc[client.client_type || 'other'] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const totalClients = clients.length
      const clientTypeData = Object.entries(clientTypes).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count: count as number,
        percentage: totalClients > 0 ? ((count as number) / totalClients) * 100 : 0
      }))

      // Activity timeline (last 30 days)
      const activityTimeline = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        
        const dayComms = communications.filter(c => 
          c.created_at.startsWith(dateStr)
        ).length
        
        const dayShowings = showings.filter(s => 
          s.showing_date === dateStr
        ).length
        
        const dayTasks = tasks.filter(t => 
          t.completed_at && t.completed_at.startsWith(dateStr)
        ).length

        activityTimeline.push({
          date: format(date, 'MMM dd'),
          communications: dayComms,
          showings: dayShowings,
          tasks: dayTasks
        })
      }

      setData({
        salesMetrics: {
          totalSales,
          totalCommission,
          averageSalePrice,
          salesThisMonth,
          salesLastMonth,
          conversionRate
        },
        activityMetrics: {
          totalCommunications: communications.length,
          completedTasks,
          scheduledShowings,
          newClients,
          activeListings
        },
        performanceData,
        communicationData,
        pipelineData,
        clientTypeData,
        activityTimeline
      })
    } catch (error) {
      console.error('Error fetching reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchReportsData()
    setRefreshing(false)
  }

  const handleExport = () => {
    // This would typically generate a PDF or CSV report
    console.log('Exporting report...', data)
    alert('Export functionality would be implemented here')
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(8)].map((_, i) => (
            <Card key={`reports-skeleton-${i}`} className="animate-pulse">
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

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Unable to load reports data</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-700">Performance insights and business metrics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-700" />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as '3m' | '6m' | '12m')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
            >
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="12m">Last 12 months</option>
            </select>
          </div>
          
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 bg-blue-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg ${
              activeTab === 'advanced'
                ? 'border-blue-500 text-blue-600 bg-blue-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            Advanced Analytics
          </button>
        </nav>
      </div>

      {/* Conditional Content */}
      {activeTab === 'overview' ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Sales</CardTitle>
            <Award className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{data.salesMetrics.totalSales}</div>
            <p className="text-xs text-gray-700 font-medium">
              {data.salesMetrics.salesThisMonth > data.salesMetrics.salesLastMonth ? '+' : ''}
              {data.salesMetrics.salesThisMonth - data.salesMetrics.salesLastMonth} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${data.salesMetrics.totalCommission.toLocaleString()}
            </div>
            <p className="text-xs text-gray-700 font-medium">
              Avg: ${data.salesMetrics.averageSalePrice.toLocaleString()} per sale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {data.salesMetrics.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-700 font-medium">
              Leads to sales conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Active Listings</CardTitle>
            <Home className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{data.activityMetrics.activeListings}</div>
            <p className="text-xs text-gray-700 font-medium">
              {data.activityMetrics.newClients} new clients this period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="listings" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="clients" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.pipelineData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Communication Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.communicationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) => `${type}: ${((percentage || 0)).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.communicationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">Commission Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Commission']} />
                <Area type="monotone" dataKey="commission" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Daily Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.activityTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="communications" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
              <Area type="monotone" dataKey="showings" stackId="1" stroke="#10B981" fill="#10B981" />
              <Area type="monotone" dataKey="tasks" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Phone className="h-5 w-5" />
              Communication Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 font-medium">Total Communications</span>
                <span className="font-bold text-gray-900">{data.activityMetrics.totalCommunications}</span>
              </div>
              {data.communicationData.map((item) => (
                <div key={item.type} className="flex justify-between">
                  <span className="text-sm text-gray-700 font-medium">{item.type}</span>
                  <span className="font-bold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Users className="h-5 w-5" />
              Client Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.clientTypeData.map((item) => (
                <div key={item.type} className="flex justify-between">
                  <span className="text-sm text-gray-700 font-medium">{item.type}</span>
                  <span className="font-bold text-gray-900">{item.count} ({item.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Clock className="h-5 w-5" />
              Task Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 font-medium">Completed Tasks</span>
                <span className="font-bold text-gray-900">{data.activityMetrics.completedTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 font-medium">Scheduled Showings</span>
                <span className="font-bold text-gray-900">{data.activityMetrics.scheduledShowings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 font-medium">New Clients</span>
                <span className="font-bold text-gray-900">{data.activityMetrics.newClients}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </>
      ) : (
        <AdvancedAnalytics />
      )}
    </div>
  )
} 