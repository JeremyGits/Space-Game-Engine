/**
 * ResourceManager
 * 
 * Manages loading, caching, and lifecycle of game resources.
 * Supports multiple resource types with priority-based loading.
 */

import { EventEmitter } from './EventEmitter';
import {
  IResourceManager,
  ResourceType,
  ResourceState,
  ResourcePriority,
  ResourceEntry,
  ResourceMetadata,
  ResourceLoadOptions,
  
  ResourceManagerConfig,
  ResourceStats,
  ResourceEventType
} from '../../types/engine/ResourceTypes';

export class ResourceManager implements IResourceManager {
  private eventEmitter: EventEmitter;
  private config: ResourceManagerConfig;
  
  // Resource storage
  private resources: Map<string, ResourceEntry> = new Map();
  
  // Loading queue
  private loadQueue: Array<{
    id: string;
    url: string;
    type: ResourceType;
    _options: ResourceLoadOptions;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];
  
  private activeLoads: number = 0;
  private maxConcurrentLoads: number = 6;
  
  // Cache management
  private cacheSize: number = 0;
  private maxCacheSize: number = 512 * 1024 * 1024; // 512 MB
  
  // Statistics
  private totalLoadTime: number = 0;
  private loadCount: number = 0;

  constructor(eventEmitter: EventEmitter, config: ResourceManagerConfig = {}) {
    this.eventEmitter = eventEmitter;
    this.config = {
      maxCacheSize: 512 * 1024 * 1024,
      maxConcurrentLoads: 6,
      enableCaching: true,
      enableCompression: false,
      preloadCritical: true,
      ...config
    };
    
    this.maxConcurrentLoads = this.config.maxConcurrentLoads!;
    this.maxCacheSize = this.config.maxCacheSize!;
  }

  /**
   * Load a resource
   */
  async load<T>(
    id: string,
    url: string,
    type: ResourceType,
    _options: ResourceLoadOptions = {}
  ): Promise<T> {
    // Check if already loaded
    if (this.resources.has(id)) {
      const entry = this.resources.get(id)!;
      
      if (entry.state === ResourceState.LOADED) {
        entry.refCount++;
        entry.lastAccessed = Date.now();
        return entry.data as T;
      }
      
      if (entry.state === ResourceState.LOADING) {
        // Wait for existing load
        return new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            const currentEntry = this.resources.get(id);
            if (currentEntry?.state === ResourceState.LOADED) {
              clearInterval(checkInterval);
              resolve(currentEntry.data as T);
            } else if (currentEntry?.state === ResourceState.ERROR) {
              clearInterval(checkInterval);
              reject(currentEntry.error);
            }
          }, 100);
        });
      }
    }

    // Create resource entry
    const entry: ResourceEntry<T> = {
      id,
      type,
      url,
      data: null,
      state: ResourceState.LOADING,
      priority: _options.priority || ResourcePriority.MEDIUM,
      loadTime: 0,
      size: 0,
      refCount: 1,
      lastAccessed: Date.now(),
      tags: new Set(),
      dependencies: []
    };
    
    this.resources.set(id, entry);

    // Emit load start event
    this.eventEmitter.emit(ResourceEventType.LOAD_START, {
      id,
      type,
      state: ResourceState.LOADING,
      timestamp: Date.now()
    });

    // Queue or load immediately
    if (this.activeLoads >= this.maxConcurrentLoads) {
      return new Promise((resolve, reject) => {
        this.loadQueue.push({ id, url, type, _options, resolve, reject });
        this.sortQueue();
      });
    }

    return this.performLoad<T>(id, url, type, _options);
  }

  /**
   * Perform the actual load
   */
  private async performLoad<T>(
    id: string,
    url: string,
    type: ResourceType,
    _options: ResourceLoadOptions
  ): Promise<T> {
    this.activeLoads++;
    const startTime = performance.now();
    const entry = this.resources.get(id)!;

    try {
      // Load based on type
      let data: T;
      
      switch (type) {
        case ResourceType.TEXTURE:
          data = await this.loadTexture(url) as T;
          break;
        case ResourceType.MODEL:
          data = await this.loadModel(url) as T;
          break;
        case ResourceType.AUDIO:
          data = await this.loadAudio(url) as T;
          break;
        case ResourceType.JSON:
          data = await this.loadJSON(url) as T;
          break;
        case ResourceType.TEXT:
          data = await this.loadText(url) as T;
          break;
        case ResourceType.BINARY:
          data = await this.loadBinary(url) as T;
          break;
        default:
          throw new Error(`Unsupported resource type: ${type}`);
      }

      // Calculate size (approximate)
      const size = this.estimateSize(data);
      const loadTime = performance.now() - startTime;

      // Update entry
      entry.data = data;
      entry.state = ResourceState.LOADED;
      entry.loadTime = loadTime;
      entry.size = size;

      // Update cache
      if (this.config.enableCaching) {
        this.cacheSize += size;
        this.checkCacheSize();
      }

      // Update statistics
      this.totalLoadTime += loadTime;
      this.loadCount++;

      // Emit load complete event
      this.eventEmitter.emit(ResourceEventType.LOAD_COMPLETE, {
        id,
        type,
        state: ResourceState.LOADED,
        timestamp: Date.now()
      });

      console.log(`[ResourceManager] Loaded ${id} (${type}) in ${loadTime.toFixed(2)}ms`);

      this.activeLoads--;
      this.processQueue();

      return data;
    } catch (error) {
      entry.state = ResourceState.ERROR;
      entry.error = error as Error;

      // Emit error event
      this.eventEmitter.emit(ResourceEventType.LOAD_ERROR, {
        id,
        type,
        state: ResourceState.ERROR,
        error: error as Error,
        timestamp: Date.now()
      });

      console.error(`[ResourceManager] Failed to load ${id}:`, error);

      this.activeLoads--;
      this.processQueue();

      throw error;
    }
  }

  /**
   * Load batch of resources
   */
  async loadBatch(resources: ResourceMetadata[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    
    // Sort by priority
    const sorted = [...resources].sort((a, b) => a.priority - b.priority);
    
    // Load all resources
    const promises = sorted.map(async (resource) => {
      try {
        const data = await this.load(
          resource.id,
          resource.url,
          resource.type,
          { priority: resource.priority }
        );
        results.set(resource.id, data);
      } catch (error) {
        console.error(`[ResourceManager] Failed to load ${resource.id}:`, error);
      }
    });
    
    await Promise.all(promises);
    return results;
  }

  /**
   * Preload resources
   */
  async preload(ids: string[]): Promise<void> {
    const promises = ids.map(id => {
      const entry = this.resources.get(id);
      if (entry && entry.state === ResourceState.UNLOADED) {
        return this.load(id, entry.url, entry.type);
      }
      return Promise.resolve();
    });
    
    await Promise.all(promises);
  }

  /**
   * Get a resource
   */
  get<T>(id: string): T | null {
    const entry = this.resources.get(id);
    if (entry && entry.state === ResourceState.LOADED) {
      entry.refCount++;
      entry.lastAccessed = Date.now();
      return entry.data as T;
    }
    return null;
  }

  /**
   * Check if resource exists
   */
  has(id: string): boolean {
    return this.resources.has(id);
  }

  /**
   * Get resource state
   */
  getState(id: string): ResourceState {
    const entry = this.resources.get(id);
    return entry ? entry.state : ResourceState.UNLOADED;
  }

  /**
   * Unload a resource
   */
  unload(id: string): void {
    const entry = this.resources.get(id);
    if (!entry) return;

    entry.refCount--;
    
    if (entry.refCount <= 0) {
      this.cacheSize -= entry.size;
      this.resources.delete(id);
      
      this.eventEmitter.emit(ResourceEventType.UNLOAD, {
        id,
        type: entry.type,
        state: ResourceState.UNLOADED,
        timestamp: Date.now()
      });
      
      console.log(`[ResourceManager] Unloaded ${id}`);
    }
  }

  /**
   * Unload batch of resources
   */
  unloadBatch(ids: string[]): void {
    ids.forEach(id => this.unload(id));
  }

  /**
   * Unload resources by tag
   */
  unloadByTag(tag: string): void {
    const toUnload: string[] = [];
    
    this.resources.forEach((entry, id) => {
      if (entry.tags.has(tag)) {
        toUnload.push(id);
      }
    });
    
    this.unloadBatch(toUnload);
  }

  /**
   * Clear all resources
   */
  clear(): void {
    this.resources.clear();
    this.loadQueue = [];
    this.cacheSize = 0;
    this.activeLoads = 0;
    console.log('[ResourceManager] Cleared all resources');
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cacheSize;
  }

  /**
   * Get cache usage percentage
   */
  getCacheUsage(): number {
    return (this.cacheSize / this.maxCacheSize) * 100;
  }

  /**
   * Evict least recently used resources
   */
  evictLRU(count: number): void {
    const entries = Array.from(this.resources.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.unload(entries[i][0]);
    }
  }

  /**
   * Get statistics
   */
  getStats(): ResourceStats {
    const resourcesByType = new Map<ResourceType, number>();
    let loadedCount = 0;
    let loadingCount = 0;
    let failedCount = 0;
    
    this.resources.forEach(entry => {
      const count = resourcesByType.get(entry.type) || 0;
      resourcesByType.set(entry.type, count + 1);
      
      if (entry.state === ResourceState.LOADED) loadedCount++;
      else if (entry.state === ResourceState.LOADING) loadingCount++;
      else if (entry.state === ResourceState.ERROR) failedCount++;
    });
    
    return {
      totalResources: this.resources.size,
      loadedResources: loadedCount,
      loadingResources: loadingCount,
      failedResources: failedCount,
      cacheSize: this.cacheSize,
      cacheUsage: this.getCacheUsage(),
      totalLoadTime: this.totalLoadTime,
      averageLoadTime: this.loadCount > 0 ? this.totalLoadTime / this.loadCount : 0,
      resourcesByType
    };
  }

  /**
   * Process load queue
   */
  private processQueue(): void {
    while (this.activeLoads < this.maxConcurrentLoads && this.loadQueue.length > 0) {
      const item = this.loadQueue.shift()!;
      this.performLoad(item.id, item.url, item.type, item._options)
        .then(item.resolve)
        .catch(item.reject);
    }
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    this.loadQueue.sort((a, b) => {
      const priorityA = a._options.priority || ResourcePriority.MEDIUM;
      const priorityB = b._options.priority || ResourcePriority.MEDIUM;
      return priorityA - priorityB;
    });
  }

  /**
   * Check cache size and evict if necessary
   */
  private checkCacheSize(): void {
    if (this.cacheSize > this.maxCacheSize) {
      const toEvict = Math.ceil(this.resources.size * 0.1); // Evict 10%
      this.evictLRU(toEvict);
      
      this.eventEmitter.emit(ResourceEventType.CACHE_FULL, {
        id: '',
        type: ResourceType.BINARY,
        state: ResourceState.LOADED,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Estimate resource size
   */
  private estimateSize(data: any): number {
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }
    if (typeof data === 'string') {
      return data.length * 2; // Approximate UTF-16
    }
    if (data instanceof HTMLImageElement) {
      return (data.width * data.height * 4); // RGBA
    }
    // Default estimate
    return JSON.stringify(data).length * 2;
  }

  // Resource loaders

  private async loadTexture(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
      img.src = url;
    });
  }

  private async loadModel(url: string): Promise<any> {
    // Model loading would integrate with Three.js loaders
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load model: ${url}`);
    return response.json();
  }

  private async loadAudio(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load audio: ${url}`);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new AudioContext();
    return audioContext.decodeAudioData(arrayBuffer);
  }

  private async loadJSON(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load JSON: ${url}`);
    return response.json();
  }

  private async loadText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load text: ${url}`);
    return response.text();
  }

  private async loadBinary(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load binary: ${url}`);
    return response.arrayBuffer();
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `ResourceManager | Total: ${stats.totalResources}, Loaded: ${stats.loadedResources}, Loading: ${stats.loadingResources}, Cache: ${(stats.cacheUsage).toFixed(1)}%`;
  }
}
