/**
 * Contour-Based Segmentation
 * Segments image based on contour detection and hierarchy
 * Excellent for structured objects with clear boundaries
 */

import type { SegmentationResult, SegmentedRegion } from '../../../types/cv/SegmentationTypes';
import type { Point2D } from '../../../types/cv/DetectionTypes';

export interface ContourSegmentConfig {
  minRegionSize?: number;
  maxRegions?: number;
  colorSpace?: 'RGB' | 'HSV' | 'LAB' | 'GRAY';
  thresholdValue?: number;       // Threshold value (default: 127)
  thresholdType?: 'BINARY' | 'BINARY_INV' | 'OTSU';
  retrievalMode?: 'EXTERNAL' | 'LIST' | 'TREE' | 'CCOMP';
  approximationMethod?: 'NONE' | 'SIMPLE' | 'TC89_L1' | 'TC89_KCOS';
  mergeThreshold?: number;
  smoothing?: number;
}

export class ContourSegmenter {
  private config: Required<ContourSegmentConfig>;
  
  constructor(config: ContourSegmentConfig = {}) {
    this.config = {
      minRegionSize: config.minRegionSize ?? 100,
      maxRegions: config.maxRegions ?? 1000,
      colorSpace: config.colorSpace ?? 'RGB',
      thresholdValue: config.thresholdValue ?? 127,
      thresholdType: config.thresholdType ?? 'BINARY_INV',
      retrievalMode: config.retrievalMode ?? 'EXTERNAL',
      approximationMethod: config.approximationMethod ?? 'SIMPLE',
      mergeThreshold: config.mergeThreshold ?? 0.1,
      smoothing: config.smoothing ?? 0,
    };
  }
  
  /**
   * Segment image using contour detection
   */
  segment(image: HTMLCanvasElement | HTMLImageElement, cv: any): SegmentationResult {
    const startTime = performance.now();
    
    try {
      const src = cv.imread(image);
      const gray = new cv.Mat();
      const binary = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      
      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      
      // Apply threshold
      const threshType = this.getThresholdType(cv);
      cv.threshold(gray, binary, this.config.thresholdValue, 255, threshType);
      
      // Find contours
      const retrievalMode = this.getRetrievalMode(cv);
      const approxMethod = this.getApproximationMethod(cv);
      
      cv.findContours(
        binary,
        contours,
        hierarchy,
        retrievalMode,
        approxMethod
      );
      
      // Extract regions from contours
      const regions: SegmentedRegion[] = [];
      
      for (let i = 0; i < contours.size() && regions.length < this.config.maxRegions; i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        
        if (area >= this.config.minRegionSize) {
          const rect = cv.boundingRect(contour);
          const moments = cv.moments(contour);
          const perimeter = cv.arcLength(contour, true);
          
          // Extract contour points
          const contourPoints: Point2D[] = [];
          for (let j = 0; j < contour.data32S.length; j += 2) {
            contourPoints.push({
              x: contour.data32S[j],
              y: contour.data32S[j + 1],
            });
          }
          
          regions.push({
            id: `region_${i}`,
            bounds: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
            mask: null,
            contour: contourPoints,
            area,
            centroid: {
              x: moments.m10 / moments.m00,
              y: moments.m01 / moments.m00,
            },
            color: { r: 0, g: 0, b: 0 },
            properties: {
              meanColor: { r: 0, g: 0, b: 0 },
              colorVariance: 0,
              textureComplexity: 0,
              edgeDensity: perimeter / area,
              isConvex: cv.isContourConvex(contour),
              solidity: area / cv.contourArea(cv.convexHull(contour, new cv.Mat(), false, true)),
            },
          });
        }
        
        contour.delete();
      }
      
      // Clean up
      src.delete();
      gray.delete();
      binary.delete();
      contours.delete();
      hierarchy.delete();
      
      const processingTime = performance.now() - startTime;
      
      return {
        regions,
        totalRegions: regions.length,
        processingTime,
        algorithm: 'contour',
        parameters: {
          minRegionSize: this.config.minRegionSize,
          maxRegions: this.config.maxRegions,
          mergeThreshold: this.config.mergeThreshold,
          colorSpace: this.config.colorSpace,
          smoothing: this.config.smoothing,
        },
      };
      
    } catch (error) {
      console.error('Contour segmentation failed:', error);
      throw error;
    }
  }
  
  private getThresholdType(cv: any): number {
    switch (this.config.thresholdType) {
      case 'BINARY': return cv.THRESH_BINARY;
      case 'BINARY_INV': return cv.THRESH_BINARY_INV;
      case 'OTSU': return cv.THRESH_BINARY + cv.THRESH_OTSU;
      default: return cv.THRESH_BINARY_INV;
    }
  }
  
  private getRetrievalMode(cv: any): number {
    switch (this.config.retrievalMode) {
      case 'EXTERNAL': return cv.RETR_EXTERNAL;
      case 'LIST': return cv.RETR_LIST;
      case 'TREE': return cv.RETR_TREE;
      case 'CCOMP': return cv.RETR_CCOMP;
      default: return cv.RETR_EXTERNAL;
    }
  }
  
  private getApproximationMethod(cv: any): number {
    switch (this.config.approximationMethod) {
      case 'NONE': return cv.CHAIN_APPROX_NONE;
      case 'SIMPLE': return cv.CHAIN_APPROX_SIMPLE;
      case 'TC89_L1': return cv.CHAIN_APPROX_TC89_L1;
      case 'TC89_KCOS': return cv.CHAIN_APPROX_TC89_KCOS;
      default: return cv.CHAIN_APPROX_SIMPLE;
    }
  }
  
  updateConfig(config: Partial<ContourSegmentConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  getConfig(): Required<ContourSegmentConfig> {
    return { ...this.config };
  }
}
