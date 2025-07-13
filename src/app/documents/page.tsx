'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Plus, FileText, Download, Eye, Trash2, Edit, Search, Settings, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useHydration } from '@/hooks/useHydration';
import MainNavigation from '@/components/navigation/MainNavigation';
import Link from 'next/link';
import DocumentsSidebar from '@/components/documents/DocumentsSidebar';

export default function DocumentsPage() {
  const { user, agent, loading } = useAuth();
  const router = useRouter();
  const isHydrated = useHydration();
  const [selectedTab, setSelectedTab] = useState<'all' | 'draft' | 'finalized' | 'signed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'document_status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const {
    documents,
    documentsLoading,
    fetchDocuments,
    deleteDocument
  } = useDocumentStore();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (agent?.id) {
      fetchDocuments(agent.id);
    }
  }, [agent?.id, fetchDocuments]);

  const filteredDocuments = documents
    .filter(doc => {
      // Status filter
      if (selectedTab !== 'all' && doc.document_status !== selectedTab) return false;
      
      // Document type filter
      if (documentTypeFilter !== 'all' && doc.document_type !== documentTypeFilter) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          doc.title?.toLowerCase().includes(searchLower) ||
          doc.document_type?.toLowerCase().includes(searchLower) ||
          (doc as any).clients?.name?.toLowerCase().includes(searchLower) ||
          (doc as any).properties?.address?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = (a.title || '').toLowerCase();
          bValue = (b.title || '').toLowerCase();
          break;
        case 'document_status':
          aValue = a.document_status || '';
          bValue = b.document_status || '';
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at || '');
          bValue = new Date(b.created_at || '');
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Get unique document types for filter dropdown
  const documentTypes = Array.from(new Set(documents.map(doc => doc.document_type)));

  // Get document stats
  const documentStats = {
    total: documents.length,
    draft: documents.filter(doc => doc.document_status === 'draft').length,
    finalized: documents.filter(doc => doc.document_status === 'finalized').length,
    signed: documents.filter(doc => doc.document_status === 'signed').length,
  };

  const handleGeneratePDF = async (documentId: string) => {
    // TODO: Implement PDF generation
    console.log('Generate PDF for document:', documentId);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(documentId);
    }
  };

  // Show loading state until hydrated and auth is resolved
  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not authenticated after hydration, show loading while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation title="Documents" />
      <main>
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
                <p className="text-gray-600 mt-1">Manage your real estate documents and agreements</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link href="/documents/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Document
                  </Button>
                </Link>
                <Link href="/documents/templates/create">
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </Link>
                <Link href="/documents/templates">
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Browse Templates
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        <div className="flex">
          {/* Sidebar for larger screens */}
          <div className="hidden lg:block w-80 p-6 pr-4">
            <DocumentsSidebar />
          </div>

          {/* Main content */}
          <div className="flex-1 p-6">
            {/* Document Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Documents</p>
                    <p className="text-2xl font-bold text-gray-900">{documentStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Drafts</p>
                    <p className="text-2xl font-bold text-gray-900">{documentStats.draft}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-8 h-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Finalized</p>
                    <p className="text-2xl font-bold text-gray-900">{documentStats.finalized}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Signed</p>
                    <p className="text-2xl font-bold text-gray-900">{documentStats.signed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search documents, clients, or properties..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Document Type Filter */}
                <div className="min-w-48">
                  <select
                    value={documentTypeFilter}
                    onChange={(e) => setDocumentTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Document Types</option>
                    {documentTypes.map((type) => (
                      <option key={type} value={type || ''}>
                        {(type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Sort Options */}
                <div className="min-w-40">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field as any);
                      setSortOrder(order as any);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="created_at-desc">Newest First</option>
                    <option value="created_at-asc">Oldest First</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                    <option value="document_status-asc">Status A-Z</option>
                    <option value="document_status-desc">Status Z-A</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: 'all', label: 'All Documents', count: documentStats.total, icon: FileText },
              { key: 'draft', label: 'Drafts', count: documentStats.draft, icon: Clock },
              { key: 'finalized', label: 'Finalized', count: documentStats.finalized, icon: AlertCircle },
              { key: 'signed', label: 'Signed', count: documentStats.signed, icon: CheckCircle }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedTab === tab.key
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    selectedTab === tab.key
                      ? 'bg-white text-blue-500'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Results Summary */}
          {searchTerm || documentTypeFilter !== 'all' ? (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Showing {filteredDocuments.length} of {documents.length} documents
                {searchTerm && (
                  <span> matching "{searchTerm}"</span>
                )}
                {documentTypeFilter !== 'all' && (
                  <span> in {documentTypeFilter.replace(/_/g, ' ')}</span>
                )}
              </p>
            </div>
          ) : null}



        {/* Loading State */}
        {documentsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Documents Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500">
                  {searchTerm || documentTypeFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms' 
                    : 'Create your first document to get started'}
                </p>
                <Link href="/documents/create" className="inline-block mt-4">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Document
                  </Button>
                </Link>
              </div>
            ) : (
              filteredDocuments.map((document) => (
                <Card key={document.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-blue-600 bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                            {document.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 font-medium mb-1">
                          {(document as any).document_templates?.name || document.document_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Type'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          Created {formatDate(document.created_at || '')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                          document.document_status === 'draft' 
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : document.document_status === 'finalized'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : document.document_status === 'signed'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {document.document_status}
                        </span>
                        {document.document_status === 'draft' && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            Needs attention
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Document Details */}
                    <div className="space-y-3 mb-4">
                      {(document as any).clients && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">Client:</span>
                          <span className="font-medium text-gray-900">{(document as any).clients.first_name} {(document as any).clients.last_name}</span>
                        </div>
                      )}
                      {(document as any).properties && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-600">Property:</span>
                          <span className="font-medium text-gray-900 truncate">{(document as any).properties.address}</span>
                        </div>
                      )}
                      {document.finalized_at && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-gray-600">Finalized:</span>
                          <span className="font-medium text-gray-900">{formatDate(document.finalized_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      <Link href={`/documents/${document.id}`} className="flex-1 min-w-0">
                        <Button variant="outline" size="sm" className="w-full justify-center hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      
                      {document.document_status === 'draft' && (
                        <Link href={`/documents/${document.id}/edit`} className="flex-1 min-w-0">
                          <Button variant="outline" size="sm" className="w-full justify-center hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      )}

                      {document.pdf_url ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(document.pdf_url!, '_blank')}
                          className="flex-1 min-w-0 justify-center hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleGeneratePDF(document.id)}
                          className="flex-1 min-w-0 justify-center hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Generate PDF
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteDocument(document.id)}
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
          </div>
        </div>

        {/* Mobile Floating Action Button */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Link href="/documents/create">
            <Button className="w-14 h-14 rounded-full shadow-lg">
              <Plus className="w-6 h-6" />
            </Button>
          </Link>
        </div>

        </div>
      </main>
    </div>
  );
}