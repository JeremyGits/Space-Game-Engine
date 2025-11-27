/**
 * Distance LOD Strategy
 * 
 * Classic distance-based LOD selection.
 * Simple and efficient.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * Distance LOD configuration
 */
export interface DistanceLODConfig {
  /** LOD distances */
  distances: number[];
  
  /** Enable smooth transitions */
  smoothTransitions: boolean;
  
  /** Transition zone size */
  transitionZone: number;
}

/**
 * Distance LOD strategy
 */
export class DistanceLOD {
  private config: DistanceLODConfig;
  
  constructor(config: Partial<DistanceLODConfig> = {}) {
    this.config = {
      distances: config.distances ?? [10, 20, 40, 80, 160, 320, 640, 1280],
      smoothTransitions: config.smoothTransitions ?? true,
      transitionZone: config.transitionZone ?? 0.2
    };
  }
  
  /**
   * Calculate LOD for voxel
   */
  calculate(voxel: Voxel, cameraPosition: THREE.Vector3): { level: number; blend: number } {
    const distance = voxel.position.distanceTo(cameraPosition);
    
    // Find appropriate LOD level
    let level = this.config.distances.length - 1;
    let blend = 0;
    
    for (let i = 0; i < this.config.distances.length; i++) {
      if (distance < this.config.distances[i]) {
        level = i;
        
        // Calculate blend factor for smooth transitions
        if (this.config.smoothTransitions && i < this.config.distances.length - 1) {
          const currentDist = i > 0 ? this.config.distances[i - 1] : 0;
          const nextDist = this.config.distances[i];
          const range = nextDist - currentDist;
          const transitionStart = nextDist - (range * this.config.transitionZone);
          
          if (distance > transitionStart) {
            blend = (distance - transitionStart) / (range * this.config.transitionZone);
          }
        }
        
        break;
      }
    }
    
    return { level, blend };
  }
  
  /**
   * Get LOD distances
   */
  getDistances(): number[] {
    return [...this.config.distances];
  }
  
  /**
   * Set LOD distances
   */
  setDistances(distances: number[]): void {
    this.config.distances = [...distances];
  }
}
