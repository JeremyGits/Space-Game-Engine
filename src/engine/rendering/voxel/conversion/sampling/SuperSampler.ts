/**
 * Super Sampler
 * 
 * Multi-sample anti-aliasing (MSAA) for voxel conversion.
 * Reduces aliasing artifacts by sampling multiple points per pixel.
 * 
 * Patterns:
 * - Grid: Regular grid sampling
 * - Rotated Grid: Diagonal grid
 * - Jittered: Random offsets
 * - Poisson Disk: Blue noise distribution
 */

import * as THREE from 'three';
import { BilinearSampler } from './BilinearSampler';

/**
 * Super-sampling pattern
 */
export enum SuperSamplePattern {
  GRID = 'grid',
  ROTATED_GRID = 'rotated_grid',
  JITTERED = 'jittered',
  POISSON_DISK = 'poisson_disk'
}

/**
 * Super sampler options
 */
export interface SuperSamplerOptions {
  /** Number of samples (1, 2, 4, 8, 16) */
  sampleCount?: number;
  
  /** Sampling pattern */
  pattern?: SuperSamplePattern;
  
  /** Jitter amount (0-1) for jittered pattern */
  jitterAmount?: number;
}

/**
 * Super sampler class
 */
export class SuperSampler {
  private options: Required<SuperSamplerOptions>;
  private bilinearSampler: BilinearSampler;
  private sampleOffsets: [number, number][] = [];
  
  constructor(options: SuperSamplerOptions = {}) {
    this.options = {
      sampleCount: options.sampleCount ?? 4,
      pattern: options.pattern ?? SuperSamplePattern.ROTATED_GRID,
      jitterAmount: options.jitterAmount ?? 0.5
    };
    
    this.bilinearSampler = new BilinearSampler();
    this.generateSampleOffsets();
  }
  
  /**
   * Sample color with super-sampling
   */
  sampleColor(
    imageData: ImageData,
    x: number,
    y: number
  ): THREE.Color {
    let r = 0, g = 0, b = 0;
    
    // Sample at each offset
    for (const [dx, dy] of this.sampleOffsets) {
      const color = this.bilinearSampler.sampleColor(imageData, x + dx, y + dy);
      r += color.r;
      g += color.g;
      b += color.b;
    }
    
    // Average
    const count = this.sampleOffsets.length;
    return new THREE.Color(r / count, g / count, b / count);
  }
  
  /**
   * Sample depth with super-sampling
   */
  sampleDepth(
    depthMap: Float32Array,
    x: number,
    y: number,
    width: number,
    height: number
  ): number {
    let sum = 0;
    
    for (const [dx, dy] of this.sampleOffsets) {
      sum += this.bilinearSampler.sampleDepth(depthMap, x + dx, y + dy, width, height);
    }
    
    return sum / this.sampleOffsets.length;
  }
  
  /**
   * Sample normalized coordinates
   */
  sampleNormalized(
    imageData: ImageData,
    u: number,
    v: number
  ): THREE.Color {
    const x = u * (imageData.width - 1);
    const y = v * (imageData.height - 1);
    return this.sampleColor(imageData, x, y);
  }
  
  /**
   * Generate sample offsets based on pattern
   */
  private generateSampleOffsets(): void {
    switch (this.options.pattern) {
      case SuperSamplePattern.GRID:
        this.generateGridPattern();
        break;
      
      case SuperSamplePattern.ROTATED_GRID:
        this.generateRotatedGridPattern();
        break;
      
      case SuperSamplePattern.JITTERED:
        this.generateJitteredPattern();
        break;
      
      case SuperSamplePattern.POISSON_DISK:
        this.generatePoissonDiskPattern();
        break;
    }
  }
  
  /**
   * Regular grid pattern
   */
  private generateGridPattern(): void {
    const n = Math.sqrt(this.options.sampleCount);
    const step = 1 / n;
    
    this.sampleOffsets = [];
    
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        this.sampleOffsets.push([
          (x + 0.5) * step - 0.5,
          (y + 0.5) * step - 0.5
        ]);
      }
    }
  }
  
  /**
   * Rotated grid pattern (better for diagonal edges)
   */
  private generateRotatedGridPattern(): void {
    const n = Math.sqrt(this.options.sampleCount);
    const step = 1 / n;
    const angle = Math.PI / 4; // 45 degrees
    
    this.sampleOffsets = [];
    
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const px = (x + 0.5) * step - 0.5;
        const py = (y + 0.5) * step - 0.5;
        
        // Rotate
        const rx = px * Math.cos(angle) - py * Math.sin(angle);
        const ry = px * Math.sin(angle) + py * Math.cos(angle);
        
        this.sampleOffsets.push([rx, ry]);
      }
    }
  }
  
  /**
   * Jittered pattern (random offsets)
   */
  private generateJitteredPattern(): void {
    const n = Math.sqrt(this.options.sampleCount);
    const step = 1 / n;
    const jitter = this.options.jitterAmount * step;
    
    this.sampleOffsets = [];
    
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const px = (x + 0.5) * step - 0.5;
        const py = (y + 0.5) * step - 0.5;
        
        // Add jitter
        const jx = (Math.random() - 0.5) * jitter;
        const jy = (Math.random() - 0.5) * jitter;
        
        this.sampleOffsets.push([px + jx, py + jy]);
      }
    }
  }
  
  /**
   * Poisson disk pattern (blue noise, best quality)
   */
  private generatePoissonDiskPattern(): void {
    // Pre-computed Poisson disk samples for common counts
    const poissonSamples: { [key: number]: [number, number][] } = {
      4: [
        [-0.25, -0.25],
        [0.25, -0.25],
        [-0.25, 0.25],
        [0.25, 0.25]
      ],
      8: [
        [-0.375, -0.125],
        [-0.125, -0.375],
        [0.125, -0.375],
        [0.375, -0.125],
        [-0.375, 0.125],
        [-0.125, 0.375],
        [0.125, 0.375],
        [0.375, 0.125]
      ],
      16: [
        [-0.4375, -0.3125], [-0.3125, -0.4375], [-0.1875, -0.4375], [-0.0625, -0.3125],
        [0.0625, -0.4375], [0.1875, -0.3125], [0.3125, -0.4375], [0.4375, -0.3125],
        [-0.4375, -0.0625], [-0.3125, -0.1875], [-0.1875, -0.0625], [-0.0625, -0.1875],
        [0.0625, -0.1875], [0.1875, -0.0625], [0.3125, -0.1875], [0.4375, -0.0625]
      ]
    };
    
    this.sampleOffsets = poissonSamples[this.options.sampleCount] || poissonSamples[4];
  }
  
  /**
   * Get sample offsets (for debugging)
   */
  getSampleOffsets(): [number, number][] {
    return this.sampleOffsets;
  }
  
  /**
   * Get effective sample count
   */
  getSampleCount(): number {
    return this.sampleOffsets.length;
  }
}
