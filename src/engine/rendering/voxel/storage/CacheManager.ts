/**
 * Cache Manager
 * 
 * Intelligent caching system for voxel data.
 * Implements LRU (Least Recently Used) eviction policy.
 * 
 * Features:
 * - LRU cache eviction
 * - Configurable cache size
 * - Hit/miss statistics
 * - Automatic eviction
 */

import { Voxel, VoxelUtils } from '../core/Voxel';

/**
 * Cache entry
 */
interface CacheEntry {
  voxel: Voxel;
  lastAccess: number;
  accessCount: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total cache hits */
  hits: number;
  
  /** Total cache misses */
  misses: number;
  
  /** Hit rate (0-1) */
  hitRate: number;
  
  /** Current cache size */
  size: number;
  
  /** Maximum cache size */
  maxSize: number;
  
  /** Memory usage */
  memoryUsage: number;
  
  /** Eviction count */
  evictions: number;
}

/**
 * Cache manager class
 */
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;
  
  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
    console.log(`[CacheManager] Initialized with max size: ${maxSize}`);
  }
  
  /**
   * Get voxel from cache
   */
  get(x: number, y: number, z: number): Voxel | null {
    const key = VoxelUtils.getVoxelKey(x, y, z);
    const entry = this.cache.get(key);
    
    if (entry) {
      // Cache hit
      entry.lastAccess = Date.now();
      entry.accessCount++;
      this.hits++;
      return entry.voxel;
    }
    
    // Cache miss
    this.misses++;
    return null;
  }
  
  /**
   * Put voxel in cache
   */
  set(x: number, y: number, z: number, voxel: Voxel): void {
    const key = VoxelUtils.getVoxelKey(x, y, z);
    
    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    // Add to cache
    this.cache.set(key, {
      voxel,
      lastAccess: Date.now(),
      accessCount: 1
    });
  }
  
  /**
   * Check if voxel is cached
   */
  has(x: number, y: number, z: number): boolean {
    const key = VoxelUtils.getVoxelKey(x, y, z);
    return this.cache.has(key);
  }
  
  /**
   * Remove voxel from cache
   */
  delete(x: number, y: number, z: number): boolean {
    const key = VoxelUtils.getVoxelKey(x, y, z);
    return this.cache.delete(key);
  }
  
  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }
  
  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictions++;
    }
  }
  
  /**
   * Evict entries not accessed recently
   */
  evictOld(maxAge: number = 60000): number {
    const now = Date.now();
    const toEvict: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.lastAccess > maxAge) {
        toEvict.push(key);
      }
    }
    
    for (const key of toEvict) {
      this.cache.delete(key);
      this.evictions++;
    }
    
    return toEvict.length;
  }
  
  /**
   * Prefetch voxels (add to cache)
   */
  prefetch(voxels: Voxel[]): number {
    let count = 0;
    
    for (const voxel of voxels) {
      const x = Math.floor(voxel.position.x);
      const y = Math.floor(voxel.position.y);
      const z = Math.floor(voxel.position.z);
      
      if (!this.has(x, y, z)) {
        this.set(x, y, z, voxel);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;
    
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += entry.voxel.getMemorySize() + 32; // +32 for entry overhead
    }
    
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsage,
      evictions: this.evictions
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }
  
  /**
   * Set maximum cache size
   */
  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    
    // Evict if over new limit
    while (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }
  
  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }
  
  /**
   * Get max cache size
   */
  getMaxSize(): number {
    return this.maxSize;
  }
  
  /**
   * Get all cached voxels
   */
  getAllCached(): Voxel[] {
    return Array.from(this.cache.values()).map(entry => entry.voxel);
  }
  
  /**
   * Get most frequently accessed voxels
   */
  getMostAccessed(count: number = 10): Voxel[] {
    const entries = Array.from(this.cache.values());
    entries.sort((a, b) => b.accessCount - a.accessCount);
    return entries.slice(0, count).map(e => e.voxel);
  }
  
  /**
   * Log cache status
   */
  logStatus(): void {
    const stats = this.getStats();
    console.log(`
=== CACHE MANAGER STATUS ===
Size: ${stats.size} / ${stats.maxSize}
Hits: ${stats.hits}
Misses: ${stats.misses}
Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%
Memory: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB
Evictions: ${stats.evictions}
============================
    `.trim());
  }
}
