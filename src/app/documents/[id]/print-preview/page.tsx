'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { supabase } from '@/lib/supabase';
import PrintPreview from '@/components/documents/PrintPreview';

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
  clients?: { first_name: string; last_name: string; email: string };
  properties?: { address: string };
}

export default function DocumentPrintPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [document, setDocument] = useState<DocumentWithTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  const { generatePDF } = useDocumentStore();

  useEffect(() => {
    if (params.id) {
      fetchDocument(params.id as string);
    }
  }, [params.id]);

  const fetchDocument = async (documentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          document_templates(*),
          clients(first_name, last_name, email),
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

  const generateContent = () => {
    if (!document?.document_templates?.template_content) return '';
    
    let content = document.document_templates.template_content;
    
    if (document.field_values) {
      Object.entries(document.field_values).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        content = content.replace(new RegExp(placeholder, 'g'), String(value || ''));
      });
    }
    
    return content;
  };

  const handleGeneratePDF = async () => {
    if (!document) return;
    
    const pdfUrl = await generatePDF(document.id);
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      await fetchDocument(document.id);
    }
  };

  const handleClose = () => {
    router.push(`/documents/${params.id}`);
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
        </div>
      </div>
    );
  }

  return (
    <PrintPreview
      isOpen={true}
      onClose={handleClose}
      document={{
        id: document.id,
        title: document.title || document.document_name,
        content: generateContent(),
        document_templates: document.document_templates,
        field_values: document.field_values
      }}
      onPrint={() => window.print()}
      onDownload={document.pdf_url ? () => window.open(document.pdf_url!, '_blank') : handleGeneratePDF}
    />
  );
}