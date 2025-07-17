'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, FileText, Calendar, User, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getSignedDocuments, deleteSignedDocument, SignedDocument } from '@/lib/signedDocuments';
import { formatDate } from '@/lib/utils';

export default function SignedDocumentsPage() {
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSignedDocuments = () => {
      const docs = getSignedDocuments();
      setSignedDocuments(docs);
      setLoading(false);
    };

    loadSignedDocuments();
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this signed document?')) {
      deleteSignedDocument(id);
      setSignedDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
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
                <h1 className="text-3xl font-bold text-gray-900">Signed Documents</h1>
                <p className="text-gray-600 mt-1">View all documents you have signed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {signedDocuments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No signed documents yet</h3>
              <p className="text-gray-600 mb-6">
                When you sign documents, they will appear here.
              </p>
              <Link href="/documents/create">
                <Button>Create and Sign a Document</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signedDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {doc.title}
                      </h3>
                      {doc.templateName && (
                        <p className="text-sm text-gray-500">
                          Template: {doc.templateName}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span>Signed by: {doc.signedBy}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Signed: {formatDate(doc.signedAt)}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Digital Signature:</p>
                      <p className="text-sm text-gray-600 italic">"{doc.signature}"</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link href={`/documents/signed/${doc.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="w-4 h-4 mr-2" />
                        View Document
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}