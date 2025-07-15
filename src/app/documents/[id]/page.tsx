'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ArrowLeft, Download, Edit, FileText, Home, List, Plus, Settings, Share2, Printer, Eye, PenTool } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import PrintPreview from '@/components/documents/PrintPreview';
import DocumentSigning from '@/components/documents/DocumentSigning';
import { saveSignedDocument } from '@/lib/signedDocuments';

interface DocumentWithTemplate {
  id: string;
  title: string | null;
  document_name: string;
  document_type: string | null;
  field_values: any | null;
  document_status: string | null;
  pdf_url: string | null;
  created_at: string | null;
  finalized_at: string | null;
  template_id: string | null;
  document_templates: any | null;
  clients?: { id: string; first_name: string; last_name: string; email: string };
  properties?: { address: string };
}

export default function DocumentViewPage() {
  const params = useParams();
  const { user, agent } = useAuth();
  const [document, setDocument] = useState<DocumentWithTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSigningInterface, setShowSigningInterface] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchDocument(params.id as string);
    }
  }, [params.id]);

  const fetchDocument = async (documentId: string) => {
    try {
      // First check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          document_templates(*),
          clients(id, first_name, last_name, email),
          properties(address)
        `)
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch document: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Document not found');
      }
      
      setDocument(data as DocumentWithTemplate);
    } catch (error) {
      console.error('Error fetching document:', error);
      setDocument(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!document) return;
    
    try {
      const response = await fetch('/api/documents/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const generateContent = () => {
    if (!document?.document_templates?.template_content) return '';
    
    let content = document.document_templates.template_content;
    
    // Replace placeholders with actual values
    if (document.field_values) {
      Object.entries(document.field_values).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        content = content.replace(new RegExp(placeholder, 'g'), String(value || ''));
      });
    }
    
    return content;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view documents.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-4">The document you're looking for doesn't exist.</p>
          <Link href="/documents">
            <Button>Back to Documents</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Enhanced Header with Navigation */}
      <div className="bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <span className="text-gray-400">›</span>
              <Link href="/documents">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                  <List className="w-4 h-4 mr-2" />
                  Documents
                </Button>
              </Link>
              <span className="text-gray-400">›</span>
              <span className="text-sm font-medium text-gray-900">Document View</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link href="/documents/create">
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Plus className="w-4 h-4 mr-2" />
                  New Document
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Document Header */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link href="/documents">
                  <Button variant="outline" size="sm" className="mr-4 border-gray-400 text-gray-800 hover:bg-gray-100 font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Documents
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{document.title || document.document_name}</h1>
                  <p className="text-gray-700 mt-1 font-medium">{document.document_templates?.name || 'No template'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {document.document_status === 'draft' && (
                  <Link href={`/documents/${document.id}/edit`}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Document
                    </Button>
                  </Link>
                )}
                
                <Button 
                  variant="outline" 
                  className="border-blue-400 text-blue-800 hover:bg-blue-50 font-medium"
                  onClick={() => setShowPrintPreview(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Print Preview
                </Button>

                <Button 
                  variant="outline" 
                  className="border-gray-400 text-gray-800 hover:bg-gray-100 font-medium"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Quick Print
                </Button>

                <Button 
                  variant="outline" 
                  className="border-gray-400 text-gray-800 hover:bg-gray-100 font-medium"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>

                <Button 
                  variant="outline" 
                  className="border-purple-400 text-purple-800 hover:bg-purple-50 font-medium"
                  onClick={() => setShowSigningInterface(true)}
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Sign Document
                </Button>
                
                {document.pdf_url ? (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white font-medium"
                    onClick={() => window.open(document.pdf_url!, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                ) : (
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white font-medium"
                    onClick={handleGeneratePDF}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate PDF
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Document Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-gray-300 shadow-lg">
              <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Document Information</h2>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Status</p>
                  <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border-2 ${
                    document.document_status === 'draft' 
                      ? 'bg-yellow-50 text-yellow-900 border-yellow-300'
                      : document.document_status === 'finalized'
                      ? 'bg-blue-50 text-blue-900 border-blue-300'
                      : document.document_status === 'signed'
                      ? 'bg-green-50 text-green-900 border-green-300'
                      : 'bg-gray-50 text-gray-900 border-gray-300'
                  }`}>
                    {document.document_status?.toUpperCase()}
                  </span>
                </div>

                <div className="border-t-2 border-gray-200 pt-4">
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Created</p>
                  <p className="text-base font-medium text-gray-900">{document.created_at ? formatDate(document.created_at) : 'Unknown'}</p>
                </div>

                {document.finalized_at && (
                  <div className="border-t-2 border-gray-200 pt-4">
                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Finalized</p>
                    <p className="text-base font-medium text-gray-900">{document.finalized_at ? formatDate(document.finalized_at) : 'Unknown'}</p>
                  </div>
                )}

                {document.clients && (
                  <div className="border-t-2 border-gray-200 pt-4">
                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Client</p>
                    <p className="text-base font-bold text-gray-900">{document.clients.first_name} {document.clients.last_name}</p>
                    <p className="text-sm text-gray-700 font-medium">{document.clients.email}</p>
                  </div>
                )}

                {document.properties && (
                  <div className="border-t-2 border-gray-200 pt-4">
                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Property</p>
                    <p className="text-base font-bold text-gray-900">{document.properties.address}</p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="border-t-2 border-gray-200 pt-4">
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Quick Actions</p>
                  <div className="space-y-2">
                    <Link href="/documents" className="block">
                      <Button variant="outline" size="sm" className="w-full justify-start border-2 border-gray-300 text-gray-800 font-medium hover:bg-gray-100">
                        <List className="w-4 h-4 mr-2" />
                        All Documents
                      </Button>
                    </Link>
                    <Link href="/documents/create" className="block">
                      <Button variant="outline" size="sm" className="w-full justify-start border-2 border-gray-300 text-gray-800 font-medium hover:bg-gray-100">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Document Content */}
          <div className="lg:col-span-3">
            <Card className="border-2 border-gray-300 shadow-lg">
              <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Document Content</h2>
              </CardHeader>
              <CardContent className="p-8">
                <div 
                  className="prose max-w-none document-content text-gray-900"
                  dangerouslySetInnerHTML={{ __html: generateContent() }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .document-content {
          font-family: 'Times New Roman', serif;
          line-height: 1.8;
          color: #111827;
          font-size: 1rem;
        }
        
        .document-content h1 {
          text-align: center;
          font-size: 1.75rem;
          font-weight: 900;
          margin-bottom: 2.5rem;
          text-transform: uppercase;
          color: #000000;
          letter-spacing: 0.05em;
          border-bottom: 3px solid #000000;
          padding-bottom: 1rem;
        }
        
        .document-content h2 {
          font-size: 1.375rem;
          font-weight: 800;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          text-transform: uppercase;
          color: #000000;
          letter-spacing: 0.025em;
          border-bottom: 2px solid #374151;
          padding-bottom: 0.5rem;
        }
        
        .document-content h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #000000;
          text-decoration: underline;
        }
        
        .document-content p {
          margin-bottom: 1rem;
          font-weight: 500;
          color: #111827;
        }
        
        .document-content strong {
          font-weight: 800;
          color: #000000;
        }
        
        .document-content .signature-block {
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          border: 2px solid #374151;
          background-color: #f9fafb;
        }
        
        .document-content .property-section,
        .document-content .parties-section,
        .document-content .terms-section,
        .document-content .signatures-section {
          margin-bottom: 3rem;
          padding: 1.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background-color: #ffffff;
        }
        
        .document-content table {
          border-collapse: collapse;
          width: 100%;
          margin-top: 2rem;
        }
        
        .document-content td {
          padding: 1rem;
          border: 2px solid #374151;
          vertical-align: top;
        }
        
        .document-content .document-container {
          background-color: #ffffff;
          padding: 2rem;
          border: 3px solid #000000;
          border-radius: 0.5rem;
        }
        
        @media print {
          .document-content {
            font-size: 12pt;
            line-height: 1.6;
          }
        }
      `}</style>

      {/* Print Preview Modal */}
      {document && (
        <PrintPreview
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          documentData={{
            id: document.id,
            title: document.title || document.document_name,
            content: generateContent(),
            document_templates: document.document_templates,
            field_values: document.field_values
          }}
          onPrint={undefined}
          onDownload={document.pdf_url ? () => window.open(document.pdf_url!, '_blank') : handleGeneratePDF}
        />
      )}

      {/* Document Signing Interface */}
      {showSigningInterface && document && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <DocumentSigning
              documentData={{
                id: document.id,
                title: document.title || document.document_name,
                content: generateContent()
              }}
              onSigningComplete={async (documentWithSignatures) => {
                console.log('Document signed:', documentWithSignatures);
                
                try {
                  // Save signed document to local storage (now async)
                  const signedDoc = await saveSignedDocument({
                    title: documentWithSignatures.title || 'Untitled Document',
                    content: documentWithSignatures.content, // This includes the embedded signatures
                    signedBy: documentWithSignatures.signed_by,
                    signedAt: documentWithSignatures.signed_at,
                    signature: JSON.stringify(documentWithSignatures.signatures), // Store all signatures
                    signingDate: new Date().toISOString().split('T')[0],
                    templateName: document.document_templates?.name
                  });

                  setShowSigningInterface(false);
                  alert('Document signed and saved successfully!');
                  
                  // Redirect to the signed document view
                  window.open(`/documents/signed/${signedDoc.id}`, '_blank');
                } catch (error) {
                  console.error('Error saving signed document:', error);
                  alert('Document signed but failed to save. Please try again or check your browser storage.');
                  setShowSigningInterface(false);
                }
              }}
              onCancel={() => setShowSigningInterface(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}