/**
 * Resource Management Type Definitions
 * 
 * Types for managing game resources including assets, textures,
 * models, audio, and other loadable content.
 */

/**
 * Resource type enumeration
 */
export enum ResourceType {
  TEXTURE = 'texture',
  MODEL = 'model',
  AUDIO = 'audio',
  SHADER = 'shader',
  FONT = 'font',
  JSON = 'json',
  BINARY = 'binary',
  TEXT = 'text'
}

/**
 * Resource loading state
 */
export enum ResourceState {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}

/**
 * Resource priority
 */
export enum ResourcePriority {
  CRITICAL = 0,    // Must load before game starts
  HIGH = 1,        // Load early
  MEDIUM = 2,      // Load during gameplay
  LOW = 3          // Load when idle
}

/**
 * Resource metadata
 */
export interface ResourceMetadata {
  id: string;
  type: ResourceType;
  url: string;
  size?: number;
  priority: ResourcePriority;
  tags: string[];
  dependencies: string[];
  metadata?: Record<string, any>;
}

/**
 * Resource entry
 */
export interface ResourceEntry<T = any> {
  id: string;
  type: ResourceType;
  url: string;
  data: T | null;
  state: ResourceState;
  priority: ResourcePriority;
  loadTime: number;
  size: number;
  error?: Error;
  refCount: number;
  lastAccessed: number;
  tags: Set<string>;
  dependencies: string[];
}

/**
 * Resource load options
 */
export interface ResourceLoadOptions {
  priority?: ResourcePriority;
  cache?: boolean;
  timeout?: number;
  retryCount?: number;
  onProgress?: (progress: number) => void;
}

/**
 * Resource load result
 */
export interface ResourceLoadResult<T = any> {
  success: boolean;
  data: T | null;
  loadTime: number;
  size: number;
  error?: Error;
}

/**
 * Resource manager configuration
 */
export interface ResourceManagerConfig {
  maxCacheSize?: number;        // Maximum cache size in bytes
  maxConcurrentLoads?: number;  // Maximum concurrent loads
  enableCaching?: boolean;       // Enable resource caching
  enableCompression?: boolean;   // Enable compression
  preloadCritical?: boolean;     // Preload critical resources
}

/**
 * Resource manager interface
 */
export interface IResourceManager {
  // Loading
  load<T>(id: string, url: string, type: ResourceType, options?: ResourceLoadOptions): Promise<T>;
  loadBatch(resources: ResourceMetadata[]): Promise<Map<string, any>>;
  preload(ids: string[]): Promise<void>;
  
  // Access
  get<T>(id: string): T | null;
  has(id: string): boolean;
  getState(id: string): ResourceState;
  
  // Management
  unload(id: string): void;
  unloadBatch(ids: string[]): void;
  unloadByTag(tag: string): void;
  clear(): void;
  
  // Cache management
  getCacheSize(): number;
  getCacheUsage(): number;
  evictLRU(count: number): void;
  
  // Statistics
  getStats(): ResourceStats;
}

/**
 * Resource statistics
 */
export interface ResourceStats {
  totalResources: number;
  loadedResources: number;
  loadingResources: number;
  failedResources: number;
  cacheSize: number;
  cacheUsage: number;
  totalLoadTime: number;
  averageLoadTime: number;
  resourcesByType: Map<ResourceType, number>;
}

/**
 * Resource events
 */
export enum ResourceEventType {
  LOAD_START = 'resource:load:start',
  LOAD_PROGRESS = 'resource:load:progress',
  LOAD_COMPLETE = 'resource:load:complete',
  LOAD_ERROR = 'resource:load:error',
  UNLOAD = 'resource:unload',
  CACHE_FULL = 'resource:cache:full',
  CACHE_EVICT = 'resource:cache:evict'
}

/**
 * Resource event data
 */
export interface ResourceEvent {
  id: string;
  type: ResourceType;
  state: ResourceState;
  progress?: number;
  error?: Error;
  timestamp: number;
}

/**
 * Asset loader interface
 */
export interface IAssetLoader<T = any> {
  load(url: string, options?: any): Promise<T>;
  supports(type: ResourceType): boolean;
}
