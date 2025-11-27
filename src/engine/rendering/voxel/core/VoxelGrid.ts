/**
 * Voxel Grid - Dense 3D Grid
 * 
 * A simple dense 3D grid for storing voxels.
 * This is provided as a reference implementation and for small datasets.
 * For large datasets, use SparseVoxelOctree instead for 90% memory savings.
 */

import * as THREE from 'three';
import { Voxel } from './Voxel';
import { VoxelUtils } from './Voxel';

/**
 * Dense voxel grid class
 */
export class VoxelGrid {
  private width: number;
  private height: number;
  private depth: number;
  private voxelSize: number;
  
  /** 3D array of voxels [x][y][z] */
  private grid: (Voxel | null)[][][];
  
  /** Bounds of the grid in world space */
  private bounds: THREE.Box3;
  
  /** Total number of voxels (including empty) */
  private totalCells: number;
  
  /** Number of occupied voxels */
  private occupiedCount: number = 0;
  
  constructor(width: number, height: number, depth: number, voxelSize: number = 1.0) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.voxelSize = voxelSize;
    this.totalCells = width * height * depth;
    
    // Initialize 3D array
    this.grid = [];
    for (let x = 0; x < width; x++) {
      this.grid[x] = [];
      for (let y = 0; y < height; y++) {
        this.grid[x][y] = [];
        for (let z = 0; z < depth; z++) {
          this.grid[x][y][z] = null;
        }
      }
    }
    
    // Calculate bounds
    this.bounds = new THREE.Box3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(width * voxelSize, height * voxelSize, depth * voxelSize)
    );
    
    console.log(`[VoxelGrid] Created ${width}x${height}x${depth} grid (${this.totalCells} cells)`);
  }
  
  /**
   * Set voxel at grid coordinates
   */
  setVoxel(x: number, y: number, z: number, voxel: Voxel | null): boolean {
    if (!this.isValidCoordinate(x, y, z)) {
      return false;
    }
    
    const wasOccupied = this.grid[x][y][z] !== null;
    const isOccupied = voxel !== null;
    
    this.grid[x][y][z] = voxel;
    
    // Update occupied count
    if (wasOccupied && !isOccupied) {
      this.occupiedCount--;
    } else if (!wasOccupied && isOccupied) {
      this.occupiedCount++;
    }
    
    return true;
  }
  
  /**
   * Get voxel at grid coordinates
   */
  getVoxel(x: number, y: number, z: number): Voxel | null {
    if (!this.isValidCoordinate(x, y, z)) {
      return null;
    }
    
    return this.grid[x][y][z];
  }
  
  /**
   * Check if coordinate is valid
   */
  isValidCoordinate(x: number, y: number, z: number): boolean {
    return x >= 0 && x < this.width &&
           y >= 0 && y < this.height &&
           z >= 0 && z < this.depth;
  }
  
  /**
   * Check if voxel exists at coordinates
   */
  hasVoxel(x: number, y: number, z: number): boolean {
    return this.getVoxel(x, y, z) !== null;
  }
  
  /**
   * Remove voxel at coordinates
   */
  removeVoxel(x: number, y: number, z: number): boolean {
    return this.setVoxel(x, y, z, null);
  }
  
  /**
   * Get all voxels (non-null only)
   */
  getAllVoxels(): Voxel[] {
    const voxels: Voxel[] = [];
    
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.depth; z++) {
          const voxel = this.grid[x][y][z];
          if (voxel) {
            voxels.push(voxel);
          }
        }
      }
    }
    
    return voxels;
  }
  
  /**
   * Get voxels in a region
   */
  getVoxelsInRegion(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number
  ): Voxel[] {
    const voxels: Voxel[] = [];
    
    // Clamp to grid bounds
    const startX = Math.max(0, minX);
    const startY = Math.max(0, minY);
    const startZ = Math.max(0, minZ);
    const endX = Math.min(this.width - 1, maxX);
    const endY = Math.min(this.height - 1, maxY);
    const endZ = Math.min(this.depth - 1, maxZ);
    
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        for (let z = startZ; z <= endZ; z++) {
          const voxel = this.grid[x][y][z];
          if (voxel) {
            voxels.push(voxel);
          }
        }
      }
    }
    
    return voxels;
  }
  
  /**
   * Clear all voxels
   */
  clear(): void {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.depth; z++) {
          this.grid[x][y][z] = null;
        }
      }
    }
    
    this.occupiedCount = 0;
  }
  
  /**
   * Fill region with voxels
   */
  fillRegion(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
    color: THREE.Color,
    material?: any
  ): number {
    let count = 0;
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.isValidCoordinate(x, y, z)) {
            const voxel = new Voxel(x, y, z, color, 1.0, material);
            this.setVoxel(x, y, z, voxel);
            count++;
          }
        }
      }
    }
    
    return count;
  }
  
  /**
   * Get grid dimensions
   */
  getDimensions(): { width: number; height: number; depth: number } {
    return {
      width: this.width,
      height: this.height,
      depth: this.depth
    };
  }
  
  /**
   * Get grid bounds
   */
  getBounds(): THREE.Box3 {
    return this.bounds.clone();
  }
  
  /**
   * Get voxel size
   */
  getVoxelSize(): number {
    return this.voxelSize;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      width: this.width,
      height: this.height,
      depth: this.depth,
      totalCells: this.totalCells,
      occupiedCells: this.occupiedCount,
      emptyCells: this.totalCells - this.occupiedCount,
      occupancyRate: this.occupiedCount / this.totalCells,
      memoryUsage: this.getMemoryUsage()
    };
  }
  
  /**
   * Get memory usage in bytes
   */
  getMemoryUsage(): number {
    // Grid array overhead
    let memory = this.totalCells * 8; // Pointer size
    
    // Occupied voxels
    memory += this.occupiedCount * 69; // Each voxel is ~69 bytes
    
    return memory;
  }
  
  /**
   * Convert to sparse representation (array of voxels)
   */
  toSparse(): Voxel[] {
    return this.getAllVoxels();
  }
  
  /**
   * Clone this grid
   */
  clone(): VoxelGrid {
    const cloned = new VoxelGrid(this.width, this.height, this.depth, this.voxelSize);
    
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.depth; z++) {
          const voxel = this.grid[x][y][z];
          if (voxel) {
            cloned.setVoxel(x, y, z, voxel.clone());
          }
        }
      }
    }
    
    return cloned;
  }
  
  /**
   * Serialize to JSON
   */
  toJSON(): any {
    const voxels = this.getAllVoxels().map(v => v.toJSON());
    
    return {
      width: this.width,
      height: this.height,
      depth: this.depth,
      voxelSize: this.voxelSize,
      voxels
    };
  }
  
  /**
   * Deserialize from JSON
   */
  static fromJSON(data: any): VoxelGrid {
    const grid = new VoxelGrid(data.width, data.height, data.depth, data.voxelSize);
    
    for (const voxelData of data.voxels) {
      const voxel = Voxel.fromJSON(voxelData);
      grid.setVoxel(
        Math.floor(voxel.position.x),
        Math.floor(voxel.position.y),
        Math.floor(voxel.position.z),
        voxel
      );
    }
    
    return grid;
  }
  
  /**
   * Create grid from voxel array
   */
  static fromVoxels(voxels: Voxel[], voxelSize: number = 1.0): VoxelGrid {
    if (voxels.length === 0) {
      return new VoxelGrid(1, 1, 1, voxelSize);
    }
    
    // Find bounds
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    for (const voxel of voxels) {
      minX = Math.min(minX, voxel.position.x);
      minY = Math.min(minY, voxel.position.y);
      minZ = Math.min(minZ, voxel.position.z);
      maxX = Math.max(maxX, voxel.position.x);
      maxY = Math.max(maxY, voxel.position.y);
      maxZ = Math.max(maxZ, voxel.position.z);
    }
    
    const width = Math.ceil(maxX - minX) + 1;
    const height = Math.ceil(maxY - minY) + 1;
    const depth = Math.ceil(maxZ - minZ) + 1;
    
    const grid = new VoxelGrid(width, height, depth, voxelSize);
    
    // Add voxels
    for (const voxel of voxels) {
      const x = Math.floor(voxel.position.x - minX);
      const y = Math.floor(voxel.position.y - minY);
      const z = Math.floor(voxel.position.z - minZ);
      grid.setVoxel(x, y, z, voxel);
    }
    
    return grid;
  }
}
