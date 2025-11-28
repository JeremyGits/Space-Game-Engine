/**
 * Template Matcher
 * Advanced template matching with rotation and scale invariance
 */

import type { TemplateMatch, Point2D } from '../../../../types/cv';
import { detectTemplate } from '../TemplateDetector';
import { getOpenCV, isOpenCVAvailable } from '../../core/OpenCVLoader';
import { processImage } from '../../core/ImageProcessor';

export interface AdvancedTemplateMatchingOptions {
  method?: 'sqdiff' | 'sqdiff_normed' | 'ccorr' | 'ccorr_normed' | 'ccoeff' | 'ccoeff_normed';
  threshold?: number;
  maxMatches?: number;
  multiScale?: boolean;
  scaleRange?: [number, number];
  scaleStep?: number;
  rotationInvariant?: boolean;
  rotationStep?: number; // degrees
  pyramidLevels?: number;
}

export interface TemplateMatchingResult {
  matches: TemplateMatch[];
  bestMatch: TemplateMatch | null;
  processingTime: number;
  scalesChecked: number;
  rotationsChecked: number;
}

/**
 * Advanced template matching with rotation and scale invariance
 */
export async function matchTemplate(
  imageUrl: string,
  templateUrl: string,
  options: AdvancedTemplateMatchingOptions = {}
): Promise<TemplateMatchingResult> {
  const startTime = performance.now();
  
  const {
    method = 'ccoeff_normed',
    threshold = 0.8,
    maxMatches = 10,
    multiScale = true,
    scaleRange = [0.5, 2.0],
    scaleStep = 0.1,
    rotationInvariant = false,
    rotationStep = 15,
    pyramidLevels = 3,
  } = options;
  
  let allMatches: TemplateMatch[] = [];
  let scalesChecked = 0;
  let rotationsChecked = 0;
  
  if (rotationInvariant) {
    // Check multiple rotations
    for (let angle = 0; angle < 360; angle += rotationStep) {
      rotationsChecked++;
      
      // Rotate template
      const rotatedTemplate = await rotateImage(templateUrl, angle);
      
      // Match at this rotation
      const result = await detectTemplate(imageUrl, rotatedTemplate, {
        method,
        threshold,
        maxMatches,
        multiScale,
        scaleRange,
        scaleStep,
      });
      
      // Add rotation info to matches
      const rotatedMatches = result.matches.map(m => ({
        ...m,
        rotation: angle,
      }));
      
      allMatches.push(...rotatedMatches);
      scalesChecked += Math.ceil((scaleRange[1] - scaleRange[0]) / scaleStep);
    }
  } else {
    // Single rotation (0 degrees)
    const result = await detectTemplate(imageUrl, templateUrl, {
      method,
      threshold,
      maxMatches,
      multiScale,
      scaleRange,
      scaleStep,
    });
    
    allMatches = result.matches;
    scalesChecked = multiScale ? Math.ceil((scaleRange[1] - scaleRange[0]) / scaleStep) : 1;
    rotationsChecked = 1;
  }
  
  // Sort by confidence and take top matches
  allMatches.sort((a, b) => b.confidence - a.confidence);
  const topMatches = allMatches.slice(0, maxMatches);
  
  const processingTime = performance.now() - startTime;
  
  console.log(`🔍 Found ${topMatches.length} template matches (${scalesChecked} scales, ${rotationsChecked} rotations) in ${processingTime.toFixed(2)}ms`);
  
  return {
    matches: topMatches,
    bestMatch: topMatches[0] || null,
    processingTime,
    scalesChecked,
    rotationsChecked,
  };
}

/**
 * Rotate image by angle
 */
async function rotateImage(imageUrl: string, angle: number): Promise<string> {
  if (!isOpenCVAvailable()) {
    throw new Error('OpenCV.js not available');
  }
  
  const cv = getOpenCV();
  const processed = await processImage(imageUrl);
  
  const src = cv.matFromImageData(processed.data);
  const dst = new cv.Mat();
  
  try {
    const center = new cv.Point(src.cols / 2, src.rows / 2);
    const rotMat = cv.getRotationMatrix2D(center, angle, 1.0);
    
    cv.warpAffine(src, dst, rotMat, new cv.Size(src.cols, src.rows));
    
    // Convert back to data URL
    const canvas = document.createElement('canvas');
    canvas.width = dst.cols;
    canvas.height = dst.rows;
    
    cv.imshow(canvas, dst);
    const dataUrl = canvas.toDataURL();
    
    rotMat.delete();
    
    return dataUrl;
    
  } finally {
    src.delete();
    dst.delete();
  }
}

/**
 * Match template with pyramid search (coarse to fine)
 */
export async function matchTemplatePyramid(
  imageUrl: string,
  templateUrl: string,
  levels: number = 3
): Promise<TemplateMatchingResult> {
  const startTime = performance.now();
  
  if (!isOpenCVAvailable()) {
    throw new Error('OpenCV.js not available');
  }
  
  const cv = getOpenCV();
  
  // Load images
  const [processedImage, processedTemplate] = await Promise.all([
    processImage(imageUrl, { grayscale: true }),
    processImage(templateUrl, { grayscale: true }),
  ]);
  
  const img = cv.matFromImageData(processedImage.data);
  const templ = cv.matFromImageData(processedTemplate.data);
  
  try {
    let bestMatch: TemplateMatch | null = null;
    let bestConfidence = 0;
    
    // Build pyramids
    const imgPyramid = buildPyramid(cv, img, levels);
    const templPyramid = buildPyramid(cv, templ, levels);
    
    // Search from coarse to fine
    for (let level = levels - 1; level >= 0; level--) {
      const result = new cv.Mat();
      
      cv.matchTemplate(
        imgPyramid[level],
        templPyramid[level],
        result,
        cv.TM_CCOEFF_NORMED
      );
      
      const minMax = cv.minMaxLoc(result);
      const confidence = minMax.maxVal;
      
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        
        // Scale position back to original image size
        const scale = Math.pow(2, level);
        bestMatch = {
          position: {
            x: minMax.maxLoc.x * scale,
            y: minMax.maxLoc.y * scale,
          },
          confidence,
          scale: 1.0,
          rotation: 0,
        };
      }
      
      result.delete();
    }
    
    // Clean up pyramids
    imgPyramid.forEach(m => m.delete());
    templPyramid.forEach(m => m.delete());
    
    const processingTime = performance.now() - startTime;
    
    return {
      matches: bestMatch ? [bestMatch] : [],
      bestMatch,
      processingTime,
      scalesChecked: levels,
      rotationsChecked: 1,
    };
    
  } finally {
    img.delete();
    templ.delete();
  }
}

/**
 * Build image pyramid
 */
function buildPyramid(cv: any, image: any, levels: number): any[] {
  const pyramid: any[] = [image.clone()];
  
  for (let i = 1; i < levels; i++) {
    const down = new cv.Mat();
    cv.pyrDown(pyramid[i - 1], down);
    pyramid.push(down);
  }
  
  return pyramid;
}

/**
 * Find all instances of template
 */
export async function findAllInstances(
  imageUrl: string,
  templateUrl: string,
  threshold: number = 0.8
): Promise<TemplateMatch[]> {
  const result = await matchTemplate(imageUrl, templateUrl, {
    threshold,
    maxMatches: 100,
    multiScale: true,
  });
  
  return result.matches;
}

/**
 * Check if template exists in image
 */
export async function templateExistsAdvanced(
  imageUrl: string,
  templateUrl: string,
  threshold: number = 0.8
): Promise<boolean> {
  const result = await matchTemplate(imageUrl, templateUrl, {
    threshold,
    maxMatches: 1,
  });
  
  return result.matches.length > 0;
}

/**
 * Get match region from image
 */
export async function extractMatchRegion(
  imageUrl: string,
  match: TemplateMatch,
  templateWidth: number,
  templateHeight: number
): Promise<ImageData> {
  const processed = await processImage(imageUrl);
  
  const x = Math.floor(match.position.x);
  const y = Math.floor(match.position.y);
  const w = Math.floor(templateWidth * match.scale);
  const h = Math.floor(templateHeight * match.scale);
  
  // Extract region
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = processed.data.width;
  tempCanvas.height = processed.data.height;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.putImageData(processed.data, 0, 0);
  
  ctx.drawImage(tempCanvas, x, y, w, h, 0, 0, w, h);
  
  return ctx.getImageData(0, 0, w, h);
}
