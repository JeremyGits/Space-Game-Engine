/**
 * Octree Subdivision
 * 
 * Advanced subdivision strategies for octree nodes.
 * Provides smart subdivision based on various criteria.
 */

import * as THREE from 'three';
import { OctreeNode } from '../core/OctreeNode';
import { Voxel } from '../core/Voxel';

/**
 * Subdivision strategy
 */
export enum SubdivisionStrategy {
  /** Subdivide when voxel count exceeds threshold */
  COUNT_BASED = 'count-based',
  
  /** Subdivide based on voxel variance/distribution */
  VARIANCE_BASED = 'variance-based',
  
  /** Subdivide based on color/material similarity */
  SIMILARITY_BASED = 'similarity-based',
  
  /** Adaptive subdivision based on detail level */
  ADAPTIVE = 'adaptive'
}

/**
 * Subdivision criteria
 */
export interface SubdivisionCriteria {
  /** Maximum voxels per node */
  maxVoxels?: number;
  
  /** Maximum variance threshold */
  maxVariance?: number;
  
  /** Color similarity threshold */
  colorThreshold?: number;
  
  /** Material similarity threshold */
  materialThreshold?: number;
  
  /** Minimum node size (don't subdivide below this) */
  minNodeSize?: number;
}

/**
 * Octree subdivision utility class
 */
export class OctreeSubdivision {
  /**
   * Check if node should be subdivided
   */
  static shouldSubdivide(
    node: OctreeNode,
    strategy: SubdivisionStrategy,
    criteria: SubdivisionCriteria
  ): boolean {
    // Don't subdivide if not a leaf
    if (!node.isLeaf) return false;
    
    // Don't subdivide if at max depth
    if (node.level >= node.maxDepth) return false;
    
    // Don't subdivide if no voxels
    if (!node.voxels || node.voxels.length === 0) return false;
    
    // Check minimum node size
    if (criteria.minNodeSize) {
      const size = node.bounds.getSize(new THREE.Vector3());
      const minSize = Math.min(size.x, size.y, size.z);
      if (minSize <= criteria.minNodeSize) return false;
    }
    
    switch (strategy) {
      case SubdivisionStrategy.COUNT_BASED:
        return this.shouldSubdivideByCount(node, criteria);
      
      case SubdivisionStrategy.VARIANCE_BASED:
        return this.shouldSubdivideByVariance(node, criteria);
      
      case SubdivisionStrategy.SIMILARITY_BASED:
        return this.shouldSubdivideBySimilarity(node, criteria);
      
      case SubdivisionStrategy.ADAPTIVE:
        return this.shouldSubdivideAdaptive(node, criteria);
      
      default:
        return this.shouldSubdivideByCount(node, criteria);
    }
  }
  
  /**
   * Count-based subdivision
   */
  private static shouldSubdivideByCount(
    node: OctreeNode,
    criteria: SubdivisionCriteria
  ): boolean {
    const maxVoxels = criteria.maxVoxels ?? node.maxVoxelsPerNode;
    return node.voxels!.length > maxVoxels;
  }
  
  /**
   * Variance-based subdivision
   */
  private static shouldSubdivideByVariance(
    node: OctreeNode,
    criteria: SubdivisionCriteria
  ): boolean {
    if (!node.voxels || node.voxels.length < 2) return false;
    
    // Calculate spatial variance
    const variance = this.calculateSpatialVariance(node.voxels);
    const maxVariance = criteria.maxVariance ?? 10.0;
    
    return variance > maxVariance;
  }
  
  /**
   * Similarity-based subdivision
   */
  private static shouldSubdivideBySimilarity(
    node: OctreeNode,
    criteria: SubdivisionCriteria
  ): boolean {
    if (!node.voxels || node.voxels.length < 2) return false;
    
    // Check if voxels are dissimilar
    const similarity = this.calculateVoxelSimilarity(
      node.voxels,
      criteria.colorThreshold ?? 0.1,
      criteria.materialThreshold ?? 0.1
    );
    
    // Subdivide if voxels are too different
    return similarity < 0.8; // 80% similarity threshold
  }
  
  /**
   * Adaptive subdivision (combines multiple criteria)
   */
  private static shouldSubdivideAdaptive(
    node: OctreeNode,
    criteria: SubdivisionCriteria
  ): boolean {
    // Check count first
    if (this.shouldSubdivideByCount(node, criteria)) {
      // Then check if subdivision would be beneficial
      const variance = this.calculateSpatialVariance(node.voxels!);
      return variance > 1.0; // Only subdivide if voxels are spread out
    }
    
    return false;
  }
  
  /**
   * Calculate spatial variance of voxels
   */
  private static calculateSpatialVariance(voxels: Voxel[]): number {
    if (voxels.length === 0) return 0;
    
    // Calculate centroid
    const centroid = new THREE.Vector3();
    for (const voxel of voxels) {
      centroid.add(voxel.position);
    }
    centroid.divideScalar(voxels.length);
    
    // Calculate variance
    let variance = 0;
    for (const voxel of voxels) {
      variance += voxel.position.distanceToSquared(centroid);
    }
    variance /= voxels.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Calculate voxel similarity (0 = all different, 1 = all same)
   */
  private static calculateVoxelSimilarity(
    voxels: Voxel[],
    colorThreshold: number,
    materialThreshold: number
  ): number {
    if (voxels.length < 2) return 1.0;
    
    let similarPairs = 0;
    let totalPairs = 0;
    
    // Sample pairs (don't check all pairs for performance)
    const sampleSize = Math.min(voxels.length, 20);
    
    for (let i = 0; i < sampleSize; i++) {
      for (let j = i + 1; j < sampleSize; j++) {
        if (voxels[i].isSimilarTo(voxels[j], colorThreshold, materialThreshold)) {
          similarPairs++;
        }
        totalPairs++;
      }
    }
    
    return totalPairs > 0 ? similarPairs / totalPairs : 1.0;
  }
  
  /**
   * Force subdivide a node
   */
  static forceSubdivide(node: OctreeNode): boolean {
    if (!node.isLeaf) return false;
    if (node.level >= node.maxDepth) return false;
    if (!node.voxels || node.voxels.length === 0) return false;
    
    // Temporarily increase max voxels to force subdivision
    const originalMax = node.maxVoxelsPerNode;
    node.maxVoxelsPerNode = 0;
    
    // Trigger subdivision by inserting a dummy voxel
    const dummyVoxel = node.voxels[0].clone();
    node.insert(dummyVoxel);
    
    // Restore original max
    node.maxVoxelsPerNode = originalMax;
    
    return !node.isLeaf;
  }
  
  /**
   * Subdivide all nodes at a specific depth
   */
  static subdivideAtDepth(root: OctreeNode, targetDepth: number): number {
    let count = 0;
    
    root.traverse((node) => {
      if (node.level === targetDepth && node.isLeaf) {
        if (this.forceSubdivide(node)) {
          count++;
        }
      }
    });
    
    return count;
  }
  
  /**
   * Subdivide nodes matching a predicate
   */
  static subdivideWhere(
    root: OctreeNode,
    predicate: (node: OctreeNode) => boolean
  ): number {
    let count = 0;
    
    root.traverse((node) => {
      if (node.isLeaf && predicate(node)) {
        if (this.forceSubdivide(node)) {
          count++;
        }
      }
    });
    
    return count;
  }
  
  /**
   * Calculate optimal subdivision depth for a region
   */
  static calculateOptimalDepth(
    voxelCount: number,
    targetVoxelsPerNode: number = 8
  ): number {
    if (voxelCount <= targetVoxelsPerNode) return 0;
    
    // Calculate depth needed to distribute voxels
    const nodesNeeded = Math.ceil(voxelCount / targetVoxelsPerNode);
    const depth = Math.ceil(Math.log(nodesNeeded) / Math.log(8));
    
    return Math.min(depth, 12); // Cap at 12 levels
  }
}
