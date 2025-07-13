'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ArrowLeft, Settings, FileText, Users, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function DocumentSettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view document settings.</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Document Settings</h1>
                <p className="text-gray-600 mt-1">Configure document preferences and templates</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Settings className="w-5 h-5 text-gray-600 mr-2" />
                <h2 className="text-xl font-semibold">General Settings</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Document Status
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="finalized">Finalized</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-generate PDF
                </label>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-600">
                    Automatically generate PDF when document is finalized
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Retention (days)
                </label>
                <input 
                  type="number" 
                  placeholder="365"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Template Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-600 mr-2" />
                <h2 className="text-xl font-semibold">Template Management</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Manage document templates and custom fields
                </p>
                <div className="space-y-2">
                  <Link href="/documents/templates">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Browse Templates
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Create Custom Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signature Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-600 mr-2" />
                <h2 className="text-xl font-semibold">Signature Settings</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digital Signature Provider
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="internal">Internal System</option>
                  <option value="docusign">DocuSign</option>
                  <option value="hellosign">HelloSign</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Require Signature for
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Listing Agreements</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Purchase Agreements</span>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Lease Agreements</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Building2 className="w-5 h-5 text-gray-600 mr-2" />
                <h2 className="text-xl font-semibold">Integrations</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Connect with external services and tools
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">Google Drive</p>
                      <p className="text-xs text-gray-500">Store documents in Google Drive</p>
                    </div>
                    <Button size="sm" variant="outline">Connect</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">Dropbox</p>
                      <p className="text-xs text-gray-500">Sync documents with Dropbox</p>
                    </div>
                    <Button size="sm" variant="outline">Connect</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}