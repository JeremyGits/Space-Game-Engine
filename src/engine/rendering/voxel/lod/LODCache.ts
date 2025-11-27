/**
 * LOD Cache
 * 
 * Caches LOD calculations to avoid redundant computation.
 * Improves performance for static or slow-moving voxels.
 */

import { Voxel } from '../core/Voxel';
import { LODCalculationResult } from './LODCalculator';

/**
 * Cache entry
 */
interface CacheEntry {
  /** Cached LOD result */
  result: LODCalculationResult;
  
  /** Timestamp */
  timestamp: number;
  
  /** Hit count */
  hits: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total entries */
  entries: number;
  
  /** Cache hits */
  hits: number;
  
  /** Cache misses */
  misses: number;
  
  /** Hit rate */
  hitRate: number;
  
  /** Memory usage (bytes) */
  memoryUsage: number;
}

/**
 * LOD cache
 */
export class LODCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private ttl: number; // Time to live (ms)
  private hits: number = 0;
  private misses: number = 0;
  
  constructor(maxSize: number = 10000, ttl: number = 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  
  /**
   * Get cached LOD
   */
  get(voxelId: string): LODCalculationResult | null {
    const entry = this.cache.get(voxelId);
    
    if (!entry) {
      this.misses++;
      return null;
    }
    
    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(voxelId);
      this.misses++;
      return null;
    }
    
    // Cache hit
    entry.hits++;
    this.hits++;
    return entry.result;
  }
  
  /**
   * Set cached LOD
   */
  set(voxelId: string, result: LODCalculationResult): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(voxelId, {
      result,
      timestamp: Date.now(),
      hits: 0
    });
  }
  
  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    let lowestHits = Infinity;
    
    for (const [key, entry] of this.cache) {
      // Prioritize by hits, then by age
      if (entry.hits < lowestHits || 
          (entry.hits === lowestHits && entry.timestamp < oldestTime)) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        lowestHits = entry.hits;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clear all
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
  
  /**
   * Get statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;
    
    // Estimate memory usage
    const entrySize = 100; // Approximate bytes per entry
    const memoryUsage = this.cache.size * entrySize;
    
    return {
      entries: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      memoryUsage
    };
  }
  
  /**
   * Invalidate voxel
   */
  invalidate(voxelId: string): void {
    this.cache.delete(voxelId);
  }
  
  /**
   * Invalidate multiple voxels
   */
  invalidateMultiple(voxelIds: string[]): void {
    for (const id of voxelIds) {
      this.cache.delete(id);
    }
  }
}
