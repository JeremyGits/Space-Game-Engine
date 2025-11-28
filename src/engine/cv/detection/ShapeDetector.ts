/**
 * Shape Detector
 * Detects and classifies shapes from contours
 */

import type { DetectedShape, DetectedContour, ShapeType, Point2D, BoundingBox } from '../../../types/cv';
import { detectContours, getContourBounds, getContourCentroid } from './ContourDetector';

export interface ShapeDetectionOptions {
  minArea?: number;
  maxArea?: number;
  circularityThreshold?: number;
  rectangularityThreshold?: number;
  triangleThreshold?: number;
}

export interface ShapeDetectionResult {
  shapes: DetectedShape[];
  processingTime: number;
}

/**
 * Detect and classify shapes in an image
 */
export async function detectShapes(
  imageUrl: string,
  options: ShapeDetectionOptions = {}
): Promise<ShapeDetectionResult> {
  const startTime = performance.now();
  
  const {
    minArea = 100,
    maxArea = Infinity,
    circularityThreshold = 0.8,
    rectangularityThreshold = 0.85,
    triangleThreshold = 0.9,
  } = options;
  
  // Get contours first
  const contourResult = await detectContours(imageUrl, {
    minArea,
    maxArea,
    approximation: true,
    epsilon: 0.02,
  });
  
  // Classify each contour as a shape
  const shapes: DetectedShape[] = [];
  
  for (const contour of contourResult.contours) {
    const shape = classifyShape(contour, {
      circularityThreshold,
      rectangularityThreshold,
      triangleThreshold,
    });
    
    if (shape) {
      shapes.push(shape);
    }
  }
  
  const processingTime = performance.now() - startTime;
  
  console.log(`🔍 Detected ${shapes.length} shapes in ${processingTime.toFixed(2)}ms`);
  
  return {
    shapes,
    processingTime,
  };
}

/**
 * Classify a contour as a specific shape
 */
export function classifyShape(
  contour: DetectedContour,
  thresholds: {
    circularityThreshold: number;
    rectangularityThreshold: number;
    triangleThreshold: number;
  }
): DetectedShape | null {
  const points = contour.points;
  const vertexCount = points.length;
  
  // Calculate shape properties
  const circularity = calculateCircularity(contour);
  const rectangularity = calculateRectangularity(contour);
  const convexity = calculateConvexity(contour);
  const symmetry = calculateSymmetry(contour);
  const compactness = calculateCompactness(contour);
  
  // Determine shape type
  let type: ShapeType;
  let confidence: number;
  
  // Circle detection
  if (circularity >= thresholds.circularityThreshold) {
    type = 'circle';
    confidence = circularity;
  }
  // Rectangle/Square detection
  else if (vertexCount === 4 && rectangularity >= thresholds.rectangularityThreshold) {
    const bounds = getContourBounds(contour);
    const aspectRatio = bounds.width / bounds.height;
    
    if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
      type = 'square';
    } else {
      type = 'rectangle';
    }
    confidence = rectangularity;
  }
  // Triangle detection
  else if (vertexCount === 3) {
    type = 'triangle';
    confidence = thresholds.triangleThreshold;
  }
  // Ellipse detection
  else if (circularity >= 0.6 && circularity < thresholds.circularityThreshold) {
    type = 'ellipse';
    confidence = circularity;
  }
  // Polygon detection
  else if (vertexCount > 4 && vertexCount <= 12 && convexity > 0.9) {
    type = 'polygon';
    confidence = convexity;
  }
  // Line detection
  else if (vertexCount === 2) {
    type = 'line';
    confidence = 1.0;
  }
  // Irregular shape
  else {
    type = 'irregular';
    confidence = 0.5;
  }
  
  const bounds = getContourBounds(contour);
  
  return {
    type,
    points,
    bounds,
    confidence,
    properties: {
      circularity,
      rectangularity,
      convexity,
      symmetry,
      compactness,
    },
  };
}

/**
 * Calculate circularity (4π * area / perimeter²)
 * Perfect circle = 1.0, less circular = lower value
 */
export function calculateCircularity(contour: DetectedContour): number {
  const { area, perimeter } = contour;
  
  if (perimeter === 0) return 0;
  
  const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
  return Math.min(1, circularity);
}

/**
 * Calculate rectangularity (area / bounding box area)
 * Perfect rectangle = 1.0
 */
export function calculateRectangularity(contour: DetectedContour): number {
  const bounds = getContourBounds(contour);
  const boundingBoxArea = bounds.width * bounds.height;
  
  if (boundingBoxArea === 0) return 0;
  
  return contour.area / boundingBoxArea;
}

/**
 * Calculate convexity (convex hull area / contour area)
 * Convex shape = 1.0
 */
export function calculateConvexity(contour: DetectedContour): number {
  // Simplified: assume contour is reasonably convex
  // Full implementation would use cv.convexHull
  return 0.95; // Placeholder
}

/**
 * Calculate symmetry (0-1, higher = more symmetric)
 */
export function calculateSymmetry(contour: DetectedContour): number {
  // Simplified symmetry calculation
  const centroid = getContourCentroid(contour);
  const points = contour.points;
  
  // Calculate variance from centroid
  let variance = 0;
  for (const point of points) {
    const dx = point.x - centroid.x;
    const dy = point.y - centroid.y;
    variance += dx * dx + dy * dy;
  }
  
  variance /= points.length;
  
  // Normalize to 0-1 (lower variance = higher symmetry)
  const symmetry = 1 / (1 + variance / 1000);
  return symmetry;
}

/**
 * Calculate compactness (perimeter² / area)
 * Circle has minimum compactness
 */
export function calculateCompactness(contour: DetectedContour): number {
  const { area, perimeter } = contour;
  
  if (area === 0) return 0;
  
  const compactness = (perimeter * perimeter) / area;
  
  // Normalize (circle = 4π ≈ 12.57)
  return 12.57 / compactness;
}

/**
 * Filter shapes by type
 */
export function filterShapesByType(shapes: DetectedShape[], type: ShapeType): DetectedShape[] {
  return shapes.filter(s => s.type === type);
}

/**
 * Filter shapes by confidence
 */
export function filterShapesByConfidence(
  shapes: DetectedShape[],
  minConfidence: number
): DetectedShape[] {
  return shapes.filter(s => s.confidence >= minConfidence);
}

/**
 * Get shape center
 */
export function getShapeCenter(shape: DetectedShape): Point2D {
  const points = shape.points;
  
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

/**
 * Calculate shape area
 */
export function calculateShapeArea(shape: DetectedShape): number {
  const points = shape.points;
  let area = 0;
  
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area / 2);
}

/**
 * Check if point is inside shape
 */
export function isPointInShape(point: Point2D, shape: DetectedShape): boolean {
  const points = shape.points;
  let inside = false;
  
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}
