import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Generate PDF content
    const pdfContent = generatePDFContent(document);
    
    // Create PDF using jsPDF (simpler approach for now)
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(20);
    pdf.text(document.title || 'Untitled Document', 20, 30);
    
    // Add content based on template
    let yPos = 50;
    const lineHeight = 10;
    
    // Parse field values and add to PDF
    const fieldValues = document.field_values as Record<string, any>;
    const templateFields = (document.document_templates as any)?.template_fields || [];
    
    templateFields.forEach((field: any) => {
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
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Update document with PDF URL
    const { error: updateError } = await supabase
      .from('documents')
      .update({ pdf_url: publicUrl })
      .eq('id', documentId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    return NextResponse.json({ pdfUrl: publicUrl });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generatePDFContent(document: any) {
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