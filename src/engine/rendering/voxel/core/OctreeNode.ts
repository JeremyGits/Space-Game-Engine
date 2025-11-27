/**
 * Octree Node
 * 
 * Represents a node in the sparse voxel octree structure.
 * Each node can have up to 8 children (octants) or store voxels directly (leaf node).
 */

import * as THREE from 'three';
import { Voxel } from './Voxel';

/**
 * Octree node class
 */
export class OctreeNode {
  /** Bounding box of this node */
  public bounds: THREE.Box3;
  
  /** Depth level in the octree (0 = root) */
  public level: number;
  
  /** Maximum depth allowed */
  public maxDepth: number;
  
  /** Child nodes (8 octants) - null if leaf node */
  public children: OctreeNode[] | null = null;
  
  /** Voxels stored in this node (only for leaf nodes) */
  public voxels: Voxel[] | null = null;
  
  /** Maximum voxels per leaf node before subdivision */
  public maxVoxelsPerNode: number;
  
  /** Whether this node is a leaf */
  public isLeaf: boolean = true;
  
  /** Parent node reference */
  public parent: OctreeNode | null = null;
  
  /** Node ID for debugging */
  public id: string;
  
  constructor(
    bounds: THREE.Box3,
    level: number = 0,
    maxDepth: number = 8,
    maxVoxelsPerNode: number = 8,
    parent: OctreeNode | null = null
  ) {
    this.bounds = bounds.clone();
    this.level = level;
    this.maxDepth = maxDepth;
    this.maxVoxelsPerNode = maxVoxelsPerNode;
    this.parent = parent;
    this.voxels = [];
    this.id = `node_${level}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Insert a voxel into this node
   */
  insert(voxel: Voxel): boolean {
    // Check if voxel is within bounds
    if (!this.bounds.containsPoint(voxel.position)) {
      return false;
    }
    
    // If this is a leaf node
    if (this.isLeaf) {
      // Add to voxels array
      this.voxels!.push(voxel);
      
      // Check if we need to subdivide
      if (this.voxels!.length > this.maxVoxelsPerNode && this.level < this.maxDepth) {
        this.subdivide();
      }
      
      return true;
    }
    
    // If not a leaf, insert into appropriate child
    for (const child of this.children!) {
      if (child.insert(voxel)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Subdivide this node into 8 children
   */
  private subdivide(): void {
    if (!this.isLeaf) return;
    
    const center = this.bounds.getCenter(new THREE.Vector3());
    const min = this.bounds.min;
    const max = this.bounds.max;
    
    // Create 8 child nodes (octants)
    this.children = [
      // Bottom 4 octants
      new OctreeNode(
        new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(center.x, center.y, center.z)),
        this.level + 1, this.maxDepth, this.maxVoxelsPerNode, this
      ),
      new OctreeNode(
        new THREE.Box3(new THREE.Vector3(center.x, min.y, min.z), new THREE.Vector3(max.x, center.y, center.z)),
        this.level + 1, this.maxDepth, this.maxVoxelsPerNode, this
      ),
      new OctreeNode(
        new THREE.Box3(new THREE.Vector3(min.x, min.y, center.z), new THREE.Vector3(center.x, center.y, max.z)),
        this.level + 1, this.maxDepth, this.maxVoxelsPerNode, this
      ),
      new OctreeNode(
        new THREE.Box3(new THREE.Vector3(center.x, min.y, center.z), new THREE.Vector3(max.x, center.y, max.z)),
        this.level + 1, this.maxDepth, this.maxVoxelsPerNode, this
      ),
      // Top 4 octants
      new OctreeNode(
        new THREE.Box3(new THREE.Vector3(min.x, center.y, min.z), new THREE.Vector3(center.x, max.y, center.z)),
        this.level + 1, this.maxDepth, this.maxVoxelsPerNode, this
      ),
      new OctreeNode(
        new THREE.Box3(new THREE.Vector3(center.x, center.y, min.z), new THREE.Vector3(max.x, max.y, center.z)),
        this.level + 1, this.maxDepth, this.maxVoxelsPerNode, this
      ),
      new OctreeNode(
        new THREE.Box3(new THREE.Vector3(min.x, center.y, center.z), new THREE.Vector3(center.x, max.y, max.z)),
        this.level + 1, this.maxDepth, this.maxVoxelsPerNode, this
      ),
      new OctreeNode(
        new THREE.Box3(new THREE.Vector3(center.x, center.y, center.z), new THREE.Vector3(max.x, max.y, max.z)),
        this.level + 1, this.maxDepth, this.maxVoxelsPerNode, this
      )
    ];
    
    // Redistribute voxels to children
    const voxelsToRedistribute = this.voxels!;
    this.voxels = null;
    this.isLeaf = false;
    
    for (const voxel of voxelsToRedistribute) {
      this.insert(voxel);
    }
  }
  
  /**
   * Query voxels within a bounding box
   */
  queryBox(box: THREE.Box3, results: Voxel[] = []): Voxel[] {
    // Check if this node intersects the query box
    if (!this.bounds.intersectsBox(box)) {
      return results;
    }
    
    // If leaf, check voxels
    if (this.isLeaf && this.voxels) {
      for (const voxel of this.voxels) {
        if (box.containsPoint(voxel.position)) {
          results.push(voxel);
        }
      }
      return results;
    }
    
    // If not leaf, query children
    if (this.children) {
      for (const child of this.children) {
        child.queryBox(box, results);
      }
    }
    
    return results;
  }
  
  /**
   * Query voxels within a sphere
   */
  querySphere(center: THREE.Vector3, radius: number, results: Voxel[] = []): Voxel[] {
    // Quick bounds check
    const sphere = new THREE.Sphere(center, radius);
    if (!sphere.intersectsBox(this.bounds)) {
      return results;
    }
    
    // If leaf, check voxels
    if (this.isLeaf && this.voxels) {
      const radiusSquared = radius * radius;
      for (const voxel of this.voxels) {
        if (voxel.position.distanceToSquared(center) <= radiusSquared) {
          results.push(voxel);
        }
      }
      return results;
    }
    
    // If not leaf, query children
    if (this.children) {
      for (const child of this.children) {
        child.querySphere(center, radius, results);
      }
    }
    
    return results;
  }
  
  /**
   * Query voxels within a frustum
   */
  queryFrustum(frustum: THREE.Frustum, results: Voxel[] = []): Voxel[] {
    // Check if this node intersects the frustum
    if (!frustum.intersectsBox(this.bounds)) {
      return results;
    }
    
    // If leaf, add all voxels (they're all within frustum)
    if (this.isLeaf && this.voxels) {
      results.push(...this.voxels);
      return results;
    }
    
    // If not leaf, query children
    if (this.children) {
      for (const child of this.children) {
        child.queryFrustum(frustum, results);
      }
    }
    
    return results;
  }
  
  /**
   * Get all voxels in this node and its children
   */
  getAllVoxels(results: Voxel[] = []): Voxel[] {
    if (this.isLeaf && this.voxels) {
      results.push(...this.voxels);
      return results;
    }
    
    if (this.children) {
      for (const child of this.children) {
        child.getAllVoxels(results);
      }
    }
    
    return results;
  }
  
  /**
   * Get total voxel count in this node and children
   */
  getVoxelCount(): number {
    if (this.isLeaf) {
      return this.voxels?.length ?? 0;
    }
    
    let count = 0;
    if (this.children) {
      for (const child of this.children) {
        count += child.getVoxelCount();
      }
    }
    
    return count;
  }
  
  /**
   * Get total node count (including this node and all children)
   */
  getNodeCount(): number {
    if (this.isLeaf) {
      return 1;
    }
    
    let count = 1; // This node
    if (this.children) {
      for (const child of this.children) {
        count += child.getNodeCount();
      }
    }
    
    return count;
  }
  
  /**
   * Get maximum depth of this subtree
   */
  getMaxDepth(): number {
    if (this.isLeaf) {
      return this.level;
    }
    
    let maxDepth = this.level;
    if (this.children) {
      for (const child of this.children) {
        maxDepth = Math.max(maxDepth, child.getMaxDepth());
      }
    }
    
    return maxDepth;
  }
  
  /**
   * Clear all voxels from this node and children
   */
  clear(): void {
    if (this.isLeaf) {
      this.voxels = [];
    } else if (this.children) {
      for (const child of this.children) {
        child.clear();
      }
      this.children = null;
      this.voxels = [];
      this.isLeaf = true;
    }
  }
  
  /**
   * Get memory usage of this node and children (bytes)
   */
  getMemoryUsage(): number {
    let memory = 0;
    
    // Node overhead
    memory += 128; // Approximate object overhead
    
    // Voxels
    if (this.isLeaf && this.voxels) {
      memory += this.voxels.length * 69; // Each voxel is ~69 bytes
    }
    
    // Children
    if (this.children) {
      for (const child of this.children) {
        memory += child.getMemoryUsage();
      }
    }
    
    return memory;
  }
  
  /**
   * Traverse all nodes (depth-first)
   */
  traverse(callback: (node: OctreeNode) => void): void {
    callback(this);
    
    if (this.children) {
      for (const child of this.children) {
        child.traverse(callback);
      }
    }
  }
  
  /**
   * Find node containing a specific point
   */
  findNodeContainingPoint(point: THREE.Vector3): OctreeNode | null {
    if (!this.bounds.containsPoint(point)) {
      return null;
    }
    
    if (this.isLeaf) {
      return this;
    }
    
    if (this.children) {
      for (const child of this.children) {
        const result = child.findNodeContainingPoint(point);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  /**
   * Get octant index for a point (0-7)
   */
  private getOctantIndex(point: THREE.Vector3): number {
    const center = this.bounds.getCenter(new THREE.Vector3());
    
    let index = 0;
    if (point.x >= center.x) index |= 1;
    if (point.y >= center.y) index |= 2;
    if (point.z >= center.z) index |= 4;
    
    return index;
  }
  
  /**
   * Convert to JSON for serialization
   */
  toJSON(): any {
    return {
      bounds: {
        min: this.bounds.min.toArray(),
        max: this.bounds.max.toArray()
      },
      level: this.level,
      isLeaf: this.isLeaf,
      voxels: this.isLeaf ? this.voxels?.map(v => v.toJSON()) : null,
      children: this.children ? this.children.map(c => c.toJSON()) : null
    };
  }
  
  /**
   * Create node from JSON
   */
  static fromJSON(data: any, maxDepth: number, maxVoxelsPerNode: number): OctreeNode {
    const bounds = new THREE.Box3(
      new THREE.Vector3().fromArray(data.bounds.min),
      new THREE.Vector3().fromArray(data.bounds.max)
    );
    
    const node = new OctreeNode(bounds, data.level, maxDepth, maxVoxelsPerNode);
    node.isLeaf = data.isLeaf;
    
    if (data.isLeaf && data.voxels) {
      node.voxels = data.voxels.map((v: any) => Voxel.fromJSON(v));
    } else if (data.children) {
      node.children = data.children.map((c: any) => 
        OctreeNode.fromJSON(c, maxDepth, maxVoxelsPerNode)
      );
      node.voxels = null;
    }
    
    return node;
  }
}
