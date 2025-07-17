'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { useClientStore } from '@/stores/useClientStore';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { ArrowLeft, FileText, Printer, Share2, PenTool } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import DocumentSigning from '@/components/documents/DocumentSigning';
import { saveSignedDocument } from '@/lib/signedDocuments';

const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  template_id: z.string().min(1, 'Template is required'),
  client_id: z.string().optional(),
  property_id: z.string().optional(),
});

type CreateDocumentData = z.infer<typeof createDocumentSchema>;

export default function CreateDocumentPage() {
  const router = useRouter();
  const { user, agent } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, any>>({});
  const [showTemplateFields, setShowTemplateFields] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [showSigningInterface, setShowSigningInterface] = useState(false);
  const [createdDocument, setCreatedDocument] = useState<any>(null);
  
  const {
    documentTemplates,
    templatesLoading,
    fetchDocumentTemplates,
    createDocument
  } = useDocumentStore();

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowPrintPreviewModal(false);
      }
    };

    if (showPrintPreviewModal) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [showPrintPreviewModal]);

  const { clients, fetchClients } = useClientStore();
  const { properties, fetchProperties } = usePropertyStore();

  // Update document content whenever template or field values change
  useEffect(() => {
    if (selectedTemplate) {
      let content = selectedTemplate.template_content || '';
      
      // Auto-populate default values if no field values exist yet
      if (Object.keys(templateFieldValues).length === 0) {
        const defaultValues: Record<string, any> = {};
        selectedTemplate.template_fields?.forEach((field: any) => {
          if (field.default) {
            defaultValues[field.name] = field.default;
          }
        });
        
        if (Object.keys(defaultValues).length > 0) {
          setTemplateFieldValues(defaultValues);
          return; // Let the next effect cycle handle the content update
        }
      }
      
      // Replace placeholders with actual values or defaults
      const allValues = { ...templateFieldValues };
      selectedTemplate.template_fields?.forEach((field: any) => {
        if (!allValues[field.name] && field.default) {
          allValues[field.name] = field.default;
        }
      });
      
      Object.entries(allValues).forEach(([key, value]) => {
        if (value) {
          const placeholder = `{{${key}}}`;
          content = content.replace(new RegExp(placeholder, 'g'), `<strong>${String(value)}</strong>`);
        }
      });
      
      // Enhance content for better print formatting
      content = enhanceContentForPrint(content);
      setDocumentContent(content);
    }
  }, [selectedTemplate, templateFieldValues]);

  // Enhance content for print with proper spacing and formatting
  const enhanceContentForPrint = (content: string) => {
    // Add spacing between bullet points
    content = content.replace(/<p><strong>\([a-z]\)<\/strong>/g, '<p style="margin-top: 16px;"><strong>($1)</strong>');
    content = content.replace(/<p><strong>\([ivx]+\)<\/strong>/g, '<p style="margin-top: 16px;"><strong>($1)</strong>');
    
    // Add print-specific styles
    const printStyles = `
      <style>
        @media print {
          .document-container {
            font-family: 'Times New Roman', serif !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0.5in !important;
            page-break-inside: avoid;
          }
          
          @page {
            size: A4;
            margin: 0.5in;
          }
          
          h1 {
            font-size: 16pt !important;
            margin-bottom: 20pt !important;
            page-break-after: avoid;
          }
          
          h2 {
            font-size: 14pt !important;
            margin-top: 20pt !important;
            margin-bottom: 12pt !important;
            page-break-after: avoid;
          }
          
          p {
            margin-bottom: 8pt !important;
            text-align: justify;
            orphans: 2;
            widows: 2;
          }
          
          .signature-section {
            page-break-inside: avoid;
            margin-top: 40pt !important;
          }
          
          img {
            max-width: 120px !important;
            max-height: 120px !important;
          }
        }
        
        @media screen {
          .print-preview {
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin: 20px auto;
            padding: 1in;
            width: 8.27in;
            min-height: 11.69in;
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.4;
          }
        }
      </style>
    `;
    
    return printStyles + content;
  };

  // Print function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Document</title>
            <meta charset="utf-8">
          </head>
          <body>
            ${documentContent}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Share document for signing
  const handleShareForSigning = async () => {
    if (!selectedClientId) {
      alert('Please select a client to share the document for signing.');
      return;
    }
    
    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (selectedClient) {
      // In a real implementation, this would generate a signing link
      const signingLink = `${window.location.origin}/documents/sign/${Date.now()}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Document for Signing: ${watch('title') || 'Untitled'}`,
            text: `Please review and sign this document: ${selectedTemplate?.name || ''}`,
            url: signingLink,
          });
        } catch (error) {
          // Fallback to copying to clipboard
          navigator.clipboard.writeText(signingLink);
          alert(`Signing link copied to clipboard:\n${signingLink}`);
        }
      } else {
        // Fallback for browsers without Web Share API
        navigator.clipboard.writeText(signingLink);
        alert(`Signing link copied to clipboard:\n${signingLink}\n\nSend this link to ${selectedClient.first_name} ${selectedClient.last_name} (${selectedClient.email}) for signing.`);
      }
    }
  };

  // Auto-populate fields from selected client/property
  const autoPopulateFromClientProperty = () => {
    if (!selectedTemplate) return;
    
    const selectedClient = clients.find(c => c.id === selectedClientId);
    const selectedProperty = properties.find(p => p.id === selectedPropertyId);
    
    const autoValues: Record<string, any> = {};
    
    if (selectedClient) {
      // Map client fields to template fields
      autoValues.client_name = `${selectedClient.first_name} ${selectedClient.last_name}`;
      autoValues.seller_name = `${selectedClient.first_name} ${selectedClient.last_name}`;
      autoValues.owner_name = `${selectedClient.first_name} ${selectedClient.last_name}`;
      autoValues.landlord_name = `${selectedClient.first_name} ${selectedClient.last_name}`;
      autoValues.client_email = selectedClient.email;
      autoValues.seller_email = selectedClient.email;
      autoValues.owner_email = selectedClient.email;
      autoValues.client_phone = selectedClient.phone;
      autoValues.seller_phone = selectedClient.phone;
      autoValues.owner_phone = selectedClient.phone;
      autoValues.client_address = selectedClient.address;
      autoValues.seller_address = selectedClient.address;
      autoValues.owner_address = selectedClient.address;
      autoValues.landlord_address = selectedClient.address;
    }
    
    if (selectedProperty) {
      // Map property fields to template fields
      autoValues.property_address = selectedProperty.address;
      autoValues.city = selectedProperty.city;
      autoValues.state = selectedProperty.state;
      autoValues.zip_code = selectedProperty.zip_code;
      autoValues.listing_price = selectedProperty.price;
      autoValues.sale_price = selectedProperty.price;
      autoValues.mls_number = selectedProperty.mls_number;
    }
    
    // Add current date for date fields
    const currentDate = new Date().toISOString().split('T')[0];
    autoValues.effective_date = currentDate;
    autoValues.listing_date = currentDate;
    autoValues.agreement_date = currentDate;
    
    // Only update fields that exist in the template and aren't already filled
    const filteredValues: Record<string, any> = {};
    selectedTemplate.template_fields?.forEach((field: any) => {
      if (autoValues[field.name] && templateFieldValues[field.name] === undefined) {
        filteredValues[field.name] = autoValues[field.name];
      }
    });
    
    if (Object.keys(filteredValues).length > 0) {
      setTemplateFieldValues(prev => ({ ...prev, ...filteredValues }));
    }
  };

  // Fill default values with button click effect
  const fillDefaultValues = () => {
    if (!selectedTemplate) return;
    
    const defaults: Record<string, any> = {};
    selectedTemplate.template_fields?.forEach((field: any) => {
      if (field.default) {
        defaults[field.name] = field.default;
      }
    });
    
    if (Object.keys(defaults).length > 0) {
      setTemplateFieldValues(prev => ({ ...prev, ...defaults }));
    }
  };

  // Clear all values with button click effect
  const clearAllValues = () => {
    setTemplateFieldValues({});
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<CreateDocumentData>({
    resolver: zodResolver(createDocumentSchema)
  });

  const watchedTemplateId = watch('template_id');

  useEffect(() => {
    fetchDocumentTemplates();
    if (agent?.id) {
      fetchClients(agent.id);
      fetchProperties(agent.id);
    }
  }, [agent?.id, fetchDocumentTemplates, fetchClients, fetchProperties]);

  useEffect(() => {
    if (watchedTemplateId) {
      const template = documentTemplates.find(t => t.id === watchedTemplateId);
      setSelectedTemplate(template);
      
      // Initialize with default values
      const initialValues: Record<string, any> = {};
      if (template?.template_fields && Array.isArray(template.template_fields)) {
        template.template_fields.forEach((field: any) => {
          if (field.default) {
            initialValues[field.name] = field.default;
          }
        });
      }
      
      setTemplateFieldValues(initialValues);
    }
  }, [watchedTemplateId, documentTemplates]);

  // Handle template field changes with proper input handling
  const handleTemplateFieldChange = (fieldName: string, value: any) => {
    setTemplateFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderTemplateField = (field: any) => {
    const value = templateFieldValues[field.name] !== undefined ? templateFieldValues[field.name] : (field.default || '');

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleTemplateFieldChange(field.name, e.target.value)}
            placeholder={field.label}
            required={field.required}
            className="focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
        );
      
      case 'number':
      case 'currency':
        return (
          <div className="relative">
            <input
              type="number"
              value={value}
              onChange={(e) => handleTemplateFieldChange(field.name, e.target.value)}
              placeholder={field.label}
              required={field.required}
              step={field.type === 'currency' ? '0.01' : '0.1'}
              min="0"
              className="flex h-10 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 focus:ring-blue-500 transition-all duration-200 pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
              <button
                type="button"
                onClick={() => {
                  const currentValue = parseFloat(value || '0');
                  const increment = field.type === 'currency' ? 0.01 : 0.1;
                  handleTemplateFieldChange(field.name, (currentValue + increment).toFixed(field.type === 'currency' ? 2 : 1));
                }}
                className="text-xs px-1 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-t border-b border-gray-300 transition-colors duration-150 hover:cursor-pointer"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentValue = parseFloat(value || '0');
                  const decrement = field.type === 'currency' ? 0.01 : 0.1;
                  const newValue = Math.max(0, currentValue - decrement);
                  handleTemplateFieldChange(field.name, newValue.toFixed(field.type === 'currency' ? 2 : 1));
                }}
                className="text-xs px-1 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-b transition-colors duration-150 hover:cursor-pointer"
              >
                ▼
              </button>
            </div>
          </div>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleTemplateFieldChange(field.name, e.target.value)}
            required={field.required}
            className="focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleTemplateFieldChange(field.name, e.target.value)}
            placeholder={field.label}
            required={field.required}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleTemplateFieldChange(field.name, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleTemplateFieldChange(field.name, e.target.value)}
            placeholder={field.label}
            required={field.required}
            className="focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
        );
    }
  };

  // Prepare options for dropdowns
  const clientOptions = (clients || []).map(client => ({
    id: client.id,
    label: `${client.first_name} ${client.last_name}`,
    sublabel: client.email
  }));

  const propertyOptions = (properties || []).map(property => ({
    id: property.id,
    label: property.address,
    sublabel: `${property.city}, ${property.state} ${property.zip_code}`
  }));

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to create documents.</p>
      </div>
    );
  }

  const onSubmit = async (data: CreateDocumentData) => {
    if (!agent?.id) return;

    // Map template document_type to valid values
    const validDocumentTypes = ['contract', 'disclosure', 'inspection', 'financial', 'marketing'];
    const templateDocType = selectedTemplate?.document_type;
    const documentType = validDocumentTypes.includes(templateDocType) ? templateDocType : 'contract';

    const documentData = {
      document_name: data.title,
      template_id: data.template_id,
      created_by: agent.id,
      agent_id: agent.id,
      client_id: selectedClientId || null,
      property_id: selectedPropertyId || null,
      document_type: documentType,
      field_values: templateFieldValues,
      document_status: 'draft',
      file_url: '/placeholder.pdf', // Temporary placeholder URL
      title: data.title
    };

    try {
      const document = await createDocument(documentData);
      if (document) {
        // If we have template fields filled, go directly to view, otherwise go to edit
        if (Object.keys(templateFieldValues).length > 0) {
          router.push(`/documents/${document.id}`);
        } else {
          router.push(`/documents/${document.id}/edit`);
        }
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/documents">
                <Button variant="outline" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Documents
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Document</h1>
                <p className="text-gray-600 text-sm">Choose a template and create a new document</p>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedTemplate && (
              <div className="flex items-center space-x-2">
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mr-2">
                    Client: {selectedClientId ? 'Yes' : 'No'} | 
                    Fields: {Object.keys(templateFieldValues).length}
                  </div>
                )}
                {Object.keys(templateFieldValues).length > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPrintPreviewModal(true)}
                      className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 active:bg-blue-100 transition-all duration-200"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Preview
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="cursor-pointer hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all duration-200"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                  </>
                )}
                
                {selectedClientId && Object.keys(templateFieldValues).length > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleShareForSigning}
                      className="cursor-pointer hover:bg-green-50 hover:border-green-300 hover:text-green-700 active:bg-green-100 transition-all duration-200"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share for Signing
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('Sign Document button clicked - no form submission should occur');
                        
                        if (!selectedTemplate?.id) {
                          alert('Please select a template first.');
                          return;
                        }

                        // Create a mock document object for signing interface
                        const mockDocument = {
                          id: 'preview-' + Date.now(),
                          title: watch('title') || selectedTemplate?.name || 'Untitled Document',
                          document_name: watch('title') || selectedTemplate?.name || 'Untitled Document'
                        };

                        console.log('Opening signing interface with mock document:', mockDocument);
                        setCreatedDocument(mockDocument);
                        setShowSigningInterface(true);
                      }}
                      className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 active:bg-purple-100 transition-all duration-200"
                    >
                      <PenTool className="w-4 h-4 mr-2" />
                      Sign Document
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Split Screen Layout */}
        <div className="flex h-[calc(100vh-120px)]">
          {/* Left Panel - Form */}
          <div className="w-1/2 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Basic Information</h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Title *
                      </label>
                      <Input
                        {...register('title')}
                        placeholder="Enter document title"
                        error={errors.title?.message}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Template *
                      </label>
                      <select
                        {...register('template_id')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a template</option>
                        {(documentTemplates || []).map((template: any) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      {errors.template_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.template_id.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <SearchableDropdown
                        label="Client (Optional)"
                        options={clientOptions}
                        value={selectedClientId}
                        onChange={(value) => {
                          setSelectedClientId(value);
                          setValue('client_id', value);
                        }}
                        placeholder="Search and select a client"
                        allowClear={true}
                      />

                      <SearchableDropdown
                        label="Property (Optional)"
                        options={propertyOptions}
                        value={selectedPropertyId}
                        onChange={(value) => {
                          setSelectedPropertyId(value);
                          setValue('property_id', value);
                        }}
                        placeholder="Search and select a property"
                        allowClear={true}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Template Fields */}
                {selectedTemplate && (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-xl font-semibold">Template Fields</h2>
                          <p className="text-gray-600 text-sm">
                            Fill out these fields to customize your document
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {Object.keys(templateFieldValues).filter(key => templateFieldValues[key]).length} / {selectedTemplate.template_fields?.length || 0}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedTemplate.template_fields?.map((field: any, index: number) => (
                          <div key={index}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {renderTemplateField(field)}
                            {field.description && (
                              <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="mt-6 pt-4 border-t">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearAllValues}
                            className="cursor-pointer hover:bg-red-50 hover:border-red-300 hover:text-red-700 active:bg-red-100 transition-all duration-200 transform hover:scale-105 active:scale-95"
                          >
                            Clear All
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={fillDefaultValues}
                            className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 active:bg-blue-100 transition-all duration-200 transform hover:scale-105 active:scale-95"
                          >
                            Fill Defaults
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={autoPopulateFromClientProperty}
                            className="cursor-pointer hover:bg-green-50 hover:border-green-300 hover:text-green-700 active:bg-green-100 transition-all duration-200 transform hover:scale-105 active:scale-95"
                          >
                            Auto-Fill from Client/Property
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-4 pb-6">
                  <Link href="/documents">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting || templatesLoading}>
                    {isSubmitting ? 'Creating...' : 'Create Document'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="w-1/2 bg-gray-50 overflow-y-auto">
            <div className="pl-5 pr-0 py-6">
              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pr-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Live Preview</h2>
                      <p className="text-gray-600 text-sm">
                        Real-time preview updates as you fill the form
                      </p>
                    </div>
                  </div>

                  <div 
                    className="bg-white border rounded-lg overflow-y-auto"
                    style={{ 
                      maxHeight: 'calc(100vh - 250px)',
                      paddingLeft: '20px',
                      paddingRight: '20px',
                      paddingTop: '24px',
                      paddingBottom: '24px'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: documentContent || selectedTemplate.template_content || ''
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Template</h3>
                    <p className="text-gray-600">
                      Choose a document template from the form to see a live preview here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPrintPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Print Preview</h2>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="cursor-pointer hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all duration-200"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <button
                  onClick={() => setShowPrintPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="bg-white shadow-lg mx-auto" style={{ width: '8.27in', minHeight: '11.69in', paddingTop: '1in', paddingBottom: '1in' }}>
                <div 
                  className="print-preview"
                  style={{ 
                    fontFamily: 'Times, serif',
                    fontSize: '12pt',
                    lineHeight: '1.5',
                    color: '#000'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: enhanceContentForPrint(documentContent || selectedTemplate?.template_content || '')
                  }}
                />
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Print Preview Information</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Document formatted for A4 paper (8.27" × 11.69")</li>
                        <li>Standard 1-inch margins on all sides</li>
                        <li>Professional print formatting applied</li>
                        <li>Click "Print" to send to printer</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Signing Interface */}
      {showSigningInterface && createdDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <DocumentSigning
              documentData={{
                id: createdDocument.id,
                title: createdDocument.title || createdDocument.document_name,
                content: documentContent
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
                    templateName: selectedTemplate?.name
                  });

                  setShowSigningInterface(false);
                  alert('Document signed and saved successfully!');
                  
                  // Redirect to the signed document view
                  router.push(`/documents/signed/${signedDoc.id}`);
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