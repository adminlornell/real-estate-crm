'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Upload, Pen, Trash2, Edit } from 'lucide-react';

interface SignatureData {
  type: 'upload' | 'drawn' | 'none';
  data?: string;
  fileName?: string;
  timestamp: string;
  signerName?: string;
  signerDate?: string;
}

interface EmbeddedSignatureProps {
  label: string;
  defaultSignerName?: string;
  onSignatureChange: (signature: SignatureData | null) => void;
  disabled?: boolean;
}

export default function EmbeddedSignature({ 
  label, 
  defaultSignerName = '', 
  onSignatureChange, 
  disabled = false 
}: EmbeddedSignatureProps) {
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerDate, setSignerDate] = useState(new Date().toISOString().split('T')[0]);
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 250;
        canvas.height = 80;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        signerName: signerName,
        signerDate: signerDate
      };
      setSignature(newSignature);
      onSignatureChange(newSignature);
      setIsEditing(false);
      setShowUpload(false);
    };
    reader.readAsDataURL(file);
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || showConfirmation) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setIsMouseDown(true);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDown || disabled || showConfirmation) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const stopDrawing = () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);
  };

  const handleConfirmSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let hasDrawing = false;
        
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

  const acceptDrawnSignature = () => {
    if (drawnSignature) {
      const newSignature: SignatureData = {
        type: 'drawn',
        data: drawnSignature,
        timestamp: new Date().toISOString(),
        signerName: signerName,
        signerDate: signerDate
      };
      setSignature(newSignature);
      onSignatureChange(newSignature);
      setShowConfirmation(false);
      setIsDrawing(false);
      setIsEditing(false);
      setDrawnSignature(null);
    }
  };

  const rejectDrawnSignature = () => {
    setShowConfirmation(false);
    setDrawnSignature(null);
    initializeCanvas();
  };

  const clearSignature = () => {
    setSignature(null);
    onSignatureChange(null);
    setIsEditing(true);
    setIsDrawing(false);
    setShowConfirmation(false);
    setDrawnSignature(null);
    setShowUpload(false);
    if (canvasRef.current) {
      initializeCanvas();
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setSignature(null);
    onSignatureChange(null);
  };

  useEffect(() => {
    if (isDrawing && canvasRef.current) {
      initializeCanvas();
    }
  }, [isDrawing]);

  // Touch support
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

  if (signature && !isEditing) {
    // Display the signed signature
    return (
      <div className="border-2 border-gray-800 bg-gray-50 p-4 my-4">
        <div className="text-center">
          <h4 className="font-bold text-gray-900 mb-2">{label}</h4>
          <div className="bg-white border border-gray-300 p-2 inline-block">
            <img 
              src={signature.data} 
              alt={`${label} signature`} 
              className="max-w-[200px] max-h-[60px] object-contain"
            />
          </div>
          <div className="mt-2 text-sm">
            <p><strong>Name:</strong> {signature.signerName || 'Not provided'}</p>
            <p><strong>Date:</strong> {signature.signerDate || 'Not provided'}</p>
          </div>
          {!disabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={startEditing}
              className="mt-2"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit Signature
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isEditing) {
    // Show editing interface
    return (
      <div className="border-2 border-dashed border-gray-400 bg-yellow-50 p-4 my-4">
        <div className="text-center mb-4">
          <h4 className="font-bold text-gray-900 mb-2">{label}</h4>
          <p className="text-sm text-gray-600">Please add your signature below</p>
        </div>

        <div className="space-y-4">
          {/* Name and Date inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter name"
                size="sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="date"
                value={signerDate}
                onChange={(e) => setSignerDate(e.target.value)}
                size="sm"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center space-x-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpload(!showUpload)}
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDrawing(true);
                setShowUpload(false);
                setTimeout(initializeCanvas, 100);
              }}
            >
              <Pen className="w-4 h-4 mr-1" />
              Draw
            </Button>
          </div>

          {/* File upload */}
          {showUpload && (
            <div className="border border-gray-300 rounded p-3 bg-white">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/svg+xml"
                onChange={handleFileUpload}
                className="w-full text-sm"
              />
            </div>
          )}

          {/* Drawing canvas */}
          {isDrawing && (
            <div className="border border-gray-300 rounded bg-white p-2">
              <p className="text-xs text-gray-600 mb-2 text-center">Draw your signature:</p>
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={250}
                  height={80}
                  className={`border border-gray-300 cursor-crosshair bg-white ${showConfirmation ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ 
                    touchAction: 'none',
                    pointerEvents: showConfirmation ? 'none' : 'auto'
                  }}
                />
              </div>
              
              {showConfirmation ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-center">Confirm your signature:</p>
                  <div className="flex justify-center">
                    <img 
                      src={drawnSignature || ''} 
                      alt="Signature preview" 
                      className="border border-gray-300 bg-white p-1 max-h-16"
                    />
                  </div>
                  <div className="flex justify-center space-x-2">
                    <Button
                      size="sm"
                      onClick={acceptDrawnSignature}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      ✓ Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={rejectDrawnSignature}
                    >
                      Edit More
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => initializeCanvas()}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirmSignature}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    ✓ Confirm
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show empty signature box
  return (
    <div className="border-2 border-dashed border-gray-400 bg-gray-50 p-4 my-4">
      <div className="text-center">
        <h4 className="font-bold text-gray-900 mb-2">{label}</h4>
        <p className="text-sm text-gray-500 mb-3">Click to add signature</p>
        <Button
          variant="outline"
          onClick={() => setIsEditing(true)}
          disabled={disabled}
        >
          <Pen className="w-4 h-4 mr-2" />
          Add Signature
        </Button>
      </div>
    </div>
  );
}