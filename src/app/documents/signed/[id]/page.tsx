'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Download, Printer, Share2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getSignedDocument, SignedDocument } from '@/lib/signedDocuments';
import { formatDate } from '@/lib/utils';

export default function SignedDocumentViewPage() {
  const params = useParams();
  const [document, setDocument] = useState<SignedDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const doc = getSignedDocument(params.id as string);
      setDocument(doc);
      setLoading(false);
    }
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!document) return;
    
    // Create a downloadable HTML file
    const content = `
<!DOCTYPE html>
<html>
<head>
    <title>${document.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        .signature-section { margin-top: 50px; padding: 20px; border: 2px solid #000; background-color: #f9f9f9; }
        .content { line-height: 1.6; margin-bottom: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${document.title}</h1>
        <p>Signed Document</p>
    </div>
    <div class="content">
        ${document.content}
    </div>
    <div class="signature-section">
        <h3>Document Signature</h3>
        <p><strong>Signed by:</strong> ${document.signedBy}</p>
        <p><strong>Digital Signature:</strong> "${document.signature}"</p>
        <p><strong>Date Signed:</strong> ${formatDate(document.signedAt)}</p>
        <p><strong>Signing Date:</strong> ${document.signingDate}</p>
    </div>
</body>
</html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = globalThis.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_signed.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <p className="text-gray-600 mb-4">The signed document you're looking for doesn't exist.</p>
          <Link href="/documents/signed">
            <Button>Back to Signed Documents</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Top Navigation */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <Link href="/documents">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
                  Documents
                </Button>
              </Link>
              <span className="text-gray-400">›</span>
              <Link href="/documents/signed">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
                  Signed Documents
                </Button>
              </Link>
              <span className="text-gray-400">›</span>
              <span className="text-sm font-medium text-gray-900">View Signed Document</span>
            </div>
          </div>

          {/* Document Header */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link href="/documents/signed">
                  <Button variant="outline" size="sm" className="mr-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Signed Documents
                  </Button>
                </Link>
                <div>
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
                  </div>
                  <p className="text-gray-700 mt-1 font-medium">
                    Signed Document {document.templateName && `• Template: ${document.templateName}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  className="border-gray-400 text-gray-800 hover:bg-gray-100"
                  onClick={handlePrint}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>

                <Button 
                  variant="outline" 
                  className="border-gray-400 text-gray-800 hover:bg-gray-100"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Signature Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-green-300 shadow-lg">
              <CardHeader className="bg-green-50 border-b-2 border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <h2 className="text-xl font-bold text-green-900">Document Signed</h2>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Signed By</p>
                  <p className="text-base font-bold text-gray-900">{document.signedBy}</p>
                </div>

                <div className="border-t-2 border-gray-200 pt-4">
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Signatures</p>
                  <div className="space-y-2">
                    {(() => {
                      try {
                        const signatures = JSON.parse(document.signature);
                        return (
                          <div className="grid grid-cols-2 gap-2">
                            {signatures.seller && (
                              <div className="border border-gray-200 rounded p-2">
                                <p className="text-xs font-medium text-gray-600">Seller/Landlord:</p>
                                <p className="text-sm text-gray-900">{signatures.seller.signerName || 'Not provided'}</p>
                              </div>
                            )}
                            {signatures.broker && (
                              <div className="border border-gray-200 rounded p-2">
                                <p className="text-xs font-medium text-gray-600">Broker:</p>
                                <p className="text-sm text-gray-900">{signatures.broker.signerName || 'Not provided'}</p>
                              </div>
                            )}
                          </div>
                        );
                      } catch {
                        return <p className="text-base font-medium text-gray-900 italic">"{document.signature}"</p>;
                      }
                    })()}
                  </div>
                </div>

                <div className="border-t-2 border-gray-200 pt-4">
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Date Signed</p>
                  <p className="text-base font-medium text-gray-900">{formatDate(document.signedAt)}</p>
                </div>

                <div className="border-t-2 border-gray-200 pt-4">
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Signing Date</p>
                  <p className="text-base font-medium text-gray-900">{document.signingDate}</p>
                </div>

                {document.templateName && (
                  <div className="border-t-2 border-gray-200 pt-4">
                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Template Used</p>
                    <p className="text-base font-medium text-gray-900">{document.templateName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Content */}
          <div className="lg:col-span-3">
            <Card className="border-2 border-gray-300 shadow-lg">
              <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Document Content</h2>
              </CardHeader>
              <CardContent className="p-8">
                <div className="print-content">
                  <div 
                    className="max-w-none document-content text-gray-900"
                    dangerouslySetInnerHTML={{ __html: document.content }}
                  />
                </div>
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
          color: #000000;
          letter-spacing: 0.05em;
          padding-bottom: 1rem;
        }
        
        .document-content h2 {
          font-size: 1.375rem;
          font-weight: 800;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          color: #000000;
          letter-spacing: 0.025em;
          padding-bottom: 0.5rem;
        }
        
        .document-content p {
          margin-bottom: 1rem;
          font-weight: 500;
          color: #111827;
        }
        
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden !important;
          }
          
          /* Show only the document content and its parents */
          .print-content,
          .print-content * {
            visibility: visible !important;
          }
          
          /* Reset all print styles */
          @page {
            margin: 0.5in !important;
            size: letter !important;
          }
          
          /* Position the print content to fill the page */
          .print-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            page-break-inside: auto !important;
          }
          
          .document-content {
            font-size: 12pt !important;
            line-height: 1.4 !important;
            color: black !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-inside: auto !important;
          }
          
          /* Aggressive margin reset for all elements */
          .document-content * {
            margin: 0 !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
          }
          
          .document-content h1 {
            font-size: 18pt !important;
            margin: 0 !important;
            margin-bottom: 8pt !important;
            padding: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            text-align: center !important;
          }
          
          .document-content h2 {
            font-size: 16pt !important;
            margin: 0 !important;
            margin-top: 8pt !important;
            margin-bottom: 4pt !important;
            padding: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          
          .document-content p {
            margin: 0 !important;
            margin-bottom: 4pt !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
          }
          
          /* Remove any div margins that might cause gaps */
          .document-content div {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Handle any potential br tags causing excessive space */
          .document-content br {
            line-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Prevent any element from creating page breaks */
          .document-content * {
            page-break-before: avoid !important;
          }
          
          /* First element should start immediately */
          .document-content *:first-child {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          
          /* Logo styling - center and enlarge */
          .document-content img:not(.signature-container img),
          .document-content .document-header img {
            display: block !important;
            margin: 0 auto !important;
            margin-left: auto !important;
            margin-right: auto !important;
            transform: scale(1.5) !important;
            margin-bottom: 16pt !important;
            text-align: center !important;
          }
          
          /* Document header styling */
          .document-content .document-header,
          .document-content div[style*="text-align: center"]:not(.signature-container) {
            text-align: center !important;
            margin-bottom: 20pt !important;
          }
          
          /* AGREED AND ACCEPTED section styling */
          .document-content h2:contains("AGREED AND ACCEPTED") {
            margin-top: 30pt !important;
            text-align: center !important;
          }
          
          /* Add gap before signature section */
          .document-content h2:contains("AGREED AND ACCEPTED")::before {
            content: "" !important;
            display: block !important;
            height: 20pt !important;
          }
          
          /* SIGNATURE LAYOUT FIX - Override centering for signature containers */
          .document-content .signature-container {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 20pt 0 !important;
            padding: 0 10% !important;
            text-align: left !important;
            position: relative !important;
            clear: both !important;
            min-height: 120pt !important;
          }
          
          .document-content .signature-container .end-signature-signed {
            flex: 0 0 35% !important;
            width: 35% !important;
            text-align: left !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: none !important;
            border-radius: 0 !important;
            position: relative !important;
          }
          
          .document-content .signature-container .end-signature-signed h4 {
            text-align: left !important;
            font-size: 12pt !important;
            font-weight: bold !important;
            margin-bottom: 10pt !important;
            text-transform: uppercase !important;
          }
          
          .document-content .signature-container .end-signature-signed img {
            display: block !important;
            margin: 0 0 8pt 0 !important;
            max-width: 150pt !important;
            max-height: 40pt !important;
            border: 1pt solid #000 !important;
            padding: 3pt !important;
            background: white !important;
            text-align: left !important;
          }
          
          .document-content .signature-container .end-signature-signed p {
            text-align: left !important;
            font-size: 10pt !important;
            margin: 2pt 0 !important;
            line-height: 1.2 !important;
          }
          
          /* Override any remaining center alignment for signature elements */
          .document-content .signature-container * {
            text-align: left !important;
          }
          
          /* Ensure side-by-side positioning is maintained */
          .document-content .signature-container .end-signature-signed:first-child {
            margin-right: 20pt !important;
          }
          
          .document-content .signature-container .end-signature-signed:last-child {
            margin-left: 20pt !important;
          }
        }
      `}</style>
    </div>
  );
}