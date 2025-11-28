/**
 * Computer Vision System - Type Definitions
 * Core types for the CV engine
 */

export interface CVConfig {
  // OpenCV.js configuration
  opencv: {
    enabled: boolean;
    wasmPath?: string;
    simdEnabled?: boolean;
    threadsEnabled?: boolean;
  };
  
  // TensorFlow.js configuration
  tensorflow: {
    enabled: boolean;
    backend?: 'webgl' | 'wasm' | 'cpu';
    modelPath?: string;
  };
  
  // Performance settings
  performance: {
    maxImageSize: number;
    cacheResults: boolean;
    parallelProcessing: boolean;
    gpuAcceleration: boolean;
  };
  
  // Detection settings
  detection: {
    minObjectSize: number;
    maxObjectSize: number;
    confidenceThreshold: number;
    nmsThreshold: number;
  };
  
  // Segmentation settings
  segmentation: {
    algorithm: 'watershed' | 'grabcut' | 'kmeans' | 'contour';
    minRegionSize: number;
    mergeThreshold: number;
  };
  
  // Classification settings
  classification: {
    method: 'rules' | 'database' | 'ml' | 'hybrid';
    confidenceThreshold: number;
    fallbackToManual: boolean;
  };
}

export interface CVEngineState {
  initialized: boolean;
  opencvReady: boolean;
  tensorflowReady: boolean;
  modelsLoaded: boolean;
  databaseLoaded: boolean;
  processing: boolean;
  error: string | null;
}

export interface CVPerformanceMetrics {
  totalTime: number;
  segmentationTime: number;
  featureExtractionTime: number;
  classificationTime: number;
  objectsDetected: number;
  regionsSegmented: number;
  componentsClassified: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface CVDebugInfo {
  visualizeContours: boolean;
  visualizeRegions: boolean;
  visualizeFeatures: boolean;
  visualizeClassifications: boolean;
  showConfidence: boolean;
  showPerformance: boolean;
  logVerbose: boolean;
}

// Re-export from other CV type files
export * from './DetectionTypes';
export * from './SegmentationTypes';
export * from './FeatureTypes';
