/**
 * Streaming Storage
 * 
 * Streaming voxel storage for massive datasets that don't fit in memory.
 * Loads/unloads voxel chunks based on camera position.
 * 
 * Features:
 * - Chunk-based streaming
 * - Distance-based loading/unloading
 * - Memory budget management
 * - Async loading
 */

import * as THREE from 'three';
import { Voxel, VoxelUtils } from '../core/Voxel';
import { SparseVoxelOctree } from '../core/SparseVoxelOctree';
import { VoxelStorage, type StorageStats, type StorageCapabilities } from './VoxelStorage';

/**
 * Voxel chunk
 */
interface VoxelChunk {
  /** Chunk ID */
  id: string;
  
  /** Chunk bounds */
  bounds: THREE.Box3;
  
  /** Voxels in this chunk */
  voxels: Map<string, Voxel>;
  
  /** Whether chunk is loaded */
  loaded: boolean;
  
  /** Last access time */
  lastAccess: number;
  
  /** Memory usage */
  memoryUsage: number;
}

/**
 * Streaming configuration
 */
export interface StreamingConfig {
  /** Chunk size (voxels per side) */
  chunkSize: number;
  
  /** Load distance (chunks) */
  loadDistance: number;
  
  /** Unload distance (chunks) */
  unloadDistance: number;
  
  /** Memory budget (bytes) */
  memoryBudget: number;
  
  /** Max chunks in memory */
  maxChunks: number;
}

/**
 * Streaming storage implementation
 */
export class StreamingStorage extends VoxelStorage {
  private config: StreamingConfig;
  private chunks: Map<string, VoxelChunk> = new Map();
  private loadedChunks: Set<string> = new Set();
  private cameraPosition: THREE.Vector3 = new THREE.Vector3();
  
  constructor(config?: Partial<StreamingConfig>) {
    super();
    
    this.config = {
      chunkSize: config?.chunkSize ?? 32,
      loadDistance: config?.loadDistance ?? 3,
      unloadDistance: config?.unloadDistance ?? 5,
      memoryBudget: config?.memoryBudget ?? 512 * 1024 * 1024, // 512MB
      maxChunks: config?.maxChunks ?? 100
    };
    
    console.log('[StreamingStorage] Initialized with chunk size:', this.config.chunkSize);
  }
  
  /**
   * Update camera position for streaming
   */
  updateCameraPosition(position: THREE.Vector3): void {
    this.cameraPosition.copy(position);
    this.updateStreaming();
  }
  
  /**
   * Update streaming (load/unload chunks)
   */
  private updateStreaming(): void {
    const currentChunk = this.getChunkCoords(this.cameraPosition);
    
    // Load nearby chunks
    for (let x = -this.config.loadDistance; x <= this.config.loadDistance; x++) {
      for (let y = -this.config.loadDistance; y <= this.config.loadDistance; y++) {
        for (let z = -this.config.loadDistance; z <= this.config.loadDistance; z++) {
          const chunkId = this.getChunkId(
            currentChunk.x + x,
            currentChunk.y + y,
            currentChunk.z + z
          );
          
          if (!this.loadedChunks.has(chunkId)) {
            this.loadChunk(chunkId);
          }
        }
      }
    }
    
    // Unload distant chunks
    const toUnload: string[] = [];
    
    for (const chunkId of this.loadedChunks) {
      const coords = this.parseChunkId(chunkId);
      const distance = Math.max(
        Math.abs(coords.x - currentChunk.x),
        Math.abs(coords.y - currentChunk.y),
        Math.abs(coords.z - currentChunk.z)
      );
      
      if (distance > this.config.unloadDistance) {
        toUnload.push(chunkId);
      }
    }
    
    for (const chunkId of toUnload) {
      this.unloadChunk(chunkId);
    }
    
    // Enforce memory budget
    this.enforceMemoryBudget();
  }
  
  /**
   * Load a chunk
   */
  private async loadChunk(chunkId: string): Promise<void> {
    if (this.loadedChunks.has(chunkId)) return;
    
    let chunk = this.chunks.get(chunkId);
    
    if (!chunk) {
      // Create new chunk
      const coords = this.parseChunkId(chunkId);
      chunk = this.createChunk(coords.x, coords.y, coords.z);
      this.chunks.set(chunkId, chunk);
    }
    
    chunk.loaded = true;
    chunk.lastAccess = Date.now();
    this.loadedChunks.add(chunkId);
    
    this.memoryUsage += chunk.memoryUsage;
  }
  
  /**
   * Unload a chunk
   */
  private unloadChunk(chunkId: string): void {
    const chunk = this.chunks.get(chunkId);
    
    if (chunk && chunk.loaded) {
      chunk.loaded = false;
      this.loadedChunks.delete(chunkId);
      this.memoryUsage -= chunk.memoryUsage;
    }
  }
  
  /**
   * Create a new chunk
   */
  private createChunk(x: number, y: number, z: number): VoxelChunk {
    const chunkSize = this.config.chunkSize;
    const bounds = new THREE.Box3(
      new THREE.Vector3(x * chunkSize, y * chunkSize, z * chunkSize),
      new THREE.Vector3((x + 1) * chunkSize, (y + 1) * chunkSize, (z + 1) * chunkSize)
    );
    
    return {
      id: this.getChunkId(x, y, z),
      bounds,
      voxels: new Map(),
      loaded: false,
      lastAccess: Date.now(),
      memoryUsage: 0
    };
  }
  
  /**
   * Get chunk ID from coordinates
   */
  private getChunkId(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }
  
  /**
   * Parse chunk ID to coordinates
   */
  private parseChunkId(id: string): { x: number; y: number; z: number } {
    const [x, y, z] = id.split(',').map(Number);
    return { x, y, z };
  }
  
  /**
   * Get chunk coordinates for a world position
   */
  private getChunkCoords(position: THREE.Vector3): { x: number; y: number; z: number } {
    const chunkSize = this.config.chunkSize;
    return {
      x: Math.floor(position.x / chunkSize),
      y: Math.floor(position.y / chunkSize),
      z: Math.floor(position.z / chunkSize)
    };
  }
  
  /**
   * Get chunk for a voxel position
   */
  private getChunkForVoxel(x: number, y: number, z: number): VoxelChunk | null {
    const coords = this.getChunkCoords(new THREE.Vector3(x, y, z));
    const chunkId = this.getChunkId(coords.x, coords.y, coords.z);
    return this.chunks.get(chunkId) || null;
  }
  
  /**
   * Enforce memory budget
   */
  private enforceMemoryBudget(): void {
    if (this.memoryUsage <= this.config.memoryBudget) return;
    
    // Sort chunks by last access time
    const chunks = Array.from(this.chunks.values())
      .filter(c => c.loaded)
      .sort((a, b) => a.lastAccess - b.lastAccess);
    
    // Unload oldest chunks until under budget
    for (const chunk of chunks) {
      if (this.memoryUsage <= this.config.memoryBudget) break;
      this.unloadChunk(chunk.id);
    }
  }
  
  /**
   * Store a voxel
   */
  async set(x: number, y: number, z: number, voxel: Voxel): Promise<void> {
    const chunk = this.getChunkForVoxel(x, y, z);
    
    if (!chunk) {
      // Create chunk if it doesn't exist
      const coords = this.getChunkCoords(new THREE.Vector3(x, y, z));
      const chunkId = this.getChunkId(coords.x, coords.y, coords.z);
      await this.loadChunk(chunkId);
      return this.set(x, y, z, voxel);
    }
    
    const key = VoxelUtils.getVoxelKey(x, y, z);
    const existed = chunk.voxels.has(key);
    
    chunk.voxels.set(key, voxel);
    chunk.lastAccess = Date.now();
    
    if (!existed) {
      this.voxelCount++;
      const voxelSize = voxel.getMemorySize();
      chunk.memoryUsage += voxelSize;
      this.memoryUsage += voxelSize;
    }
  }
  
  /**
   * Retrieve a voxel
   */
  async get(x: number, y: number, z: number): Promise<Voxel | null> {
    const chunk = this.getChunkForVoxel(x, y, z);
    
    if (!chunk || !chunk.loaded) {
      return null;
    }
    
    chunk.lastAccess = Date.now();
    const key = VoxelUtils.getVoxelKey(x, y, z);
    return chunk.voxels.get(key) || null;
  }
  
  /**
   * Check if voxel exists
   */
  async has(x: number, y: number, z: number): Promise<boolean> {
    const chunk = this.getChunkForVoxel(x, y, z);
    
    if (!chunk || !chunk.loaded) {
      return false;
    }
    
    const key = VoxelUtils.getVoxelKey(x, y, z);
    return chunk.voxels.has(key);
  }
  
  /**
   * Remove a voxel
   */
  async delete(x: number, y: number, z: number): Promise<boolean> {
    const chunk = this.getChunkForVoxel(x, y, z);
    
    if (!chunk || !chunk.loaded) {
      return false;
    }
    
    const key = VoxelUtils.getVoxelKey(x, y, z);
    const voxel = chunk.voxels.get(key);
    
    if (voxel) {
      chunk.voxels.delete(key);
      this.voxelCount--;
      const voxelSize = voxel.getMemorySize();
      chunk.memoryUsage -= voxelSize;
      this.memoryUsage -= voxelSize;
      return true;
    }
    
    return false;
  }
  
  /**
   * Store multiple voxels
   */
  async setMany(voxels: Voxel[]): Promise<number> {
    let count = 0;
    
    for (const voxel of voxels) {
      await this.set(
        Math.floor(voxel.position.x),
        Math.floor(voxel.position.y),
        Math.floor(voxel.position.z),
        voxel
      );
      count++;
    }
    
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
   * Get all loaded voxels
   */
  async getAll(): Promise<Voxel[]> {
    const voxels: Voxel[] = [];
    
    for (const chunk of this.chunks.values()) {
      if (chunk.loaded) {
        voxels.push(...chunk.voxels.values());
      }
    }
    
    return voxels;
  }
  
  /**
   * Clear all voxels
   */
  async clear(): Promise<void> {
    this.chunks.clear();
    this.loadedChunks.clear();
    this.voxelCount = 0;
    this.memoryUsage = 0;
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
      supportsStreaming: true,
      supportsCaching: true,
      supportsPersistence: true,
      maxVoxels: 1_000_000_000 // 1 billion voxels (streamed)
    };
  }
  
  /**
   * Optimize storage
   */
  async optimize(): Promise<void> {
    // Unload least recently used chunks
    this.enforceMemoryBudget();
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
    const chunks: any[] = [];
    
    for (const chunk of this.chunks.values()) {
      chunks.push({
        id: chunk.id,
        bounds: {
          min: chunk.bounds.min.toArray(),
          max: chunk.bounds.max.toArray()
        },
        voxels: Array.from(chunk.voxels.values()).map(v => v.toJSON())
      });
    }
    
    return {
      type: 'streaming',
      config: this.config,
      voxelCount: this.voxelCount,
      chunks
    };
  }
  
  /**
   * Import from JSON
   */
  async fromJSON(data: any): Promise<void> {
    await this.clear();
    
    this.config = data.config;
    
    for (const chunkData of data.chunks) {
      const chunk: VoxelChunk = {
        id: chunkData.id,
        bounds: new THREE.Box3(
          new THREE.Vector3().fromArray(chunkData.bounds.min),
          new THREE.Vector3().fromArray(chunkData.bounds.max)
        ),
        voxels: new Map(),
        loaded: false,
        lastAccess: Date.now(),
        memoryUsage: 0
      };
      
      for (const voxelData of chunkData.voxels) {
        const voxel = Voxel.fromJSON(voxelData);
        const key = VoxelUtils.getVoxelKey(
          Math.floor(voxel.position.x),
          Math.floor(voxel.position.y),
          Math.floor(voxel.position.z)
        );
        chunk.voxels.set(key, voxel);
        chunk.memoryUsage += voxel.getMemorySize();
      }
      
      this.chunks.set(chunk.id, chunk);
      this.voxelCount += chunk.voxels.size;
    }
  }
  
  /**
   * Get loaded chunk count
   */
  getLoadedChunkCount(): number {
    return this.loadedChunks.size;
  }
  
  /**
   * Get total chunk count
   */
  getTotalChunkCount(): number {
    return this.chunks.size;
  }
}
