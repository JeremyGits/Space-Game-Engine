/**
 * Circle Detector
 * Detects circles using Hough Circle Transform (OpenCV.js)
 */

import type { DetectedCircle, Point2D } from '../../../types/cv';
import { getOpenCV, isOpenCVAvailable } from '../core/OpenCVLoader';
import { processImage } from '../core/ImageProcessor';

export interface CircleDetectionOptions {
  minRadius?: number;
  maxRadius?: number;
  minDist?: number;
  param1?: number; // Canny edge threshold
  param2?: number; // Accumulator threshold
  dp?: number; // Inverse ratio of accumulator resolution
}

export interface CircleDetectionResult {
  circles: DetectedCircle[];
  processingTime: number;
  method: 'hough';
}

/**
 * Detect circles using Hough Circle Transform
 */
export async function detectCircles(
  imageUrl: string,
  options: CircleDetectionOptions = {}
): Promise<CircleDetectionResult> {
  if (!isOpenCVAvailable()) {
    throw new Error('OpenCV.js not available. Load it first.');
  }
  
  const startTime = performance.now();
  const cv = getOpenCV();
  
  const {
    minRadius = 10,
    maxRadius = 100,
    minDist = 20,
    param1 = 100,
    param2 = 30,
    dp = 1,
  } = options;
  
  // Process image to grayscale
  const processed = await processImage(imageUrl, { grayscale: true });
  
  // Create OpenCV Mat from ImageData
  const src = cv.matFromImageData(processed.data);
  const gray = new cv.Mat();
  const circles = new cv.Mat();
  
  try {
    // Convert to grayscale if needed
    if (src.channels() > 1) {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    } else {
      src.copyTo(gray);
    }
    
    // Apply Gaussian blur to reduce noise
    cv.GaussianBlur(gray, gray, new cv.Size(9, 9), 2, 2);
    
    // Detect circles using Hough Transform
    cv.HoughCircles(
      gray,
      circles,
      cv.HOUGH_GRADIENT,
      dp,
      minDist,
      param1,
      param2,
      minRadius,
      maxRadius
    );
    
    // Convert to our format
    const detectedCircles: DetectedCircle[] = [];
    
    for (let i = 0; i < circles.cols; i++) {
      const x = circles.data32F[i * 3];
      const y = circles.data32F[i * 3 + 1];
      const radius = circles.data32F[i * 3 + 2];
      
      detectedCircles.push({
        center: { x, y },
        radius,
        confidence: 1.0, // Hough doesn't provide confidence, use 1.0
      });
    }
    
    const processingTime = performance.now() - startTime;
    
    console.log(`🔍 Detected ${detectedCircles.length} circles in ${processingTime.toFixed(2)}ms`);
    
    return {
      circles: detectedCircles,
      processingTime,
      method: 'hough',
    };
    
  } finally {
    // Clean up
    src.delete();
    gray.delete();
    circles.delete();
  }
}

/**
 * Find largest circle
 */
export async function findLargestCircle(
  imageUrl: string,
  options?: CircleDetectionOptions
): Promise<DetectedCircle | null> {
  const result = await detectCircles(imageUrl, options);
  
  if (result.circles.length === 0) {
    return null;
  }
  
  return result.circles.reduce((largest, current) =>
    current.radius > largest.radius ? current : largest
  );
}

/**
 * Filter circles by radius
 */
export function filterCirclesByRadius(
  circles: DetectedCircle[],
  minRadius: number,
  maxRadius: number = Infinity
): DetectedCircle[] {
  return circles.filter(c => c.radius >= minRadius && c.radius <= maxRadius);
}

/**
 * Filter circles by position
 */
export function filterCirclesByPosition(
  circles: DetectedCircle[],
  bounds: { x: number; y: number; width: number; height: number }
): DetectedCircle[] {
  return circles.filter(c => {
    const { center } = c;
    return (
      center.x >= bounds.x &&
      center.x <= bounds.x + bounds.width &&
      center.y >= bounds.y &&
      center.y <= bounds.y + bounds.height
    );
  });
}

/**
 * Check if two circles overlap
 */
export function circlesOverlap(circle1: DetectedCircle, circle2: DetectedCircle): boolean {
  const dx = circle1.center.x - circle2.center.x;
  const dy = circle1.center.y - circle2.center.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < (circle1.radius + circle2.radius);
}

/**
 * Remove overlapping circles (keep larger ones)
 */
export function removeOverlappingCircles(circles: DetectedCircle[]): DetectedCircle[] {
  const sorted = [...circles].sort((a, b) => b.radius - a.radius);
  const result: DetectedCircle[] = [];
  
  for (const circle of sorted) {
    let overlaps = false;
    
    for (const existing of result) {
      if (circlesOverlap(circle, existing)) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      result.push(circle);
    }
  }
  
  return result;
}

/**
 * Calculate circle area
 */
export function getCircleArea(circle: DetectedCircle): number {
  return Math.PI * circle.radius * circle.radius;
}

/**
 * Calculate circle circumference
 */
export function getCircleCircumference(circle: DetectedCircle): number {
  return 2 * Math.PI * circle.radius;
}
