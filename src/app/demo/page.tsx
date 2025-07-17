"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

import {
  PropertyCard,
  ClientDashboard,
  GlobalSearch,
  TaskKanban,
  DocumentManager,
} from "@/components/real-estate"

// Mock data for demo
const mockProperties = [
  {
    id: "1",
    title: "Luxury Downtown Condo",
    city: "New York",
    state: "NY",
    price: 450000,
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 1200,
    status: "available" as const,
    photos: ["/api/placeholder/400/300"],
    agent: {
      id: "agent1",
      name: "Sarah Johnson",
      avatar: "/api/placeholder/40/40"
    },
    interested_clients_count: 3,
    showings_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    description: "Beautiful condo in downtown",
    address: "123 Main St",
    zipcode: "10001",
    lot_size: 0,
    year_built: 2020,
    property_type: "condo" as const,
    created_by: "agent1"
  }
]

const mockDashboardStats = {
  activeClients: 245,
  activeClientsChange: 12.5,
  leadConversion: 24,
  leadConversionChange: 3.2,
  avgDealSize: 325000,
  avgDealSizeChange: 8.1,
  monthlyRevenue: 2345000,
  monthlyRevenueChange: 15.7
}

const mockRecentLeads = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    phone: "555-0123",
    source: "Website",
    status: "new" as const,
    budget: 300000,
    created_at: new Date().toISOString()
  },
  {
    id: "2",
    name: "Jane Doe",
    email: "jane@example.com",
    source: "Referral",
    status: "contacted" as const,
    budget: 450000,
    created_at: new Date().toISOString()
  }
]

const mockActiveClients = [
  {
    id: "1",
    name: "Mike Johnson",
    email: "mike@example.com",
    phone: "555-0456",
    status: "viewing" as const,
    budget: 400000,
    preferred_locations: ["Downtown", "Midtown"],
    last_contact: new Date().toISOString()
  }
]

const mockClosedDeals = [
  {
    id: "1",
    client_name: "Alice Brown",
    property_title: "Suburban House",
    sale_price: 350000,
    commission: 10500,
    closed_date: new Date().toISOString(),
    status: "sold" as const
  }
]

const mockTasks = [
  {
    id: "1",
    title: "Follow up with John Smith",
    description: "Call about property viewing",
    priority: "high" as const,
    type: "call" as const,
    status: "todo" as const,
    assignee: {
      id: "1",
      name: "Agent",
      avatar: "/api/placeholder/40/40"
    },
    client: {
      id: "1",
      name: "John Smith"
    },
    due_date: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "2",
    title: "Prepare listing documents",
    description: "Get all documents ready for new listing",
    priority: "medium" as const,
    type: "document" as const,
    status: "in_progress" as const,
    property: {
      id: "1",
      title: "Downtown Condo"
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const mockDocuments = [
  {
    id: "1",
    title: "Purchase Agreement - 123 Main St",
    type: "contract" as const,
    status: "pending_signature" as const,
    client: {
      id: "1",
      name: "John Smith",
      avatar: "/api/placeholder/40/40"
    },
    property: {
      id: "1",
      title: "Downtown Condo",
      address: "123 Main St"
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    signature_progress: 66,
    file_size: 2048000,
    pages: 12
  },
  {
    id: "2",
    title: "Disclosure Statement",
    type: "disclosure" as const,
    status: "signed" as const,
    client: {
      id: "2",
      name: "Jane Doe"
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    signed_by: [
      {
        id: "1",
        name: "Jane Doe",
        signed_at: new Date().toISOString()
      }
    ]
  }
]

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">shadcn/ui CRM Demo</h1>
              <p className="text-muted-foreground">
                Showcase of enhanced real estate CRM components
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">shadcn/ui</Badge>
              <Badge variant="outline">Next.js 15</Badge>
              <Badge variant="outline">React 19</Badge>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Global Search</CardTitle>
              <CardDescription>
                Try the global search with Cmd+K or click the search box
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <GlobalSearch
                  placeholder="Search properties, clients, documents..."
                  onSelectResult={(result) => {
                    toast.success(`Selected: ${result.title}`)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>✨ Enhanced Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Modern Property Cards with hover effects</li>
                    <li>• Advanced Client Dashboard with analytics</li>
                    <li>• Global Search with keyboard shortcuts</li>
                    <li>• Drag & Drop Task Kanban board</li>
                    <li>• Professional Document Manager</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🎨 Design System</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Consistent shadcn/ui components</li>
                    <li>• Accessible design patterns</li>
                    <li>• Mobile-responsive layouts</li>
                    <li>• Dark mode support</li>
                    <li>• Custom color schemes</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🚀 Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Real-time search & filtering</li>
                    <li>• Advanced analytics dashboard</li>
                    <li>• Task management system</li>
                    <li>• Document workflow</li>
                    <li>• Notification system</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Component Architecture</CardTitle>
                <CardDescription>
                  All components are built with shadcn/ui and follow best practices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Core Components</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Button</Badge>
                      <Badge variant="secondary">Card</Badge>
                      <Badge variant="secondary">Input</Badge>
                      <Badge variant="secondary">Dialog</Badge>
                      <Badge variant="secondary">Tabs</Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Advanced Components</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Command</Badge>
                      <Badge variant="secondary">Progress</Badge>
                      <Badge variant="secondary">Avatar</Badge>
                      <Badge variant="secondary">Badge</Badge>
                      <Badge variant="secondary">Skeleton</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enhanced Property Cards</CardTitle>
                  <CardDescription>
                    Modern property cards with hover effects, image galleries, and agent information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {mockProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        onViewDetails={(prop) => {
                          toast.success(`Viewing details for ${prop.title}`)
                        }}
                        onToggleFavorite={(id) => {
                          toast.success(`Toggled favorite for property ${id}`)
                        }}
                        isFavorite={false}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Dashboard</CardTitle>
                  <CardDescription>
                    Comprehensive dashboard with analytics, lead tracking, and client management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ClientDashboard
                    stats={mockDashboardStats}
                    recentLeads={mockRecentLeads}
                    activeClients={mockActiveClients}
                    closedDeals={mockClosedDeals}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Task Kanban Board</CardTitle>
                  <CardDescription>
                    Drag and drop task management with priority levels and assignment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TaskKanban
                    tasks={mockTasks}
                    onTaskMove={(taskId, newStatus) => {
                      toast.success(`Moved task ${taskId} to ${newStatus}`)
                    }}
                    onTaskCreate={(task) => {
                      toast.success(`Created new task: ${task.title}`)
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Document Manager</CardTitle>
                  <CardDescription>
                    Professional document management with signature tracking and file organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentManager
                    documents={mockDocuments}
                    onDocumentView={(id) => {
                      toast.success(`Viewing document ${id}`)
                    }}
                    onDocumentDownload={(id) => {
                      toast.success(`Downloading document ${id}`)
                    }}
                    onDocumentShare={(id) => {
                      toast.success(`Sharing document ${id}`)
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}