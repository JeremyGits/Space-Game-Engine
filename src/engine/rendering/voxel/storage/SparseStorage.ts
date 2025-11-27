/**
 * Sparse Storage
 * 
 * Hash map-based sparse storage for voxels.
 * Optimized for datasets with low occupancy (< 30%).
 * 
 * Features:
 * - O(1) lookup, insert, delete
 * - Only stores occupied voxels
 * - 90%+ memory savings vs dense storage
 * - Fast batch operations
 */

import * as THREE from 'three';
import { Voxel, VoxelUtils } from '../core/Voxel';
import { SparseVoxelOctree } from '../core/SparseVoxelOctree';
import { VoxelStorage, type StorageStats, type StorageCapabilities } from './VoxelStorage';

/**
 * Sparse storage implementation using hash map
 */
export class SparseStorage extends VoxelStorage {
  /** Hash map for voxel storage */
  private voxelMap: Map<string, Voxel> = new Map();
  
  /** Bounds of stored voxels */
  private bounds: THREE.Box3 = new THREE.Box3();
  
  /** Whether bounds need recalculation */
  private boundsDirty: boolean = true;
  
  constructor() {
    super();
    console.log('[SparseStorage] Initialized');
  }
  
  /**
   * Store a voxel
   */
  async set(x: number, y: number, z: number, voxel: Voxel): Promise<void> {
    const key = VoxelUtils.getVoxelKey(x, y, z);
    const existed = this.voxelMap.has(key);
    
    this.voxelMap.set(key, voxel);
    
    if (!existed) {
      this.voxelCount++;
      this.memoryUsage += voxel.getMemorySize() + 50; // +50 for map overhead
      this.boundsDirty = true;
    }
  }
  
  /**
   * Retrieve a voxel
   */
  async get(x: number, y: number, z: number): Promise<Voxel | null> {
    const key = VoxelUtils.getVoxelKey(x, y, z);
    return this.voxelMap.get(key) || null;
  }
  
  /**
   * Check if voxel exists
   */
  async has(x: number, y: number, z: number): Promise<boolean> {
    const key = VoxelUtils.getVoxelKey(x, y, z);
    return this.voxelMap.has(key);
  }
  
  /**
   * Remove a voxel
   */
  async delete(x: number, y: number, z: number): Promise<boolean> {
    const key = VoxelUtils.getVoxelKey(x, y, z);
    const voxel = this.voxelMap.get(key);
    
    if (voxel) {
      this.voxelMap.delete(key);
      this.voxelCount--;
      this.memoryUsage -= voxel.getMemorySize() + 50;
      this.boundsDirty = true;
      return true;
    }
    
    return false;
  }
  
  /**
   * Store multiple voxels (batch operation)
   */
  async setMany(voxels: Voxel[]): Promise<number> {
    let count = 0;
    
    for (const voxel of voxels) {
      const key = VoxelUtils.getVoxelKey(
        Math.floor(voxel.position.x),
        Math.floor(voxel.position.y),
        Math.floor(voxel.position.z)
      );
      
      const existed = this.voxelMap.has(key);
      this.voxelMap.set(key, voxel);
      
      if (!existed) {
        this.voxelCount++;
        this.memoryUsage += voxel.getMemorySize() + 50;
        count++;
      }
    }
    
    this.boundsDirty = true;
    return count;
  }
  
  /**
   * Retrieve multiple voxels
   */
  async getMany(coordinates: Array<[number, number, number]>): Promise<Voxel[]> {
    const voxels: Voxel[] = [];
    
    for (const [x, y, z] of coordinates) {
      const voxel = await this.get(x, y, z);
      if (voxel) {
        voxels.push(voxel);
      }
    }
    
    return voxels;
  }
  
  /**
   * Get all voxels
   */
  async getAll(): Promise<Voxel[]> {
    return Array.from(this.voxelMap.values());
  }
  
  /**
   * Clear all voxels
   */
  async clear(): Promise<void> {
    this.voxelMap.clear();
    this.voxelCount = 0;
    this.memoryUsage = 0;
    this.bounds = new THREE.Box3();
    this.boundsDirty = true;
  }
  
  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    return {
      voxelCount: this.voxelCount,
      memoryUsage: this.memoryUsage,
      efficiency: this.getEfficiency()
    };
  }
  
  /**
   * Get storage capabilities
   */
  getCapabilities(): StorageCapabilities {
    return {
      supportsCompression: false,
      supportsStreaming: false,
      supportsCaching: false,
      supportsPersistence: true,
      maxVoxels: 100_000_000 // 100 million voxels
    };
  }
  
  /**
   * Optimize storage
   */
  async optimize(): Promise<void> {
    // Remove inactive voxels
    const toRemove: string[] = [];
    
    for (const [key, voxel] of this.voxelMap.entries()) {
      if (!voxel.active) {
        toRemove.push(key);
      }
    }
    
    for (const key of toRemove) {
      this.voxelMap.delete(key);
      this.voxelCount--;
    }
    
    console.log(`[SparseStorage] Optimized: removed ${toRemove.length} inactive voxels`);
  }
  
  /**
   * Convert to octree
   */
  async toOctree(): Promise<SparseVoxelOctree> {
    const voxels = await this.getAll();
    return SparseVoxelOctree.fromVoxels(voxels);
  }
  
  /**
   * Load from octree
   */
  async fromOctree(octree: SparseVoxelOctree): Promise<void> {
    await this.clear();
    const voxels = octree.getAllVoxels();
    await this.setMany(voxels);
  }
  
  /**
   * Export to JSON
   */
  async toJSON(): Promise<any> {
    const voxels = await this.getAll();
    
    return {
      type: 'sparse',
      voxelCount: this.voxelCount,
      voxels: voxels.map(v => v.toJSON())
    };
  }
  
  /**
   * Import from JSON
   */
  async fromJSON(data: any): Promise<void> {
    await this.clear();
    
    const voxels = data.voxels.map((v: any) => Voxel.fromJSON(v));
    await this.setMany(voxels);
  }
  
  /**
   * Get bounds of all voxels
   */
  getBounds(): THREE.Box3 {
    if (this.boundsDirty) {
      this.recalculateBounds();
    }
    return this.bounds.clone();
  }
  
  /**
   * Recalculate bounds
   */
  private recalculateBounds(): void {
    this.bounds.makeEmpty();
    
    for (const voxel of this.voxelMap.values()) {
      this.bounds.expandByPoint(voxel.position);
    }
    
    this.boundsDirty = false;
  }
  
  /**
   * Get voxels in region
   */
  async getVoxelsInRegion(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number
  ): Promise<Voxel[]> {
    const voxels: Voxel[] = [];
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const voxel = await this.get(x, y, z);
          if (voxel) {
            voxels.push(voxel);
          }
        }
      }
    }
    
    return voxels;
  }
  
  /**
   * Clone storage
   */
  async clone(): Promise<SparseStorage> {
    const cloned = new SparseStorage();
    const voxels = await this.getAll();
    await cloned.setMany(voxels.map(v => v.clone()));
    return cloned;
  }
}
