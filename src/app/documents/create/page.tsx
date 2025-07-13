'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { useClientStore } from '@/stores/useClientStore';
import { usePropertyStore } from '@/stores/usePropertyStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { ArrowLeft, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

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
  
  const {
    templates,
    templatesLoading,
    fetchTemplates,
    createDocument,
    getTemplateById
  } = useDocumentStore();

  const { clients, fetchClients } = useClientStore();
  const { properties, fetchProperties } = usePropertyStore();

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
      autoValues.client_email = selectedClient.email;
      autoValues.seller_email = selectedClient.email;
      autoValues.owner_email = selectedClient.email;
      autoValues.client_phone = selectedClient.phone;
      autoValues.seller_phone = selectedClient.phone;
      autoValues.owner_phone = selectedClient.phone;
      autoValues.client_address = selectedClient.address;
      autoValues.seller_address = selectedClient.address;
      autoValues.owner_address = selectedClient.address;
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
    
    // Only update fields that exist in the template and aren't already filled
    const filteredValues: Record<string, any> = {};
    selectedTemplate.template_fields?.forEach((field: any) => {
      if (autoValues[field.name] && !templateFieldValues[field.name]) {
        filteredValues[field.name] = autoValues[field.name];
      }
    });
    
    if (Object.keys(filteredValues).length > 0) {
      setTemplateFieldValues(prev => ({ ...prev, ...filteredValues }));
    }
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
    fetchTemplates();
    if (agent?.id) {
      fetchClients(agent.id);
      fetchProperties(agent.id);
    }
  }, [agent?.id, fetchTemplates, fetchClients, fetchProperties]);

  useEffect(() => {
    if (watchedTemplateId) {
      const template = getTemplateById(watchedTemplateId);
      setSelectedTemplate(template);
      setTemplateFieldValues({});
      setShowTemplateFields(false);
    }
  }, [watchedTemplateId, getTemplateById]);

  const handleTemplateFieldChange = (fieldName: string, value: any) => {
    setTemplateFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderTemplateField = (field: any) => {
    const value = templateFieldValues[field.name] || field.default || '';

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
          />
        );
      
      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleTemplateFieldChange(field.name, e.target.value)}
            placeholder={field.label}
            required={field.required}
            step={field.type === 'currency' ? '0.01' : '1'}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleTemplateFieldChange(field.name, e.target.value)}
            required={field.required}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleTemplateFieldChange(field.name, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
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
          />
        );
    }
  };

  // Prepare options for dropdowns
  const clientOptions = clients.map(client => ({
    id: client.id,
    label: `${client.first_name} ${client.last_name}`,
    sublabel: client.email
  }));

  const propertyOptions = properties.map(property => ({
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

    const documentData = {
      title: data.title,
      template_id: data.template_id,
      agent_id: agent.id,
      client_id: selectedClientId || null,
      property_id: selectedPropertyId || null,
      document_type: selectedTemplate?.document_type || 'custom',
      field_values: templateFieldValues,
      document_status: 'draft'
    };

    const document = await createDocument(documentData);
    if (document) {
      // If we have template fields filled, go directly to view, otherwise go to edit
      if (Object.keys(templateFieldValues).length > 0) {
        router.push(`/documents/${document.id}`);
      } else {
        router.push(`/documents/${document.id}/edit`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/documents">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Document</h1>
            <p className="text-gray-600 mt-2">Choose a template and create a new document</p>
          </div>
        </div>

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
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {errors.template_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.template_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Template Preview */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Template Preview</h2>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTemplateFields(!showTemplateFields)}
                  >
                    {showTemplateFields ? 'Hide Form Fields' : 'Fill Template Fields'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <FileText className="w-5 h-5 text-blue-500 mr-2" />
                    <h3 className="font-medium">{selectedTemplate.name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{selectedTemplate.description}</p>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Required Fields:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTemplate.template_fields?.filter((field: any) => field.required).map((field: any, index: number) => (
                        <div key={index} className="text-sm text-gray-600">
                          • {field.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dynamic Template Fields */}
          {selectedTemplate && showTemplateFields && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Fill Template Fields</h2>
                <p className="text-gray-600 text-sm">
                  Fill out these fields to pre-populate your document. You can also fill them later in the editor.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.template_fields?.map((field: any, index: number) => (
                    <div key={index} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
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
                
                {/* Template Progress */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Fields completed: {Object.keys(templateFieldValues).filter(key => templateFieldValues[key]).length} / {selectedTemplate.template_fields?.length || 0}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTemplateFieldValues({})}
                      >
                        Clear All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Auto-fill with default values
                          const defaults: Record<string, any> = {};
                          selectedTemplate.template_fields?.forEach((field: any) => {
                            if (field.default) {
                              defaults[field.name] = field.default;
                            }
                          });
                          setTemplateFieldValues(prev => ({ ...prev, ...defaults }));
                        }}
                      >
                        Fill Defaults
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={autoPopulateFromClientProperty}
                      >
                        Auto-Fill from Client/Property
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Preview */}
          {selectedTemplate && showTemplateFields && Object.keys(templateFieldValues).length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Live Preview</h2>
                <p className="text-gray-600 text-sm">
                  Preview of how your document will look with the current field values.
                </p>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose max-w-none text-sm border p-4 rounded bg-gray-50 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ 
                    __html: (() => {
                      let content = selectedTemplate.template_content || '';
                      Object.entries(templateFieldValues).forEach(([key, value]) => {
                        if (value) {
                          const placeholder = `{{${key}}}`;
                          content = content.replace(new RegExp(placeholder, 'g'), String(value));
                        }
                      });
                      return content;
                    })()
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4">
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
  );
}