'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PenTool, Check, Download, AlertCircle, Eye } from 'lucide-react';
import SignatureCanvas from '@/components/documents/SignatureCanvas';

export default function DocumentSigningPage() {
  const params = useParams();
  const [documentId] = useState(params.id as string);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerDate, setSignerDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSigned, setIsSigned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureCoordinates, setSignatureCoordinates] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [signatureRequest, setSignatureRequest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [processedContent, setProcessedContent] = useState<string>('');

  // Function to remove horizontal lines and signature sections from document content
  const processDocumentContent = (content: string) => {
    if (!content) return '';
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Remove signature sections
    const signatureSections = tempDiv.querySelectorAll('.signature-block, .signatures-section');
    signatureSections.forEach((section: Element) => section.remove());
    
    // Remove headings that contain "SIGNATURES" or "AGREED AND ACCEPTED"
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading: Element) => {
      if (heading.textContent?.includes('SIGNATURES') || 
          heading.textContent?.includes('AGREED AND ACCEPTED')) {
        heading.remove();
      }
    });
    
    // Remove paragraphs containing only underscores (horizontal lines)
    const paragraphs = tempDiv.querySelectorAll('p');
    paragraphs.forEach((p: Element) => {
      const text = p.textContent?.trim() || '';
      // Check if paragraph contains only underscores, spaces, and "Date:"
      if (text.match(/^[_\s]*$/) || 
          text.match(/^.*_+.*Date:\s*_+.*$/) ||
          text.match(/^_+\s*Date:\s*_+$/)) {
        p.remove();
      }
    });
    
    return tempDiv.innerHTML;
  };

  // Process content when document changes
  useEffect(() => {
    if (document?.content) {
      const processed = processDocumentContent(document.content);
      setProcessedContent(processed);
    }
  }, [document]);

  // Fetch document and signature request data
  useEffect(() => {
    const fetchDocumentData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if this is a token-based signing URL
        const isToken = documentId.length > 30; // Tokens are longer than UUIDs
        
        if (isToken) {
          // Fetch by signing token
          const response = await fetch(`/api/signature-requests?token=${documentId}`);
          if (!response.ok) {
            throw new Error('Signature request not found or expired');
          }
          
          const data = await response.json();
          setSignatureRequest(data.signatureRequest);
          setDocument(data.signatureRequest.documents);
        } else {
          // Fetch by document ID (fallback for old URLs)
          const response = await fetch(`/api/documents/${documentId}`);
          if (!response.ok) {
            throw new Error('Document not found');
          }
          
          const data = await response.json();
          setDocument(data.document);
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        setError(error instanceof Error ? error.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    if (documentId) {
      fetchDocumentData();
    }
  }, [documentId]);

  const handleSignatureCapture = (signature: string, coordinates: any) => {
    setSignatureData(signature);
    setSignatureCoordinates(coordinates);
    setShowSignatureCanvas(false);
  };

  const handleSign = async () => {
    if (!signerName || !signerEmail) {
      alert('Please fill in your name and email address.');
      return;
    }

    if (!signatureData) {
      alert('Please provide your digital signature.');
      return;
    }

    setIsLoading(true);

    try {
      // Get device info for security tracking
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Save signature to database
      const response = await fetch('/api/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: document.id,
          signerName,
          signerEmail,
          signerType: 'client',
          signatureData,
          signatureCoordinates,
          deviceInfo,
          signingSessionId: crypto.randomUUID()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save signature');
      }

      const result = await response.json();
      setIsSigned(true);
      
      console.log('Document signed successfully:', result);

    } catch (error) {
      console.error('Error signing document:', error);
      alert(error instanceof Error ? error.message : 'Failed to sign document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!document) return;
    
    // Create a printable version with signature
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      let content = document.content || '';
      
      // Replace placeholders with actual values
      content = content
        .replace(/\[SIGNER NAME\]/g, signerName)
        .replace(/\[DATE\]/g, signerDate);

      // Add signature image if available
      let signatureHtml = '';
      if (signatureData) {
        signatureHtml = `
          <div style="margin-top: 20px;">
            <p><strong>Digital Signature:</strong></p>
            <img src="${signatureData}" alt="Digital Signature" style="max-width: 200px; border: 1px solid #ccc;" />
            <p style="font-size: 10pt; color: #666;">
              Signed on ${new Date().toLocaleString()} by ${signerName}
            </p>
          </div>
        `;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${document.title} - Signed</title>
            <meta charset="utf-8">
            <style>
              @media print {
                @page {
                  size: A4;
                  margin: 1in;
                }
                body {
                  font-family: 'Times New Roman', serif;
                  font-size: 12pt;
                  line-height: 1.4;
                }
              }
            </style>
          </head>
          <body>
            ${content}
            ${signatureHtml}
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Loading state
  if (isLoading && !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Error Loading Document</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSigned) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Document Successfully Signed!</h1>
              <p className="text-gray-600 mt-2">
                Thank you for signing the document. A copy has been recorded and all parties have been notified.
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Signed by:</strong> {signerName}<br />
                  <strong>Email:</strong> {signerEmail}<br />
                  <strong>Date:</strong> {signerDate}<br />
                  <strong>Time:</strong> {new Date().toLocaleTimeString()}
                </p>
              </div>
              
              {signatureData && (
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm font-medium text-gray-700 mb-2">Your Digital Signature:</p>
                  <img 
                    src={signatureData} 
                    alt="Digital Signature" 
                    className="mx-auto border border-gray-300 rounded"
                    style={{ maxWidth: '200px', maxHeight: '80px' }}
                  />
                </div>
              )}
              
              <div className="flex justify-center space-x-4">
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Signed Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Signing</h1>
          <p className="text-gray-600 mt-2">Please review the document below and provide your signature</p>
          {signatureRequest && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Signing Request:</strong> {signatureRequest.request_title}
              </p>
              {signatureRequest.request_message && (
                <p className="text-sm text-blue-700 mt-1">{signatureRequest.request_message}</p>
              )}
            </div>
          )}
        </div>

        {/* Document Preview */}
        {document && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{document.title}</h2>
                  <p className="text-gray-600 text-sm">Please review the document carefully before signing</p>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Eye className="w-4 h-4 mr-1" />
                  Document Preview
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="bg-white border rounded-lg overflow-y-auto document-preview-clean"
                style={{ 
                  maxHeight: '400px',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  paddingTop: '24px',
                  paddingBottom: '24px'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: processedContent || document?.content || '<p>Document content not available</p>' 
                }}
              />
              <style dangerouslySetInnerHTML={{
                __html: `
                  .document-preview-clean {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #000;
                  }
                  .document-preview-clean h1 {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 20px 0;
                    text-align: center;
                    text-transform: none !important;
                    border: none !important;
                    text-decoration: none !important;
                  }
                  .document-preview-clean h2 {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 24px 0 12px 0;
                    text-transform: none !important;
                    border: none !important;
                    border-bottom: none !important;
                    text-decoration: none !important;
                    background: none !important;
                  }
                  .document-preview-clean h3 {
                    font-size: 16px;
                    font-weight: bold;
                    margin: 16px 0 8px 0;
                    text-transform: none !important;
                    border: none !important;
                    text-decoration: none !important;
                  }
                  .document-preview-clean p {
                    margin: 0 0 16px 0;
                    line-height: 1.6;
                  }
                  .document-preview-clean strong {
                    font-weight: bold;
                  }
                  .document-preview-clean div {
                    margin-bottom: 0;
                  }
                  /* Remove any Tailwind prose styles */
                  .document-preview-clean h1:before,
                  .document-preview-clean h1:after,
                  .document-preview-clean h2:before,
                  .document-preview-clean h2:after,
                  .document-preview-clean h3:before,
                  .document-preview-clean h3:after {
                    display: none !important;
                    content: none !important;
                  }
                `
              }} />
            </CardContent>
          </Card>
        )}

        {/* Signature Form */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center">
              <PenTool className="w-5 h-5 mr-2" />
              Digital Signature
            </h2>
            <p className="text-gray-600 text-sm">
              By providing your information below and clicking "Sign Document", you are providing a legally binding electronic signature.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter your full legal name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signature Date
                </label>
                <Input
                  type="date"
                  value={signerDate}
                  onChange={(e) => setSignerDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>By signing this document electronically, you agree that your electronic signature has the same legal effect as a handwritten signature.</li>
                      <li>Please ensure all information is accurate before proceeding.</li>
                      <li>You will receive a copy of the signed document via email.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Digital Signature</h3>
              
              {!signatureData ? (
                !showSignatureCanvas ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <PenTool className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Click below to provide your digital signature</p>
                    <Button
                      type="button"
                      onClick={() => setShowSignatureCanvas(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <PenTool className="w-4 h-4 mr-2" />
                      Add Signature
                    </Button>
                  </div>
                ) : (
                  <SignatureCanvas
                    onSignatureCapture={handleSignatureCapture}
                    onCancel={() => setShowSignatureCanvas(false)}
                    width={600}
                    height={200}
                  />
                )
              ) : (
                <div className="border border-green-300 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-800 font-medium">Signature Captured</p>
                      <p className="text-green-700 text-sm">Your digital signature has been recorded</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <img 
                        src={signatureData} 
                        alt="Your Signature" 
                        className="border border-gray-300 rounded bg-white"
                        style={{ maxWidth: '150px', maxHeight: '60px' }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSignatureData(null);
                          setSignatureCoordinates(null);
                          setShowSignatureCanvas(false);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSign}
                disabled={isLoading || !signerName || !signerEmail || !signatureData}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing Document...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Complete Signature
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 