/**
 * Color Similarity
 * 
 * Calculates similarity based on color distance.
 * Supports multiple color spaces and perceptual weighting.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';
import { SimilarityMetric, SimilarityResult } from './SimilarityMetric';

/**
 * Color similarity configuration
 */
export interface ColorSimilarityConfig {
  /** Color space */
  colorSpace?: 'rgb' | 'hsv' | 'lab';
  
  /** Use perceptual weighting */
  perceptual?: boolean;
  
  /** Maximum color distance */
  maxDistance?: number;
  
  /** Enable caching */
  enableCaching?: boolean;
  
  /** Cache size */
  cacheSize?: number;
  
  /** Normalization method */
  normalization?: 'linear' | 'exponential' | 'sigmoid';
}

/**
 * Color similarity metric
 */
export class ColorSimilarity extends SimilarityMetric {
  private colorConfig: Required<Omit<ColorSimilarityConfig, 'enableCaching' | 'cacheSize' | 'normalization'>>;
  
  constructor(config: ColorSimilarityConfig = {}) {
    super({
      enableCaching: config.enableCaching,
      cacheSize: config.cacheSize,
      normalization: config.normalization
    });
    
    this.colorConfig = {
      colorSpace: config.colorSpace ?? 'rgb',
      perceptual: config.perceptual ?? true,
      maxDistance: config.maxDistance ?? Math.sqrt(3)
    };
  }
  
  /**
   * Calculate color similarity
   */
  protected calculateSimilarity(voxelA: Voxel, voxelB: Voxel): SimilarityResult {
    const distance = this.calculateColorDistance(voxelA.color, voxelB.color);
    const score = 1 - (distance / this.colorConfig.maxDistance);
    
    return {
      score,
      distance,
      components: {
        color: score
      }
    };
  }
  
  /**
   * Calculate color distance
   */
  private calculateColorDistance(colorA: THREE.Color, colorB: THREE.Color): number {
    switch (this.colorConfig.colorSpace) {
      case 'rgb':
        return this.rgbDistance(colorA, colorB);
      case 'hsv':
        return this.hsvDistance(colorA, colorB);
      case 'lab':
        return this.labDistance(colorA, colorB);
      default:
        return this.rgbDistance(colorA, colorB);
    }
  }
  
  /**
   * RGB distance
   */
  private rgbDistance(colorA: THREE.Color, colorB: THREE.Color): number {
    const dr = colorA.r - colorB.r;
    const dg = colorA.g - colorB.g;
    const db = colorA.b - colorB.b;
    
    if (this.colorConfig.perceptual) {
      // Perceptual weighting
      return Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);
    } else {
      return Math.sqrt(dr * dr + dg * dg + db * db);
    }
  }
  
  /**
   * HSV distance
   */
  private hsvDistance(colorA: THREE.Color, colorB: THREE.Color): number {
    const hsvA = this.rgbToHsv(colorA);
    const hsvB = this.rgbToHsv(colorB);
    
    let dh = Math.abs(hsvA.h - hsvB.h);
    if (dh > 0.5) dh = 1 - dh;
    
    const ds = hsvA.s - hsvB.s;
    const dv = hsvA.v - hsvB.v;
    
    return Math.sqrt(dh * dh + ds * ds + dv * dv);
  }
  
  /**
   * LAB distance
   */
  private labDistance(colorA: THREE.Color, colorB: THREE.Color): number {
    const labA = this.rgbToLab(colorA);
    const labB = this.rgbToLab(colorB);
    
    const dL = labA.L - labB.L;
    const da = labA.a - labB.a;
    const db = labA.b - labB.b;
    
    return Math.sqrt(dL * dL + da * da + db * db) / 100;
  }
  
  /**
   * Convert RGB to HSV
   */
  private rgbToHsv(color: THREE.Color): { h: number; s: number; v: number } {
    const max = Math.max(color.r, color.g, color.b);
    const min = Math.min(color.r, color.g, color.b);
    const delta = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : delta / max;
    const v = max;
    
    if (delta !== 0) {
      if (max === color.r) {
        h = ((color.g - color.b) / delta + (color.g < color.b ? 6 : 0)) / 6;
      } else if (max === color.g) {
        h = ((color.b - color.r) / delta + 2) / 6;
      } else {
        h = ((color.r - color.g) / delta + 4) / 6;
      }
    }
    
    return { h, s, v };
  }
  
  /**
   * Convert RGB to LAB
   */
  private rgbToLab(color: THREE.Color): { L: number; a: number; b: number } {
    const L = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    const a = (color.r - color.g) * 0.5;
    const b = (color.r + color.g - 2 * color.b) * 0.25;
    
    return { L: L * 100, a: a * 100, b: b * 100 };
  }
}
