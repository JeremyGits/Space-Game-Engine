/**
 * Tesseract.js Loader
 * Loads and initializes Tesseract OCR engine
 * Provides text recognition capabilities
 */

import { createWorker, type Worker } from 'tesseract.js';

let tesseractWorker: Worker | null = null;
let isLoading = false;
let isLoaded = false;

export interface TesseractConfig {
  language?: string;              // Language (default: 'eng')
  oem?: number;                   // OCR Engine Mode (default: 1 - LSTM)
  psm?: number;                   // Page Segmentation Mode (default: 3 - Auto)
  tessedit_char_whitelist?: string; // Character whitelist
}

/**
 * Load Tesseract.js worker
 */
export async function loadTesseract(config: TesseractConfig = {}): Promise<Worker> {
  // Return existing worker if already loaded
  if (tesseractWorker && isLoaded) {
    console.log('✅ Tesseract already loaded');
    return tesseractWorker;
  }
  
  // Wait if currently loading
  if (isLoading) {
    console.log('⏳ Tesseract is loading...');
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return tesseractWorker!;
  }
  
  try {
    isLoading = true;
    console.log('📚 Loading Tesseract.js...');
    
    // Create worker
    const worker = await createWorker(config.language || 'eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${(m.progress * 100).toFixed(0)}%`);
        }
      },
    });
    
    // Configure worker
    if (config.oem !== undefined) {
      await worker.setParameters({ tesseract_oem: config.oem });
    }
    
    if (config.psm !== undefined) {
      await worker.setParameters({ tesseract_pagesegmode: config.psm });
    }
    
    if (config.tessedit_char_whitelist) {
      await worker.setParameters({
        tessedit_char_whitelist: config.tessedit_char_whitelist,
      });
    }
    
    tesseractWorker = worker;
    isLoaded = true;
    isLoading = false;
    
    console.log('✅ Tesseract.js loaded successfully!');
    return worker;
    
  } catch (error) {
    isLoading = false;
    console.error('❌ Failed to load Tesseract.js:', error);
    throw error;
  }
}

/**
 * Get Tesseract worker (must be loaded first)
 */
export function getTesseractWorker(): Worker | null {
  return tesseractWorker;
}

/**
 * Check if Tesseract is loaded
 */
export function isTesseractLoaded(): boolean {
  return isLoaded && tesseractWorker !== null;
}

/**
 * Terminate Tesseract worker
 */
export async function terminateTesseract(): Promise<void> {
  if (tesseractWorker) {
    await tesseractWorker.terminate();
    tesseractWorker = null;
    isLoaded = false;
    console.log('🗑️ Tesseract worker terminated');
  }
}
