/**
 * Computer Vision - Detection Type Definitions
 * Types for object detection, shape detection, and feature detection
 */

export interface DetectedObject {
  id: string;
  type: string;
  bounds: BoundingBox;
  confidence: number;
  properties: ObjectProperties;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObjectProperties {
  area: number;
  perimeter: number;
  circularity: number;
  aspectRatio: number;
  vertices: number;
  centroid: Point2D;
  orientation: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface DetectedShape {
  type: ShapeType;
  points: Point2D[];
  bounds: BoundingBox;
  confidence: number;
  properties: ShapeProperties;
}

export type ShapeType = 
  | 'circle'
  | 'rectangle'
  | 'square'
  | 'triangle'
  | 'polygon'
  | 'ellipse'
  | 'line'
  | 'irregular';

export interface ShapeProperties {
  circularity: number;
  rectangularity: number;
  convexity: number;
  symmetry: number;
  compactness: number;
}

export interface DetectedCircle {
  center: Point2D;
  radius: number;
  confidence: number;
}

export interface DetectedLine {
  start: Point2D;
  end: Point2D;
  angle: number;
  length: number;
}

export interface DetectedContour {
  points: Point2D[];
  area: number;
  perimeter: number;
  hierarchy: number;
  isHole: boolean;
}

export interface FeaturePoint {
  position: Point2D;
  response: number;
  size: number;
  angle: number;
  octave: number;
  descriptor?: number[];
}

export interface FeatureMatch {
  queryIdx: number;
  trainIdx: number;
  distance: number;
  confidence: number;
}

export interface TemplateMatch {
  position: Point2D;
  confidence: number;
  scale: number;
  rotation: number;
}

export interface DetectionResult {
  objects: DetectedObject[];
  shapes: DetectedShape[];
  contours: DetectedContour[];
  features: FeaturePoint[];
  processingTime: number;
  method: 'opencv' | 'custom' | 'hybrid';
}

export interface DetectionConfig {
  minObjectSize: number;
  maxObjectSize: number;
  confidenceThreshold: number;
  nmsThreshold: number;
  maxDetections: number;
  enableShapeDetection: boolean;
  enableFeatureDetection: boolean;
  enableContourDetection: boolean;
}
