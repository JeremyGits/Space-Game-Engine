/**
 * 🧩 CROSSWORD OCR DEMO - FULL TEXT RECOGNITION
 * OpenCV.js + Tesseract.js = Complete CV Pipeline!
 */

import { useEffect, useState, useRef } from 'react';
import { loadOpenCV } from '../engine/cv/core/OpenCVLoader';
import { OCREngine } from '../engine/cv/ocr/OCREngine';

interface RecognizedCell {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
  area: number;
  center: { x: number; y: number };
  recognizedText: string;
  confidence: number;
  isRecognizing: boolean;
  imageData: ImageData | null;
}

export default function CrosswordOCRDemo() {
  const [cvReady, setCvReady] = useState(false);
  const [ocrReady, setOcrReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cells, setCells] = useState<RecognizedCell[]>([]);
  const [processingTime, setProcessingTime] = useState(0);
  const [ocrTime, setOcrTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const ocrEngineRef = useRef<OCREngine | null>(null);
  
  useEffect(() => {
    initializeSystem();
    return () => {
      if (ocrEngineRef.current) {
        ocrEngineRef.current.terminate();
      }
    };
  }, []);
  
  async function initializeSystem() {
    try {
      setLoading(true);
      console.log('🚀 Initializing CV + OCR System...');
      
      await loadOpenCV();
      console.log('✅ OpenCV.js ready!');
      setCvReady(true);
      
      const ocrEngine = new OCREngine({
        language: 'eng',
        whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        psm: 10,
      });
      await ocrEngine.initialize();
      ocrEngineRef.current = ocrEngine;
      console.log('✅ Tesseract.js ready!');
      setOcrReady(true);
      
      setLoading(false);
      await extractCells();
      
    } catch (err) {
      console.error('❌ System initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Initialization failed');
      setLoading(false);
    }
  }
  
  async function extractCells() {
    if (!cvReady) return;
    
    try {
      const startTime = performance.now();
      // @ts-ignore
      const cv = window.cv;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = '/crossword.png';
      });
      
      const canvas = canvasRef.current!;
      const maxSize = 1000;
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
      
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const binary = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.threshold(gray, binary, 127, 255, cv.THRESH_BINARY_INV);
      cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      
      const extractedCells: RecognizedCell[] = [];
      
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        
        if (area < 200) {
          contour.delete();
          continue;
        }
        
        const rect = cv.boundingRect(contour);
        const aspectRatio = rect.width / rect.height;
        if (aspectRatio < 0.5 || aspectRatio > 2.0) {
          contour.delete();
          continue;
        }
        
        const moments = cv.moments(contour);
        const centerX = moments.m10 / moments.m00;
        const centerY = moments.m01 / moments.m00;
        
        const cellCanvas = document.createElement('canvas');
        cellCanvas.width = rect.width;
        cellCanvas.height = rect.height;
        const cellCtx = cellCanvas.getContext('2d')!;
        
        cellCtx.fillStyle = 'white';
        cellCtx.fillRect(0, 0, rect.width, rect.height);
        cellCtx.drawImage(canvas, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
        
        const imageData = cellCtx.getImageData(0, 0, rect.width, rect.height);
        
        extractedCells.push({
          id: i,
          bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          area,
          center: { x: centerX, y: centerY },
          recognizedText: '',
          confidence: 0,
          isRecognizing: false,
          imageData,
        });
        
        contour.delete();
      }
      
      extractedCells.sort((a, b) => {
        const rowDiff = Math.abs(a.bounds.y - b.bounds.y);
        if (rowDiff < 30) return a.bounds.x - b.bounds.x;
        return a.bounds.y - b.bounds.y;
      });
      
      setCells(extractedCells);
      drawResults(src, extractedCells);
      
      src.delete();
      gray.delete();
      binary.delete();
      contours.delete();
      hierarchy.delete();
      
      setProcessingTime(performance.now() - startTime);
      console.log(`✅ Extracted ${extractedCells.length} cells`);
      
    } catch (err) {
      console.error('❌ Extraction failed:', err);
      setError(err instanceof Error ? err.message : 'Extraction failed');
    }
  }
  
  async function recognizeAllCells() {
    if (!ocrReady || !ocrEngineRef.current) return;
    
    setRecognizing(true);
    const startTime = performance.now();
    const updatedCells = [...cells];
    
    for (let i = 0; i < updatedCells.length; i++) {
      const cell = updatedCells[i];
      if (!cell.imageData) continue;
      
      try {
        cell.isRecognizing = true;
        setCells([...updatedCells]);
        
        const canvas = document.createElement('canvas');
        canvas.width = cell.imageData.width;
        canvas.height = cell.imageData.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(cell.imageData, 0, 0);
        
        const result = await ocrEngineRef.current!.recognizeCharacter(canvas);
        cell.recognizedText = result.char.trim().toUpperCase();
        cell.confidence = result.confidence;
        cell.isRecognizing = false;
        
        setCells([...updatedCells]);
        
      } catch (err) {
        console.error(`Failed cell #${i + 1}:`, err);
        cell.recognizedText = '?';
        cell.confidence = 0;
        cell.isRecognizing = false;
      }
    }
    
    setOcrTime(performance.now() - startTime);
    setRecognizing(false);
    console.log(`✅ Recognized all cells`);
  }
  
  function drawResults(src: any, cells: RecognizedCell[]) {
    const resultCanvas = resultCanvasRef.current!;
    resultCanvas.width = src.cols;
    resultCanvas.height = src.rows;
    
    // @ts-ignore
    const cv = window.cv;
    cv.imshow(resultCanvas, src);
    
    const ctx = resultCanvas.getContext('2d')!;
    
    cells.forEach((cell, index) => {
      const { x, y, width, height } = cell.bounds;
      let color = '#00ff00';
      if (cell.isRecognizing) color = '#ffaa00';
      else if (cell.recognizedText) color = '#00aaff';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      ctx.fillStyle = color;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`#${index + 1}`, x, y - 5);
      
      if (cell.recognizedText) {
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#00aaff';
        ctx.fillText(cell.recognizedText, x + width / 2 - 8, y + height / 2 + 8);
      }
    });
  }
  
  const getAllLettersString = () => {
    return cells.filter(c => c.recognizedText).map(c => c.recognizedText).join('');
  };
  
  const copyLettersToClipboard = () => {
    const letters = getAllLettersString();
    navigator.clipboard.writeText(letters).then(() => {
      alert(`Copied ${letters.length} letters:\n${letters}`);
    });
  };
  
  function downloadResults() {
    const allLetters = getAllLettersString();
    const data = {
      totalCells: cells.length,
      recognizedCells: cells.filter(c => c.recognizedText).length,
      averageConfidence: cells.length > 0 ? cells.reduce((sum, c) => sum + c.confidence, 0) / cells.length : 0,
      allLettersString: allLetters,
      cells: cells.map((cell, index) => ({
        id: index + 1,
        position: cell.bounds,
        recognizedText: cell.recognizedText,
        confidence: cell.confidence,
        area: cell.area,
      })),
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crossword_ocr_results.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  
  if (loading) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ff00', fontFamily: 'monospace', fontSize: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🧩</div>
          <div>Loading CV + OCR System...</div>
          <div style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
            {!cvReady && '📦 Loading OpenCV.js...'}
            {cvReady && !ocrReady && '🔤 Loading Tesseract.js...'}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff0000', fontFamily: 'monospace' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <div style={{ fontSize: '20px', marginBottom: '10px' }}>Error</div>
          <div style={{ fontSize: '14px', color: '#ff6666' }}>{error}</div>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', background: '#ff0000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const recognizedCount = cells.filter(c => c.recognizedText).length;
  const avgConfidence = cells.length > 0 ? cells.reduce((sum, c) => sum + c.confidence, 0) / cells.length : 0;
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', overflow: 'auto', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.98)', borderBottom: '3px solid #00ff00', padding: '20px', zIndex: 1000, boxShadow: '0 4px 20px rgba(0,255,0,0.3)' }}>
        <h1 style={{ color: '#00ff00', margin: 0, fontSize: '28px', textShadow: '0 0 10px #00ff00' }}>
          🧩 CROSSWORD OCR DEMO - Full Text Recognition
        </h1>
        <div style={{ color: '#888', fontSize: '14px', marginTop: '5px' }}>
          OpenCV.js + Tesseract.js = COMPLETE CV PIPELINE!
        </div>
        
        <div style={{ marginTop: '15px', display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
          <div style={{ color: '#00ff00' }}>✅ OpenCV: Ready</div>
          <div style={{ color: '#00ff00' }}>🔤 Tesseract: Ready</div>
          <div style={{ color: '#00aaff' }}>📦 Cells: {cells.length}</div>
          <div style={{ color: '#ffaa00' }}>⚡ Extract: {processingTime.toFixed(0)}ms</div>
          {ocrTime > 0 && <div style={{ color: '#ff00ff' }}>🔤 OCR: {ocrTime.toFixed(0)}ms</div>}
          {recognizedCount > 0 && (
            <>
              <div style={{ color: '#00ff88' }}>✓ Recognized: {recognizedCount}/{cells.length}</div>
              <div style={{ color: '#ffdd00' }}>📊 Avg Confidence: {avgConfidence.toFixed(1)}%</div>
            </>
          )}
        </div>
        
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={extractCells} disabled={recognizing} style={{ padding: '10px 20px', background: recognizing ? '#333' : '#00ff00', color: recognizing ? '#666' : '#000', border: 'none', borderRadius: '6px', cursor: recognizing ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            🔄 Re-Extract
          </button>
          <button onClick={recognizeAllCells} disabled={recognizing || cells.length === 0} style={{ padding: '10px 20px', background: recognizing ? '#333' : '#00aaff', color: recognizing ? '#666' : '#000', border: 'none', borderRadius: '6px', cursor: recognizing || cells.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            {recognizing ? '⏳ Recognizing...' : '🔤 Recognize All'}
          </button>
          <button onClick={downloadResults} disabled={recognizedCount === 0} style={{ padding: '10px 20px', background: recognizedCount === 0 ? '#333' : '#ff00ff', color: recognizedCount === 0 ? '#666' : '#000', border: 'none', borderRadius: '6px', cursor: recognizedCount === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            💾 Download JSON
          </button>
          <a href="#" style={{ padding: '10px 20px', background: '#333', color: '#00aaff', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}>← Back</a>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ marginTop: '220px', padding: '20px' }}>
        {/* Images */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '1800px', margin: '0 auto 30px' }}>
          <div>
            <h2 style={{ color: '#00ff00', marginBottom: '10px', fontSize: '20px' }}>📷 Original Crossword</h2>
            <div style={{ background: '#1a1a1a', border: '2px solid #333', borderRadius: '12px', padding: '15px' }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} />
            </div>
          </div>
          
          <div>
            <h2 style={{ color: '#00ff00', marginBottom: '10px', fontSize: '20px' }}>🎯 Detected + Recognized</h2>
            <div style={{ background: '#1a1a1a', border: '2px solid #333', borderRadius: '12px', padding: '15px' }}>
              <canvas ref={resultCanvasRef} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} />
            </div>
          </div>
        </div>
        
        {/* ALL LETTERS STRING - BIG DISPLAY */}
        {recognizedCount > 0 && (
          <div style={{ maxWidth: '1800px', margin: '0 auto 30px' }}>
            <h2 style={{ color: '#00ff00', marginBottom: '15px', fontSize: '24px', textShadow: '0 0 10px #00ff00' }}>
              📝 ALL RECOGNIZED LETTERS ({getAllLettersString().length} characters)
            </h2>
            <div style={{ background: '#1a1a1a', border: '4px solid #00ff00', borderRadius: '12px', padding: '30px', boxShadow: '0 0 30px rgba(0,255,0,0.3)' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#00ff00', fontFamily: 'monospace', letterSpacing: '6px', wordBreak: 'break-all', lineHeight: '1.8', textShadow: '0 0 15px #00ff00', textAlign: 'center' }}>
                {getAllLettersString()}
              </div>
              <div style={{ marginTop: '25px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button onClick={copyLettersToClipboard} style={{ padding: '15px 30px', background: '#00aaff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(0,170,255,0.4)' }}>
                  📋 Copy to Clipboard
                </button>
                <div style={{ padding: '15px 20px', background: '#0a0a0a', border: '2px solid #00ff00', borderRadius: '8px', color: '#00ff00', fontSize: '14px' }}>
                  {getAllLettersString().length} letters captured
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Recognized Cells Grid */}
        <div style={{ maxWidth: '1800px', margin: '0 auto 30px' }}>
          <h2 style={{ color: '#00ff00', marginBottom: '15px', fontSize: '22px' }}>
            🔤 Individual Letters ({recognizedCount}/{cells.length})
          </h2>
          <div style={{ background: '#1a1a1a', border: '2px solid #333', borderRadius: '12px', padding: '25px', maxHeight: '600px', overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
              {cells.map((cell, index) => {
                const hasText = cell.recognizedText.length > 0;
                const isGood = cell.confidence > 70;
                let borderColor = '#333';
                if (cell.isRecognizing) borderColor = '#ffaa00';
                else if (hasText && isGood) borderColor = '#00ff00';
                else if (hasText) borderColor = '#ffaa00';
                
                return (
                  <div key={cell.id} style={{ background: '#0a0a0a', border: `3px solid ${borderColor}`, borderRadius: '8px', padding: '10px', textAlign: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '3px', left: '5px', color: '#666', fontSize: '9px', fontWeight: 'bold' }}>#{index + 1}</div>
                    {hasText && (
                      <div style={{ fontSize: '42px', fontWeight: 'bold', color: isGood ? '#00ff00' : '#ffaa00', marginBottom: '5px', textShadow: `0 0 8px ${isGood ? '#00ff00' : '#ffaa00'}` }}>
                        {cell.recognizedText}
                      </div>
                    )}
                    {cell.imageData && (
                      <canvas width={cell.bounds.width} height={cell.bounds.height} ref={(canvas) => { if (canvas && cell.imageData) { canvas.getContext('2d')!.putImageData(cell.imageData, 0, 0); }}} style={{ width: '60px', height: '60px', border: '1px solid #444', margin: '0 auto 5px', display: 'block', borderRadius: '4px', imageRendering: 'pixelated', objectFit: 'contain' }} />
                    )}
                    {hasText && <div style={{ fontSize: '10px', color: isGood ? '#00ff88' : '#ffaa00', marginTop: '3px' }}>{cell.confidence.toFixed(0)}%</div>}
                    {cell.isRecognizing && <div style={{ fontSize: '11px', color: '#ffaa00', marginTop: '3px' }}>⏳</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
