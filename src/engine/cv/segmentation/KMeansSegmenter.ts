/**
 * K-Means Segmentation Algorithm
 * Clusters pixels by color similarity
 * Fast and effective for color-based segmentation
 */

import type { SegmentationResult } from '../../../types/cv/SegmentationTypes';

export interface KMeansConfig {
  minRegionSize?: number;
  maxRegions?: number;
  colorSpace?: 'RGB' | 'HSV' | 'LAB' | 'GRAY';
  k?: number;                    // Number of clusters (default: 5)
  maxIterations?: number;        // Max iterations (default: 100)
  epsilon?: number;              // Convergence threshold (default: 0.2)
  attempts?: number;             // Number of attempts (default: 3)
  mergeThreshold?: number;
  smoothing?: number;
}

export class KMeansSegmenter {
  private config: Required<KMeansConfig>;
  
  constructor(config: KMeansConfig = {}) {
    this.config = {
      minRegionSize: config.minRegionSize ?? 100,
      maxRegions: config.maxRegions ?? 1000,
      colorSpace: config.colorSpace ?? 'RGB',
      k: config.k ?? 5,
      maxIterations: config.maxIterations ?? 100,
      epsilon: config.epsilon ?? 0.2,
      attempts: config.attempts ?? 3,
      mergeThreshold: config.mergeThreshold ?? 0.1,
      smoothing: config.smoothing ?? 0,
    };
  }
  
  /**
   * Segment image using K-means clustering
   */
  segment(image: HTMLCanvasElement | HTMLImageElement, cv: any): SegmentationResult {
    const startTime = performance.now();
    
    try {
      const src = cv.imread(image);
      const samples = new cv.Mat();
      const labels = new cv.Mat();
      const centers = new cv.Mat();
      
      // Reshape image to 2D array of pixels
      const reshaped = src.reshape(1, src.rows * src.cols);
      reshaped.convertTo(samples, cv.CV_32F);
      
      // K-means clustering
      const criteria = new cv.TermCriteria(
        cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER,
        this.config.maxIterations,
        this.config.epsilon
      );
      
      cv.kmeans(
        samples,
        this.config.k,
        labels,
        criteria,
        this.config.attempts,
        cv.KMEANS_PP_CENTERS,
        centers
      );
      
      // Reshape labels back to image dimensions
      const segmented = labels.reshape(src.channels(), src.rows);
      
      // Clean up
      src.delete();
      samples.delete();
      labels.delete();
      centers.delete();
      reshaped.delete();
      segmented.delete();
      
      const processingTime = performance.now() - startTime;
      
      return {
        regions: [],
        totalRegions: this.config.k,
        processingTime,
        algorithm: 'kmeans',
        parameters: {
          minRegionSize: this.config.minRegionSize,
          maxRegions: this.config.maxRegions,
          mergeThreshold: this.config.mergeThreshold,
          colorSpace: this.config.colorSpace,
          smoothing: this.config.smoothing,
        },
      };
      
    } catch (error) {
      console.error('K-means segmentation failed:', error);
      throw error;
    }
  }
  
  updateConfig(config: Partial<KMeansConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  getConfig(): Required<KMeansConfig> {
    return { ...this.config };
  }
}
