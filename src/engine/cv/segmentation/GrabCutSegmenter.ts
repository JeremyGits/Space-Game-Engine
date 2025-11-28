/**
 * GrabCut Segmentation Algorithm
 * Interactive foreground/background segmentation
 * Excellent for extracting objects from complex backgrounds
 */

import type { SegmentationResult } from '../../../types/cv/SegmentationTypes';

export interface GrabCutConfig {
  minRegionSize?: number;
  maxRegions?: number;
  colorSpace?: 'RGB' | 'HSV' | 'LAB' | 'GRAY';
  iterations?: number;           // GrabCut iterations (default: 5)
  mode?: 'INIT_WITH_RECT' | 'INIT_WITH_MASK';
  mergeThreshold?: number;
  smoothing?: number;
}

export class GrabCutSegmenter {
  private config: Required<GrabCutConfig>;
  
  constructor(config: GrabCutConfig = {}) {
    this.config = {
      minRegionSize: config.minRegionSize ?? 100,
      maxRegions: config.maxRegions ?? 1000,
      colorSpace: config.colorSpace ?? 'RGB',
      iterations: config.iterations ?? 5,
      mode: config.mode ?? 'INIT_WITH_RECT',
      mergeThreshold: config.mergeThreshold ?? 0.1,
      smoothing: config.smoothing ?? 0,
    };
  }
  
  /**
   * Segment image using GrabCut algorithm
   */
  segment(
    image: HTMLCanvasElement | HTMLImageElement,
    cv: any,
    rect?: { x: number; y: number; width: number; height: number }
  ): SegmentationResult {
    const startTime = performance.now();
    
    try {
      const src = cv.imread(image);
      const mask = new cv.Mat();
      const bgdModel = new cv.Mat();
      const fgdModel = new cv.Mat();
      
      // Initialize mask
      mask.setTo(new cv.Scalar(cv.GC_BGD));
      
      // Define rectangle if not provided
      const grabCutRect = rect || {
        x: Math.floor(src.cols * 0.1),
        y: Math.floor(src.rows * 0.1),
        width: Math.floor(src.cols * 0.8),
        height: Math.floor(src.rows * 0.8),
      };
      
      const cvRect = new cv.Rect(
        grabCutRect.x,
        grabCutRect.y,
        grabCutRect.width,
        grabCutRect.height
      );
      
      // Apply GrabCut
      cv.grabCut(
        src,
        mask,
        cvRect,
        bgdModel,
        fgdModel,
        this.config.iterations,
        cv.GC_INIT_WITH_RECT
      );
      
      // Create binary mask (foreground = 1, background = 0)
      const foreground = new cv.Mat();
      cv.compare(mask, new cv.Scalar(cv.GC_PR_FGD), foreground, cv.CMP_EQ);
      
      const definite = new cv.Mat();
      cv.compare(mask, new cv.Scalar(cv.GC_FGD), definite, cv.CMP_EQ);
      cv.add(foreground, definite, foreground);
      
      // Clean up
      src.delete();
      mask.delete();
      bgdModel.delete();
      fgdModel.delete();
      foreground.delete();
      definite.delete();
      
      const processingTime = performance.now() - startTime;
      
      return {
        regions: [],
        totalRegions: 0,
        processingTime,
        algorithm: 'grabcut',
        parameters: {
          minRegionSize: this.config.minRegionSize,
          maxRegions: this.config.maxRegions,
          mergeThreshold: this.config.mergeThreshold,
          colorSpace: this.config.colorSpace,
          smoothing: this.config.smoothing,
        },
      };
      
    } catch (error) {
      console.error('GrabCut segmentation failed:', error);
      throw error;
    }
  }
  
  updateConfig(config: Partial<GrabCutConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  getConfig(): Required<GrabCutConfig> {
    return { ...this.config };
  }
}
