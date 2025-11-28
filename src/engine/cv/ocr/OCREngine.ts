/**
 * OCR Engine - Main interface for text recognition
 * Combines Tesseract.js with preprocessing and post-processing
 */

import { TextRecognizer, type OCRResult, type TextRecognizerConfig } from './TextRecognizer';

export interface OCREngineConfig extends TextRecognizerConfig {
  preprocessImage?: boolean;      // Apply preprocessing (default: true)
  enhanceContrast?: boolean;      // Enhance contrast (default: true)
  denoise?: boolean;              // Remove noise (default: true)
  binarize?: boolean;             // Convert to binary (default: true)
}

export class OCREngine {
  private recognizer: TextRecognizer;
  private config: OCREngineConfig;
  
  constructor(config: OCREngineConfig = {}) {
    this.config = {
      preprocessImage: config.preprocessImage ?? true,
      enhanceContrast: config.enhanceContrast ?? true,
      denoise: config.denoise ?? true,
      binarize: config.binarize ?? true,
      ...config,
    };
    
    this.recognizer = new TextRecognizer(config);
  }
  
  /**
   * Initialize OCR engine
   */
  async initialize(): Promise<void> {
    await this.recognizer.initialize();
  }
  
  /**
   * Recognize text with preprocessing
   */
  async recognize(
    image: HTMLCanvasElement | HTMLImageElement | ImageData | string
  ): Promise<OCRResult> {
    let processedImage = image;
    
    if (this.config.preprocessImage && image instanceof HTMLCanvasElement) {
      processedImage = this.preprocessImage(image);
    }
    
    return await this.recognizer.recognize(processedImage);
  }
  
  /**
   * Recognize single character (optimized)
   */
  async recognizeCharacter(
    image: HTMLCanvasElement | HTMLImageElement | ImageData
  ): Promise<{ char: string; confidence: number }> {
    let processedImage = image;
    
    if (this.config.preprocessImage && image instanceof HTMLCanvasElement) {
      processedImage = this.preprocessImage(image);
    }
    
    return await this.recognizer.recognizeCharacter(processedImage);
  }
  
  /**
   * Batch recognition
   */
  async recognizeBatch(
    images: Array<HTMLCanvasElement | HTMLImageElement | ImageData>
  ): Promise<OCRResult[]> {
    const processedImages = images.map(img => {
      if (this.config.preprocessImage && img instanceof HTMLCanvasElement) {
        return this.preprocessImage(img);
      }
      return img;
    });
    
    return await this.recognizer.recognizeBatch(processedImages);
  }
  
  /**
   * Preprocess image for better OCR
   */
  private preprocessImage(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
    
    // Enhance contrast
    if (this.config.enhanceContrast) {
      for (let i = 0; i < data.length; i += 4) {
        const value = data[i];
        const enhanced = ((value / 255 - 0.5) * 1.5 + 0.5) * 255;
        data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, enhanced));
      }
    }
    
    // Binarize (Otsu's method approximation)
    if (this.config.binarize) {
      // Calculate threshold
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += data[i];
      }
      const threshold = sum / (data.length / 4);
      
      // Apply threshold
      for (let i = 0; i < data.length; i += 4) {
        const value = data[i] > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = value;
      }
    }
    
    // Create new canvas with processed image
    const processedCanvas = document.createElement('canvas');
    processedCanvas.width = canvas.width;
    processedCanvas.height = canvas.height;
    const processedCtx = processedCanvas.getContext('2d')!;
    processedCtx.putImageData(imageData, 0, 0);
    
    return processedCanvas;
  }
  
  /**
   * Check if ready
   */
  isReady(): boolean {
    return this.recognizer.isReady();
  }
  
  /**
   * Terminate
   */
  async terminate(): Promise<void> {
    await this.recognizer.terminate();
  }
}
