/**
 * Contour Detector
 * Detects contours in images using OpenCV.js
 */

import type { DetectedContour, Point2D } from '../../../types/cv';
import { getOpenCV, isOpenCVAvailable } from '../core/OpenCVLoader';
import { processImage } from '../core/ImageProcessor';

export interface ContourDetectionOptions {
  mode?: 'external' | 'list' | 'tree' | 'ccomp';
  method?: 'none' | 'simple' | 'tc89_l1' | 'tc89_kcos';
  minArea?: number;
  maxArea?: number;
  approximation?: boolean;
  epsilon?: number;
}

export interface ContourDetectionResult {
  contours: DetectedContour[];
  hierarchy: number[][];
  processingTime: number;
}

/**
 * Detect contours in an image
 */
export async function detectContours(
  imageUrl: string,
  options: ContourDetectionOptions = {}
): Promise<ContourDetectionResult> {
  if (!isOpenCVAvailable()) {
    throw new Error('OpenCV.js not available. Load it first.');
  }
  
  const startTime = performance.now();
  const cv = getOpenCV();
  
  const {
    mode = 'external',
    method = 'simple',
    minArea = 100,
    maxArea = Infinity,
    approximation = true,
    epsilon = 0.01,
  } = options;
  
  // Process image to grayscale
  const processed = await processImage(imageUrl, { grayscale: true });
  
  // Create OpenCV Mat from ImageData
  const src = cv.matFromImageData(processed.data);
  const gray = new cv.Mat();
  const binary = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  
  try {
    // Convert to grayscale if needed
    if (src.channels() > 1) {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    } else {
      src.copyTo(gray);
    }
    
    // Apply threshold to get binary image
    cv.threshold(gray, binary, 127, 255, cv.THRESH_BINARY);
    
    // Map mode string to OpenCV constant
    const modeMap = {
      'external': cv.RETR_EXTERNAL,
      'list': cv.RETR_LIST,
      'tree': cv.RETR_TREE,
      'ccomp': cv.RETR_CCOMP,
    };
    
    // Map method string to OpenCV constant
    const methodMap = {
      'none': cv.CHAIN_APPROX_NONE,
      'simple': cv.CHAIN_APPROX_SIMPLE,
      'tc89_l1': cv.CHAIN_APPROX_TC89_L1,
      'tc89_kcos': cv.CHAIN_APPROX_TC89_KCOS,
    };
    
    // Find contours
    cv.findContours(
      binary,
      contours,
      hierarchy,
      modeMap[mode],
      methodMap[method]
    );
    
    // Convert contours to our format
    const detectedContours: DetectedContour[] = [];
    
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      
      // Filter by area
      if (area < minArea || area > maxArea) {
        continue;
      }
      
      // Get perimeter
      const perimeter = cv.arcLength(contour, true);
      
      // Approximate contour if requested
      let finalContour = contour;
      if (approximation) {
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, epsilon * perimeter, true);
        finalContour = approx;
      }
      
      // Convert points
      const points: Point2D[] = [];
      for (let j = 0; j < finalContour.rows; j++) {
        const point = finalContour.data32S;
        points.push({
          x: point[j * 2],
          y: point[j * 2 + 1],
        });
      }
      
      // Get hierarchy info
      const hierarchyData = hierarchy.data32S;
      const hierarchyIndex = i * 4;
      
      detectedContours.push({
        points,
        area,
        perimeter,
        hierarchy: hierarchyData[hierarchyIndex + 3], // Parent index
        isHole: hierarchyData[hierarchyIndex + 3] >= 0,
      });
      
      if (approximation && finalContour !== contour) {
        finalContour.delete();
      }
    }
    
    const processingTime = performance.now() - startTime;
    
    return {
      contours: detectedContours,
      hierarchy: [], // TODO: Convert hierarchy properly
      processingTime,
    };
    
  } finally {
    // Clean up OpenCV Mats
    src.delete();
    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Find largest contour
 */
export async function findLargestContour(
  imageUrl: string,
  options?: ContourDetectionOptions
): Promise<DetectedContour | null> {
  const result = await detectContours(imageUrl, options);
  
  if (result.contours.length === 0) {
    return null;
  }
  
  return result.contours.reduce((largest, current) => 
    current.area > largest.area ? current : largest
  );
}

/**
 * Filter contours by area
 */
export function filterContoursByArea(
  contours: DetectedContour[],
  minArea: number,
  maxArea: number = Infinity
): DetectedContour[] {
  return contours.filter(c => c.area >= minArea && c.area <= maxArea);
}

/**
 * Filter contours by perimeter
 */
export function filterContoursByPerimeter(
  contours: DetectedContour[],
  minPerimeter: number,
  maxPerimeter: number = Infinity
): DetectedContour[] {
  return contours.filter(c => c.perimeter >= minPerimeter && c.perimeter <= maxPerimeter);
}

/**
 * Get contour bounding box
 */
export function getContourBounds(contour: DetectedContour): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const points = contour.points;
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Get contour centroid
 */
export function getContourCentroid(contour: DetectedContour): Point2D {
  const points = contour.points;
  
  let sumX = 0, sumY = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }
  
  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}
