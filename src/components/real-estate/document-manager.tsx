"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  FileText, 
  Download, 
  Eye, 
  Edit, 
  Share, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  User,
  Calendar,
  Signature
} from "lucide-react"

interface Document {
  id: string
  title: string
  type: "contract" | "agreement" | "disclosure" | "application" | "other"
  status: "draft" | "pending_review" | "pending_signature" | "signed" | "completed"
  client?: {
    id: string
    name: string
    avatar?: string
  }
  property?: {
    id: string
    title: string
    address: string
  }
  created_at: string
  updated_at: string
  due_date?: string
  signed_by?: Array<{
    id: string
    name: string
    signed_at: string
    avatar?: string
  }>
  signature_progress?: number
  file_size?: number
  pages?: number
}

interface DocumentManagerProps {
  documents: Document[]
  onDocumentCreate?: (document: Omit<Document, "id" | "created_at" | "updated_at">) => void
  onDocumentUpdate?: (documentId: string, updates: Partial<Document>) => void
  onDocumentDelete?: (documentId: string) => void
  onDocumentView?: (documentId: string) => void
  onDocumentDownload?: (documentId: string) => void
  onDocumentShare?: (documentId: string) => void
}

export function DocumentManager({ 
  documents, 
  onDocumentCreate,
  onDocumentUpdate,
  onDocumentDelete,
  onDocumentView,
  onDocumentDownload,
  onDocumentShare
}: DocumentManagerProps) {
  const [newDocumentDialog, setNewDocumentDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  const getStatusIcon = (status: Document["status"]) => {
    switch (status) {
      case "draft":
        return <Edit className="h-4 w-4" />
      case "pending_review":
        return <Clock className="h-4 w-4" />
      case "pending_signature":
        return <Signature className="h-4 w-4" />
      case "signed":
        return <CheckCircle className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "pending_review":
        return "bg-yellow-100 text-yellow-800"
      case "pending_signature":
        return "bg-blue-100 text-blue-800"
      case "signed":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: Document["type"]) => {
    switch (type) {
      case "contract":
        return <FileText className="h-4 w-4" />
      case "agreement":
        return <FileText className="h-4 w-4" />
      case "disclosure":
        return <AlertCircle className="h-4 w-4" />
      case "application":
        return <User className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size"
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.property?.title.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus
    const matchesType = filterType === "all" || doc.type === filterType
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getDocumentStats = () => {
    const total = documents.length
    const draft = documents.filter(d => d.status === "draft").length
    const pending = documents.filter(d => d.status === "pending_signature").length
    const signed = documents.filter(d => d.status === "signed" || d.status === "completed").length
    
    return { total, draft, pending, signed }
  }

  const stats = getDocumentStats()

  const DocumentCard = ({ document }: { document: Document }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getTypeIcon(document.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{document.title}</h3>
              {document.client && (
                <p className="text-xs text-muted-foreground">
                  Client: {document.client.name}
                </p>
              )}
              {document.property && (
                <p className="text-xs text-muted-foreground">
                  Property: {document.property.title}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className={getStatusColor(document.status)}>
            {getStatusIcon(document.status)}
            <span className="ml-1 capitalize">{document.status.replace('_', ' ')}</span>
          </Badge>
          <Badge variant="outline" className="capitalize">
            {document.type}
          </Badge>
        </div>

        {document.status === "pending_signature" && document.signature_progress && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Signature Progress</span>
              <span>{document.signature_progress}%</span>
            </div>
            <Progress value={document.signature_progress} className="h-2" />
          </div>
        )}

        {document.signed_by && document.signed_by.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Signed by:</p>
            <div className="flex items-center gap-1">
              {document.signed_by.slice(0, 3).map((signer) => (
                <Avatar key={signer.id} className="h-5 w-5">
                  <AvatarImage src={signer.avatar} />
                  <AvatarFallback className="text-xs">
                    {signer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
              {document.signed_by.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{document.signed_by.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>Created: {new Date(document.created_at).toLocaleDateString()}</span>
          {document.file_size && (
            <span>{formatFileSize(document.file_size)}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onDocumentView?.(document.id)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onDocumentDownload?.(document.id)}
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onDocumentShare?.(document.id)}
          >
            <Share className="h-3 w-3 mr-1" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const CreateDocumentDialog = () => (
    <Dialog open={newDocumentDialog} onOpenChange={setNewDocumentDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
          <DialogDescription>
            Create a new document from template or upload existing
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Document Title</Label>
            <Input id="title" placeholder="Enter document title..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Document Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="agreement">Agreement</SelectItem>
                <SelectItem value="disclosure">Disclosure</SelectItem>
                <SelectItem value="application">Application</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client">Client</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client1">John Smith</SelectItem>
                <SelectItem value="client2">Jane Doe</SelectItem>
                <SelectItem value="client3">Mike Johnson</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Enter document description..." />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setNewDocumentDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => setNewDocumentDialog(false)}>
            Create Document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Management</h2>
          <p className="text-muted-foreground">
            Manage contracts, agreements, and property documents
          </p>
        </div>
        <Button onClick={() => setNewDocumentDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Signature</CardTitle>
            <Signature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.signed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="pending_signature">Pending Signature</SelectItem>
            <SelectItem value="signed">Signed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="agreement">Agreement</SelectItem>
            <SelectItem value="disclosure">Disclosure</SelectItem>
            <SelectItem value="application">Application</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus !== "all" || filterType !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first document"}
            </p>
            <Button onClick={() => setNewDocumentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateDocumentDialog />
    </div>
  )
}