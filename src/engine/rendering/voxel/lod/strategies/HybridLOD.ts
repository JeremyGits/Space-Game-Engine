/**
 * Hybrid LOD Strategy
 * 
 * Combines multiple LOD strategies for optimal results.
 * Best of all worlds!
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';
import { DistanceLOD } from './DistanceLOD';
import { ScreenSpaceLOD } from './ScreenSpaceLOD';
import { ImportanceLOD } from './ImportanceLOD';

/**
 * Hybrid LOD configuration
 */
export interface HybridLODConfig {
  /** Distance weight (0-1) */
  distanceWeight: number;
  
  /** Screen space weight (0-1) */
  screenSpaceWeight: number;
  
  /** Importance weight (0-1) */
  importanceWeight: number;
}

/**
 * Hybrid LOD strategy
 */
export class HybridLOD {
  private distanceLOD: DistanceLOD;
  private screenSpaceLOD: ScreenSpaceLOD;
  private importanceLOD: ImportanceLOD;
  private config: HybridLODConfig;
  
  constructor(config: Partial<HybridLODConfig> = {}) {
    this.distanceLOD = new DistanceLOD();
    this.screenSpaceLOD = new ScreenSpaceLOD();
    this.importanceLOD = new ImportanceLOD();
    
    this.config = {
      distanceWeight: config.distanceWeight ?? 0.4,
      screenSpaceWeight: config.screenSpaceWeight ?? 0.4,
      importanceWeight: config.importanceWeight ?? 0.2
    };
    
    // Normalize weights
    this.normalizeWeights();
  }
  
  /**
   * Normalize weights to sum to 1
   */
  private normalizeWeights(): void {
    const sum = this.config.distanceWeight + 
                this.config.screenSpaceWeight + 
                this.config.importanceWeight;
    
    if (sum > 0) {
      this.config.distanceWeight /= sum;
      this.config.screenSpaceWeight /= sum;
      this.config.importanceWeight /= sum;
    }
  }
  
  /**
   * Calculate hybrid LOD
   */
  calculate(voxel: Voxel, camera: THREE.PerspectiveCamera): { level: number; blend: number } {
    // Get LOD from each strategy
    const distanceResult = this.distanceLOD.calculate(voxel, camera.position);
    const screenResult = this.screenSpaceLOD.calculate(voxel, camera);
    const importanceResult = this.importanceLOD.calculate(voxel, distanceResult.level);
    
    // Weighted average
    const weightedLevel = 
      distanceResult.level * this.config.distanceWeight +
      screenResult.level * this.config.screenSpaceWeight +
      importanceResult.level * this.config.importanceWeight;
    
    // Round to nearest level
    const level = Math.round(weightedLevel);
    
    // Use distance blend factor
    const blend = distanceResult.blend;
    
    return { level: Math.max(0, Math.min(7, level)), blend };
  }
  
  /**
   * Update weights
   */
  updateWeights(weights: Partial<HybridLODConfig>): void {
    this.config = { ...this.config, ...weights };
    this.normalizeWeights();
  }
  
  /**
   * Get weights
   */
  getWeights(): HybridLODConfig {
    return { ...this.config };
  }
}
