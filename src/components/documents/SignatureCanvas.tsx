'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { RotateCcw, Check, X } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureCapture: (signatureData: string, coordinates: any) => void;
  onCancel?: () => void;
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  className?: string;
}

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export default function SignatureCanvas({
  onSignatureCapture,
  onCancel,
  width = 600,
  height = 200,
  strokeColor = '#000000',
  strokeWidth = 2,
  backgroundColor = '#ffffff',
  className = ''
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set drawing styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }, [width, height, strokeColor, strokeWidth, backgroundColor]);

  // Get point coordinates relative to canvas
  const getPointFromEvent = useCallback((event: MouseEvent | TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, timestamp: Date.now() };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      timestamp: Date.now()
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    const point = getPointFromEvent(event);
    setIsDrawing(true);
    setCurrentStroke([point]);
    setIsEmpty(false);
  }, [getPointFromEvent]);

  // Continue drawing
  const draw = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const point = getPointFromEvent(event);
    
    setCurrentStroke(prev => {
      const newStroke = [...prev, point];
      
      // Draw the line segment
      if (newStroke.length > 1) {
        const prevPoint = newStroke[newStroke.length - 2];
        
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
      
      return newStroke;
    });
  }, [isDrawing, getPointFromEvent]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (currentStroke.length > 0) {
      const newStroke: Stroke = {
        points: currentStroke,
        color: strokeColor,
        width: strokeWidth
      };
      
      setStrokes(prev => [...prev, newStroke]);
      setCurrentStroke([]);
    }
  }, [isDrawing, currentStroke, strokeColor, strokeWidth]);

  // Mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => startDrawing(e);
    const handleMouseMove = (e: MouseEvent) => draw(e);
    const handleMouseUp = () => stopDrawing();
    const handleMouseLeave = () => stopDrawing();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [startDrawing, draw, stopDrawing]);

  // Touch events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => startDrawing(e);
    const handleTouchMove = (e: TouchEvent) => draw(e);
    const handleTouchEnd = () => stopDrawing();

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startDrawing, draw, stopDrawing]);

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    setStrokes([]);
    setCurrentStroke([]);
    setIsEmpty(true);
  };

  // Redraw all strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear and fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Redraw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      
      stroke.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      ctx.stroke();
    });
  }, [strokes, backgroundColor, width, height]);

  // Redraw when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Capture signature
  const captureSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // Get image data as base64
    const signatureData = canvas.toDataURL('image/png');
    
    // Prepare coordinates data for storage
    const coordinatesData = {
      strokes,
      width,
      height,
      timestamp: Date.now()
    };

    onSignatureCapture(signatureData, coordinatesData);
  };

  return (
    <div className={`signature-canvas-container ${className}`}>
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Digital Signature</h3>
          <p className="text-sm text-gray-600">
            Please sign in the box below using your mouse or finger
          </p>
        </div>

        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            className="border border-gray-400 rounded cursor-crosshair touch-none"
            style={{ 
              maxWidth: '100%',
              height: 'auto',
              backgroundColor: backgroundColor 
            }}
          />
        </div>

        <div className="flex justify-center space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={clearCanvas}
            className="flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}

          <Button
            type="button"
            onClick={captureSignature}
            disabled={isEmpty}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Accept Signature
          </Button>
        </div>

        {isEmpty && (
          <div className="text-center mt-3">
            <p className="text-sm text-gray-500">
              Canvas is empty. Please draw your signature above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 