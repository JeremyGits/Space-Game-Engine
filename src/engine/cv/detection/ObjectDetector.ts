/**
 * Object Detector
 * Main object detection system - combines all detection methods
 */

import type { DetectedObject, BoundingBox, DetectionResult, DetectionConfig } from '../../../types/cv';
import { detectContours, getContourBounds, getContourCentroid } from './ContourDetector';
import { detectCircles } from './CircleDetector';
import { detectShapes } from './ShapeDetector';
import { getCVContext } from '../core/CVContext';
import { getResultCache } from '../core/ResultCache';

export interface ObjectDetectionOptions extends Partial<DetectionConfig> {
  useContours?: boolean;
  useCircles?: boolean;
  useShapes?: boolean;
  extractProperties?: boolean;
}

/**
 * Detect objects in an image using multiple methods
 */
export async function detectObjects(
  imageUrl: string,
  options: ObjectDetectionOptions = {}
): Promise<DetectionResult> {
  const context = getCVContext();
  const operationId = `detect_${Date.now()}`;
  
  context.startOperation(operationId);
  
  try {
    const startTime = performance.now();
    
    const {
      minObjectSize = 10,
      maxObjectSize = 1000,
      confidenceThreshold = 0.7,
      useContours = true,
      useCircles = true,
      useShapes = true,
      extractProperties = true,
    } = options;
    
    // Check cache
    const cache = getResultCache('detection');
    const cacheKey = `objects_${imageUrl}_${JSON.stringify(options)}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      context.endOperation(operationId);
      return cached;
    }
    
    const objects: DetectedObject[] = [];
    const shapes: any[] = [];
    const contours: any[] = [];
    const features: any[] = [];
    
    // Run detection methods in parallel
    const detectionPromises: Promise<any>[] = [];
    
    if (useContours) {
      detectionPromises.push(
        detectContours(imageUrl, {
          minArea: minObjectSize * minObjectSize,
          maxArea: maxObjectSize * maxObjectSize,
        })
      );
    }
    
    if (useCircles) {
      detectionPromises.push(
        detectCircles(imageUrl, {
          minRadius: minObjectSize / 2,
          maxRadius: maxObjectSize / 2,
        })
      );
    }
    
    if (useShapes) {
      detectionPromises.push(
        detectShapes(imageUrl, {
          minArea: minObjectSize * minObjectSize,
          maxArea: maxObjectSize * maxObjectSize,
        })
      );
    }
    
    // Wait for all detections
    const results = await Promise.all(detectionPromises);
    
    // Process results
    let resultIndex = 0;
    
    if (useContours) {
      const contourResult = results[resultIndex++];
      contours.push(...contourResult.contours);
      
      // Convert contours to objects
      for (const contour of contourResult.contours) {
        const bounds = getContourBounds(contour);
        const centroid = getContourCentroid(contour);
        
        objects.push({
          id: `contour_${objects.length}`,
          type: 'contour',
          bounds,
          confidence: 0.9,
          properties: {
            area: contour.area,
            perimeter: contour.perimeter,
            circularity: 0,
            aspectRatio: bounds.width / bounds.height,
            vertices: contour.points.length,
            centroid,
            orientation: 0,
          },
        });
      }
    }
    
    if (useCircles) {
      const circleResult = results[resultIndex++];
      
      // Convert circles to objects
      for (const circle of circleResult.circles) {
        objects.push({
          id: `circle_${objects.length}`,
          type: 'circle',
          bounds: {
            x: circle.center.x - circle.radius,
            y: circle.center.y - circle.radius,
            width: circle.radius * 2,
            height: circle.radius * 2,
          },
          confidence: circle.confidence,
          properties: {
            area: Math.PI * circle.radius * circle.radius,
            perimeter: 2 * Math.PI * circle.radius,
            circularity: 1.0,
            aspectRatio: 1.0,
            vertices: 0,
            centroid: circle.center,
            orientation: 0,
          },
        });
      }
    }
    
    if (useShapes) {
      const shapeResult = results[resultIndex++];
      shapes.push(...shapeResult.shapes);
      
      // Convert shapes to objects
      for (const shape of shapeResult.shapes) {
        const centroid = {
          x: shape.bounds.x + shape.bounds.width / 2,
          y: shape.bounds.y + shape.bounds.height / 2,
        };
        
        objects.push({
          id: `shape_${objects.length}`,
          type: shape.type,
          bounds: shape.bounds,
          confidence: shape.confidence,
          properties: {
            area: shape.bounds.width * shape.bounds.height,
            perimeter: 2 * (shape.bounds.width + shape.bounds.height),
            circularity: shape.properties.circularity,
            aspectRatio: shape.bounds.width / shape.bounds.height,
            vertices: shape.points.length,
            centroid,
            orientation: 0,
          },
        });
      }
    }
    
    // Filter by confidence
    const filteredObjects = objects.filter(obj => obj.confidence >= confidenceThreshold);
    
    const processingTime = performance.now() - startTime;
    
    const result: DetectionResult = {
      objects: filteredObjects,
      shapes,
      contours,
      features,
      processingTime,
      method: 'hybrid',
    };
    
    // Cache result
    cache.set(cacheKey, result);
    
    context.endOperation(operationId);
    
    console.log(`🔍 Detected ${filteredObjects.length} objects in ${processingTime.toFixed(2)}ms`);
    
    return result;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.endOperationWithError(operationId, errorMessage);
    throw error;
  }
}

/**
 * Detect objects by type
 */
export async function detectObjectsByType(
  imageUrl: string,
  type: string,
  options?: ObjectDetectionOptions
): Promise<DetectedObject[]> {
  const result = await detectObjects(imageUrl, options);
  return result.objects.filter(obj => obj.type === type);
}

/**
 * Find largest object
 */
export async function findLargestObject(
  imageUrl: string,
  options?: ObjectDetectionOptions
): Promise<DetectedObject | null> {
  const result = await detectObjects(imageUrl, options);
  
  if (result.objects.length === 0) {
    return null;
  }
  
  return result.objects.reduce((largest, current) =>
    current.properties.area > largest.properties.area ? current : largest
  );
}

/**
 * Count objects
 */
export async function countObjects(
  imageUrl: string,
  options?: ObjectDetectionOptions
): Promise<number> {
  const result = await detectObjects(imageUrl, options);
  return result.objects.length;
}

/**
 * Filter objects by size
 */
export function filterObjectsBySize(
  objects: DetectedObject[],
  minSize: number,
  maxSize: number = Infinity
): DetectedObject[] {
  return objects.filter(obj => {
    const size = Math.max(obj.bounds.width, obj.bounds.height);
    return size >= minSize && size <= maxSize;
  });
}

/**
 * Filter objects by area
 */
export function filterObjectsByArea(
  objects: DetectedObject[],
  minArea: number,
  maxArea: number = Infinity
): DetectedObject[] {
  return objects.filter(obj => 
    obj.properties.area >= minArea && obj.properties.area <= maxArea
  );
}

/**
 * Filter objects by confidence
 */
export function filterObjectsByConfidence(
  objects: DetectedObject[],
  minConfidence: number
): DetectedObject[] {
  return objects.filter(obj => obj.confidence >= minConfidence);
}

/**
 * Group nearby objects
 */
export function groupNearbyObjects(
  objects: DetectedObject[],
  maxDistance: number
): DetectedObject[][] {
  const groups: DetectedObject[][] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < objects.length; i++) {
    if (used.has(i)) continue;
    
    const group: DetectedObject[] = [objects[i]];
    used.add(i);
    
    for (let j = i + 1; j < objects.length; j++) {
      if (used.has(j)) continue;
      
      const distance = calculateObjectDistance(objects[i], objects[j]);
      if (distance <= maxDistance) {
        group.push(objects[j]);
        used.add(j);
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

/**
 * Calculate distance between two objects
 */
export function calculateObjectDistance(obj1: DetectedObject, obj2: DetectedObject): number {
  const c1 = obj1.properties.centroid;
  const c2 = obj2.properties.centroid;
  
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if objects overlap
 */
export function objectsOverlap(obj1: DetectedObject, obj2: DetectedObject): boolean {
  const b1 = obj1.bounds;
  const b2 = obj2.bounds;
  
  return !(
    b1.x + b1.width < b2.x ||
    b2.x + b2.width < b1.x ||
    b1.y + b1.height < b2.y ||
    b2.y + b2.height < b1.y
  );
}

/**
 * Merge overlapping objects
 */
export function mergeOverlappingObjects(objects: DetectedObject[]): DetectedObject[] {
  const result: DetectedObject[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < objects.length; i++) {
    if (used.has(i)) continue;
    
    let merged = objects[i];
    used.add(i);
    
    for (let j = i + 1; j < objects.length; j++) {
      if (used.has(j)) continue;
      
      if (objectsOverlap(merged, objects[j])) {
        merged = mergeObjects(merged, objects[j]);
        used.add(j);
      }
    }
    
    result.push(merged);
  }
  
  return result;
}

/**
 * Merge two objects
 */
function mergeObjects(obj1: DetectedObject, obj2: DetectedObject): DetectedObject {
  const b1 = obj1.bounds;
  const b2 = obj2.bounds;
  
  const minX = Math.min(b1.x, b2.x);
  const minY = Math.min(b1.y, b2.y);
  const maxX = Math.max(b1.x + b1.width, b2.x + b2.width);
  const maxY = Math.max(b1.y + b1.height, b2.y + b2.height);
  
  const mergedBounds: BoundingBox = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
  
  return {
    id: `merged_${obj1.id}_${obj2.id}`,
    type: obj1.type,
    bounds: mergedBounds,
    confidence: (obj1.confidence + obj2.confidence) / 2,
    properties: {
      area: obj1.properties.area + obj2.properties.area,
      perimeter: obj1.properties.perimeter + obj2.properties.perimeter,
      circularity: (obj1.properties.circularity + obj2.properties.circularity) / 2,
      aspectRatio: mergedBounds.width / mergedBounds.height,
      vertices: obj1.properties.vertices + obj2.properties.vertices,
      centroid: {
        x: (obj1.properties.centroid.x + obj2.properties.centroid.x) / 2,
        y: (obj1.properties.centroid.y + obj2.properties.centroid.y) / 2,
      },
      orientation: (obj1.properties.orientation + obj2.properties.orientation) / 2,
    },
  };
}
