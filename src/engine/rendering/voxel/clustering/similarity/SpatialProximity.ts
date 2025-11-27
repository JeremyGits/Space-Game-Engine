/**
 * Spatial Proximity
 * 
 * Calculates similarity based on spatial distance.
 * Uses various distance metrics.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';
import { SimilarityMetric, SimilarityResult, SimilarityMetricConfig } from './SimilarityMetric';

/**
 * Spatial proximity configuration
 */
export interface SpatialProximityConfig extends SimilarityMetricConfig {
  /** Distance metric */
  distanceMetric?: 'euclidean' | 'manhattan' | 'chebyshev';
  
  /** Maximum distance */
  maxDistance?: number;
  
  /** Distance falloff curve */
  falloff?: 'linear' | 'quadratic' | 'inverse';
}

/**
 * Spatial proximity metric
 */
export class SpatialProximity extends SimilarityMetric {
  private spatialConfig: Required<Omit<SpatialProximityConfig, 'enableCaching' | 'cacheSize' | 'normalization'>>;
  
  constructor(config: SpatialProximityConfig = {}) {
    super({
      enableCaching: config.enableCaching,
      cacheSize: config.cacheSize,
      normalization: config.normalization
    });
    
    this.spatialConfig = {
      distanceMetric: config.distanceMetric ?? 'euclidean',
      maxDistance: config.maxDistance ?? 10.0,
      falloff: config.falloff ?? 'linear'
    };
  }
  
  /**
   * Calculate spatial similarity
   */
  protected calculateSimilarity(voxelA: Voxel, voxelB: Voxel): SimilarityResult {
    const distance = this.calculateDistance(voxelA.position, voxelB.position);
    const score = this.applyFalloff(distance);
    
    return {
      score,
      distance,
      components: {
        spatial: score
      }
    };
  }
  
  /**
   * Calculate distance
   */
  private calculateDistance(posA: THREE.Vector3, posB: THREE.Vector3): number {
    switch (this.spatialConfig.distanceMetric) {
      case 'euclidean':
        return posA.distanceTo(posB);
      
      case 'manhattan':
        return Math.abs(posA.x - posB.x) + 
               Math.abs(posA.y - posB.y) + 
               Math.abs(posA.z - posB.z);
      
      case 'chebyshev':
        return Math.max(
          Math.abs(posA.x - posB.x),
          Math.abs(posA.y - posB.y),
          Math.abs(posA.z - posB.z)
        );
      
      default:
        return posA.distanceTo(posB);
    }
  }
  
  /**
   * Apply distance falloff
   */
  private applyFalloff(distance: number): number {
    const normalized = distance / this.spatialConfig.maxDistance;
    
    switch (this.spatialConfig.falloff) {
      case 'linear':
        return Math.max(0, 1 - normalized);
      
      case 'quadratic':
        return Math.max(0, 1 - normalized * normalized);
      
      case 'inverse':
        return 1 / (1 + normalized);
      
      default:
        return Math.max(0, 1 - normalized);
    }
  }
}
