/**
 * Material Similarity
 * 
 * Calculates similarity based on material properties.
 * Compares metalness, roughness, and other PBR properties.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';
import { SimilarityMetric, SimilarityResult, SimilarityMetricConfig } from './SimilarityMetric';

/**
 * Material similarity configuration
 */
export interface MaterialSimilarityConfig extends SimilarityMetricConfig {
  /** Weight for metalness */
  metalnessWeight?: number;
  
  /** Weight for roughness */
  roughnessWeight?: number;
  
  /** Weight for emissive */
  emissiveWeight?: number;
}

/**
 * Material similarity metric
 */
export class MaterialSimilarity extends SimilarityMetric {
  private materialConfig: Required<Omit<MaterialSimilarityConfig, 'enableCaching' | 'cacheSize' | 'normalization'>>;
  
  constructor(config: MaterialSimilarityConfig = {}) {
    super({
      enableCaching: config.enableCaching,
      cacheSize: config.cacheSize,
      normalization: config.normalization
    });
    
    this.materialConfig = {
      metalnessWeight: config.metalnessWeight ?? 0.4,
      roughnessWeight: config.roughnessWeight ?? 0.4,
      emissiveWeight: config.emissiveWeight ?? 0.2
    };
  }
  
  /**
   * Calculate material similarity
   */
  protected calculateSimilarity(voxelA: Voxel, voxelB: Voxel): SimilarityResult {
    // Get material properties (default to 0 if not set)
    const metalnessA = voxelA.material?.metalness ?? 0;
    const metalnessB = voxelB.material?.metalness ?? 0;
    const roughnessA = voxelA.material?.roughness ?? 0.5;
    const roughnessB = voxelB.material?.roughness ?? 0.5;
    const emissiveA = voxelA.material?.emissive ?? 0;
    const emissiveB = voxelB.material?.emissive ?? 0;
    
    // Calculate component similarities
    const metalnessSim = 1 - Math.abs(metalnessA - metalnessB);
    const roughnessSim = 1 - Math.abs(roughnessA - roughnessB);
    const emissiveSim = 1 - Math.abs(emissiveA - emissiveB);
    
    // Weighted combination
    const score =
      metalnessSim * this.materialConfig.metalnessWeight +
      roughnessSim * this.materialConfig.roughnessWeight +
      emissiveSim * this.materialConfig.emissiveWeight;
    
    // Calculate distance (inverse of similarity)
    const distance = 1 - score;
    
    return {
      score,
      distance,
      components: {
        material: score
      }
    };
  }
}
