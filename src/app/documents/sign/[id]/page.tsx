'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PenTool, Check, Download } from 'lucide-react';

export default function DocumentSigningPage() {
  const params = useParams();
  const [documentId] = useState(params.id as string);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerDate, setSignerDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSigned, setIsSigned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock document data - in real implementation, fetch from API
  const mockDocument = {
    id: documentId,
    title: 'Exclusive Leasing Agency Agreement',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1>EXCLUSIVE LEASING AGENCY AGREEMENT</h1>
          <p><strong>DATE: ${new Date().toLocaleDateString()}</strong></p>
        </div>
        
        <p>This Exclusive Leasing Agency Agreement (the "Agreement") is made as of <strong>${new Date().toLocaleDateString()}</strong> (the "Effective Date") by and between <strong>[LANDLORD NAME]</strong> of <strong>[LANDLORD ADDRESS]</strong> ("LANDLORD") and <strong>LORNELL REAL ESTATE, LLC</strong>, of <strong>22 CHERRY STREET, SPENCER, MA 01562</strong> ("BROKER").</p>
        
        <p>By signing below, you acknowledge that you have read, understood, and agree to all terms and conditions set forth in this agreement.</p>
        
        <div style="margin-top: 60px; page-break-inside: avoid;">
          <h2>AGREED AND ACCEPTED:</h2>
          
          <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div style="width: 45%;">
              <p>____________________________</p>
              <p id="signer-name-placeholder">[SIGNER NAME]</p>
              <p>LANDLORD</p>
              <p style="margin-top: 20px;">Date: <span id="signer-date-placeholder">[DATE]</span></p>
            </div>
            
            <div style="width: 45%;">
              <p>____________________________</p>
              <p>LORNELL REAL ESTATE, LLC</p>
              <p>BROKER</p>
              <p style="margin-top: 20px;">Date: _______________</p>
            </div>
          </div>
        </div>
      </div>
    `,
    status: 'pending_signature'
  };

  const handleSign = async () => {
    if (!signerName || !signerEmail) {
      alert('Please fill in your name and email address.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call to record signature
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update the document content with signature details
      const signedContent = mockDocument.content
        .replace('[SIGNER NAME]', signerName)
        .replace('[DATE]', signerDate);
      
      setIsSigned(true);
      
      // In real implementation, this would save to database
      console.log('Document signed:', {
        documentId,
        signerName,
        signerEmail,
        signerDate,
        signedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error signing document:', error);
      alert('Failed to sign document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const signedContent = mockDocument.content
        .replace('[SIGNER NAME]', signerName)
        .replace('[DATE]', signerDate);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${mockDocument.title} - Signed</title>
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
            ${signedContent}
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
        </div>

        {/* Document Preview */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">{mockDocument.title}</h2>
            <p className="text-gray-600 text-sm">Please review the document carefully before signing</p>
          </CardHeader>
          <CardContent>
            <div 
              className="prose max-w-none text-sm border p-6 rounded bg-white max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: mockDocument.content }}
            />
          </CardContent>
        </Card>

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

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSign}
                disabled={isLoading || !signerName || !signerEmail}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing Document...
                  </>
                ) : (
                  <>
                    <PenTool className="w-4 h-4 mr-2" />
                    Sign Document
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