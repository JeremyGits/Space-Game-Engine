/**
 * Rectangle Detector
 * Detects rectangles and squares from contours
 */

import type { DetectedShape, DetectedContour, BoundingBox, Point2D } from '../../../types/cv';
import { detectContours, getContourBounds } from './ContourDetector';

export interface RectangleDetectionOptions {
  minArea?: number;
  maxArea?: number;
  angleThreshold?: number; // Max deviation from 90 degrees
  aspectRatioRange?: [number, number]; // [min, max] aspect ratio
  squareOnly?: boolean;
}

export interface DetectedRectangle extends DetectedShape {
  type: 'rectangle' | 'square';
  corners: [Point2D, Point2D, Point2D, Point2D];
  angle: number;
  aspectRatio: number;
}

export interface RectangleDetectionResult {
  rectangles: DetectedRectangle[];
  processingTime: number;
}

/**
 * Detect rectangles in an image
 */
export async function detectRectangles(
  imageUrl: string,
  options: RectangleDetectionOptions = {}
): Promise<RectangleDetectionResult> {
  const startTime = performance.now();
  
  const {
    minArea = 100,
    maxArea = Infinity,
    angleThreshold = 15, // degrees
    aspectRatioRange = [0.1, 10],
    squareOnly = false,
  } = options;
  
  // Get contours
  const contourResult = await detectContours(imageUrl, {
    minArea,
    maxArea,
    approximation: true,
    epsilon: 0.02,
  });
  
  // Filter and classify rectangles
  const rectangles: DetectedRectangle[] = [];
  
  for (const contour of contourResult.contours) {
    const rectangle = classifyAsRectangle(contour, {
      angleThreshold,
      aspectRatioRange,
      squareOnly,
    });
    
    if (rectangle) {
      rectangles.push(rectangle);
    }
  }
  
  const processingTime = performance.now() - startTime;
  
  console.log(`🔍 Detected ${rectangles.length} rectangles in ${processingTime.toFixed(2)}ms`);
  
  return {
    rectangles,
    processingTime,
  };
}

/**
 * Classify contour as rectangle
 */
export function classifyAsRectangle(
  contour: DetectedContour,
  options: {
    angleThreshold: number;
    aspectRatioRange: [number, number];
    squareOnly: boolean;
  }
): DetectedRectangle | null {
  const points = contour.points;
  
  // Must have 4 vertices for rectangle
  if (points.length !== 4) {
    return null;
  }
  
  // Check if angles are close to 90 degrees
  const angles = calculateCornerAngles(points);
  const angleDeviation = angles.map(a => Math.abs(a - 90));
  const maxDeviation = Math.max(...angleDeviation);
  
  if (maxDeviation > options.angleThreshold) {
    return null;
  }
  
  // Calculate aspect ratio
  const bounds = getContourBounds(contour);
  const aspectRatio = bounds.width / bounds.height;
  
  // Check aspect ratio range
  if (aspectRatio < options.aspectRatioRange[0] || aspectRatio > options.aspectRatioRange[1]) {
    return null;
  }
  
  // Check if square only
  if (options.squareOnly && (aspectRatio < 0.9 || aspectRatio > 1.1)) {
    return null;
  }
  
  // Determine if square or rectangle
  const isSquare = aspectRatio >= 0.9 && aspectRatio <= 1.1;
  const type: 'rectangle' | 'square' = isSquare ? 'square' : 'rectangle';
  
  // Calculate angle (rotation)
  const angle = calculateRectangleAngle(points);
  
  // Calculate confidence based on angle deviation
  const confidence = 1 - (maxDeviation / options.angleThreshold);
  
  return {
    type,
    points,
    bounds,
    confidence,
    properties: {
      circularity: 0.785, // π/4 for rectangle
      rectangularity: 1.0,
      convexity: 1.0,
      symmetry: isSquare ? 1.0 : 0.5,
      compactness: 0.785,
    },
    corners: [points[0], points[1], points[2], points[3]],
    angle,
    aspectRatio,
  };
}

/**
 * Calculate corner angles
 */
function calculateCornerAngles(points: Point2D[]): number[] {
  const angles: number[] = [];
  
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    
    // Vectors
    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    
    // Dot product and magnitudes
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    // Angle in degrees
    const angleRad = Math.acos(dot / (mag1 * mag2));
    const angleDeg = (angleRad * 180) / Math.PI;
    
    angles.push(angleDeg);
  }
  
  return angles;
}

/**
 * Calculate rectangle rotation angle
 */
function calculateRectangleAngle(points: Point2D[]): number {
  // Use first edge
  const dx = points[1].x - points[0].x;
  const dy = points[1].y - points[0].y;
  
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;
  
  return angleDeg;
}

/**
 * Find largest rectangle
 */
export async function findLargestRectangle(
  imageUrl: string,
  options?: RectangleDetectionOptions
): Promise<DetectedRectangle | null> {
  const result = await detectRectangles(imageUrl, options);
  
  if (result.rectangles.length === 0) {
    return null;
  }
  
  return result.rectangles.reduce((largest, current) => {
    const largestArea = largest.bounds.width * largest.bounds.height;
    const currentArea = current.bounds.width * current.bounds.height;
    return currentArea > largestArea ? current : largest;
  });
}

/**
 * Filter rectangles by aspect ratio
 */
export function filterRectanglesByAspectRatio(
  rectangles: DetectedRectangle[],
  minRatio: number,
  maxRatio: number
): DetectedRectangle[] {
  return rectangles.filter(r => 
    r.aspectRatio >= minRatio && r.aspectRatio <= maxRatio
  );
}

/**
 * Get only squares
 */
export function getSquares(rectangles: DetectedRectangle[]): DetectedRectangle[] {
  return rectangles.filter(r => r.type === 'square');
}

/**
 * Get rectangle dimensions
 */
export function getRectangleDimensions(rectangle: DetectedRectangle): {
  width: number;
  height: number;
  area: number;
  perimeter: number;
} {
  const { width, height } = rectangle.bounds;
  
  return {
    width,
    height,
    area: width * height,
    perimeter: 2 * (width + height),
  };
}

/**
 * Check if rectangles overlap
 */
export function rectanglesOverlap(rect1: DetectedRectangle, rect2: DetectedRectangle): boolean {
  const b1 = rect1.bounds;
  const b2 = rect2.bounds;
  
  return !(
    b1.x + b1.width < b2.x ||
    b2.x + b2.width < b1.x ||
    b1.y + b1.height < b2.y ||
    b2.y + b2.height < b1.y
  );
}

/**
 * Calculate overlap area between two rectangles
 */
export function calculateOverlapArea(rect1: DetectedRectangle, rect2: DetectedRectangle): number {
  if (!rectanglesOverlap(rect1, rect2)) {
    return 0;
  }
  
  const b1 = rect1.bounds;
  const b2 = rect2.bounds;
  
  const xOverlap = Math.min(b1.x + b1.width, b2.x + b2.width) - Math.max(b1.x, b2.x);
  const yOverlap = Math.min(b1.y + b1.height, b2.y + b2.height) - Math.max(b1.y, b2.y);
  
  return xOverlap * yOverlap;
}
