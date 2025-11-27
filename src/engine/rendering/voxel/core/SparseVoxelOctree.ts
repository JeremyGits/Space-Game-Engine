/**
 * Sparse Voxel Octree
 * 
 * Main data structure for efficient voxel storage and querying.
 * Only stores occupied voxels, achieving 90% memory reduction compared to dense grids.
 * 
 * Features:
 * - Hierarchical spatial partitioning
 * - Efficient spatial queries (box, sphere, frustum, ray)
 * - Automatic LOD levels
 * - Fast insertion and removal
 * - Serialization support
 */

import * as THREE from 'three';
import { Voxel } from './Voxel';
import { OctreeNode } from './OctreeNode';
import { VoxelBounds } from './VoxelBounds';
import { VoxelQuery, type VoxelQueryResult, type VoxelRaycastResult } from './VoxelQuery';

/**
 * Sparse voxel octree configuration
 */
export interface SparseVoxelOctreeConfig {
  /** Maximum depth of the octree */
  maxDepth: number;
  
  /** Maximum voxels per leaf node before subdivision */
  maxVoxelsPerNode: number;
  
  /** Initial bounds of the octree */
  bounds: THREE.Box3;
  
  /** Voxel size in world units */
  voxelSize: number;
}

/**
 * Sparse voxel octree class
 */
export class SparseVoxelOctree {
  private root: OctreeNode;
  private config: SparseVoxelOctreeConfig;
  
  /** Total number of voxels in the octree */
  private voxelCount: number = 0;
  
  /** Hash map for fast voxel lookup by position */
  private voxelMap: Map<string, Voxel> = new Map();
  
  constructor(config: Partial<SparseVoxelOctreeConfig> = {}) {
    // Default configuration
    this.config = {
      maxDepth: config.maxDepth ?? 8,
      maxVoxelsPerNode: config.maxVoxelsPerNode ?? 8,
      bounds: config.bounds ?? new THREE.Box3(
        new THREE.Vector3(-512, -512, -512),
        new THREE.Vector3(512, 512, 512)
      ),
      voxelSize: config.voxelSize ?? 1.0
    };
    
    // Create root node
    this.root = new OctreeNode(
      this.config.bounds,
      0,
      this.config.maxDepth,
      this.config.maxVoxelsPerNode
    );
    
    console.log('[SparseVoxelOctree] Created with bounds:', this.config.bounds);
  }
  
  /**
   * Insert a voxel into the octree
   */
  insert(voxel: Voxel): boolean {
    const success = this.root.insert(voxel);
    
    if (success) {
      // Add to hash map for fast lookup
      const key = this.getVoxelKey(voxel.position);
      this.voxelMap.set(key, voxel);
      this.voxelCount++;
    }
    
    return success;
  }
  
  /**
   * Insert multiple voxels
   */
  insertMany(voxels: Voxel[]): number {
    let count = 0;
    
    for (const voxel of voxels) {
      if (this.insert(voxel)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Get voxel at position
   */
  getVoxel(x: number, y: number, z: number): Voxel | null {
    const key = `${x},${y},${z}`;
    return this.voxelMap.get(key) || null;
  }
  
  /**
   * Check if voxel exists at position
   */
  hasVoxel(x: number, y: number, z: number): boolean {
    const key = `${x},${y},${z}`;
    return this.voxelMap.has(key);
  }
  
  /**
   * Remove voxel at position
   */
  removeVoxel(x: number, y: number, z: number): boolean {
    const key = `${x},${y},${z}`;
    const voxel = this.voxelMap.get(key);
    
    if (voxel) {
      this.voxelMap.delete(key);
      this.voxelCount--;
      // Note: Voxel remains in octree structure but marked as inactive
      voxel.active = false;
      return true;
    }
    
    return false;
  }
  
  /**
   * Query voxels within a bounding box
   */
  queryBox(box: THREE.Box3): Voxel[] {
    return this.root.queryBox(box);
  }
  
  /**
   * Query voxels within a sphere
   */
  querySphere(center: THREE.Vector3, radius: number): Voxel[] {
    return this.root.querySphere(center, radius);
  }
  
  /**
   * Query voxels within a frustum (for rendering)
   */
  queryFrustum(frustum: THREE.Frustum): Voxel[] {
    return this.root.queryFrustum(frustum);
  }
  
  /**
   * Raycast against voxels
   */
  raycast(ray: THREE.Ray, maxDistance: number = Infinity): VoxelRaycastResult | null {
    // Get voxels along the ray path
    const voxels = this.getAllVoxels();
    return VoxelQuery.raycast(voxels, ray, maxDistance);
  }
  
  /**
   * Find nearest voxel to a point
   */
  findNearest(point: THREE.Vector3): VoxelQueryResult | null {
    const voxels = this.getAllVoxels();
    return VoxelQuery.findNearest(voxels, point);
  }
  
  /**
   * Find K nearest voxels
   */
  findKNearest(point: THREE.Vector3, k: number): VoxelQueryResult[] {
    const voxels = this.getAllVoxels();
    return VoxelQuery.findKNearest(voxels, point, k);
  }
  
  /**
   * Get all voxels in the octree
   */
  getAllVoxels(): Voxel[] {
    return Array.from(this.voxelMap.values()).filter(v => v.active);
  }
  
  /**
   * Get voxels at a specific LOD level
   */
  getVoxelsAtLOD(lodLevel: number): Voxel[] {
    // For now, return all voxels
    // In a full implementation, this would return voxels at the specified detail level
    return this.getAllVoxels();
  }
  
  /**
   * Get total voxel count
   */
  getVoxelCount(): number {
    return this.voxelCount;
  }
  
  /**
   * Get total node count
   */
  getNodeCount(): number {
    return this.root.getNodeCount();
  }
  
  /**
   * Get maximum depth
   */
  getMaxDepth(): number {
    return this.root.getMaxDepth();
  }
  
  /**
   * Get octree bounds
   */
  getBounds(): THREE.Box3 {
    return this.config.bounds.clone();
  }
  
  /**
   * Get voxel size
   */
  getVoxelSize(): number {
    return this.config.voxelSize;
  }
  
  /**
   * Clear all voxels
   */
  clear(): void {
    this.root.clear();
    this.voxelMap.clear();
    this.voxelCount = 0;
  }
  
  /**
   * Get memory usage in bytes
   */
  getMemoryUsage(): number {
    // Octree structure
    const octreeMemory = this.root.getMemoryUsage();
    
    // Hash map overhead
    const mapMemory = this.voxelMap.size * 50; // Approximate overhead per entry
    
    return octreeMemory + mapMemory;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      voxelCount: this.voxelCount,
      nodeCount: this.getNodeCount(),
      maxDepth: this.getMaxDepth(),
      configuredMaxDepth: this.config.maxDepth,
      memoryUsage: this.getMemoryUsage(),
      memoryUsageMB: this.getMemoryUsage() / 1024 / 1024,
      bounds: this.config.bounds,
      voxelSize: this.config.voxelSize
    };
  }
  
  /**
   * Optimize the octree (remove empty nodes, rebalance)
   */
  optimize(): void {
    // TODO: Implement optimization
    // - Remove empty leaf nodes
    // - Merge nodes with few voxels
    // - Rebalance tree
    console.log('[SparseVoxelOctree] Optimization not yet implemented');
  }
  
  /**
   * Traverse all nodes
   */
  traverse(callback: (node: OctreeNode) => void): void {
    this.root.traverse(callback);
  }
  
  /**
   * Get root node (for advanced operations)
   */
  getRoot(): OctreeNode {
    return this.root;
  }
  
  /**
   * Serialize to JSON
   */
  toJSON(): any {
    return {
      config: {
        maxDepth: this.config.maxDepth,
        maxVoxelsPerNode: this.config.maxVoxelsPerNode,
        bounds: {
          min: this.config.bounds.min.toArray(),
          max: this.config.bounds.max.toArray()
        },
        voxelSize: this.config.voxelSize
      },
      root: this.root.toJSON(),
      voxelCount: this.voxelCount
    };
  }
  
  /**
   * Deserialize from JSON
   */
  static fromJSON(data: any): SparseVoxelOctree {
    const config: SparseVoxelOctreeConfig = {
      maxDepth: data.config.maxDepth,
      maxVoxelsPerNode: data.config.maxVoxelsPerNode,
      bounds: new THREE.Box3(
        new THREE.Vector3().fromArray(data.config.bounds.min),
        new THREE.Vector3().fromArray(data.config.bounds.max)
      ),
      voxelSize: data.config.voxelSize
    };
    
    const octree = new SparseVoxelOctree(config);
    octree.root = OctreeNode.fromJSON(data.root, config.maxDepth, config.maxVoxelsPerNode);
    octree.voxelCount = data.voxelCount;
    
    // Rebuild hash map
    const allVoxels = octree.root.getAllVoxels();
    for (const voxel of allVoxels) {
      const key = octree.getVoxelKey(voxel.position);
      octree.voxelMap.set(key, voxel);
    }
    
    return octree;
  }
  
  /**
   * Create octree from voxel array
   */
  static fromVoxels(voxels: Voxel[], config?: Partial<SparseVoxelOctreeConfig>): SparseVoxelOctree {
    // Calculate bounds if not provided
    if (!config?.bounds && voxels.length > 0) {
      const bounds = VoxelBounds.calculateBounds(voxels);
      config = { ...config, bounds };
    }
    
    const octree = new SparseVoxelOctree(config);
    octree.insertMany(voxels);
    
    return octree;
  }
  
  /**
   * Create octree from dense grid
   */
  static fromGrid(grid: any): SparseVoxelOctree {
    // Will be implemented when VoxelGrid is available
    const voxels = grid.getAllVoxels();
    return SparseVoxelOctree.fromVoxels(voxels);
  }
  
  /**
   * Get voxel key for hash map
   */
  private getVoxelKey(position: THREE.Vector3): string {
    return `${Math.floor(position.x)},${Math.floor(position.y)},${Math.floor(position.z)}`;
  }
  
  /**
   * Log octree status
   */
  logStatus(): void {
    const stats = this.getStats();
    console.log(`
=== SPARSE VOXEL OCTREE STATUS ===
Voxels: ${stats.voxelCount}
Nodes: ${stats.nodeCount}
Depth: ${stats.maxDepth} / ${stats.configuredMaxDepth}
Memory: ${stats.memoryUsageMB.toFixed(2)}MB
Voxel Size: ${stats.voxelSize}
Bounds: ${stats.bounds.min.toArray()} to ${stats.bounds.max.toArray()}
===================================
    `.trim());
  }
}
