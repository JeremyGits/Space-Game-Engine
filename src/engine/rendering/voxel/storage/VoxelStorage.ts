/**
 * Voxel Storage Interface
 * 
 * Abstract interface for voxel storage backends.
 * Allows different storage strategies (sparse, compressed, streaming, etc.)
 */

import { Voxel } from '../core/Voxel';
import { SparseVoxelOctree } from '../core/SparseVoxelOctree';

/**
 * Storage statistics
 */
export interface StorageStats {
  /** Total voxels stored */
  voxelCount: number;
  
  /** Memory usage in bytes */
  memoryUsage: number;
  
  /** Compression ratio (if applicable) */
  compressionRatio?: number;
  
  /** Storage efficiency (voxels per MB) */
  efficiency: number;
  
  /** Read operations per second */
  readOps?: number;
  
  /** Write operations per second */
  writeOps?: number;
}

/**
 * Storage capabilities
 */
export interface StorageCapabilities {
  /** Supports compression */
  supportsCompression: boolean;
  
  /** Supports streaming */
  supportsStreaming: boolean;
  
  /** Supports caching */
  supportsCaching: boolean;
  
  /** Supports persistence */
  supportsPersistence: boolean;
  
  /** Maximum voxels supported */
  maxVoxels: number;
}

/**
 * Abstract voxel storage interface
 */
export abstract class VoxelStorage {
  protected voxelCount: number = 0;
  protected memoryUsage: number = 0;
  
  /**
   * Store a voxel
   */
  abstract set(x: number, y: number, z: number, voxel: Voxel): Promise<void>;
  
  /**
   * Retrieve a voxel
   */
  abstract get(x: number, y: number, z: number): Promise<Voxel | null>;
  
  /**
   * Check if voxel exists
   */
  abstract has(x: number, y: number, z: number): Promise<boolean>;
  
  /**
   * Remove a voxel
   */
  abstract delete(x: number, y: number, z: number): Promise<boolean>;
  
  /**
   * Store multiple voxels (batch operation)
   */
  abstract setMany(voxels: Voxel[]): Promise<number>;
  
  /**
   * Retrieve multiple voxels
   */
  abstract getMany(coordinates: Array<[number, number, number]>): Promise<Voxel[]>;
  
  /**
   * Get all voxels
   */
  abstract getAll(): Promise<Voxel[]>;
  
  /**
   * Clear all voxels
   */
  abstract clear(): Promise<void>;
  
  /**
   * Get storage statistics
   */
  abstract getStats(): StorageStats;
  
  /**
   * Get storage capabilities
   */
  abstract getCapabilities(): StorageCapabilities;
  
  /**
   * Optimize storage
   */
  abstract optimize(): Promise<void>;
  
  /**
   * Serialize to octree
   */
  abstract toOctree(): Promise<SparseVoxelOctree>;
  
  /**
   * Load from octree
   */
  abstract fromOctree(octree: SparseVoxelOctree): Promise<void>;
  
  /**
   * Export to JSON
   */
  abstract toJSON(): Promise<any>;
  
  /**
   * Import from JSON
   */
  abstract fromJSON(data: any): Promise<void>;
  
  /**
   * Get voxel count
   */
  getVoxelCount(): number {
    return this.voxelCount;
  }
  
  /**
   * Get memory usage
   */
  getMemoryUsage(): number {
    return this.memoryUsage;
  }
  
  /**
   * Calculate storage efficiency (voxels per MB)
   */
  getEfficiency(): number {
    if (this.memoryUsage === 0) return 0;
    return this.voxelCount / (this.memoryUsage / 1024 / 1024);
  }
}

/**
 * Storage factory for creating storage instances
 */
export class StorageFactory {
  /**
   * Create storage instance based on type
   */
  static create(type: 'sparse' | 'compressed' | 'streaming', options?: any): VoxelStorage {
    // Will be implemented when concrete storage classes are available
    throw new Error(`Storage type '${type}' not yet implemented`);
  }
}
