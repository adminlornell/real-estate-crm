'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ArrowLeft, FileText, Plus, Settings } from 'lucide-react';
import Link from 'next/link';

export default function DocumentTemplatesPage() {
  const { user } = useAuth();
  const { 
    templates, 
    templatesLoading, 
    templatesError, 
    fetchTemplates 
  } = useDocumentStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view document templates.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/documents">
                <Button variant="outline" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Documents
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Document Templates</h1>
                <p className="text-gray-600 mt-1">Browse and manage document templates</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/documents/create">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Document
                </Button>
              </Link>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {templatesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        ) : templatesError ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{templatesError}</p>
            <Button onClick={fetchTemplates}>Try Again</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <FileText className="w-6 h-6 text-blue-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {template.document_type}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {template.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {template.template_fields?.length || 0} fields
                    </div>
                    <Link href={`/documents/create?template=${template.id}`}>
                      <Button size="sm">
                        Use Template
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!templatesLoading && !templatesError && templates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Available</h3>
            <p className="text-gray-600 mb-4">There are no document templates available at the moment.</p>
            <Button onClick={fetchTemplates}>Refresh</Button>
          </div>
        )}
      </div>
    </div>
  );
}