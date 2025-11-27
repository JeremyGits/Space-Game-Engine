/**
 * Dynamic LOD Strategy
 * 
 * Dynamically adjusts LOD based on runtime conditions.
 * Performance-aware and adaptive.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Current FPS */
  fps: number;
  
  /** Frame time (ms) */
  frameTime: number;
  
  /** GPU memory usage */
  gpuMemory: number;
  
  /** Voxel count */
  voxelCount: number;
}

/**
 * Dynamic LOD strategy
 */
export class DynamicLOD {
  private targetFPS: number = 60;
  private lodBias: number = 0; // -3 to +3
  private performanceHistory: number[] = [];
  
  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS;
  }
  
  /**
   * Calculate dynamic LOD
   */
  calculate(
    voxel: Voxel,
    baseLevel: number,
    metrics: PerformanceMetrics
  ): { level: number; bias: number } {
    // Update LOD bias based on performance
    this.updateBias(metrics);
    
    // Apply bias to base level
    const level = Math.max(0, Math.min(7, baseLevel + this.lodBias));
    
    return { level, bias: this.lodBias };
  }
  
  /**
   * Update LOD bias based on performance
   */
  private updateBias(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics.fps);
    
    if (this.performanceHistory.length > 60) {
      this.performanceHistory.shift();
    }
    
    // Calculate average FPS
    const avgFPS = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
    
    // Adjust bias
    if (avgFPS < this.targetFPS * 0.9) {
      // Performance too low - increase LOD (lower detail)
      this.lodBias = Math.min(3, this.lodBias + 0.1);
    } else if (avgFPS > this.targetFPS * 1.05) {
      // Performance headroom - decrease LOD (higher detail)
      this.lodBias = Math.max(-3, this.lodBias - 0.05);
    }
  }
  
  /**
   * Get current bias
   */
  getBias(): number {
    return this.lodBias;
  }
  
  /**
   * Set bias manually
   */
  setBias(bias: number): void {
    this.lodBias = Math.max(-3, Math.min(3, bias));
  }
  
  /**
   * Reset bias
   */
  resetBias(): void {
    this.lodBias = 0;
    this.performanceHistory = [];
  }
}
