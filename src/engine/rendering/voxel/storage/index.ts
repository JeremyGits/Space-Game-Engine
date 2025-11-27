/**
 * Voxel Storage - Export Module
 * 
 * Storage backends for voxel data with different trade-offs.
 */

// Base storage interface
export { VoxelStorage, StorageFactory } from './VoxelStorage';
export type { StorageStats, StorageCapabilities } from './VoxelStorage';

// Sparse storage (hash map)
export { SparseStorage } from './SparseStorage';

// Compressed storage (RLE + palettes)
export { CompressedStorage } from './CompressedStorage';

// Streaming storage (chunk-based)
export { StreamingStorage } from './StreamingStorage';
export type { StreamingConfig } from './StreamingStorage';

// Cache manager
export { CacheManager } from './CacheManager';
export type { CacheStats } from './CacheManager';
