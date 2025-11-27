/**
 * Adaptive Sampler
 * 
 * Intelligently chooses sampling strategy based on image content.
 * Uses more samples in detailed areas, fewer in flat areas.
 * 
 * Features:
 * - Edge detection for detail areas
 * - Adaptive sample count
 * - Quality-performance balance
 */

import * as THREE from 'three';
import { BilinearSampler } from './BilinearSampler';
import { BicubicSampler } from './BicubicSampler';

/**
 * Adaptive sampler options
 */
export interface AdaptiveSamplerOptions {
  /** Minimum samples per pixel */
  minSamples?: number;
  
  /** Maximum samples per pixel */
  maxSamples?: number;
  
  /** Edge detection threshold */
  edgeThreshold?: number;
  
  /** Use bicubic for high-detail areas */
  useBicubicForDetails?: boolean;
}

/**
 * Adaptive sampler class
 */
export class AdaptiveSampler {
  private options: Required<AdaptiveSamplerOptions>;
  private bilinearSampler: BilinearSampler;
  private bicubicSampler: BicubicSampler;
  private edgeMap: Float32Array | null = null;
  
  constructor(options: AdaptiveSamplerOptions = {}) {
    this.options = {
      minSamples: options.minSamples ?? 1,
      maxSamples: options.maxSamples ?? 4,
      edgeThreshold: options.edgeThreshold ?? 0.1,
      useBicubicForDetails: options.useBicubicForDetails ?? true
    };
    
    this.bilinearSampler = new BilinearSampler();
    this.bicubicSampler = new BicubicSampler();
  }
  
  /**
   * Analyze image to build edge map
   */
  analyzeImage(imageData: ImageData): void {
    const { width, height, data } = imageData;
    this.edgeMap = new Float32Array(width * height);
    
    // Calculate gradients for edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Get luminance
        const getLum = (dx: number, dy: number) => {
          const i = ((y + dy) * width + (x + dx)) * 4;
          return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        };
        
        // Sobel operator
        const gx = 
          -getLum(-1, -1) + getLum(1, -1) +
          -2 * getLum(-1, 0) + 2 * getLum(1, 0) +
          -getLum(-1, 1) + getLum(1, 1);
        
        const gy =
          -getLum(-1, -1) - 2 * getLum(0, -1) - getLum(1, -1) +
          getLum(-1, 1) + 2 * getLum(0, 1) + getLum(1, 1);
        
        // Gradient magnitude
        this.edgeMap[idx] = Math.sqrt(gx * gx + gy * gy) / (8 * 255);
      }
    }
  }
  
  /**
   * Sample with adaptive quality
   */
  sampleColor(
    imageData: ImageData,
    x: number,
    y: number
  ): THREE.Color {
    if (!this.edgeMap) {
      this.analyzeImage(imageData);
    }
    
    const { width, height } = imageData;
    const edgeStrength = this.getEdgeStrength(x, y, width, height);
    
    // Choose sampling strategy based on edge strength
    if (edgeStrength > this.options.edgeThreshold && this.options.useBicubicForDetails) {
      // High detail area - use bicubic
      return this.bicubicSampler.sampleColor(imageData, x, y);
    } else if (edgeStrength > this.options.edgeThreshold / 2) {
      // Medium detail - use bilinear
      return this.bilinearSampler.sampleColor(imageData, x, y);
    } else {
      // Low detail - use simple sampling
      return this.bilinearSampler.sampleColor(imageData, x, y);
    }
  }
  
  /**
   * Sample with adaptive super-sampling
   */
  sampleAdaptiveSuperSample(
    imageData: ImageData,
    x: number,
    y: number
  ): THREE.Color {
    if (!this.edgeMap) {
      this.analyzeImage(imageData);
    }
    
    const { width, height } = imageData;
    const edgeStrength = this.getEdgeStrength(x, y, width, height);
    
    // Determine sample count based on edge strength
    const sampleCount = Math.floor(
      this.options.minSamples + 
      (this.options.maxSamples - this.options.minSamples) * edgeStrength
    );
    
    if (sampleCount <= 1) {
      return this.bilinearSampler.sampleColor(imageData, x, y);
    }
    
    // Super-sample with adaptive grid
    let r = 0, g = 0, b = 0;
    const step = 1 / sampleCount;
    
    for (let sy = 0; sy < sampleCount; sy++) {
      for (let sx = 0; sx < sampleCount; sx++) {
        const offsetX = (sx + 0.5) * step - 0.5;
        const offsetY = (sy + 0.5) * step - 0.5;
        
        const color = this.bilinearSampler.sampleColor(
          imageData,
          x + offsetX,
          y + offsetY
        );
        
        r += color.r;
        g += color.g;
        b += color.b;
      }
    }
    
    const totalSamples = sampleCount * sampleCount;
    return new THREE.Color(r / totalSamples, g / totalSamples, b / totalSamples);
  }
  
  /**
   * Sample depth with adaptive quality
   */
  sampleDepth(
    depthMap: Float32Array,
    x: number,
    y: number,
    width: number,
    height: number
  ): number {
    if (!this.edgeMap) {
      // No edge map - use bilinear
      return this.bilinearSampler.sampleDepth(depthMap, x, y, width, height);
    }
    
    const edgeStrength = this.getEdgeStrength(x, y, width, height);
    
    if (edgeStrength > this.options.edgeThreshold && this.options.useBicubicForDetails) {
      return this.bicubicSampler.sampleDepth(depthMap, x, y, width, height);
    } else {
      return this.bilinearSampler.sampleDepth(depthMap, x, y, width, height);
    }
  }
  
  /**
   * Get edge strength at position
   */
  private getEdgeStrength(x: number, y: number, width: number, height: number): number {
    if (!this.edgeMap) return 0;
    
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    
    if (ix < 0 || ix >= width || iy < 0 || iy >= height) {
      return 0;
    }
    
    return this.edgeMap[iy * width + ix];
  }
  
  /**
   * Get sample count for position
   */
  getSampleCount(x: number, y: number, width: number, height: number): number {
    const edgeStrength = this.getEdgeStrength(x, y, width, height);
    
    return Math.floor(
      this.options.minSamples + 
      (this.options.maxSamples - this.options.minSamples) * edgeStrength
    );
  }
  
  /**
   * Get edge map (for debugging/visualization)
   */
  getEdgeMap(): Float32Array | null {
    return this.edgeMap;
  }
  
  /**
   * Clear edge map (force re-analysis)
   */
  clearEdgeMap(): void {
    this.edgeMap = null;
  }
}
