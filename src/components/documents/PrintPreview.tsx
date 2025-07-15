'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { 
  X, 
  Printer, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Settings,
  Eye,
  FileText,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface PrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: {
    id: string;
    title: string;
    content: string;
    document_templates?: {
      name: string;
      template_content: string;
    };
    field_values?: Record<string, any>;
  };
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function PrintPreview({ 
  isOpen, 
  onClose, 
  documentData, 
  onPrint, 
  onDownload 
}: PrintPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [margins, setMargins] = useState({ top: 20, right: 20, bottom: 20, left: 20 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const paperSizes = {
    A4: { width: 210, height: 297 }, // mm
    Letter: { width: 216, height: 279 }, // mm  
    Legal: { width: 216, height: 356 } // mm
  };

  const zoomLevels = [25, 50, 75, 100, 125, 150, 200];

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'p') {
          e.preventDefault();
          handlePrint();
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const generateContent = () => {
    if (!documentData?.document_templates?.template_content) {
      return documentData.content || '';
    }
    
    let content = documentData.document_templates.template_content;
    
    if (documentData.field_values) {
      Object.entries(documentData.field_values).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        content = content.replace(new RegExp(placeholder, 'g'), String(value || ''));
      });
    }
    
    return content;
  };

  const handleZoomIn = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= zoom);
    const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
    setZoom(zoomLevels[nextIndex]);
  };

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= zoom);
    const prevIndex = Math.max(currentIndex - 1, 0);
    setZoom(zoomLevels[prevIndex]);
  };

  const handlePrint = () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked');
      }
      
      // Use actual document content (with signatures) first, fall back to template generation
      const content = documentData.content || generateContent();
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title></title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              margin: 20mm;
              size: A4;
              /* Remove headers and footers */
              @top-left { content: ""; }
              @top-center { content: ""; }
              @top-right { content: ""; }
              @bottom-left { content: ""; }
              @bottom-center { content: ""; }
              @bottom-right { content: ""; }
            }
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              color: #000;
              font-size: 12pt;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Ensure no browser defaults interfere */
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h1 {
              text-align: center;
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 20pt;
              text-transform: uppercase;
              border-bottom: 2pt solid #000;
              padding-bottom: 10pt;
            }
            h2 {
              font-size: 14pt;
              font-weight: bold;
              margin-top: 20pt;
              margin-bottom: 10pt;
              text-transform: uppercase;
              border-bottom: 1pt solid #333;
              padding-bottom: 5pt;
            }
            h3 {
              font-size: 12pt;
              font-weight: bold;
              margin-top: 15pt;
              margin-bottom: 8pt;
              text-decoration: underline;
            }
            p {
              margin-bottom: 8pt;
              text-align: justify;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 15pt 0;
            }
            td, th {
              border: 1pt solid #000;
              padding: 8pt;
              text-align: left;
            }
            
            /* BULLETPROOF SIGNATURE SIDE-BY-SIDE LAYOUT */
            .signature-container .end-signature-signed {
              display: inline-block !important;
              width: 45% !important;
              vertical-align: top !important;
              margin-right: 5% !important;
            }
            
            .signature-container .end-signature-signed:last-child {
              margin-right: 0 !important;
            }
            
            /* AGGRESSIVE FALLBACK - Force ANY signature elements to be side-by-side */
            .end-signature-signed {
              display: inline-block !important;
              width: 45% !important;
              vertical-align: top !important;
              margin-right: 5% !important;
              box-sizing: border-box !important;
            }
            
            .end-signature-signed:last-of-type,
            .end-signature-signed:nth-child(2) {
              margin-right: 0 !important;
            }
            
            /* Force container to be block */
            .signature-container,
            .signatures-section {
              display: block !important;
              width: 100% !important;
              clear: both !important;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        // Show instructions for removing headers/footers
        const userAgent = navigator.userAgent.toLowerCase();
        let instructions = '';
        
        if (userAgent.includes('chrome')) {
          instructions = 'In the print dialog, click "More settings" and uncheck "Headers and footers" for a clean print.';
        } else if (userAgent.includes('firefox')) {
          instructions = 'In the print dialog, go to "Page Setup" and set headers/footers to "Blank" for a clean print.';
        } else if (userAgent.includes('safari')) {
          instructions = 'In the print dialog, uncheck "Print headers and footers" for a clean print.';
        } else {
          instructions = 'In the print dialog, look for options to disable headers and footers for a clean print.';
        }
        
        // Add instruction to the print window
        const instructionDiv = printWindow.document.createElement('div');
        instructionDiv.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          background: #f0f0f0;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 10px;
          max-width: 200px;
          z-index: 1000;
          font-family: Arial, sans-serif;
        `;
        instructionDiv.innerHTML = `<strong>Tip:</strong> ${instructions}`;
        printWindow.document.body.appendChild(instructionDiv);
        
        printWindow.print();
        printWindow.close();
      }, 250);
      
      if (onPrint) {
        onPrint();
      }
    } catch (error) {
      console.error('Print failed:', error);
      // Fallback to regular print
      window.print();
    }
  };

  const toggleOrientation = () => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
  };

  const getCurrentPaperSize = () => {
    const size = paperSizes[paperSize];
    return orientation === 'portrait' 
      ? { width: size.width, height: size.height }
      : { width: size.height, height: size.width };
  };

  if (!isOpen) return null;

  const currentSize = getCurrentPaperSize();
  const scaleForPreview = Math.min(600 / currentSize.width, 800 / currentSize.height) * (zoom / 100);

  return (
    <div className={`fixed inset-0 z-50 bg-black bg-opacity-75 transition-all duration-300 ${
      isFullscreen ? 'p-0' : 'p-4'
    }`}>
      <div className={`bg-white rounded-lg shadow-2xl flex flex-col h-full ${
        isFullscreen ? 'rounded-none' : 'max-h-[95vh]'
      }`}>
        
        {/* Header */}
        <div className="print-controls flex items-center justify-between p-4 border-b-2 border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <Eye className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Print Preview</h2>
              <p className="text-sm text-gray-600">{documentData.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-300 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= zoomLevels[0]}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Orientation Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleOrientation}
              className="flex items-center space-x-1"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-xs">{orientation}</span>
            </Button>

            {/* Settings Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className={showSettings ? 'bg-blue-50 border-blue-300' : ''}
            >
              <Settings className="w-4 h-4" />
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {/* Print Button */}
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>

            {/* Download Button */}
            {onDownload && (
              <Button 
                variant="outline" 
                onClick={onDownload}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            )}

            {/* Close Button */}
            <Button variant="outline" onClick={onClose} className="border-red-300 text-red-700 hover:bg-red-50">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Settings Panel */}
          {showSettings && (
            <div className="w-80 border-r-2 border-gray-200 bg-gray-50 overflow-y-auto">
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Paper Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Paper Size
                      </label>
                      <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="A4">A4 (210 × 297 mm)</option>
                        <option value="Letter">Letter (8.5 × 11 in)</option>
                        <option value="Legal">Legal (8.5 × 14 in)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Margins (mm)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(margins).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
                          {key}
                        </label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => setMargins(prev => ({ 
                            ...prev, 
                            [key]: parseInt(e.target.value) || 0 
                          }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          min="0"
                          max="50"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Zoom Presets</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {zoomLevels.map(level => (
                      <Button
                        key={level}
                        variant={zoom === level ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setZoom(level)}
                        className="text-xs"
                      >
                        {level}%
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Area */}
          <div className="flex-1 overflow-auto bg-gray-100 p-8">
            <div className="flex justify-center">
              <div 
                ref={previewRef}
                id="print-content"
                className="print-content print-preview-page bg-white shadow-2xl"
                style={{
                  width: `${currentSize.width * scaleForPreview}px`,
                  height: `${currentSize.height * scaleForPreview}px`,
                  padding: `${margins.top * scaleForPreview}px ${margins.right * scaleForPreview}px ${margins.bottom * scaleForPreview}px ${margins.left * scaleForPreview}px`,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  margin: '0 auto',
                  position: 'relative'
                }}
              >
                <div 
                  className="document-preview-content h-full overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: generateContent() }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Quick Actions */}
        <div className="border-t-2 border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                {paperSize} - {orientation}
              </span>
              <span>Zoom: {zoom}%</span>
              <span>
                {currentSize.width} × {currentSize.height} mm
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setZoom(100)}
                className="text-xs"
              >
                Reset Zoom
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setOrientation('portrait');
                  setPaperSize('A4');
                  setMargins({ top: 20, right: 20, bottom: 20, left: 20 });
                  setZoom(100);
                }}
                className="text-xs"
              >
                Reset All
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .print-preview-page {
          box-shadow: 0 0 20px rgba(0,0,0,0.3);
          border: 1px solid #ddd;
        }
        
        .document-preview-content {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          color: #000;
          font-size: 12pt;
        }
        
        .document-preview-content h1 {
          text-align: center;
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 20pt;
          text-transform: uppercase;
          border-bottom: 2pt solid #000;
          padding-bottom: 10pt;
        }
        
        .document-preview-content h2 {
          font-size: 14pt;
          font-weight: bold;
          margin-top: 20pt;
          margin-bottom: 10pt;
          text-transform: uppercase;
          border-bottom: 1pt solid #333;
          padding-bottom: 5pt;
        }
        
        .document-preview-content h3 {
          font-size: 12pt;
          font-weight: bold;
          margin-top: 15pt;
          margin-bottom: 8pt;
          text-decoration: underline;
        }
        
        .document-preview-content p {
          margin-bottom: 8pt;
          text-align: justify;
        }
        
        .document-preview-content strong {
          font-weight: bold;
        }
        
        .document-preview-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 15pt 0;
        }
        
        .document-preview-content td, 
        .document-preview-content th {
          border: 1pt solid #000;
          padding: 8pt;
          text-align: left;
        }
        
        .document-preview-content .signature-block {
          margin-top: 30pt;
          padding: 15pt;
          border: 2pt solid #000;
          background-color: #f9f9f9;
        }
        
        .document-preview-content .property-section,
        .document-preview-content .parties-section,
        .document-preview-content .terms-section {
          margin-bottom: 25pt;
          padding: 15pt;
          border: 1pt solid #666;
          border-radius: 3pt;
        }

        /* BULLETPROOF SIGNATURE SIDE-BY-SIDE LAYOUT FOR PREVIEW */
        .document-preview-content .signature-container .end-signature-signed {
          display: inline-block !important;
          width: 45% !important;
          vertical-align: top !important;
          margin-right: 5% !important;
        }
        
        .document-preview-content .signature-container .end-signature-signed:last-child {
          margin-right: 0 !important;
        }

        /* AGGRESSIVE FALLBACK FOR PREVIEW - Force ANY signature elements to be side-by-side */
        .document-preview-content .end-signature-signed {
          display: inline-block !important;
          width: 45% !important;
          vertical-align: top !important;
          margin-right: 5% !important;
          box-sizing: border-box !important;
        }
        
        .document-preview-content .end-signature-signed:last-of-type,
        .document-preview-content .end-signature-signed:nth-child(2) {
          margin-right: 0 !important;
        }
        
        /* Force container to be block for preview */
        .document-preview-content .signature-container,
        .document-preview-content .signatures-section {
          display: block !important;
          width: 100% !important;
          clear: both !important;
        }

        @media print {
          @page {
            margin: 20mm;
            size: auto;
            /* Remove browser's default headers and footers */
            margin-top: 0;
            margin-bottom: 0;
          }
          
          /* Hide browser's default print elements */
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Remove any default browser print styling */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hide UI elements but not print dialog triggers */
          .fixed:not(.print-content),
          .absolute:not(.print-content),
          nav,
          header,
          footer,
          .bg-gray-50,
          .border-t-2,
          .z-50,
          .print-controls {
            display: none !important;
          }
          
          /* Hide everything except our print content */
          body > *:not(#print-content) {
            display: none !important;
          }
          
          /* Ensure only our content shows */
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Show only print content */
          #print-content {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            background: white !important;
            visibility: visible !important;
          }
          
          .document-preview-content {
            font-size: 12pt !important;
            line-height: 1.4 !important;
            color: #000 !important;
            background: white !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
          
          /* Ensure proper print formatting */
          .document-preview-content h1 {
            page-break-after: avoid !important;
          }
          
          .document-preview-content h2,
          .document-preview-content h3 {
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          
          .document-preview-content p {
            orphans: 3 !important;
            widows: 3 !important;
          }
          
          .document-preview-content table {
            page-break-inside: avoid !important;
          }
          
          /* BULLETPROOF PRINT SIGNATURE LAYOUT */
          .document-preview-content .signature-container .end-signature-signed {
            display: inline-block !important;
            width: 45% !important;
            vertical-align: top !important;
            margin-right: 5% !important;
          }
          
          .document-preview-content .signature-container .end-signature-signed:last-child {
            margin-right: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}