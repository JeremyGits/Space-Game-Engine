/**
 * Shader Cache
 * 
 * Caches compiled shaders for performance
 */

import { Shader } from './Shader';
import { shaderCompiler } from './ShaderCompiler';

/**
 * Cached shader entry
 */
interface CachedShader {
  shader: Shader;
  hash: string;
  lastUsed: number;
  useCount: number;
}

/**
 * Shader cache configuration
 */
export interface ShaderCacheConfig {
  maxSize?: number;
  maxAge?: number; // milliseconds
  enableLRU?: boolean;
}

/**
 * Shader cache class
 */
export class ShaderCache {
  private cache: Map<string, CachedShader> = new Map();
  private config: Required<ShaderCacheConfig>;
  
  // Statistics
  private hits: number = 0;
  private misses: number = 0;
  
  /**
   * Create shader cache
   */
  constructor(config: ShaderCacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize ?? 100,
      maxAge: config.maxAge ?? 5 * 60 * 1000, // 5 minutes
      enableLRU: config.enableLRU ?? true
    };
  }
  
  /**
   * Get shader from cache
   */
  get(key: string): Shader | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.remove(key);
      this.misses++;
      return null;
    }
    
    // Update usage
    entry.lastUsed = Date.now();
    entry.useCount++;
    
    this.hits++;
    return entry.shader;
  }
  
  /**
   * Set shader in cache
   */
  set(key: string, shader: Shader, source: string): void {
    // Check cache size
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }
    
    // Generate hash
    const hash = shaderCompiler.hash(source);
    
    // Add to cache
    this.cache.set(key, {
      shader,
      hash,
      lastUsed: Date.now(),
      useCount: 1
    });
  }
  
  /**
   * Check if shader exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    
    if (this.isExpired(entry)) {
      this.remove(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Remove shader from cache
   */
  remove(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    
    entry.shader.dispose();
    this.cache.delete(key);
    
    return true;
  }
  
  /**
   * Check if entry is expired
   */
  private isExpired(entry: CachedShader): boolean {
    const age = Date.now() - entry.lastUsed;
    return age > this.config.maxAge;
  }
  
  /**
   * Evict least recently used entry
   */
  private evict(): void {
    if (!this.config.enableLRU) {
      // Remove first entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.remove(firstKey);
      }
      return;
    }
    
    // Find least recently used
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.remove(oldestKey);
    }
  }
  
  /**
   * Clear expired entries
   */
  clearExpired(): number {
    let cleared = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.remove(key);
        cleared++;
      }
    }
    
    return cleared;
  }
  
  /**
   * Clear all entries
   */
  clear(): void {
    for (const entry of this.cache.values()) {
      entry.shader.dispose();
    }
    
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
  
  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
    entries: Array<{
      key: string;
      hash: string;
      lastUsed: number;
      useCount: number;
      age: number;
    }>;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;
    
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hash: entry.hash,
      lastUsed: entry.lastUsed,
      useCount: entry.useCount,
      age: Date.now() - entry.lastUsed
    }));
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      entries
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }
  
  /**
   * Get most used shaders
   */
  getMostUsed(count: number = 10): Array<{ key: string; useCount: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, useCount: entry.useCount }))
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, count);
  }
  
  /**
   * Get least used shaders
   */
  getLeastUsed(count: number = 10): Array<{ key: string; useCount: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, useCount: entry.useCount }))
      .sort((a, b) => a.useCount - b.useCount)
      .slice(0, count);
  }
  
  /**
   * Optimize cache
   */
  optimize(): {
    removed: number;
    kept: number;
  } {
    const before = this.cache.size;
    
    // Remove expired entries
    this.clearExpired();
    
    // Remove least used if over 80% capacity
    const threshold = this.config.maxSize * 0.8;
    if (this.cache.size > threshold) {
      const toRemove = Math.floor(this.cache.size * 0.2);
      const leastUsed = this.getLeastUsed(toRemove);
      
      for (const { key } of leastUsed) {
        this.remove(key);
      }
    }
    
    const after = this.cache.size;
    
    return {
      removed: before - after,
      kept: after
    };
  }
}

/**
 * Global shader cache instance
 */
export const shaderCache = new ShaderCache();
