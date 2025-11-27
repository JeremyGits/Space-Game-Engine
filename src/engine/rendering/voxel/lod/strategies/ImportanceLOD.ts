/**
 * Importance LOD Strategy
 * 
 * LOD based on visual importance.
 * Prioritizes important voxels.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * Importance LOD strategy
 */
export class ImportanceLOD {
  /**
   * Calculate LOD based on importance
   */
  calculate(voxel: Voxel, baseLevel: number): { level: number; importance: number } {
    // Get voxel importance (0-1)
    const importance = (voxel as any).importance || 0.5;
    
    // Adjust LOD based on importance
    // High importance = lower LOD number (more detail)
    const adjustment = Math.floor((1 - importance) * 3);
    const level = Math.max(0, Math.min(7, baseLevel + adjustment));
    
    return { level, importance };
  }
  
  /**
   * Calculate importance from factors
   */
  calculateImportance(voxel: Voxel, factors: {
    centerDistance?: number;
    colorUniqueness?: number;
    edgeProximity?: number;
    userDefined?: number;
  }): number {
    let importance = 0;
    let weightSum = 0;
    
    // Center distance (closer to center = more important)
    if (factors.centerDistance !== undefined) {
      const weight = 0.3;
      importance += (1 - factors.centerDistance) * weight;
      weightSum += weight;
    }
    
    // Color uniqueness (unique colors = more important)
    if (factors.colorUniqueness !== undefined) {
      const weight = 0.2;
      importance += factors.colorUniqueness * weight;
      weightSum += weight;
    }
    
    // Edge proximity (edges = more important)
    if (factors.edgeProximity !== undefined) {
      const weight = 0.3;
      importance += factors.edgeProximity * weight;
      weightSum += weight;
    }
    
    // User-defined importance
    if (factors.userDefined !== undefined) {
      const weight = 0.2;
      importance += factors.userDefined * weight;
      weightSum += weight;
    }
    
    return weightSum > 0 ? importance / weightSum : 0.5;
  }
}
