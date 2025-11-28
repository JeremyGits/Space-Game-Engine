/**
 * OCR Module Exports
 * Text recognition using Tesseract.js
 */

export { loadTesseract, getTesseractWorker, isTesseractLoaded, terminateTesseract } from './TesseractLoader';
export type { TesseractConfig } from './TesseractLoader';

export { TextRecognizer } from './TextRecognizer';
export type { OCRResult, OCRWord, OCRLine, TextRecognizerConfig } from './TextRecognizer';

export { OCREngine } from './OCREngine';
export type { OCREngineConfig } from './OCREngine';
