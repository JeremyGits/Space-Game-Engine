/**
 * Similarity Metric
 * 
 * Base class for voxel similarity calculations.
 * Used for clustering and grouping decisions.
 * 
 * Features:
 * - Normalized similarity (0-1)
 * - Configurable weights
 * - Caching support
 * - Performance optimization
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * Similarity result
 */
export interface SimilarityResult {
  /** Similarity score (0-1, where 1 = identical) */
  score: number;
  
  /** Component scores */
  components?: {
    color?: number;
    spatial?: number;
    material?: number;
  };
  
  /** Distance (inverse of similarity) */
  distance: number;
}

/**
 * Similarity metric configuration
 */
export interface SimilarityMetricConfig {
  /** Enable caching */
  enableCaching?: boolean;
  
  /** Cache size */
  cacheSize?: number;
  
  /** Normalization method */
  normalization?: 'linear' | 'exponential' | 'sigmoid';
}

/**
 * Base similarity metric class
 */
export abstract class SimilarityMetric {
  protected config: Required<SimilarityMetricConfig>;
  protected cache: Map<string, SimilarityResult>;
  
  constructor(config: SimilarityMetricConfig = {}) {
    this.config = {
      enableCaching: config.enableCaching ?? true,
      cacheSize: config.cacheSize ?? 1000,
      normalization: config.normalization ?? 'linear'
    };
    
    this.cache = new Map();
  }
  
  /**
   * Calculate similarity between two voxels
   */
  calculate(voxelA: Voxel, voxelB: Voxel): SimilarityResult {
    // Check cache
    if (this.config.enableCaching) {
      const cacheKey = this.getCacheKey(voxelA, voxelB);
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }
    
    // Calculate similarity
    const result = this.calculateSimilarity(voxelA, voxelB);
    
    // Normalize
    result.score = this.normalize(result.score);
    
    // Cache result
    if (this.config.enableCaching) {
      this.cacheResult(voxelA, voxelB, result);
    }
    
    return result;
  }
  
  /**
   * Calculate raw similarity (to be implemented by subclasses)
   */
  protected abstract calculateSimilarity(voxelA: Voxel, voxelB: Voxel): SimilarityResult;
  
  /**
   * Normalize similarity score
   */
  protected normalize(score: number): number {
    switch (this.config.normalization) {
      case 'linear':
        return Math.max(0, Math.min(1, score));
      
      case 'exponential':
        return 1 - Math.exp(-score);
      
      case 'sigmoid':
        return 1 / (1 + Math.exp(-score * 6 + 3));
      
      default:
        return Math.max(0, Math.min(1, score));
    }
  }
  
  /**
   * Get cache key for voxel pair
   */
  protected getCacheKey(voxelA: Voxel, voxelB: Voxel): string {
    // Use position as unique identifier
    const keyA = `${voxelA.position.x},${voxelA.position.y},${voxelA.position.z}`;
    const keyB = `${voxelB.position.x},${voxelB.position.y},${voxelB.position.z}`;
    
    // Ensure consistent ordering
    return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
  }
  
  /**
   * Cache result
   */
  protected cacheResult(voxelA: Voxel, voxelB: Voxel, result: SimilarityResult): void {
    if (this.cache.size >= this.config.cacheSize) {
      // Remove oldest entry (simple FIFO)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    const key = this.getCacheKey(voxelA, voxelB);
    this.cache.set(key, result);
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.cacheSize,
      hitRate: 0 // Would need hit/miss tracking
    };
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<SimilarityMetricConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): SimilarityMetricConfig {
    return { ...this.config };
  }
}
