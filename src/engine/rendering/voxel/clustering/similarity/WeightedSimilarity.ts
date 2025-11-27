/**
 * Weighted Similarity
 * 
 * Combines multiple similarity metrics with configurable weights.
 * Provides flexible similarity calculation.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';
import { SimilarityMetric, SimilarityResult, SimilarityMetricConfig } from './SimilarityMetric';
import { ColorSimilarity } from './ColorSimilarity';
import { SpatialProximity } from './SpatialProximity';
import { MaterialSimilarity } from './MaterialSimilarity';

/**
 * Weighted similarity configuration
 */
export interface WeightedSimilarityConfig extends SimilarityMetricConfig {
  /** Weight for color similarity */
  colorWeight?: number;
  
  /** Weight for spatial proximity */
  spatialWeight?: number;
  
  /** Weight for material similarity */
  materialWeight?: number;
  
  /** Color similarity config */
  colorConfig?: any;
  
  /** Spatial proximity config */
  spatialConfig?: any;
  
  /** Material similarity config */
  materialConfig?: any;
}

/**
 * Weighted similarity metric
 */
export class WeightedSimilarity extends SimilarityMetric {
  private weightedConfig: Required<Omit<WeightedSimilarityConfig, 'enableCaching' | 'cacheSize' | 'normalization' | 'colorConfig' | 'spatialConfig' | 'materialConfig'>>;
  private colorMetric: ColorSimilarity;
  private spatialMetric: SpatialProximity;
  private materialMetric: MaterialSimilarity;
  
  constructor(config: WeightedSimilarityConfig = {}) {
    super({
      enableCaching: config.enableCaching,
      cacheSize: config.cacheSize,
      normalization: config.normalization
    });
    
    this.weightedConfig = {
      colorWeight: config.colorWeight ?? 0.5,
      spatialWeight: config.spatialWeight ?? 0.3,
      materialWeight: config.materialWeight ?? 0.2
    };
    
    // Normalize weights
    const totalWeight = 
      this.weightedConfig.colorWeight +
      this.weightedConfig.spatialWeight +
      this.weightedConfig.materialWeight;
    
    if (totalWeight > 0) {
      this.weightedConfig.colorWeight /= totalWeight;
      this.weightedConfig.spatialWeight /= totalWeight;
      this.weightedConfig.materialWeight /= totalWeight;
    }
    
    // Initialize sub-metrics
    this.colorMetric = new ColorSimilarity(config.colorConfig);
    this.spatialMetric = new SpatialProximity(config.spatialConfig);
    this.materialMetric = new MaterialSimilarity(config.materialConfig);
  }
  
  /**
   * Calculate weighted similarity
   */
  protected calculateSimilarity(voxelA: Voxel, voxelB: Voxel): SimilarityResult {
    // Calculate component similarities
    const colorResult = this.colorMetric.calculate(voxelA, voxelB);
    const spatialResult = this.spatialMetric.calculate(voxelA, voxelB);
    const materialResult = this.materialMetric.calculate(voxelA, voxelB);
    
    // Weighted combination
    const score =
      colorResult.score * this.weightedConfig.colorWeight +
      spatialResult.score * this.weightedConfig.spatialWeight +
      materialResult.score * this.weightedConfig.materialWeight;
    
    // Weighted distance
    const distance =
      colorResult.distance * this.weightedConfig.colorWeight +
      spatialResult.distance * this.weightedConfig.spatialWeight +
      materialResult.distance * this.weightedConfig.materialWeight;
    
    return {
      score,
      distance,
      components: {
        color: colorResult.score,
        spatial: spatialResult.score,
        material: materialResult.score
      }
    };
  }
  
  /**
   * Update weights
   */
  updateWeights(weights: {
    color?: number;
    spatial?: number;
    material?: number;
  }): void {
    if (weights.color !== undefined) {
      this.weightedConfig.colorWeight = weights.color;
    }
    if (weights.spatial !== undefined) {
      this.weightedConfig.spatialWeight = weights.spatial;
    }
    if (weights.material !== undefined) {
      this.weightedConfig.materialWeight = weights.material;
    }
    
    // Normalize
    const total =
      this.weightedConfig.colorWeight +
      this.weightedConfig.spatialWeight +
      this.weightedConfig.materialWeight;
    
    if (total > 0) {
      this.weightedConfig.colorWeight /= total;
      this.weightedConfig.spatialWeight /= total;
      this.weightedConfig.materialWeight /= total;
    }
  }
  
  /**
   * Get current weights
   */
  getWeights(): { color: number; spatial: number; material: number } {
    return {
      color: this.weightedConfig.colorWeight,
      spatial: this.weightedConfig.spatialWeight,
      material: this.weightedConfig.materialWeight
    };
  }
}
