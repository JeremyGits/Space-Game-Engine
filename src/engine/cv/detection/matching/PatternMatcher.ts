/**
 * Pattern Matcher
 * Detects repeating patterns and textures in images
 */

import type { Point2D } from '../../../../types/cv';
import { getOpenCV, isOpenCVAvailable } from '../../core/OpenCVLoader';
import { processImage } from '../../core/ImageProcessor';

export interface PatternMatch {
  position: Point2D;
  size: { width: number; height: number };
  confidence: number;
  frequency: number;
  orientation: number;
}

export interface PatternDetectionOptions {
  minPatternSize?: number;
  maxPatternSize?: number;
  minFrequency?: number;
  orientationBins?: number;
  threshold?: number;
}

export interface PatternDetectionResult {
  patterns: PatternMatch[];
  dominantPattern: PatternMatch | null;
  processingTime: number;
  method: 'fft' | 'autocorrelation' | 'gabor';
}

/**
 * Detect repeating patterns using FFT
 */
export async function detectPatterns(
  imageUrl: string,
  options: PatternDetectionOptions = {}
): Promise<PatternDetectionResult> {
  if (!isOpenCVAvailable()) {
    throw new Error('OpenCV.js not available. Load it first.');
  }
  
  const startTime = performance.now();
  const cv = getOpenCV();
  
  const {
    minPatternSize = 10,
    maxPatternSize = 100,
    minFrequency = 2,
    orientationBins = 8,
    threshold = 0.7,
  } = options;
  
  // Process image
  const processed = await processImage(imageUrl, { grayscale: true });
  const src = cv.matFromImageData(processed.data);
  
  try {
    // Convert to float
    const floatImg = new cv.Mat();
    src.convertTo(floatImg, cv.CV_32F);
    
    // Compute FFT
    const planes = new cv.MatVector();
    planes.push_back(floatImg);
    planes.push_back(cv.Mat.zeros(floatImg.rows, floatImg.cols, cv.CV_32F));
    
    const complexImg = new cv.Mat();
    cv.merge(planes, complexImg);
    
    const dft = new cv.Mat();
    cv.dft(complexImg, dft);
    
    // Compute magnitude spectrum
    const dftPlanes = new cv.MatVector();
    cv.split(dft, dftPlanes);
    
    const magnitude = new cv.Mat();
    cv.magnitude(dftPlanes.get(0), dftPlanes.get(1), magnitude);
    
    // Log scale for better visualization
    cv.add(magnitude, cv.Mat.ones(magnitude.rows, magnitude.cols, cv.CV_32F), magnitude);
    cv.log(magnitude, magnitude);
    
    // Find peaks in frequency domain
    const patterns = findFrequencyPeaks(
      magnitude,
      minPatternSize,
      maxPatternSize,
      minFrequency,
      threshold
    );
    
    // Clean up
    floatImg.delete();
    planes.delete();
    complexImg.delete();
    dft.delete();
    dftPlanes.delete();
    magnitude.delete();
    
    const processingTime = performance.now() - startTime;
    
    const dominantPattern = patterns.length > 0 
      ? patterns.reduce((best, curr) => curr.confidence > best.confidence ? curr : best)
      : null;
    
    console.log(`🔍 Detected ${patterns.length} patterns in ${processingTime.toFixed(2)}ms`);
    
    return {
      patterns,
      dominantPattern,
      processingTime,
      method: 'fft',
    };
    
  } finally {
    src.delete();
  }
}

/**
 * Find peaks in frequency domain
 */
function findFrequencyPeaks(
  magnitude: any,
  minSize: number,
  maxSize: number,
  minFrequency: number,
  threshold: number
): PatternMatch[] {
  const patterns: PatternMatch[] = [];
  const data = magnitude.data32F;
  const rows = magnitude.rows;
  const cols = magnitude.cols;
  
  // Find local maxima
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const idx = y * cols + x;
      const value = data[idx];
      
      // Check if local maximum
      if (
        value > data[(y - 1) * cols + x] &&
        value > data[(y + 1) * cols + x] &&
        value > data[y * cols + (x - 1)] &&
        value > data[y * cols + (x + 1)] &&
        value > threshold
      ) {
        // Calculate pattern properties
        const centerX = cols / 2;
        const centerY = rows / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        
        const frequency = Math.sqrt(dx * dx + dy * dy);
        const orientation = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Convert frequency to pattern size
        const patternSize = cols / frequency;
        
        if (
          patternSize >= minSize &&
          patternSize <= maxSize &&
          frequency >= minFrequency
        ) {
          patterns.push({
            position: { x, y },
            size: { width: patternSize, height: patternSize },
            confidence: value,
            frequency,
            orientation,
          });
        }
      }
    }
  }
  
  return patterns;
}

/**
 * Detect patterns using autocorrelation
 */
export async function detectPatternsAutocorrelation(
  imageUrl: string,
  options: PatternDetectionOptions = {}
): Promise<PatternDetectionResult> {
  if (!isOpenCVAvailable()) {
    throw new Error('OpenCV.js not available');
  }
  
  const startTime = performance.now();
  const cv = getOpenCV();
  
  const processed = await processImage(imageUrl, { grayscale: true });
  const src = cv.matFromImageData(processed.data);
  
  try {
    // Compute autocorrelation using template matching with itself
    const result = new cv.Mat();
    cv.matchTemplate(src, src, result, cv.TM_CCORR_NORMED);
    
    // Find peaks (excluding center)
    const patterns: PatternMatch[] = [];
    const data = result.data32F;
    const centerX = result.cols / 2;
    const centerY = result.rows / 2;
    
    for (let y = 0; y < result.rows; y++) {
      for (let x = 0; x < result.cols; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Skip center and nearby points
        if (distance < 10) continue;
        
        const idx = y * result.cols + x;
        const value = data[idx];
        
        if (value > (options.threshold || 0.7)) {
          patterns.push({
            position: { x, y },
            size: { width: Math.abs(dx), height: Math.abs(dy) },
            confidence: value,
            frequency: 1 / distance,
            orientation: Math.atan2(dy, dx) * (180 / Math.PI),
          });
        }
      }
    }
    
    result.delete();
    
    const processingTime = performance.now() - startTime;
    
    const dominantPattern = patterns.length > 0
      ? patterns.reduce((best, curr) => curr.confidence > best.confidence ? curr : best)
      : null;
    
    return {
      patterns,
      dominantPattern,
      processingTime,
      method: 'autocorrelation',
    };
    
  } finally {
    src.delete();
  }
}

/**
 * Detect patterns using Gabor filters
 */
export async function detectPatternsGabor(
  imageUrl: string,
  orientations: number = 8,
  frequencies: number[] = [0.1, 0.2, 0.3]
): Promise<PatternDetectionResult> {
  const startTime = performance.now();
  
  if (!isOpenCVAvailable()) {
    throw new Error('OpenCV.js not available');
  }
  
  const cv = getOpenCV();
  const processed = await processImage(imageUrl, { grayscale: true });
  const src = cv.matFromImageData(processed.data);
  
  try {
    const patterns: PatternMatch[] = [];
    
    // Apply Gabor filters at different orientations and frequencies
    for (let i = 0; i < orientations; i++) {
      const theta = (i * Math.PI) / orientations;
      
      for (const frequency of frequencies) {
        const kernel = cv.getGaborKernel(
          new cv.Size(21, 21),
          5.0,
          theta,
          frequency,
          0.5,
          0,
          cv.CV_32F
        );
        
        const filtered = new cv.Mat();
        cv.filter2D(src, filtered, cv.CV_32F, kernel);
        
        // Find strong responses
        const mean = cv.mean(filtered);
        const threshold = mean[0] * 1.5;
        
        for (let y = 0; y < filtered.rows; y += 10) {
          for (let x = 0; x < filtered.cols; x += 10) {
            const value = filtered.floatAt(y, x);
            
            if (value > threshold) {
              patterns.push({
                position: { x, y },
                size: { width: 1 / frequency, height: 1 / frequency },
                confidence: value / (mean[0] * 2),
                frequency,
                orientation: theta * (180 / Math.PI),
              });
            }
          }
        }
        
        kernel.delete();
        filtered.delete();
      }
    }
    
    const processingTime = performance.now() - startTime;
    
    const dominantPattern = patterns.length > 0
      ? patterns.reduce((best, curr) => curr.confidence > best.confidence ? curr : best)
      : null;
    
    return {
      patterns,
      dominantPattern,
      processingTime,
      method: 'gabor',
    };
    
  } finally {
    src.delete();
  }
}

/**
 * Calculate pattern regularity score
 */
export function calculatePatternRegularity(patterns: PatternMatch[]): number {
  if (patterns.length < 2) return 0;
  
  // Calculate variance in spacing
  const spacings: number[] = [];
  
  for (let i = 0; i < patterns.length - 1; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      const dx = patterns[i].position.x - patterns[j].position.x;
      const dy = patterns[i].position.y - patterns[j].position.y;
      const spacing = Math.sqrt(dx * dx + dy * dy);
      spacings.push(spacing);
    }
  }
  
  const mean = spacings.reduce((sum, s) => sum + s, 0) / spacings.length;
  const variance = spacings.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / spacings.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower variance = more regular
  const regularity = 1 / (1 + stdDev / mean);
  
  return regularity;
}

/**
 * Group patterns by orientation
 */
export function groupPatternsByOrientation(
  patterns: PatternMatch[],
  bins: number = 8
): Map<number, PatternMatch[]> {
  const binSize = 360 / bins;
  const groups = new Map<number, PatternMatch[]>();
  
  for (const pattern of patterns) {
    const bin = Math.floor(pattern.orientation / binSize) * binSize;
    
    if (!groups.has(bin)) {
      groups.set(bin, []);
    }
    
    groups.get(bin)!.push(pattern);
  }
  
  return groups;
}

/**
 * Find dominant orientation
 */
export function findDominantOrientation(patterns: PatternMatch[]): number {
  const groups = groupPatternsByOrientation(patterns);
  
  let maxCount = 0;
  let dominantOrientation = 0;
  
  for (const [orientation, group] of groups) {
    if (group.length > maxCount) {
      maxCount = group.length;
      dominantOrientation = orientation;
    }
  }
  
  return dominantOrientation;
}
