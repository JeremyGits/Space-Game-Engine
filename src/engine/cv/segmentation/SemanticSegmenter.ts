/**
 * Semantic Segmenter - Main Segmentation Interface
 * Unified interface for all segmentation algorithms
 * Provides algorithm selection and result aggregation
 */

import type { SegmentationResult } from '../../../types/cv/SegmentationTypes';
import { WatershedSegmenter, type WatershedConfig } from './WatershedSegmenter';
import { GrabCutSegmenter, type GrabCutConfig } from './GrabCutSegmenter';
import { KMeansSegmenter, type KMeansConfig } from './KMeansSegmenter';
import { MeanShiftSegmenter, type MeanShiftConfig } from './MeanShiftSegmenter';
import { ContourSegmenter, type ContourSegmentConfig } from './ContourSegmenter';

export type SegmentationAlgorithm = 'watershed' | 'grabcut' | 'kmeans' | 'meanshift' | 'contour';

export interface SemanticSegmenterConfig {
  algorithm?: SegmentationAlgorithm;
  watershedConfig?: WatershedConfig;
  grabcutConfig?: GrabCutConfig;
  kmeansConfig?: KMeansConfig;
  meanshiftConfig?: MeanShiftConfig;
  contourConfig?: ContourSegmentConfig;
}

export class SemanticSegmenter {
  private algorithm: SegmentationAlgorithm;
  private watershedSegmenter: WatershedSegmenter;
  private grabcutSegmenter: GrabCutSegmenter;
  private kmeansSegmenter: KMeansSegmenter;
  private meanshiftSegmenter: MeanShiftSegmenter;
  private contourSegmenter: ContourSegmenter;
  
  constructor(config: SemanticSegmenterConfig = {}) {
    this.algorithm = config.algorithm ?? 'contour';
    
    // Initialize all segmenters
    this.watershedSegmenter = new WatershedSegmenter(config.watershedConfig);
    this.grabcutSegmenter = new GrabCutSegmenter(config.grabcutConfig);
    this.kmeansSegmenter = new KMeansSegmenter(config.kmeansConfig);
    this.meanshiftSegmenter = new MeanShiftSegmenter(config.meanshiftConfig);
    this.contourSegmenter = new ContourSegmenter(config.contourConfig);
  }
  
  /**
   * Segment image using selected algorithm
   */
  segment(
    image: HTMLCanvasElement | HTMLImageElement,
    cv: any,
    algorithm?: SegmentationAlgorithm
  ): SegmentationResult {
    const selectedAlgorithm = algorithm ?? this.algorithm;
    
    switch (selectedAlgorithm) {
      case 'watershed':
        return this.watershedSegmenter.segment(image, cv);
      
      case 'grabcut':
        return this.grabcutSegmenter.segment(image, cv);
      
      case 'kmeans':
        return this.kmeansSegmenter.segment(image, cv);
      
      case 'meanshift':
        return this.meanshiftSegmenter.segment(image, cv);
      
      case 'contour':
        return this.contourSegmenter.segment(image, cv);
      
      default:
        throw new Error(`Unknown segmentation algorithm: ${selectedAlgorithm}`);
    }
  }
  
  /**
   * Segment using multiple algorithms and combine results
   */
  async segmentMulti(
    image: HTMLCanvasElement | HTMLImageElement,
    cv: any,
    algorithms: SegmentationAlgorithm[]
  ): Promise<SegmentationResult[]> {
    const results: SegmentationResult[] = [];
    
    for (const algorithm of algorithms) {
      try {
        const result = this.segment(image, cv, algorithm);
        results.push(result);
      } catch (error) {
        console.error(`Segmentation failed for ${algorithm}:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Get best segmentation result from multiple algorithms
   */
  async segmentBest(
    image: HTMLCanvasElement | HTMLImageElement,
    cv: any,
    algorithms: SegmentationAlgorithm[] = ['contour', 'kmeans', 'watershed']
  ): Promise<SegmentationResult> {
    const results = await this.segmentMulti(image, cv, algorithms);
    
    if (results.length === 0) {
      throw new Error('All segmentation algorithms failed');
    }
    
    // Return result with most regions (best segmentation)
    return results.reduce((best, current) =>
      current.totalRegions > best.totalRegions ? current : best
    );
  }
  
  /**
   * Set active algorithm
   */
  setAlgorithm(algorithm: SegmentationAlgorithm): void {
    this.algorithm = algorithm;
  }
  
  /**
   * Get active algorithm
   */
  getAlgorithm(): SegmentationAlgorithm {
    return this.algorithm;
  }
  
  /**
   * Get specific segmenter
   */
  getSegmenter(algorithm: SegmentationAlgorithm): any {
    switch (algorithm) {
      case 'watershed': return this.watershedSegmenter;
      case 'grabcut': return this.grabcutSegmenter;
      case 'kmeans': return this.kmeansSegmenter;
      case 'meanshift': return this.meanshiftSegmenter;
      case 'contour': return this.contourSegmenter;
      default: throw new Error(`Unknown algorithm: ${algorithm}`);
    }
  }
}
