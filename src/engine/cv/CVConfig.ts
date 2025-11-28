/**
 * Computer Vision System - Configuration
 * Default configuration for the CV engine
 */

import type { CVConfig } from '../../types/cv';

export const DEFAULT_CV_CONFIG: CVConfig = {
  // OpenCV.js configuration
  opencv: {
    enabled: true,
    wasmPath: '/opencv.js',
    simdEnabled: true,
    threadsEnabled: false, // Threads can cause issues in some browsers
  },
  
  // TensorFlow.js configuration
  tensorflow: {
    enabled: true,
    backend: 'webgl', // Best performance
    modelPath: '/models/cv/',
  },
  
  // Performance settings
  performance: {
    maxImageSize: 2048, // Max width/height
    cacheResults: true,
    parallelProcessing: false, // Enable when stable
    gpuAcceleration: true,
  },
  
  // Detection settings
  detection: {
    minObjectSize: 10, // Minimum 10x10 pixels
    maxObjectSize: 1000, // Maximum 1000x1000 pixels
    confidenceThreshold: 0.7, // 70% confidence minimum
    nmsThreshold: 0.5, // Non-maximum suppression
  },
  
  // Segmentation settings
  segmentation: {
    algorithm: 'contour', // Fastest for most cases
    minRegionSize: 100, // Minimum 100 pixels
    mergeThreshold: 0.8, // Merge similar regions
  },
  
  // Classification settings
  classification: {
    method: 'hybrid', // Use all methods
    confidenceThreshold: 0.75, // 75% confidence
    fallbackToManual: false, // Don't require manual annotation
  },
};

/**
 * Preset configurations for different use cases
 */
export const CV_PRESETS = {
  // Fast processing, lower accuracy
  FAST: {
    ...DEFAULT_CV_CONFIG,
    performance: {
      ...DEFAULT_CV_CONFIG.performance,
      maxImageSize: 1024,
      cacheResults: true,
    },
    detection: {
      ...DEFAULT_CV_CONFIG.detection,
      confidenceThreshold: 0.6,
    },
    segmentation: {
      ...DEFAULT_CV_CONFIG.segmentation,
      algorithm: 'contour' as const,
      minRegionSize: 200,
    },
  },
  
  // Balanced speed and accuracy
  BALANCED: DEFAULT_CV_CONFIG,
  
  // High accuracy, slower processing
  ACCURATE: {
    ...DEFAULT_CV_CONFIG,
    performance: {
      ...DEFAULT_CV_CONFIG.performance,
      maxImageSize: 4096,
    },
    detection: {
      ...DEFAULT_CV_CONFIG.detection,
      confidenceThreshold: 0.85,
      minObjectSize: 5,
    },
    segmentation: {
      ...DEFAULT_CV_CONFIG.segmentation,
      algorithm: 'watershed' as const,
      minRegionSize: 50,
    },
    classification: {
      ...DEFAULT_CV_CONFIG.classification,
      confidenceThreshold: 0.85,
    },
  },
  
  // For cockpit/UI component detection
  COCKPIT: {
    ...DEFAULT_CV_CONFIG,
    detection: {
      ...DEFAULT_CV_CONFIG.detection,
      minObjectSize: 20,
      maxObjectSize: 500,
      confidenceThreshold: 0.75,
    },
    segmentation: {
      ...DEFAULT_CV_CONFIG.segmentation,
      algorithm: 'contour' as const,
      minRegionSize: 150,
    },
  },
  
  // For terrain/heightmap analysis
  TERRAIN: {
    ...DEFAULT_CV_CONFIG,
    performance: {
      ...DEFAULT_CV_CONFIG.performance,
      maxImageSize: 2048,
    },
    segmentation: {
      ...DEFAULT_CV_CONFIG.segmentation,
      algorithm: 'kmeans' as const,
      minRegionSize: 500,
    },
  },
} as const;

/**
 * Get configuration by preset name
 */
export function getCVPreset(preset: keyof typeof CV_PRESETS): CVConfig {
  return CV_PRESETS[preset];
}

/**
 * Merge custom config with defaults
 */
export function mergeCVConfig(custom: Partial<CVConfig>): CVConfig {
  return {
    opencv: { ...DEFAULT_CV_CONFIG.opencv, ...custom.opencv },
    tensorflow: { ...DEFAULT_CV_CONFIG.tensorflow, ...custom.tensorflow },
    performance: { ...DEFAULT_CV_CONFIG.performance, ...custom.performance },
    detection: { ...DEFAULT_CV_CONFIG.detection, ...custom.detection },
    segmentation: { ...DEFAULT_CV_CONFIG.segmentation, ...custom.segmentation },
    classification: { ...DEFAULT_CV_CONFIG.classification, ...custom.classification },
  };
}

/**
 * Validate configuration
 */
export function validateCVConfig(config: CVConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate image size
  if (config.performance.maxImageSize < 256) {
    errors.push('maxImageSize must be at least 256');
  }
  if (config.performance.maxImageSize > 8192) {
    errors.push('maxImageSize should not exceed 8192');
  }
  
  // Validate thresholds
  if (config.detection.confidenceThreshold < 0 || config.detection.confidenceThreshold > 1) {
    errors.push('confidenceThreshold must be between 0 and 1');
  }
  
  if (config.classification.confidenceThreshold < 0 || config.classification.confidenceThreshold > 1) {
    errors.push('classification confidenceThreshold must be between 0 and 1');
  }
  
  // Validate sizes
  if (config.detection.minObjectSize >= config.detection.maxObjectSize) {
    errors.push('minObjectSize must be less than maxObjectSize');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
