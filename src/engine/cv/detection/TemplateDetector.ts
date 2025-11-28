/**
 * Template Detector
 * Detects objects using template matching (OpenCV.js)
 */

import type { TemplateMatch, Point2D } from '../../../types/cv';
import { getOpenCV, isOpenCVAvailable } from '../core/OpenCVLoader';
import { processImage } from '../core/ImageProcessor';

export interface TemplateDetectionOptions {
  method?: 'sqdiff' | 'sqdiff_normed' | 'ccorr' | 'ccorr_normed' | 'ccoeff' | 'ccoeff_normed';
  threshold?: number;
  maxMatches?: number;
  multiScale?: boolean;
  scaleRange?: [number, number];
  scaleStep?: number;
}

export interface TemplateDetectionResult {
  matches: TemplateMatch[];
  processingTime: number;
  method: string;
}

/**
 * Detect template in image
 */
export async function detectTemplate(
  imageUrl: string,
  templateUrl: string,
  options: TemplateDetectionOptions = {}
): Promise<TemplateDetectionResult> {
  if (!isOpenCVAvailable()) {
    throw new Error('OpenCV.js not available. Load it first.');
  }
  
  const startTime = performance.now();
  const cv = getOpenCV();
  
  const {
    method = 'ccoeff_normed',
    threshold = 0.8,
    maxMatches = 10,
    multiScale = false,
    scaleRange = [0.5, 2.0],
    scaleStep = 0.1,
  } = options;
  
  // Load and process images
  const [processedImage, processedTemplate] = await Promise.all([
    processImage(imageUrl, { grayscale: true }),
    processImage(templateUrl, { grayscale: true }),
  ]);
  
  // Create OpenCV Mats
  const src = cv.matFromImageData(processedImage.data);
  const templ = cv.matFromImageData(processedTemplate.data);
  const result = new cv.Mat();
  
  try {
    // Map method string to OpenCV constant
    const methodMap: Record<string, number> = {
      'sqdiff': cv.TM_SQDIFF,
      'sqdiff_normed': cv.TM_SQDIFF_NORMED,
      'ccorr': cv.TM_CCORR,
      'ccorr_normed': cv.TM_CCORR_NORMED,
      'ccoeff': cv.TM_CCOEFF,
      'ccoeff_normed': cv.TM_CCOEFF_NORMED,
    };
    
    const matches: TemplateMatch[] = [];
    
    if (multiScale) {
      // Multi-scale template matching
      for (let scale = scaleRange[0]; scale <= scaleRange[1]; scale += scaleStep) {
        const scaledTemplate = new cv.Mat();
        const size = new cv.Size(
          Math.floor(templ.cols * scale),
          Math.floor(templ.rows * scale)
        );
        
        cv.resize(templ, scaledTemplate, size);
        
        // Perform template matching
        cv.matchTemplate(src, scaledTemplate, result, methodMap[method]);
        
        // Find matches above threshold
        const scaleMatches = findMatches(result, threshold, method, scale);
        matches.push(...scaleMatches);
        
        scaledTemplate.delete();
      }
    } else {
      // Single-scale template matching
      cv.matchTemplate(src, templ, result, methodMap[method]);
      
      // Find matches
      const singleMatches = findMatches(result, threshold, method, 1.0);
      matches.push(...singleMatches);
    }
    
    // Sort by confidence and limit
    matches.sort((a, b) => b.confidence - a.confidence);
    const topMatches = matches.slice(0, maxMatches);
    
    // Remove overlapping matches
    const filteredMatches = removeOverlappingMatches(topMatches, templ.cols, templ.rows);
    
    const processingTime = performance.now() - startTime;
    
    console.log(`🔍 Found ${filteredMatches.length} template matches in ${processingTime.toFixed(2)}ms`);
    
    return {
      matches: filteredMatches,
      processingTime,
      method,
    };
    
  } finally {
    // Clean up
    src.delete();
    templ.delete();
    result.delete();
  }
}

/**
 * Find matches in result matrix
 */
function findMatches(
  result: any,
  threshold: number,
  method: string,
  scale: number
): TemplateMatch[] {
  const matches: TemplateMatch[] = [];
  const data = result.data32F;
  
  for (let y = 0; y < result.rows; y++) {
    for (let x = 0; x < result.cols; x++) {
      const idx = y * result.cols + x;
      let value = data[idx];
      
      // For SQDIFF methods, lower is better, so invert
      if (method.includes('sqdiff')) {
        value = 1 - value;
      }
      
      if (value >= threshold) {
        matches.push({
          position: { x, y },
          confidence: value,
          scale,
          rotation: 0, // Template matching doesn't detect rotation
        });
      }
    }
  }
  
  return matches;
}

/**
 * Remove overlapping matches (keep highest confidence)
 */
function removeOverlappingMatches(
  matches: TemplateMatch[],
  templateWidth: number,
  templateHeight: number
): TemplateMatch[] {
  const result: TemplateMatch[] = [];
  
  for (const match of matches) {
    let overlaps = false;
    
    for (const existing of result) {
      if (matchesOverlap(match, existing, templateWidth, templateHeight)) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      result.push(match);
    }
  }
  
  return result;
}

/**
 * Check if two matches overlap
 */
function matchesOverlap(
  match1: TemplateMatch,
  match2: TemplateMatch,
  width: number,
  height: number
): boolean {
  const overlapThreshold = 0.5; // 50% overlap
  
  const x1 = match1.position.x;
  const y1 = match1.position.y;
  const x2 = match2.position.x;
  const y2 = match2.position.y;
  
  const xOverlap = Math.max(0, Math.min(x1 + width, x2 + width) - Math.max(x1, x2));
  const yOverlap = Math.max(0, Math.min(y1 + height, y2 + height) - Math.max(y1, y2));
  
  const overlapArea = xOverlap * yOverlap;
  const templateArea = width * height;
  
  return (overlapArea / templateArea) > overlapThreshold;
}

/**
 * Find best match
 */
export async function findBestMatch(
  imageUrl: string,
  templateUrl: string,
  options?: TemplateDetectionOptions
): Promise<TemplateMatch | null> {
  const result = await detectTemplate(imageUrl, templateUrl, {
    ...options,
    maxMatches: 1,
  });
  
  return result.matches[0] || null;
}

/**
 * Check if template exists in image
 */
export async function templateExists(
  imageUrl: string,
  templateUrl: string,
  threshold: number = 0.8
): Promise<boolean> {
  const result = await detectTemplate(imageUrl, templateUrl, {
    threshold,
    maxMatches: 1,
  });
  
  return result.matches.length > 0;
}

/**
 * Get match bounding box
 */
export function getMatchBounds(
  match: TemplateMatch,
  templateWidth: number,
  templateHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: match.position.x,
    y: match.position.y,
    width: templateWidth * match.scale,
    height: templateHeight * match.scale,
  };
}

/**
 * Get match center
 */
export function getMatchCenter(
  match: TemplateMatch,
  templateWidth: number,
  templateHeight: number
): Point2D {
  return {
    x: match.position.x + (templateWidth * match.scale) / 2,
    y: match.position.y + (templateHeight * match.scale) / 2,
  };
}
