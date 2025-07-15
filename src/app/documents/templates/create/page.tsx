'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, Eye, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export default function CreateTemplatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Template basic info
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [templateContent, setTemplateContent] = useState('');

  // Template fields
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);

  const addField = () => {
    const newField: TemplateField = {
      id: Date.now().toString(),
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: ''
    };
    setTemplateFields([...templateFields, newField]);
  };

  const updateField = (id: string, updates: Partial<TemplateField>) => {
    setTemplateFields(fields =>
      fields.map(field =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeField = (id: string) => {
    setTemplateFields(fields => fields.filter(field => field.id !== id));
  };

  const generatePreview = () => {
    let content = templateContent;
    templateFields.forEach(field => {
      const placeholder = `{{${field.name}}}`;
      const sampleValue = field.type === 'date' 
        ? '[Date]' 
        : field.type === 'number' 
        ? '[Number]' 
        : `[${field.label || field.name}]`;
      content = content.replace(new RegExp(placeholder, 'g'), sampleValue);
    });
    return content;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Add logo header to template content if it doesn't already exist
      let finalTemplateContent = templateContent;
      if (!templateContent.includes('document-header')) {
        const logoHeader = `<div class="document-header" style="text-align: center; margin-bottom: 30px;">
  <div style="height: 60px; overflow: hidden; display: flex; justify-content: center; align-items: center; margin: 0 auto; max-width: 200px;">
    <img src="/logo.svg" alt="Company Logo" style="height: 100px; width: auto; margin-top: -20px; margin-bottom: -20px;" />
  </div>
</div>`;
        finalTemplateContent = logoHeader + templateContent;
      }

      const { data, error } = await supabase
        .from('document_templates')
        .insert({
          name: templateName,
          description: templateDescription,
          document_type: documentType,
          template_content: finalTemplateContent,
          template_fields: templateFields as any, // Cast to Json type for Supabase
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      router.push('/documents/templates');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to create document templates.</p>
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
              <Link href="/documents/templates">
                <Button variant="outline" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Templates
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Document Template</h1>
                <p className="text-gray-600 mt-1">Design a reusable template for your documents</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Configuration */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Template Information</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name *
                    </label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Listing Agreement Template"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type *
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="">Select document type</option>
                      <option value="listing_agreement">Listing Agreement</option>
                      <option value="purchase_agreement">Purchase Agreement</option>
                      <option value="lease_agreement">Lease Agreement</option>
                      <option value="disclosure">Disclosure</option>
                      <option value="addendum">Addendum</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Describe what this template is for..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Template Fields */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Template Fields</h2>
                    <Button type="button" onClick={addField} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Field
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {templateFields.map((field) => (
                    <div key={field.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Field {templateFields.indexOf(field) + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          placeholder="Field name (e.g., client_name)"
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value })}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Field label (e.g., Client Name)"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="text-sm"
                        />
                        <select
                          value={field.type || 'text'}
                          onChange={(e) => updateField(field.id, { type: e.target.value as TemplateField['type'] })}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Select</option>
                        </select>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm">Required</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {templateFields.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No fields added yet. Click "Add Field" to create template fields.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Template Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">
                    {previewMode ? 'Template Preview' : 'Template Content'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {previewMode 
                      ? 'Preview of how the template will look with sample data'
                      : 'Use {{field_name}} to insert dynamic fields (e.g., {{client_name}})'
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  {previewMode ? (
                    <div 
                      className="prose max-w-none border rounded-md p-4 min-h-96 bg-white"
                      dangerouslySetInnerHTML={{ __html: generatePreview()?.replace(/\n/g, '<br>') || '' }}
                    />
                  ) : (
                    <textarea
                      value={templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
                      placeholder="Enter your template content here...

Example:
LISTING AGREEMENT

This agreement is between {{agent_name}} and {{client_name}} for the property located at {{property_address}}.

Listing Price: ${{listing_price}}
Commission Rate: {{commission_rate}}%

Dated: {{agreement_date}}"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                      rows={20}
                      required
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end space-x-3">
            <Link href="/documents/templates">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}