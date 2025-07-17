"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Users, 
  TrendingUp, 
  Target, 
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  User,
  Home,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ClientDashboardProps {
  stats: {
    activeClients: number
    activeClientsChange: number
    leadConversion: number
    leadConversionChange: number
    avgDealSize: number
    avgDealSizeChange: number
    monthlyRevenue: number
    monthlyRevenueChange: number
  }
  recentLeads: Array<{
    id: string
    name: string
    email: string
    phone?: string
    source: string
    status: "new" | "contacted" | "qualified" | "converted"
    budget: number
    created_at: string
  }>
  activeClients: Array<{
    id: string
    name: string
    email: string
    phone?: string
    status: "active" | "viewing" | "offer_made" | "closing"
    budget: number
    preferred_locations: string[]
    last_contact: string
    agent_notes?: string
  }>
  closedDeals: Array<{
    id: string
    client_name: string
    property_title: string
    sale_price: number
    commission: number
    closed_date: string
    status: "sold" | "bought"
  }>
}

export function ClientDashboard({ 
  stats, 
  recentLeads, 
  activeClients, 
  closedDeals 
}: ClientDashboardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <User className="h-4 w-4" />
      case "contacted":
        return <Phone className="h-4 w-4" />
      case "qualified":
        return <CheckCircle className="h-4 w-4" />
      case "converted":
        return <Home className="h-4 w-4" />
      case "active":
        return <Users className="h-4 w-4" />
      case "viewing":
        return <Calendar className="h-4 w-4" />
      case "offer_made":
        return <Target className="h-4 w-4" />
      case "closing":
        return <Clock className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "new":
        return "default"
      case "contacted":
        return "secondary"
      case "qualified":
        return "outline"
      case "converted":
        return "default"
      case "active":
        return "default"
      case "viewing":
        return "secondary"
      case "offer_made":
        return "destructive"
      case "closing":
        return "default"
      default:
        return "outline"
    }
  }

  const formatChange = (change: number) => {
    const sign = change > 0 ? "+" : ""
    return `${sign}${change.toFixed(1)}%`
  }

  const getChangeColor = (change: number) => {
    return change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600"
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClients}</div>
            <p className={`text-xs ${getChangeColor(stats.activeClientsChange)}`}>
              {formatChange(stats.activeClientsChange)} from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leadConversion}%</div>
            <Progress value={stats.leadConversion} className="mt-2" />
            <p className={`text-xs mt-1 ${getChangeColor(stats.leadConversionChange)}`}>
              {formatChange(stats.leadConversionChange)} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgDealSize)}</div>
            <p className={`text-xs ${getChangeColor(stats.avgDealSizeChange)}`}>
              {formatChange(stats.avgDealSizeChange)} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className={`text-xs ${getChangeColor(stats.monthlyRevenueChange)}`}>
              {formatChange(stats.monthlyRevenueChange)} from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabbed Content */}
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leads">Recent Leads</TabsTrigger>
          <TabsTrigger value="clients">Active Clients</TabsTrigger>
          <TabsTrigger value="closed">Closed Deals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>New inquiries from the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Budget: {formatCurrency(lead.budget)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {lead.source}
                        </Badge>
                        <Badge variant={getStatusVariant(lead.status)} className="text-xs">
                          {getStatusIcon(lead.status)}
                          <span className="ml-1 capitalize">{lead.status}</span>
                        </Badge>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Clients</CardTitle>
              <CardDescription>Clients currently in your pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {activeClients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Budget: {formatCurrency(client.budget)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Areas: {client.preferred_locations.join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(client.status)} className="text-xs">
                          {getStatusIcon(client.status)}
                          <span className="ml-1 capitalize">{client.status.replace('_', ' ')}</span>
                        </Badge>
                        <Button size="sm" variant="outline">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Closed Deals</CardTitle>
              <CardDescription>Successfully completed transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {closedDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{deal.client_name}</p>
                          <p className="text-sm text-muted-foreground">{deal.property_title}</p>
                          <p className="text-xs text-muted-foreground">
                            Closed: {new Date(deal.closed_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(deal.sale_price)}</p>
                        <p className="text-sm text-green-600">
                          Commission: {formatCurrency(deal.commission)}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {deal.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}