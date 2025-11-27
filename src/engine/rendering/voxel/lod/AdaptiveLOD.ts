/**
 * Adaptive LOD
 * 
 * Dynamically adjusts LOD based on performance and visual importance.
 * Maintains target frame rate while maximizing visual quality.
 */

import * as THREE from 'three';
import { Voxel } from '../core/Voxel';

/**
 * Adaptive LOD configuration
 */
export interface AdaptiveLODConfig {
  /** Target frame rate */
  targetFPS: number;
  
  /** Minimum LOD level */
  minLOD: number;
  
  /** Maximum LOD level */
  maxLOD: number;
  
  /** Adaptation speed (0-1) */
  adaptationSpeed: number;
  
  /** Performance budget (ms) */
  performanceBudget: number;
}

/**
 * LOD adjustment
 */
export interface LODAdjustment {
  /** Previous LOD */
  previousLOD: number;
  
  /** New LOD */
  newLOD: number;
  
  /** Reason for adjustment */
  reason: 'performance' | 'quality' | 'distance' | 'importance';
  
  /** Frame time */
  frameTime: number;
}

/**
 * Adaptive LOD manager
 */
export class AdaptiveLOD {
  private config: AdaptiveLODConfig;
  private currentLOD: number;
  private frameTimeHistory: number[] = [];
  private maxHistorySize: number = 60; // 1 second at 60 FPS
  private adjustments: LODAdjustment[] = [];
  
  constructor(config: Partial<AdaptiveLODConfig> = {}) {
    this.config = {
      targetFPS: config.targetFPS ?? 60,
      minLOD: config.minLOD ?? 0,
      maxLOD: config.maxLOD ?? 7,
      adaptationSpeed: config.adaptationSpeed ?? 0.1,
      performanceBudget: config.performanceBudget ?? 16.67 // 60 FPS
    };
    
    this.currentLOD = Math.floor((this.config.minLOD + this.config.maxLOD) / 2);
  }
  
  /**
   * Update adaptive LOD
   */
  update(frameTime: number, voxels: Voxel[], camera: THREE.Camera): number {
    // Record frame time
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.maxHistorySize) {
      this.frameTimeHistory.shift();
    }
    
    // Calculate average frame time
    const avgFrameTime = this.getAverageFrameTime();
    
    // Determine if adjustment needed
    const previousLOD = this.currentLOD;
    
    if (avgFrameTime > this.config.performanceBudget) {
      // Performance too low - increase LOD (lower detail)
      this.currentLOD = Math.min(
        this.config.maxLOD,
        this.currentLOD + Math.ceil(this.config.adaptationSpeed * 2)
      );
      
      this.recordAdjustment(previousLOD, this.currentLOD, 'performance', avgFrameTime);
    } else if (avgFrameTime < this.config.performanceBudget * 0.7) {
      // Performance headroom - decrease LOD (higher detail)
      this.currentLOD = Math.max(
        this.config.minLOD,
        this.currentLOD - Math.ceil(this.config.adaptationSpeed)
      );
      
      this.recordAdjustment(previousLOD, this.currentLOD, 'quality', avgFrameTime);
    }
    
    return this.currentLOD;
  }
  
  /**
   * Get average frame time
   */
  private getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 0;
    
    const sum = this.frameTimeHistory.reduce((acc, time) => acc + time, 0);
    return sum / this.frameTimeHistory.length;
  }
  
  /**
   * Record LOD adjustment
   */
  private recordAdjustment(
    previousLOD: number,
    newLOD: number,
    reason: LODAdjustment['reason'],
    frameTime: number
  ): void {
    if (previousLOD !== newLOD) {
      this.adjustments.push({
        previousLOD,
        newLOD,
        reason,
        frameTime
      });
      
      // Limit history
      if (this.adjustments.length > 100) {
        this.adjustments.shift();
      }
    }
  }
  
  /**
   * Get current LOD
   */
  getCurrentLOD(): number {
    return this.currentLOD;
  }
  
  /**
   * Get adjustment history
   */
  getAdjustments(): LODAdjustment[] {
    return [...this.adjustments];
  }
  
  /**
   * Get statistics
   */
  getStats(): {
    currentLOD: number;
    avgFrameTime: number;
    targetFrameTime: number;
    adjustmentCount: number;
  } {
    return {
      currentLOD: this.currentLOD,
      avgFrameTime: this.getAverageFrameTime(),
      targetFrameTime: this.config.performanceBudget,
      adjustmentCount: this.adjustments.length
    };
  }
  
  /**
   * Reset
   */
  reset(): void {
    this.currentLOD = Math.floor((this.config.minLOD + this.config.maxLOD) / 2);
    this.frameTimeHistory = [];
    this.adjustments = [];
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<AdaptiveLODConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
