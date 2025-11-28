/**
 * 🔬 CV Demo - FULL EXTRACTION & IDENTIFICATION
 * Extracts each letter/object and provides bounding boxes + data
 */

import { useEffect, useState, useRef } from 'react';
import { loadOpenCV } from '../engine/cv/core/OpenCVLoader';

interface ExtractedObject {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
  area: number;
  perimeter: number;
  center: { x: number; y: number };
  aspectRatio: number;
  imageData: ImageData | null;
}

export default function CVDemoExtraction() {
  const [cvReady, setCvReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [objects, setObjects] = useState<ExtractedObject[]>([]);
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
      
      // Auto-extract
      await extractObjects();
      
    } catch (err) {
      console.error('❌ Failed to load OpenCV:', err);
      setError(err instanceof Error ? err.message : 'Failed to load OpenCV');
      setLoading(false);
    }
  }
  
  async function extractObjects() {
    if (!cvReady) return;
    
    try {
      const startTime = performance.now();
      console.log('🔍 Extracting objects...');
      
      // @ts-ignore
      const cv = window.cv;
      
      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = '/crossword.png';
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
      const binary = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      
      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      
      // Apply threshold (BINARY_INV for black letters on white)
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
      
      // Extract each object
      const extractedObjects: ExtractedObject[] = [];
      
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        
        // Filter noise (min area 100px)
        if (area < 100) {
          contour.delete();
          continue;
        }
        
        const rect = cv.boundingRect(contour);
        const perimeter = cv.arcLength(contour, true);
        
        // Calculate center
        const moments = cv.moments(contour);
        const centerX = moments.m10 / moments.m00;
        const centerY = moments.m01 / moments.m00;
        
        // Extract image data for this object
        const objectCanvas = document.createElement('canvas');
        objectCanvas.width = rect.width;
        objectCanvas.height = rect.height;
        const objectCtx = objectCanvas.getContext('2d')!;
        
        // Draw just this object
        objectCtx.drawImage(
          canvas,
          rect.x, rect.y, rect.width, rect.height,
          0, 0, rect.width, rect.height
        );
        
        const imageData = objectCtx.getImageData(0, 0, rect.width, rect.height);
        
        extractedObjects.push({
          id: i,
          bounds: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
          area,
          perimeter,
          center: { x: centerX, y: centerY },
          aspectRatio: rect.width / rect.height,
          imageData,
        });
        
        contour.delete();
      }
      
      // Sort by position (left to right, top to bottom)
      extractedObjects.sort((a, b) => {
        const rowDiff = Math.abs(a.bounds.y - b.bounds.y);
        if (rowDiff < 50) {
          return a.bounds.x - b.bounds.x;
        }
        return a.bounds.y - b.bounds.y;
      });
      
      setObjects(extractedObjects);
      
      // Draw results
      drawResults(src, extractedObjects);
      
      // Clean up
      src.delete();
      gray.delete();
      binary.delete();
      contours.delete();
      hierarchy.delete();
      
      const endTime = performance.now();
      setProcessingTime(endTime - startTime);
      
      console.log(`✅ Extracted ${extractedObjects.length} objects in ${(endTime - startTime).toFixed(2)}ms`);
      
    } catch (err) {
      console.error('❌ Extraction failed:', err);
      setError(err instanceof Error ? err.message : 'Extraction failed');
    }
  }
  
  function drawResults(src: any, objects: ExtractedObject[]) {
    const resultCanvas = resultCanvasRef.current!;
    resultCanvas.width = src.cols;
    resultCanvas.height = src.rows;
    
    // @ts-ignore
    const cv = window.cv;
    
    // Draw original
    cv.imshow(resultCanvas, src);
    
    // Draw bounding boxes
    const ctx = resultCanvas.getContext('2d')!;
    
    objects.forEach((obj, index) => {
      const { x, y, width, height } = obj.bounds;
      
      // Rainbow colors for each object
      const hue = (index * 360 / objects.length) % 360;
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Draw ID
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`#${index + 1}`, x, y - 5);
      
      // Draw center point
      ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
      ctx.beginPath();
      ctx.arc(obj.center.x, obj.center.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  function downloadExtractedData() {
    const data = objects.map(obj => ({
      id: obj.id,
      bounds: obj.bounds,
      area: obj.area,
      perimeter: obj.perimeter,
      center: obj.center,
      aspectRatio: obj.aspectRatio,
    }));
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_objects.json';
    a.click();
    URL.revokeObjectURL(url);
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
          🔬 CV System - Object Extraction & Identification
        </h1>
        <div style={{ color: '#888', fontSize: '14px', marginTop: '5px' }}>
          Full extraction with bounding boxes, centers, and metadata
        </div>
        <div style={{ marginTop: '10px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ color: '#00ff00' }}>
            ✅ OpenCV.js: Ready
          </div>
          <div style={{ color: '#00aaff' }}>
            📦 Objects Extracted: {objects.length}
          </div>
          <div style={{ color: '#ffaa00' }}>
            ⚡ Processing: {processingTime.toFixed(2)}ms
          </div>
        </div>
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button
            onClick={extractObjects}
            style={{
              padding: '8px 16px',
              background: '#00ff00',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🔄 Re-Extract
          </button>
          <button
            onClick={downloadExtractedData}
            style={{
              padding: '8px 16px',
              background: '#00aaff',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            💾 Download JSON
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
            ← Back
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
          {/* Original */}
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
                }}
              />
            </div>
          </div>
          
          {/* Detected */}
          <div>
            <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>
              🎯 Detected Objects (Rainbow Boxes)
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
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Extracted Objects Grid */}
        <div style={{ maxWidth: '1600px', margin: '20px auto' }}>
          <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>
            📦 Extracted Objects ({objects.length}) - Each Can Be Saved/Used Separately!
          </h2>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '20px',
            maxHeight: '600px',
            overflow: 'auto',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '15px',
            }}>
              {objects.map((obj, index) => {
                const hue = (index * 360 / objects.length) % 360;
                return (
                  <div
                    key={obj.id}
                    style={{
                      background: '#0a0a0a',
                      border: `2px solid hsl(${hue}, 100%, 50%)`,
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ color: `hsl(${hue}, 100%, 70%)`, fontWeight: 'bold', marginBottom: '8px' }}>
                      Object #{index + 1}
                    </div>
                    {obj.imageData && (
                      <canvas
                        width={obj.bounds.width}
                        height={obj.bounds.height}
                        ref={(canvas) => {
                          if (canvas && obj.imageData) {
                            const ctx = canvas.getContext('2d')!;
                            ctx.putImageData(obj.imageData, 0, 0);
                          }
                        }}
                        style={{
                          width: '100%',
                          height: 'auto',
                          border: '1px solid #333',
                          marginBottom: '8px',
                          imageRendering: 'pixelated',
                        }}
                      />
                    )}
                    <div style={{ color: '#888', fontSize: '11px' }}>
                      {obj.bounds.width}×{obj.bounds.height}px
                    </div>
                    <div style={{ color: '#888', fontSize: '11px' }}>
                      Area: {obj.area.toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Data Table */}
        <div style={{ maxWidth: '1600px', margin: '20px auto' }}>
          <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>
            📊 Extracted Data (Can Export to JSON)
          </h2>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '20px',
            maxHeight: '400px',
            overflow: 'auto',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#888', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', color: '#00ff00' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Position</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Size</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Area</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Perimeter</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Aspect Ratio</th>
                </tr>
              </thead>
              <tbody>
                {objects.map((obj, index) => (
                  <tr key={obj.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '10px' }}>#{index + 1}</td>
                    <td style={{ padding: '10px' }}>({obj.bounds.x}, {obj.bounds.y})</td>
                    <td style={{ padding: '10px' }}>{obj.bounds.width}×{obj.bounds.height}</td>
                    <td style={{ padding: '10px' }}>{obj.area.toFixed(0)}</td>
                    <td style={{ padding: '10px' }}>{obj.perimeter.toFixed(1)}</td>
                    <td style={{ padding: '10px' }}>{obj.aspectRatio.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Capabilities */}
        <div style={{ maxWidth: '1600px', margin: '20px auto' }}>
          <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>
            🚀 What This Proves
          </h2>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <div style={{ color: '#00ff00', marginBottom: '15px', fontSize: '16px' }}>
              ✅ YES - We CAN Extract & Identify Objects from Images!
            </div>
            <div style={{ color: '#888', fontSize: '14px', lineHeight: '1.8' }}>
              • Each letter/object is detected separately<br/>
              • Bounding boxes calculated automatically<br/>
              • Position, size, area, perimeter extracted<br/>
              • Center points identified<br/>
              • Aspect ratios calculated<br/>
              • Individual image data extracted for each object<br/>
              • Data exportable to JSON<br/>
              • Ready for classification/identification!
            </div>
            <div style={{ marginTop: '20px', padding: '15px', background: '#0a0a0a', borderRadius: '4px', border: '1px solid #00ff00' }}>
              <div style={{ color: '#ffaa00', marginBottom: '10px', fontSize: '14px' }}>
                🎯 Next Steps for Full Identification:
              </div>
              <div style={{ color: '#888', fontSize: '13px', lineHeight: '1.6' }}>
                1. ✅ <strong style={{ color: '#00ff00' }}>DONE:</strong> Extract objects with bounding boxes<br/>
                2. 🚧 <strong style={{ color: '#ffaa00' }}>NEXT:</strong> Add OCR (Tesseract.js) for letter recognition<br/>
                3. 🚧 <strong style={{ color: '#ffaa00' }}>NEXT:</strong> Add shape classification (circle, square, etc.)<br/>
                4. 🚧 <strong style={{ color: '#ffaa00' }}>NEXT:</strong> Add template matching for component types<br/>
                5. 🚧 <strong style={{ color: '#ffaa00' }}>FUTURE:</strong> Add neural network for semantic segmentation
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
