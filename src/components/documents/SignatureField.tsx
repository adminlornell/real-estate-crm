'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Upload, Pen, Trash2, Download } from 'lucide-react';

interface SignatureData {
  type: 'upload' | 'drawn' | 'none';
  data?: string; // base64 for uploads, SVG path for drawn
  fileName?: string;
  timestamp: string;
  signerName?: string;
  signerDate?: string;
}

interface SignatureFieldProps {
  label: string;
  signerName?: string;
  onSignatureChange: (signature: SignatureData | null) => void;
  disabled?: boolean;
}

export default function SignatureField({ 
  label, 
  signerName, 
  onSignatureChange, 
  disabled = false 
}: SignatureFieldProps) {
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [signerNameInput, setSignerNameInput] = useState(signerName || '');
  const [signerDate, setSignerDate] = useState(new Date().toISOString().split('T')[0]);
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null); // Temporary storage for drawn signature
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or SVG file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const newSignature: SignatureData = {
        type: 'upload',
        data: result,
        fileName: file.name,
        timestamp: new Date().toISOString(),
        signerName: signerNameInput,
        signerDate: signerDate
      };
      setSignature(newSignature);
      onSignatureChange(newSignature);
      setShowUpload(false);
    };
    reader.readAsDataURL(file);
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas ref not found');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    console.log('Starting to draw at:', x, y);
    setIsMouseDown(true);
    setLastPos({ x, y });

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      console.log('Canvas context not found');
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDown || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw a line from the last position to the current position
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Start a new path from the current position for the next segment
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    setLastPos({ x, y });
  };

  const stopDrawing = () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);
    // Just stop drawing, don't show confirmation yet
    // User can continue drawing until they manually click confirm
  };

  const handleConfirmSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Check if there's actually something drawn
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let hasDrawing = false;
        
        // Check if any pixel is not white/transparent
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255 || pixels[i + 3] !== 255) {
            hasDrawing = true;
            break;
          }
        }
        
        if (hasDrawing) {
          const dataURL = canvas.toDataURL('image/png');
          setDrawnSignature(dataURL);
          setShowConfirmation(true);
        } else {
          alert('Please draw your signature first');
        }
      }
    }
  };

  const confirmDrawnSignature = () => {
    if (drawnSignature) {
      const newSignature: SignatureData = {
        type: 'drawn',
        data: drawnSignature,
        timestamp: new Date().toISOString(),
        signerName: signerNameInput,
        signerDate: signerDate
      };
      setSignature(newSignature);
      onSignatureChange(newSignature);
      setShowConfirmation(false);
      setIsDrawing(false);
      setDrawnSignature(null);
    }
  };

  const rejectDrawnSignature = () => {
    setShowConfirmation(false);
    setDrawnSignature(null);
    // Clear the canvas and allow user to redraw
    const canvas = canvasRef.current;
    if (canvas) {
      initializeCanvas();
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        initializeCanvas();
      }
    }
    setSignature(null);
    setIsDrawing(false);
    setShowConfirmation(false);
    setDrawnSignature(null);
    onSignatureChange(null);
  };

  const downloadSignature = () => {
    if (!signature?.data) return;
    
    const link = document.createElement('a');
    link.download = `signature_${label.replace(/\s+/g, '_')}_${Date.now()}.png`;
    link.href = signature.data;
    link.click();
  };

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas size explicitly
        canvas.width = 300;
        canvas.height = 100;
        
        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set drawing properties
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
      }
    }
  };

  useEffect(() => {
    if (isDrawing) {
      initializeCanvas();
    }
  }, [isDrawing]);

  // Add touch support
  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    startDrawing(mouseEvent as any);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    draw(mouseEvent as any);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    stopDrawing();
  };

  return (
    <Card className="border-2 border-gray-300">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Label */}
          <h3 className="font-semibold text-gray-900">{label}</h3>
          
          {/* Signer Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Signer Name
            </label>
            <Input
              value={signerNameInput}
              onChange={(e) => setSignerNameInput(e.target.value)}
              placeholder="Enter signer name"
              disabled={disabled}
            />
          </div>

          {/* Signer Date Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <Input
              type="date"
              value={signerDate}
              onChange={(e) => setSignerDate(e.target.value)}
              disabled={disabled}
            />
          </div>

          {/* Signature Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            {signature ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Signature ({signature.type === 'upload' ? 'Uploaded' : 'Drawn'})
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadSignature}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSignature}
                      disabled={disabled}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded p-2">
                  <img 
                    src={signature.data} 
                    alt="Signature" 
                    className="max-w-full max-h-24 object-contain"
                  />
                </div>
                
                {signature.fileName && (
                  <p className="text-xs text-gray-500">
                    File: {signature.fileName}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUpload(!showUpload)}
                    disabled={disabled}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDrawing(true);
                      setSignature(null);
                      onSignatureChange(null);
                      setShowUpload(false);
                      // Initialize canvas after state update
                      setTimeout(() => {
                        initializeCanvas();
                      }, 100);
                    }}
                    disabled={disabled}
                  >
                    <Pen className="w-4 h-4 mr-2" />
                    Draw Signature
                  </Button>
                </div>

                {/* File Upload */}
                {showUpload && (
                  <div className="border border-gray-200 rounded p-3 bg-white">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/svg+xml"
                      onChange={handleFileUpload}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPG, PNG, SVG
                    </p>
                  </div>
                )}

                {/* Drawing Canvas */}
                {isDrawing && (
                  <div className="border border-gray-200 rounded bg-white">
                    <div className="p-2 border-b border-gray-200 bg-gray-50">
                      <p className="text-xs text-gray-600">
                        Draw your signature below (use mouse or touch):
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50">
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={100}
                        className={`w-full border border-gray-300 bg-white rounded ${showConfirmation ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'}`}
                        onMouseDown={showConfirmation ? undefined : startDrawing}
                        onMouseMove={showConfirmation ? undefined : draw}
                        onMouseUp={showConfirmation ? undefined : stopDrawing}
                        onMouseLeave={showConfirmation ? undefined : stopDrawing}
                        onTouchStart={showConfirmation ? undefined : handleTouchStart}
                        onTouchMove={showConfirmation ? undefined : handleTouchMove}
                        onTouchEnd={showConfirmation ? undefined : handleTouchEnd}
                        style={{ 
                          touchAction: 'none',
                          maxWidth: '100%',
                          height: '100px',
                          pointerEvents: showConfirmation ? 'none' : 'auto'
                        }}
                      />
                    </div>
                    <div className="p-2 border-t border-gray-200 bg-gray-50">
                      {showConfirmation ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-700">
                            Please confirm your signature:
                          </p>
                          <div className="bg-white border border-gray-200 rounded p-2">
                            <img 
                              src={drawnSignature || ''} 
                              alt="Drawn signature preview" 
                              className="max-w-full max-h-16 object-contain"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={confirmDrawnSignature}
                              className="flex-1 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                            >
                              ✓ Accept Signature
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={rejectDrawnSignature}
                              className="flex-1 bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                            >
                              ✗ Edit More
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearSignature}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Clear
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleConfirmSignature}
                              className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                            >
                              ✓ Confirm Signature
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Draw your signature then click Confirm
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isDrawing && !showUpload && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Upload a signature file or draw your signature
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}