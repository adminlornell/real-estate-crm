import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
// Note: @react-pdf/renderer imports removed as they're not used in this implementation
import { reportAPIError, measurePerformance, addBreadcrumb } from '@/lib/sentry';

export async function POST(request: NextRequest) {
  return measurePerformance('generatePDF', 'api.request', async () => {
    try {
      addBreadcrumb('PDF generation request started', 'api', 'info');
      
      const { documentId } = await request.json();

      if (!documentId) {
        addBreadcrumb('PDF generation failed - no document ID', 'api', 'error');
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
      }

      addBreadcrumb('Fetching document for PDF generation', 'api', 'info', { documentId });
      
      // Fetch document with template
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select(`
          *,
          document_templates(*)
        `)
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        reportAPIError(docError || new Error('Document not found'), {
          endpoint: '/api/documents/generate-pdf',
          method: 'POST',
          status: 404
        });
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      addBreadcrumb('Generating PDF content', 'api', 'info', {
        documentTitle: document.title,
        templateType: document.document_templates?.document_type
      });

      // Generate PDF content
      // const pdfContent = generatePDFContent(document); // Commented out - not used in current implementation
      
      // Create PDF using jsPDF (simpler approach for now)
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(20);
      pdf.text(document.title || 'Untitled Document', 20, 30);
      
      // Add content based on template
      let yPos = 50;
      const lineHeight = 10;
      
      // Parse field values and add to PDF
      const fieldValues = document.field_values as Record<string, string>;
      const templateFields = Array.isArray(document.document_templates?.template_fields) 
        ? document.document_templates.template_fields as Array<{ name: string; label: string; type: string }>
        : [];
      
      templateFields.forEach((field: { name: string; label: string; type: string }) => {
        const value = fieldValues[field.name] || '';
        pdf.setFontSize(12);
        pdf.text(`${field.label}: ${value}`, 20, yPos);
        yPos += lineHeight;
        
        // Check if we need a new page
        if (yPos > 250) {
          pdf.addPage();
          yPos = 30;
        }
      });
      
      // Add signature lines
      yPos += 20;
      pdf.setFontSize(10);
      pdf.text('Signatures:', 20, yPos);
      yPos += 15;
      
      pdf.line(20, yPos, 120, yPos); // Signature line
      pdf.text('Client Signature', 20, yPos + 5);
      pdf.text('Date: ___________', 130, yPos + 5);
      
      yPos += 25;
      pdf.line(20, yPos, 120, yPos); // Signature line
      pdf.text('Agent Signature', 20, yPos + 5);
      pdf.text('Date: ___________', 130, yPos + 5);
      
      // Convert to blob and upload to Supabase storage
      const pdfBlob = pdf.output('blob');
      const fileName = `document_${documentId}_${Date.now()}.pdf`;
      
      addBreadcrumb('Uploading PDF to storage', 'api', 'info', { fileName });
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        reportAPIError(uploadError as Error, {
          endpoint: '/api/documents/generate-pdf',
          method: 'POST',
          status: 500
        });
        return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      addBreadcrumb('Updating document with PDF URL', 'api', 'info', { publicUrl });
      
      // Update document with PDF URL
      const { error: updateError } = await supabase
        .from('documents')
        .update({ pdf_url: publicUrl })
        .eq('id', documentId);

      if (updateError) {
        reportAPIError(updateError as Error, {
          endpoint: '/api/documents/generate-pdf',
          method: 'POST',
          status: 500
        });
        return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
      }

      addBreadcrumb('PDF generation completed successfully', 'api', 'info', {
        documentId,
        fileName,
        publicUrl
      });
      
      return NextResponse.json({ pdfUrl: publicUrl });

    } catch (error) {
      reportAPIError(error as Error, {
        endpoint: '/api/documents/generate-pdf',
        method: 'POST',
        status: 500
      });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

interface DocumentData {
  title: string;
  field_values: Record<string, string>;
  document_templates: {
    template_fields: Array<{ name: string; label: string; type: string }>;
    name: string;
    template_content?: string;
  };
}

function generatePDFContent(document: DocumentData) {
  const template = document.document_templates;
  const fieldValues = document.field_values;
  
  if (!template?.template_content) {
    return '<p>No template content available</p>';
  }
  
  let content = template.template_content;
  
  // Replace placeholders with actual values
  Object.entries(fieldValues).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), String(value || ''));
  });
  
  return content;
}