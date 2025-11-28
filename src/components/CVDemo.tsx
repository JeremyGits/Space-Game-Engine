/**
 * 🔬 Computer Vision Demo
 * Testing CV detection capabilities with alphabet.jpg
 */

import { useEffect, useState, useRef } from 'react';
import { loadOpenCV } from '../engine/cv/core/OpenCVLoader';

interface DetectedLetter {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  area: number;
  confidence: number;
}

export default function CVDemo() {
  const [cvReady, setCvReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<DetectedLetter[]>([]);
  const [processingTime, setProcessingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    initializeCV();
  }, []);
  
  async function initializeCV() {
    try {
      setLoading(true);
      console.log('🔬 Loading OpenCV.js...');
      
      await loadOpenCV();
      
      console.log('✅ OpenCV.js loaded!');
      setCvReady(true);
      setLoading(false);
      
      // Auto-detect letters
      await detectLetters();
      
    } catch (err) {
      console.error('❌ Failed to load OpenCV:', err);
      setError(err instanceof Error ? err.message : 'Failed to load OpenCV');
      setLoading(false);
    }
  }
  
  async function detectLetters() {
    if (!cvReady) return;
    
    try {
      const startTime = performance.now();
      console.log('🔍 Detecting letters...');
      
      // @ts-ignore - OpenCV global
      const cv = window.cv;
      
      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = '/alphabet.jpg';
      });
      
      // Draw to canvas with size limit to prevent OpenCV memory issues
      const canvas = canvasRef.current!;
      const maxDimension = 1024; // Limit to 1024px to prevent memory issues
      let width = img.width;
      let height = img.height;
      
      // Scale down if too large
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
        console.log(`📐 Scaling image from ${img.width}x${img.height} to ${width}x${height}`);
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to OpenCV Mat
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const binary = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      
      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      
      // Apply threshold
      cv.threshold(gray, binary, 127, 255, cv.THRESH_BINARY_INV);
      
      // Find contours
      cv.findContours(
        binary,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );
      
      console.log(`📊 Found ${contours.size()} contours`);
      
      // Extract letter bounding boxes
      const detectedLetters: DetectedLetter[] = [];
      
      for (let i = 0; i < contours.size(); i++) {
        try {
          const contour = contours.get(i);
          const area = cv.contourArea(contour);
          
          // Filter small noise
          if (area < 100) {
            contour.delete();
            continue;
          }
          
          const rect = cv.boundingRect(contour);
          
          detectedLetters.push({
            id: `letter_${i}`,
            bounds: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
            area,
            confidence: 1.0,
          });
          
          contour.delete();
        } catch (err) {
          console.warn(`⚠️ Skipping contour ${i}:`, err);
        }
      }
      
      // Sort by position (left to right, top to bottom)
      detectedLetters.sort((a, b) => {
        const rowDiff = Math.abs(a.bounds.y - b.bounds.y);
        if (rowDiff < 50) {
          return a.bounds.x - b.bounds.x; // Same row, sort by x
        }
        return a.bounds.y - b.bounds.y; // Different rows, sort by y
      });
      
      setLetters(detectedLetters);
      
      // Draw results
      drawResults(src, detectedLetters);
      
      // Clean up
      src.delete();
      gray.delete();
      binary.delete();
      contours.delete();
      hierarchy.delete();
      
      const endTime = performance.now();
      setProcessingTime(endTime - startTime);
      
      console.log(`✅ Detected ${detectedLetters.length} letters in ${(endTime - startTime).toFixed(2)}ms`);
      
    } catch (err) {
      console.error('❌ Detection failed:', err);
      setError(err instanceof Error ? err.message : 'Detection failed');
    }
  }
  
  function drawResults(src: any, letters: DetectedLetter[]) {
    const resultCanvas = resultCanvasRef.current!;
    resultCanvas.width = src.cols;
    resultCanvas.height = src.rows;
    
    // @ts-ignore
    const cv = window.cv;
    
    // Draw original image
    cv.imshow(resultCanvas, src);
    
    // Draw bounding boxes
    const ctx = resultCanvas.getContext('2d')!;
    
    letters.forEach((letter, index) => {
      const { x, y, width, height } = letter.bounds;
      
      // Draw rectangle
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Draw label
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px monospace';
      ctx.fillText(`#${index + 1}`, x, y - 5);
    });
  }
  
  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '24px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔬</div>
          <div>Loading OpenCV.js...</div>
          <div style={{ fontSize: '14px', marginTop: '10px', color: '#888' }}>
            Initializing Computer Vision System
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ff0000',
        fontFamily: 'monospace',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <div style={{ fontSize: '20px', marginBottom: '10px' }}>CV System Error</div>
          <div style={{ fontSize: '14px', color: '#ff6666' }}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#ff0000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0a0a',
      overflow: 'auto',
      fontFamily: 'monospace',
    }}>
      {/* Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(0,0,0,0.95)',
        borderBottom: '2px solid #00ff00',
        padding: '20px',
        zIndex: 1000,
      }}>
        <h1 style={{ color: '#00ff00', margin: 0, fontSize: '24px' }}>
          🔬 Computer Vision Demo - Letter Detection
        </h1>
        <div style={{ color: '#888', fontSize: '14px', marginTop: '5px' }}>
          Testing OpenCV.js contour detection on alphabet.jpg
        </div>
        <div style={{ marginTop: '10px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ color: '#00ff00' }}>
            ✅ OpenCV.js: Loaded
          </div>
          <div style={{ color: '#00aaff' }}>
            📊 Letters Detected: {letters.length}
          </div>
          <div style={{ color: '#ffaa00' }}>
            ⚡ Processing Time: {processingTime.toFixed(2)}ms
          </div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={detectLetters}
            style={{
              padding: '8px 16px',
              background: '#00ff00',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              marginRight: '10px',
            }}
          >
            🔄 Re-Detect
          </button>
          <a
            href="#"
            style={{
              padding: '8px 16px',
              background: '#333',
              color: '#00aaff',
              textDecoration: 'none',
              borderRadius: '4px',
              display: 'inline-block',
            }}
          >
            ← Back to Game
          </a>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ marginTop: '180px', padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          maxWidth: '1600px',
          margin: '0 auto',
        }}>
          {/* Original Image */}
          <div>
            <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>
              📷 Original Image
            </h2>
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '10px',
            }}>
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  imageRendering: 'pixelated',
                }}
              />
            </div>
          </div>
          
          {/* Detection Results */}
          <div>
            <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>
              🎯 Detection Results
            </h2>
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '10px',
            }}>
              <canvas
                ref={resultCanvasRef}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  imageRendering: 'pixelated',
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Letter List */}
        <div style={{ maxWidth: '1600px', margin: '20px auto' }}>
          <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>
            📋 Detected Letters ({letters.length})
          </h2>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '20px',
            maxHeight: '400px',
            overflow: 'auto',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '10px',
            }}>
              {letters.map((letter, index) => (
                <div
                  key={letter.id}
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid #00ff00',
                    borderRadius: '4px',
                    padding: '10px',
                  }}
                >
                  <div style={{ color: '#00ff00', fontWeight: 'bold' }}>
                    Letter #{index + 1}
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', marginTop: '5px' }}>
                    Position: ({letter.bounds.x}, {letter.bounds.y})
                  </div>
                  <div style={{ color: '#888', fontSize: '12px' }}>
                    Size: {letter.bounds.width} × {letter.bounds.height}
                  </div>
                  <div style={{ color: '#888', fontSize: '12px' }}>
                    Area: {letter.area.toFixed(0)} px²
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div style={{ maxWidth: '1600px', margin: '20px auto' }}>
          <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>
            📊 Detection Statistics
          </h2>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              <div>
                <div style={{ color: '#888', fontSize: '12px' }}>Total Letters</div>
                <div style={{ color: '#00ff00', fontSize: '32px', fontWeight: 'bold' }}>
                  {letters.length}
                </div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '12px' }}>Processing Time</div>
                <div style={{ color: '#00aaff', fontSize: '32px', fontWeight: 'bold' }}>
                  {processingTime.toFixed(0)}ms
                </div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '12px' }}>Avg Area</div>
                <div style={{ color: '#ffaa00', fontSize: '32px', fontWeight: 'bold' }}>
                  {letters.length > 0
                    ? (letters.reduce((sum, l) => sum + l.area, 0) / letters.length).toFixed(0)
                    : 0}
                </div>
              </div>
              <div>
                <div style={{ color: '#888', fontSize: '12px' }}>Algorithm</div>
                <div style={{ color: '#ff00ff', fontSize: '20px', fontWeight: 'bold', marginTop: '8px' }}>
                  OpenCV Contours
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Capabilities */}
        <div style={{ maxWidth: '1600px', margin: '20px auto' }}>
          <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>
            🚀 CV System Capabilities
          </h2>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div style={{ color: '#00ff00' }}>✅ Contour Detection</div>
              <div style={{ color: '#00ff00' }}>✅ Circle Detection (Hough)</div>
              <div style={{ color: '#00ff00' }}>✅ Shape Classification</div>
              <div style={{ color: '#00ff00' }}>✅ Rectangle Detection</div>
              <div style={{ color: '#00ff00' }}>✅ Template Matching</div>
              <div style={{ color: '#00ff00' }}>✅ Feature Matching (ORB)</div>
              <div style={{ color: '#00ff00' }}>✅ Pattern Detection (FFT)</div>
              <div style={{ color: '#00ff00' }}>✅ Object Grouping</div>
            </div>
            <div style={{ marginTop: '15px', padding: '15px', background: '#0a0a0a', borderRadius: '4px' }}>
              <div style={{ color: '#ffaa00', marginBottom: '10px' }}>
                🎯 What This Demo Shows:
              </div>
              <div style={{ color: '#888', fontSize: '14px', lineHeight: '1.6' }}>
                • Automatic letter/object extraction from images<br/>
                • Bounding box calculation for each detected object<br/>
                • Area and position analysis<br/>
                • Real-time processing with OpenCV.js<br/>
                • Foundation for component recognition in cockpit images!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
