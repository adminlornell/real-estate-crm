'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentStore } from '@/stores/useDocumentStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, FileText, Eye, Home, List, Plus, Settings } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface DocumentWithTemplate {
  id: string;
  title: string;
  document_type: string;
  field_values: Record<string, any>;
  document_status: string;
  template_id: string;
  document_templates: {
    id: string;
    name: string;
    template_fields: any[];
    template_content: string;
  };
}

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const { user, agent } = useAuth();
  const [document, setDocument] = useState<DocumentWithTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [previewMode, setPreviewMode] = useState(false);

  const { updateDocument } = useDocumentStore();

  useEffect(() => {
    if (params.id) {
      fetchDocument(params.id as string);
    }
  }, [params.id]);

  const fetchDocument = async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          document_templates(*)
        `)
        .eq('id', documentId)
        .single();

      if (error) throw error;

      setDocument(data as DocumentWithTemplate);
      setFieldValues((data.field_values as Record<string, any>) || {});
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = async () => {
    if (!document) return;
    
    setSaving(true);
    try {
      await updateDocument(document.id, {
        field_values: fieldValues
      });
      
      // Refresh document data
      await fetchDocument(document.id);
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!document) return;
    
    if (confirm('Are you sure you want to finalize this document? You won\'t be able to edit it after finalization.')) {
      // Save current changes first
      await handleSave();
      
      // Navigate back to document view
      router.push(`/documents/${document.id}`);
    }
  };

  const renderField = (field: any) => {
    const value = fieldValues[field.name] || field.default || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.label}
            required={field.required}
            className="border-2 border-gray-400 text-gray-900 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
          />
        );
      
      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.label}
            required={field.required}
            step={field.type === 'currency' ? '0.01' : '1'}
            className="border-2 border-gray-400 text-gray-900 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            className="border-2 border-gray-400 text-gray-900 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.label}
            required={field.required}
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-md text-gray-900 font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-md text-gray-900 font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
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
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.label}
            required={field.required}
            className="border-2 border-gray-400 text-gray-900 font-medium focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
          />
        );
    }
  };

  const generatePreview = () => {
    if (!document?.document_templates?.template_content) return '';
    
    let content = document.document_templates.template_content;
    
    // Replace placeholders with actual values
    Object.entries(fieldValues).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value || ''));
    });
    
    return content;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to edit documents.</p>
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
              <span className="text-sm font-medium text-gray-900">Edit Document</span>
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
                  <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
                  <p className="text-gray-700 mt-1 font-medium">{document.document_templates?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="border-gray-400 text-gray-800 hover:bg-gray-100 font-medium"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {previewMode ? 'Edit Mode' : 'Preview'}
                </Button>
                
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                
                {document.document_status === 'draft' && (
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white font-medium"
                    onClick={handleFinalize}
                  >
                    Finalize Document
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {previewMode ? (
          /* Enhanced Preview Mode */
          <Card className="border-2 border-gray-300 shadow-lg">
            <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Document Preview</h2>
            </CardHeader>
            <CardContent className="p-8">
              <div 
                className="prose max-w-none document-content text-gray-900"
                dangerouslySetInnerHTML={{ __html: generatePreview() }}
              />
            </CardContent>
          </Card>
        ) : (
          /* Enhanced Edit Mode */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Fields */}
            <div className="space-y-6">
              <Card className="border-2 border-gray-300 shadow-lg">
                <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Document Fields</h2>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {document.document_templates?.template_fields?.map((field: any, index: number) => (
                    <div key={index}>
                      <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
                        {field.label}
                        {field.required && <span className="text-red-600 ml-2 text-lg">*</span>}
                      </label>
                      <div className="relative">
                        {renderField(field)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Live Preview */}
            <div className="space-y-6">
              <Card className="border-2 border-gray-300 shadow-lg">
                <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Live Preview</h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div 
                    className="prose max-w-none document-content text-gray-900 text-sm border-2 border-gray-200 p-6 rounded-lg bg-white max-h-[600px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: generatePreview() }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}