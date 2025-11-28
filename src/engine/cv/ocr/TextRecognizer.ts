/**
 * Text Recognizer using Tesseract.js
 * Recognizes text in images and image regions
 * Supports multiple languages and custom configurations
 */

import type { Worker, RecognizeResult } from 'tesseract.js';
import { loadTesseract, getTesseractWorker } from './TesseractLoader';

export interface OCRResult {
  text: string;
  confidence: number;
  words: OCRWord[];
  lines: OCRLine[];
  processingTime: number;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

export interface OCRLine {
  text: string;
  confidence: number;
  words: OCRWord[];
  bbox: { x: number; y: number; width: number; height: number };
}

export interface TextRecognizerConfig {
  language?: string;
  whitelist?: string;             // e.g., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  blacklist?: string;
  psm?: number;                   // Page Segmentation Mode
  oem?: number;                   // OCR Engine Mode
}

export class TextRecognizer {
  private worker: Worker | null = null;
  private config: TextRecognizerConfig;
  
  constructor(config: TextRecognizerConfig = {}) {
    this.config = {
      language: config.language || 'eng',
      whitelist: config.whitelist,
      blacklist: config.blacklist,
      psm: config.psm ?? 3,         // Auto page segmentation
      oem: config.oem ?? 1,         // LSTM engine
    };
  }
  
  /**
   * Initialize OCR engine
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔤 Initializing Tesseract OCR...');
      
      this.worker = await loadTesseract({
        language: this.config.language,
        oem: this.config.oem,
        psm: this.config.psm,
        tessedit_char_whitelist: this.config.whitelist,
      });
      
      console.log('✅ Tesseract OCR ready!');
      
    } catch (error) {
      console.error('❌ Failed to initialize Tesseract:', error);
      throw error;
    }
  }
  
  /**
   * Recognize text in image
   */
  async recognize(
    image: HTMLCanvasElement | HTMLImageElement | ImageData | string
  ): Promise<OCRResult> {
    const startTime = performance.now();
    
    if (!this.worker) {
      this.worker = getTesseractWorker();
      if (!this.worker) {
        throw new Error('Tesseract not initialized. Call initialize() first.');
      }
    }
    
    try {
      const result = await this.worker.recognize(image);
      
      const processingTime = performance.now() - startTime;
      
      return this.parseResult(result, processingTime);
      
    } catch (error) {
      console.error('❌ OCR recognition failed:', error);
      throw error;
    }
  }
  
  /**
   * Recognize text in multiple images (batch)
   */
  async recognizeBatch(
    images: Array<HTMLCanvasElement | HTMLImageElement | ImageData>
  ): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    for (const image of images) {
      try {
        const result = await this.recognize(image);
        results.push(result);
      } catch (error) {
        console.error('Batch OCR failed for image:', error);
        results.push({
          text: '',
          confidence: 0,
          words: [],
          lines: [],
          processingTime: 0,
        });
      }
    }
    
    return results;
  }
  
  /**
   * Recognize single character (optimized for crosswords)
   */
  async recognizeCharacter(
    image: HTMLCanvasElement | HTMLImageElement | ImageData
  ): Promise<{ char: string; confidence: number }> {
    // Use PSM 10 for single character
    if (this.worker) {
      await this.worker.setParameters({ tesseract_pagesegmode: 10 });
    }
    
    const result = await this.recognize(image);
    
    // Reset to original PSM
    if (this.worker && this.config.psm !== undefined) {
      await this.worker.setParameters({ tesseract_pagesegmode: this.config.psm });
    }
    
    return {
      char: result.text.trim(),
      confidence: result.confidence,
    };
  }
  
  /**
   * Parse Tesseract result
   */
  private parseResult(result: RecognizeResult, processingTime: number): OCRResult {
    // Access the data safely with type assertions
    const data = result.data as any;
    
    const words: OCRWord[] = (data.words || []).map((word: any) => ({
      text: word.text,
      confidence: word.confidence,
      bbox: word.bbox,
    }));
    
    const lines: OCRLine[] = (data.lines || []).map((line: any) => ({
      text: line.text,
      confidence: line.confidence,
      words: (line.words || []).map((word: any) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox,
      })),
      bbox: line.bbox,
    }));
    
    return {
      text: data.text || '',
      confidence: data.confidence || 0,
      words,
      lines,
      processingTime,
    };
  }
  
  /**
   * Update configuration
   */
  async updateConfig(config: Partial<TextRecognizerConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    if (this.worker) {
      if (config.psm !== undefined) {
        await this.worker.setParameters({ tesseract_pagesegmode: config.psm });
      }
      
      if (config.oem !== undefined) {
        await this.worker.setParameters({ tesseract_oem: config.oem });
      }
      
      if (config.whitelist !== undefined) {
        await this.worker.setParameters({
          tessedit_char_whitelist: config.whitelist,
        });
      }
    }
  }
  
  /**
   * Check if ready
   */
  isReady(): boolean {
    return this.worker !== null;
  }
  
  /**
   * Terminate worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('🗑️ Tesseract worker terminated');
    }
  }
}
