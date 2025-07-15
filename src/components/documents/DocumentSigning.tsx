'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { PenTool, Check, X, FileText, Eye } from 'lucide-react';
import EmbeddedSignature from './EmbeddedSignature';

interface SignatureData {
  type: 'upload' | 'drawn' | 'none';
  data?: string;
  fileName?: string;
  timestamp: string;
  signerName?: string;
  signerDate?: string;
}

interface DocumentSigningProps {
  documentData: {
    id: string;
    title: string;
    content: string;
  };
  onSigningComplete?: (signatures: any) => void;
  onCancel?: () => void;
}

export default function DocumentSigning({ 
  documentData, 
  onSigningComplete, 
  onCancel 
}: DocumentSigningProps) {
  const { user } = useAuth();
  const [signatures, setSignatures] = useState({
    seller: null as SignatureData | null,
    broker: null as SignatureData | null
  });
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [documentWithSignatures, setDocumentWithSignatures] = useState<string>('');
  const [signaturePosition, setSignaturePosition] = useState<'embedded' | 'end'>('end');

  // Update document content with signatures
  useEffect(() => {
    updateDocumentContent();
  }, [signatures, documentData.content, signaturePosition]);

  const handleSignatureChange = (type: 'seller' | 'broker', signature: SignatureData | null) => {
    setSignatures(prev => ({
      ...prev,
      [type]: signature
    }));
  };

  const updateDocumentContent = () => {
    if (!documentData?.content) return;
    
    let updatedContent = documentData.content;
    
    if (signaturePosition === 'embedded') {
      // Handle embedded signatures (keep existing logic)
      const sellerSectionRegex = /seller|landlord/i;
      const brokerSectionRegex = /broker|agent/i;
      
      if (signatures.seller) {
        const sellerSignatureComponent = `
          <div class="embedded-signature-signed">
            <h4>Seller/Landlord Signature:</h4>
            <img src="${signatures.seller.data}" alt="Seller Signature" style="max-width: 200px; max-height: 60px; border: 2px solid #000; padding: 5px; background: white; margin: 10px 0;"/>
            <p><strong>Name:</strong> ${signatures.seller.signerName || 'Not provided'}</p>
            <p><strong>Date:</strong> ${signatures.seller.signerDate || 'Not provided'}</p>
          </div>`;
        
        const firstSellerIndex = updatedContent.search(sellerSectionRegex);
        if (firstSellerIndex !== -1) {
          updatedContent = updatedContent.slice(0, firstSellerIndex) + sellerSignatureComponent + updatedContent.slice(firstSellerIndex);
        }
      }
      
      if (signatures.broker) {
        const brokerSignatureComponent = signatures.broker 
          ? `<div class="embedded-signature-signed">
               <h4>Broker Signature:</h4>
               <img src="${signatures.broker.data}" alt="Broker Signature" style="max-width: 200px; max-height: 60px; border: 2px solid #000; padding: 5px; background: white; margin: 10px 0;"/>
               <p><strong>Name:</strong> ${signatures.broker.signerName || 'Not provided'}</p>
               <p><strong>Date:</strong> ${signatures.broker.signerDate || 'Not provided'}</p>
             </div>`
          : '<div class="embedded-signature-placeholder" data-signature-type="broker">{{BROKER_SIGNATURE_COMPONENT}}</div>';
        
        const firstBrokerIndex = updatedContent.search(brokerSectionRegex);
        if (firstBrokerIndex !== -1) {
          updatedContent = updatedContent.slice(0, firstBrokerIndex) + brokerSignatureComponent + updatedContent.slice(firstBrokerIndex);
        }
      }
    } else if (signaturePosition === 'end') {
      // Replace signature placeholders in the existing template signature section
      // instead of adding a new section
      
      // Replace seller signature placeholder
      if (signatures.seller) {
        const sellerSignatureHTML = `
          <div class="end-signature-signed">
            <h4>Seller/Landlord:</h4>
            <img src="${signatures.seller.data}" alt="Seller Signature" style="max-width: 200px; max-height: 60px; border: 2px solid #000; padding: 5px; background: white; margin: 10px 0;"/>
            <p><strong>Name:</strong> ${signatures.seller.signerName || 'Not provided'}</p>
            <p><strong>Date:</strong> ${signatures.seller.signerDate || 'Not provided'}</p>
          </div>
        `;
        updatedContent = updatedContent.replace(/\{\{SELLER_SIGNATURE_COMPONENT\}\}/g, sellerSignatureHTML);
      }
      
      // Replace broker signature placeholder
      if (signatures.broker) {
        const brokerSignatureHTML = `
          <div class="end-signature-signed">
            <h4>Broker:</h4>
            <img src="${signatures.broker.data}" alt="Broker Signature" style="max-width: 200px; max-height: 60px; border: 2px solid #000; padding: 5px; background: white; margin: 10px 0;"/>
            <p><strong>Name:</strong> ${signatures.broker.signerName || 'Not provided'}</p>
            <p><strong>Date:</strong> ${signatures.broker.signerDate || 'Not provided'}</p>
          </div>
        `;
        updatedContent = updatedContent.replace(/\{\{BROKER_SIGNATURE_COMPONENT\}\}/g, brokerSignatureHTML);
      }
    }
    
    setDocumentWithSignatures(updatedContent);
  };

  const canCreateDocument = () => {
    return signatures.seller !== null || signatures.broker !== null;
  };

  const handleCreateDocument = async () => {
    setIsCreatingDocument(true);
    
    try {
      let finalDocumentContent = documentWithSignatures;
      
      if (signaturePosition === 'embedded') {
        // Replace embedded signature placeholders with final signed versions
        finalDocumentContent = finalDocumentContent
          .replace(/\{\{SELLER_SIGNATURE_COMPONENT\}\}/g, signatures.seller ? `
            <div style="margin: 20px 0; padding: 15px; border: 2px solid #000; background-color: #f9f9f9; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; font-weight: bold; color: #000;">Seller/Landlord:</h4>
              <img src="${signatures.seller.data}" alt="Seller Signature" style="max-width: 200px; max-height: 60px; border: 2px solid #000; padding: 5px; background: white; margin: 10px 0; display: block;"/>
              <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Name:</strong> ${signatures.seller.signerName || 'Not provided'}</p>
              <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Date:</strong> ${signatures.seller.signerDate || 'Not provided'}</p>
            </div>
          ` : '')
          .replace(/\{\{BROKER_SIGNATURE_COMPONENT\}\}/g, signatures.broker ? `
            <div style="margin: 20px 0; padding: 15px; border: 2px solid #000; background-color: #f9f9f9; border-radius: 8px;">
              <h4 style="margin: 0 0 10px 0; font-weight: bold; color: #000;">Broker:</h4>
              <img src="${signatures.broker.data}" alt="Broker Signature" style="max-width: 200px; max-height: 60px; border: 2px solid #000; padding: 5px; background: white; margin: 10px 0; display: block;"/>
              <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Name:</strong> ${signatures.broker.signerName || 'Not provided'}</p>
              <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Date:</strong> ${signatures.broker.signerDate || 'Not provided'}</p>
            </div>
          ` : '');
      } else {
        // Replace end signature placeholders with final signed versions - proper container structure
        let sellerSignatureHtml = '';
        let brokerSignatureHtml = '';
        
        if (signatures.seller) {
          sellerSignatureHtml = `
            <div class="end-signature-signed" style="display: inline-block !important; width: 45% !important; vertical-align: top !important; margin-right: 5% !important; padding: 20px; border: 2px solid #000; background-color: #f9f9f9; border-radius: 8px;">
              <h4>Seller/Landlord:</h4>
              <img src="${signatures.seller.data}" alt="Seller Signature" style="max-width: 200px; max-height: 60px; border: 2px solid #000; padding: 5px; background: white; margin: 10px 0;"/>
              <p><strong>Name:</strong> ${signatures.seller.signerName || 'Not provided'}</p>
              <p><strong>Date:</strong> ${signatures.seller.signerDate || 'Not provided'}</p>
            </div>
          `;
        }
        
        if (signatures.broker) {
          brokerSignatureHtml = `
            <div class="end-signature-signed" style="display: inline-block !important; width: 45% !important; vertical-align: top !important; margin-right: 0 !important; padding: 20px; border: 2px solid #000; background-color: #f9f9f9; border-radius: 8px;">
              <h4>Broker:</h4>
              <img src="${signatures.broker.data}" alt="Broker Signature" style="max-width: 200px; max-height: 60px; border: 2px solid #000; padding: 5px; background: white; margin: 10px 0;"/>
              <p><strong>Name:</strong> ${signatures.broker.signerName || 'Not provided'}</p>
              <p><strong>Date:</strong> ${signatures.broker.signerDate || 'Not provided'}</p>
            </div>
          `;
        }
        
        // Create the proper signature container structure
        const signatureContainerHtml = `
          <div class="signature-container" style="display: block !important; width: 100% !important; margin: 20px 0 !important; padding: 0 !important; text-align: left !important;">
            ${sellerSignatureHtml}
            ${brokerSignatureHtml}
          </div>
        `;
        
        // Replace the entire signatures section with the new signature container
        const signaturesSectionRegex = /<div class="signatures-section">[\s\S]*?<\/div>\s*<\/div>/g;
        const agreedSectionRegex = /<h2>AGREED AND ACCEPTED<\/h2>[\s\S]*?(?=<\/div>\s*<\/div>|$)/g;
        
        if (signaturesSectionRegex.test(finalDocumentContent)) {
          // Replace the entire signatures-section
          finalDocumentContent = finalDocumentContent.replace(signaturesSectionRegex, `
            <div class="signatures-section">
              <h2>AGREED AND ACCEPTED</h2>
              ${signatureContainerHtml}
            </div>
          </div>`);
        } else if (agreedSectionRegex.test(finalDocumentContent)) {
          // Replace just the AGREED AND ACCEPTED section
          finalDocumentContent = finalDocumentContent.replace(agreedSectionRegex, `
            <h2>AGREED AND ACCEPTED</h2>
            ${signatureContainerHtml}
          `);
        } else {
          // Fallback: replace individual placeholders if they exist
          finalDocumentContent = finalDocumentContent
            .replace(/\{\{SELLER_SIGNATURE_COMPONENT\}\}/g, signatureContainerHtml)
            .replace(/\{\{BROKER_SIGNATURE_COMPONENT\}\}/g, '');
        }
      }

      const documentWithSignaturesData = {
        ...documentData,
        content: finalDocumentContent,
        signatures: signatures,
        signaturePosition: signaturePosition,
        signed_at: new Date().toISOString(),
        signed_by: user?.email || 'Anonymous User'
      };

      if (onSigningComplete) {
        onSigningComplete(documentWithSignaturesData);
      }
      
    } catch (error) {
      console.error('Error creating signed document:', error);
      alert('Failed to create signed document. Please try again.');
    } finally {
      setIsCreatingDocument(false);
    }
  };

  // Custom component to render signature placeholders within the document
  const renderEmbeddedContent = (content: string) => {
    const parts = content.split(/(\{\{SELLER_SIGNATURE_COMPONENT\}\}|\{\{BROKER_SIGNATURE_COMPONENT\}\})/);
    
    return parts.map((part, index) => {
      if (part === '{{SELLER_SIGNATURE_COMPONENT}}') {
        return (
          <EmbeddedSignature
            key={`seller-${index}`}
            label="Seller/Landlord"
            onSignatureChange={(signature) => handleSignatureChange('seller', signature)}
            disabled={isCreatingDocument}
          />
        );
      } else if (part === '{{BROKER_SIGNATURE_COMPONENT}}') {
        return (
          <EmbeddedSignature
            key={`broker-${index}`}
            label="Broker"
            onSignatureChange={(signature) => handleSignatureChange('broker', signature)}
            disabled={isCreatingDocument}
          />
        );
      } else if (part.trim()) {
        return (
          <div 
            key={index}
            dangerouslySetInnerHTML={{ __html: part }}
          />
        );
      }
      return null;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Document Signing</h1>
                <p className="text-gray-600 mt-1">{documentData.title}</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Signature Position - Fixed to End of Document */}
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Signatures at document end
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Document with Signature Areas */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <PenTool className="w-5 h-5 mr-2 text-blue-600" />
              Document with End Signatures
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Signature boxes will appear at the end of the document. Complete your signatures below.
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="max-w-none document-content">
              {renderEmbeddedContent(documentWithSignatures)}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>

              <Button
                onClick={handleCreateDocument}
                disabled={!canCreateDocument() || isCreatingDocument}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center disabled:opacity-50"
              >
                {isCreatingDocument ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Creating Document...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Create Signed Document
                  </>
                )}
              </Button>
            </div>
            {!canCreateDocument() && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Please complete at least one signature to create the signed document.
              </p>
            )}
          </CardContent>
        </Card>
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
        
        .embedded-signature-signed {
          margin: 20px 0;
          padding: 15px;
          border: 2px solid #000;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
        
        .embedded-signature-signed h4 {
          margin: 0 0 10px 0;
          font-weight: bold;
          color: #000;
        }
        
        .embedded-signature-signed img {
          display: block;
          max-width: 200px;
          max-height: 60px;
          border: 2px solid #000;
          padding: 5px;
          background: white;
          margin: 10px 0;
        }
        
        .embedded-signature-signed p {
          margin: 5px 0;
          font-size: 0.9rem;
        }
        
        .signature-section-end {
          margin-top: 40px;
          padding-top: 30px;
        }
        
        .signature-section-end h2 {
          text-align: center;
          margin-bottom: 30px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #000;
        }
        
        .signature-container {
          display: flex !important;
          justify-content: space-between !important;
          align-items: flex-start !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 20px 0 !important;
          padding: 0 10% !important;
          position: relative !important;
          clear: both !important;
          min-height: 120px !important;
        }
        
        .signature-container .end-signature-signed {
          flex: 0 0 35% !important;
          width: 35% !important;
          margin: 0 !important;
          display: block !important;
          padding: 20px !important;
          border: 2px solid #000 !important;
          background-color: #f9f9f9 !important;
          border-radius: 8px !important;
          position: relative !important;
          text-align: left !important;
        }
        
        .signature-container .end-signature-signed:first-child {
          margin-right: 15px !important;
        }
        
        .signature-container .end-signature-signed:last-child {
          margin-left: 15px !important;
        }
        
        .document-content .signature-container {
          display: block !important;
          width: 100% !important;
          margin: 20px 0 !important;
          padding: 0 !important;
          text-align: left !important;
        }
        
        .document-content .signature-container .end-signature-signed {
          display: inline-block !important;
          width: 45% !important;
          margin-right: 5% !important;
          vertical-align: top !important;
          padding: 20px !important;
          border: 2px solid #000 !important;
          background-color: #f9f9f9 !important;
          border-radius: 8px !important;
        }
        
        .document-content .signature-container .end-signature-signed:last-child {
          margin-right: 0 !important;
        }
        
        .signature-container-sidebyside {
          display: block !important;
          overflow: hidden;
          white-space: nowrap;
        }
        
        .signature-container-sidebyside .end-signature-signed {
          margin: 30px 0;
          padding: 20px;
          border: 2px solid #000;
          background-color: #f9f9f9;
          border-radius: 8px;
          display: inline-block !important;
          width: 45% !important;
          margin-right: 5% !important;
          vertical-align: top !important;
          white-space: normal;
        }
        
        .signature-container-sidebyside .end-signature-signed:last-child {
          margin-right: 0 !important;
        }
        
        .end-signature-signed {
          display: inline-block !important;
          width: 45% !important;
          margin-right: 5% !important;
          vertical-align: top !important;
          margin-top: 30px;
          padding: 20px;
          border: 2px solid #000;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
        
        .end-signature-signed:last-child {
          margin-right: 0 !important;
        }
        
        .end-signature-signed h4 {
          margin: 0 0 15px 0;
          font-weight: bold;
          color: #000;
          text-transform: uppercase;
          font-size: 1rem;
        }
        
        .end-signature-signed img {
          display: block;
          max-width: 200px;
          max-height: 60px;
          border: 2px solid #000;
          padding: 5px;
          background: white;
          margin: 15px 0;
        }
        
        .end-signature-signed p {
          margin: 8px 0;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        @media print {
          @page {
            margin: 0.5in !important;
            size: letter !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .document-content {
            font-size: 12pt !important;
            line-height: 1.4 !important;
            color: black !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .document-content h1 {
            font-size: 18pt !important;
            margin-bottom: 12pt !important;
            page-break-after: avoid !important;
            text-align: center !important;
          }
          
          .document-content h2 {
            font-size: 16pt !important;
            margin-top: 12pt !important;
            margin-bottom: 8pt !important;
            page-break-after: avoid !important;
          }
          
          .document-content p {
            margin-bottom: 8pt !important;
          }
          
          /* AGREED AND ACCEPTED section styling */
          .document-content h2:contains("AGREED AND ACCEPTED") {
            margin-top: 30pt !important;
            text-align: center !important;
          }
          
          /* SIGNATURE LAYOUT - EXACT MATCH TO SIGNED DOCUMENT PAGE */
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
          
          /* Legacy signature styling for fallback */
          .end-signature-signed {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}