/**
 * Computer Vision - Feature Type Definitions
 * Types for feature extraction and analysis
 */

import { Point2D } from './DetectionTypes';

export interface ImageFeatures {
  shape: ShapeFeatures;
  color: ColorFeatures;
  texture: TextureFeatures;
  geometric: GeometricFeatures;
  statistical: StatisticalFeatures;
}

export interface ShapeFeatures {
  circularity: number;
  rectangularity: number;
  convexity: number;
  symmetry: number;
  compactness: number;
  elongation: number;
  eccentricity: number;
}

export interface ColorFeatures {
  dominantColor: [number, number, number];
  colorHistogram: number[];
  meanColor: [number, number, number];
  stdDevColor: [number, number, number];
  colorVariance: number;
  hueHistogram: number[];
  saturationMean: number;
  brightnessMean: number;
}

export interface TextureFeatures {
  contrast: number;
  homogeneity: number;
  energy: number;
  correlation: number;
  entropy: number;
  glcmMatrix: number[][];
  lbpHistogram: number[];
  gaborResponses: number[];
}

export interface GeometricFeatures {
  area: number;
  perimeter: number;
  boundingBox: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  centroid: Point2D;
  orientation: number;
  majorAxisLength: number;
  minorAxisLength: number;
  moments: HuMoments;
}

export interface HuMoments {
  hu1: number;
  hu2: number;
  hu3: number;
  hu4: number;
  hu5: number;
  hu6: number;
  hu7: number;
}

export interface StatisticalFeatures {
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  min: number;
  max: number;
  range: number;
}

export interface FeatureDescriptor {
  type: DescriptorType;
  data: number[];
  dimensions: number;
  normalized: boolean;
}

export type DescriptorType =
  | 'ORB'
  | 'SIFT'
  | 'SURF'
  | 'BRIEF'
  | 'FAST'
  | 'HOG'
  | 'LBP'
  | 'GLCM'
  | 'custom';

export interface KeyPoint {
  position: Point2D;
  size: number;
  angle: number;
  response: number;
  octave: number;
  classId: number;
  descriptor?: FeatureDescriptor;
}

export interface FeatureExtractionResult {
  features: ImageFeatures;
  keypoints: KeyPoint[];
  descriptors: FeatureDescriptor[];
  processingTime: number;
  method: string;
}

export interface FeatureMatchResult {
  matches: FeatureMatchData[];
  goodMatches: FeatureMatchData[];
  averageDistance: number;
  matchRatio: number;
  confidence: number;
}

export interface FeatureMatchData {
  queryIdx: number;
  trainIdx: number;
  distance: number;
  imgIdx: number;
}

export interface SimilarityScore {
  overall: number;
  shape: number;
  color: number;
  texture: number;
  geometric: number;
  method: SimilarityMethod;
}

export type SimilarityMethod =
  | 'euclidean'
  | 'cosine'
  | 'manhattan'
  | 'chi-square'
  | 'correlation'
  | 'intersection'
  | 'bhattacharyya';

export interface FeatureVector {
  data: number[];
  dimensions: number;
  normalized: boolean;
  type: string;
}

export interface FeatureExtractionConfig {
  extractShape: boolean;
  extractColor: boolean;
  extractTexture: boolean;
  extractGeometric: boolean;
  extractStatistical: boolean;
  normalizeFeatures: boolean;
  featureReduction: boolean;
  targetDimensions?: number;
}
