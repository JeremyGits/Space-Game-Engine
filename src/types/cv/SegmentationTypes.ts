/**
 * Computer Vision - Segmentation Type Definitions
 * Types for semantic segmentation and region classification
 */

import { Point2D, BoundingBox } from './DetectionTypes';

export interface SegmentedRegion {
  id: string;
  bounds: BoundingBox;
  mask: ImageData | null;
  contour: Point2D[];
  area: number;
  centroid: Point2D;
  color: RGBColor;
  properties: RegionProperties;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface RegionProperties {
  meanColor: RGBColor;
  colorVariance: number;
  textureComplexity: number;
  edgeDensity: number;
  isConvex: boolean;
  solidity: number;
}

export interface SegmentationResult {
  regions: SegmentedRegion[];
  totalRegions: number;
  processingTime: number;
  algorithm: SegmentationAlgorithm;
  parameters: SegmentationParameters;
}

export type SegmentationAlgorithm =
  | 'watershed'
  | 'grabcut'
  | 'kmeans'
  | 'meanshift'
  | 'contour'
  | 'threshold'
  | 'adaptive';

export interface SegmentationParameters {
  minRegionSize: number;
  maxRegions: number;
  mergeThreshold: number;
  colorSpace: 'RGB' | 'HSV' | 'LAB' | 'GRAY';
  smoothing: number;
}

export interface ClassifiedComponent {
  id: string;
  type: ComponentType;
  region: SegmentedRegion;
  confidence: number;
  depth: number;
  geometry: GeometryTemplate;
  material: MaterialProperties;
  metadata: ComponentMetadata;
}

export type ComponentType =
  | 'button'
  | 'screen'
  | 'knob'
  | 'lever'
  | 'switch'
  | 'panel'
  | 'gauge'
  | 'display'
  | 'control'
  | 'indicator'
  | 'unknown';

export interface GeometryTemplate {
  type: 'box' | 'cylinder' | 'sphere' | 'custom';
  parameters: Record<string, number>;
  scale: [number, number, number];
}

export interface MaterialProperties {
  baseColor: RGBColor;
  metalness: number;
  roughness: number;
  emissive: boolean;
  emissiveIntensity?: number;
  transparent: boolean;
  opacity?: number;
}

export interface ComponentMetadata {
  label?: string;
  function?: string;
  interactable: boolean;
  priority: number;
  tags: string[];
}

export interface ClassificationResult {
  components: ClassifiedComponent[];
  totalComponents: number;
  averageConfidence: number;
  processingTime: number;
  method: ClassificationMethod;
}

export type ClassificationMethod =
  | 'rules'
  | 'database'
  | 'ml'
  | 'hybrid'
  | 'manual';

export interface ComponentSignature {
  id: string;
  type: ComponentType;
  shapeDescriptor: number[];
  colorHistogram: number[];
  textureDescriptor: number[];
  sizeRange: [number, number];
  aspectRatioRange: [number, number];
  circularityRange: [number, number];
  examples: string[];
}

export interface ComponentDatabase {
  version: string;
  signatures: ComponentSignature[];
  metadata: DatabaseMetadata;
}

export interface DatabaseMetadata {
  totalComponents: number;
  lastUpdated: string;
  categories: string[];
  averageAccuracy: number;
}
