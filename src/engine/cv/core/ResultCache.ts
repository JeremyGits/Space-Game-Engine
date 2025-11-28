/**
 * Result Cache
 * Caches CV processing results for performance optimization
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  hits: number;
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
}

export interface CacheOptions {
  maxEntries?: number;
  maxSize?: number; // in bytes
  ttl?: number; // time to live in ms
  evictionPolicy?: 'LRU' | 'LFU' | 'FIFO';
}

/**
 * Result Cache - LRU cache for CV results
 */
export class ResultCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private options: Required<CacheOptions>;
  private stats: CacheStats;
  private accessOrder: string[]; // For LRU
  
  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.options = {
      maxEntries: options.maxEntries || 100,
      maxSize: options.maxSize || 50 * 1024 * 1024, // 50MB default
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      evictionPolicy: options.evictionPolicy || 'LRU',
    };
    
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
    };
    
    this.accessOrder = [];
  }
  
  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // Update access
    entry.hits++;
    this.updateAccessOrder(key);
    
    this.stats.hits++;
    this.updateHitRate();
    
    return entry.value;
  }
  
  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    // Estimate size (rough approximation)
    const size = this.estimateSize(value);
    
    // Check if we need to evict
    while (this.shouldEvict(size)) {
      this.evictOne();
    }
    
    // Create entry
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      hits: 0,
      size,
    };
    
    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.stats.totalSize -= oldEntry.size;
    }
    
    // Add new entry
    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize += size;
  }
  
  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    this.cache.delete(key);
    this.stats.totalSize -= entry.size;
    this.stats.totalEntries = this.cache.size;
    
    // Remove from access order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    
    return true;
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats.totalEntries = 0;
    this.stats.totalSize = 0;
    console.log('🗑️ Result cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    const age = Date.now() - entry.timestamp;
    return age > this.options.ttl;
  }
  
  /**
   * Check if we should evict
   */
  private shouldEvict(newEntrySize: number): boolean {
    return (
      this.cache.size >= this.options.maxEntries ||
      this.stats.totalSize + newEntrySize > this.options.maxSize
    );
  }
  
  /**
   * Evict one entry based on policy
   */
  private evictOne(): void {
    if (this.cache.size === 0) return;
    
    let keyToEvict: string | null = null;
    
    switch (this.options.evictionPolicy) {
      case 'LRU':
        // Least Recently Used - first in access order
        keyToEvict = this.accessOrder[0];
        break;
        
      case 'LFU':
        // Least Frequently Used - lowest hit count
        let minHits = Infinity;
        for (const [key, entry] of this.cache) {
          if (entry.hits < minHits) {
            minHits = entry.hits;
            keyToEvict = key;
          }
        }
        break;
        
      case 'FIFO':
        // First In First Out - oldest timestamp
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache) {
          if (entry.timestamp < oldestTime) {
            oldestTime = entry.timestamp;
            keyToEvict = key;
          }
        }
        break;
    }
    
    if (keyToEvict) {
      this.delete(keyToEvict);
      this.stats.evictions++;
    }
  }
  
  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    // Remove from current position
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }
  
  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
  
  /**
   * Estimate size of value (rough approximation)
   */
  private estimateSize(value: T): number {
    try {
      // Try to serialize and measure
      const json = JSON.stringify(value);
      return json.length * 2; // UTF-16 characters = 2 bytes each
    } catch {
      // Fallback to rough estimate
      return 1024; // 1KB default
    }
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let removed = 0;
    
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`🗑️ Cleaned up ${removed} expired cache entries`);
    }
    
    return removed;
  }
  
  /**
   * Get cache efficiency metrics
   */
  getEfficiency(): {
    hitRate: number;
    avgHitsPerEntry: number;
    memoryUsage: number;
    memoryUsagePercent: number;
  } {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }
    
    return {
      hitRate: this.stats.hitRate,
      avgHitsPerEntry: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      memoryUsage: this.stats.totalSize,
      memoryUsagePercent: (this.stats.totalSize / this.options.maxSize) * 100,
    };
  }
}

// Global cache instances for different result types
const caches = {
  detection: new ResultCache({ maxEntries: 50, ttl: 10 * 60 * 1000 }),
  segmentation: new ResultCache({ maxEntries: 30, ttl: 10 * 60 * 1000 }),
  classification: new ResultCache({ maxEntries: 100, ttl: 15 * 60 * 1000 }),
  features: new ResultCache({ maxEntries: 50, ttl: 10 * 60 * 1000 }),
};

/**
 * Get cache for specific result type
 */
export function getResultCache(type: 'detection' | 'segmentation' | 'classification' | 'features'): ResultCache {
  return caches[type];
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  Object.values(caches).forEach(cache => cache.clear());
  console.log('🗑️ All CV result caches cleared');
}

/**
 * Get combined cache stats
 */
export function getAllCacheStats(): Record<string, CacheStats> {
  return {
    detection: caches.detection.getStats(),
    segmentation: caches.segmentation.getStats(),
    classification: caches.classification.getStats(),
    features: caches.features.getStats(),
  };
}

/**
 * Cleanup all caches
 */
export function cleanupAllCaches(): number {
  let total = 0;
  Object.values(caches).forEach(cache => {
    total += cache.cleanup();
  });
  return total;
}
