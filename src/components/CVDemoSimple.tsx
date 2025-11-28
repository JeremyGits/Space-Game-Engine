/**
 * 🔬 SIMPLIFIED Computer Vision Demo
 * Using Canny edge detection - more stable than contours
 */

import { useEffect, useState, useRef } from 'react';
import { loadOpenCV } from '../engine/cv/core/OpenCVLoader';

export default function CVDemoSimple() {
  const [cvReady, setCvReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processed, setProcessed] = useState(false);
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
      
      // Auto-process
      await processImage();
      
    } catch (err) {
      console.error('❌ Failed to load OpenCV:', err);
      setError(err instanceof Error ? err.message : 'Failed to load OpenCV');
      setLoading(false);
    }
  }
  
  async function processImage() {
    if (!cvReady) return;
    
    try {
      console.log('🔍 Processing image with Canny edge detection...');
      
      // @ts-ignore
      const cv = window.cv;
      
      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = '/alphabet.jpg';
      });
      
      console.log(`📐 Image loaded: ${img.width}x${img.height}`);
      
      // Draw to canvas (limit size)
      const canvas = canvasRef.current!;
      const maxSize = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Process with OpenCV
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const edges = new cv.Mat();
      
      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      
      // Apply Canny edge detection (more stable than contours)
      cv.Canny(gray, edges, 50, 150);
      
      // Show result
      const resultCanvas = resultCanvasRef.current!;
      resultCanvas.width = width;
      resultCanvas.height = height;
      cv.imshow(resultCanvas, edges);
      
      // Clean up
      src.delete();
      gray.delete();
      edges.delete();
      
      setProcessed(true);
      console.log('✅ Processing complete!');
      
    } catch (err) {
      console.error('❌ Processing failed:', err);
      setError(err instanceof Error ? err.message : 'Processing failed');
    }
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
          <div style={{ fontSize: '20px', marginBottom: '10px' }}>Error</div>
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
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      padding: '20px',
    }}>
      <h1 style={{ color: '#00ff00', marginBottom: '30px', fontSize: '32px' }}>
        🔬 CV System Test - Edge Detection
      </h1>
      
      <div style={{ display: 'flex', gap: '40px', maxWidth: '1400px' }}>
        <div>
          <h2 style={{ color: '#00ff00', marginBottom: '15px' }}>Original</h2>
          <canvas
            ref={canvasRef}
            style={{
              border: '2px solid #00ff00',
              maxWidth: '600px',
              height: 'auto',
            }}
          />
        </div>
        
        <div>
          <h2 style={{ color: '#00ff00', marginBottom: '15px' }}>Edges Detected</h2>
          <canvas
            ref={resultCanvasRef}
            style={{
              border: '2px solid #00ff00',
              maxWidth: '600px',
              height: 'auto',
            }}
          />
        </div>
      </div>
      
      <div style={{ marginTop: '30px', color: processed ? '#00ff00' : '#888' }}>
        {processed ? '✅ OpenCV.js is working!' : '⏳ Processing...'}
      </div>
      
      <button
        onClick={processImage}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          background: '#00ff00',
          color: '#000',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        🔄 Re-Process
      </button>
      
      <a
        href="#"
        style={{
          marginTop: '20px',
          color: '#00aaff',
          textDecoration: 'none',
        }}
      >
        ← Back to Game
      </a>
    </div>
  );
}
