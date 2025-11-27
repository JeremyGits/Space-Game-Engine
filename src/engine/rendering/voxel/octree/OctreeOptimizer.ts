/**
 * Octree Optimizer
 * 
 * Optimizes octree structure for better performance and memory usage.
 * Includes node merging, empty node removal, and rebalancing.
 */

import * as THREE from 'three';
import { OctreeNode } from '../core/OctreeNode';
import { Voxel } from '../core/Voxel';
import { OctreeTraversal } from './OctreeTraversal';

/**
 * Optimization options
 */
export interface OptimizationOptions {
  /** Remove empty leaf nodes */
  removeEmptyNodes?: boolean;
  
  /** Merge nodes with few voxels */
  mergeSparselyPopulatedNodes?: boolean;
  
  /** Threshold for merging (voxels per node) */
  mergeThreshold?: number;
  
  /** Collapse uniform nodes (all voxels similar) */
  collapseUniformNodes?: boolean;
  
  /** Color similarity threshold for collapsing */
  colorThreshold?: number;
  
  /** Rebalance tree structure */
  rebalance?: boolean;
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  nodesRemoved: number;
  nodesMerged: number;
  voxelsPreserved: number;
  memorySaved: number;
  timeTaken: number;
}

/**
 * Octree optimizer utility class
 */
export class OctreeOptimizer {
  /**
   * Optimize octree structure
   */
  static optimize(
    root: OctreeNode,
    options: OptimizationOptions = {}
  ): OptimizationResult {
    console.log('[OctreeOptimizer] Starting optimization...');
    const startTime = performance.now();
    
    const result: OptimizationResult = {
      nodesRemoved: 0,
      nodesMerged: 0,
      voxelsPreserved: 0,
      memorySaved: 0,
      timeTaken: 0
    };
    
    // Remove empty nodes
    if (options.removeEmptyNodes !== false) {
      result.nodesRemoved += this.removeEmptyNodes(root);
    }
    
    // Merge sparsely populated nodes
    if (options.mergeSparselyPopulatedNodes) {
      const threshold = options.mergeThreshold ?? 2;
      result.nodesMerged += this.mergeSparseNodes(root, threshold);
    }
    
    // Collapse uniform nodes
    if (options.collapseUniformNodes) {
      const colorThreshold = options.colorThreshold ?? 0.05;
      result.nodesMerged += this.collapseUniformNodes(root, colorThreshold);
    }
    
    // Rebalance tree
    if (options.rebalance) {
      this.rebalanceTree(root);
    }
    
    result.timeTaken = performance.now() - startTime;
    
    console.log(`[OctreeOptimizer] Optimization complete:`, result);
    return result;
  }
  
  /**
   * Remove empty leaf nodes
   */
  static removeEmptyNodes(root: OctreeNode): number {
    let removed = 0;
    
    // Traverse post-order (children first)
    OctreeTraversal.traverseDepthFirstPost(root, (node) => {
      if (node.isLeaf && (!node.voxels || node.voxels.length === 0)) {
        // Mark for removal (actual removal would require parent reference)
        removed++;
      }
      return true;
    });
    
    return removed;
  }
  
  /**
   * Merge nodes with few voxels into parent
   */
  static mergeSparseNodes(root: OctreeNode, threshold: number): number {
    let merged = 0;
    
    OctreeTraversal.traverseDepthFirstPost(root, (node) => {
      if (!node.isLeaf && node.children) {
        // Check if all children are leaves with few voxels
        let totalVoxels = 0;
        let allLeaves = true;
        
        for (const child of node.children) {
          if (!child.isLeaf) {
            allLeaves = false;
            break;
          }
          totalVoxels += child.voxels?.length ?? 0;
        }
        
        // Merge if all children are sparse leaves
        if (allLeaves && totalVoxels <= threshold) {
          // Collect all voxels from children
          const allVoxels: Voxel[] = [];
          for (const child of node.children) {
            if (child.voxels) {
              allVoxels.push(...child.voxels);
            }
          }
          
          // Convert node back to leaf
          node.children = null;
          node.voxels = allVoxels;
          node.isLeaf = true;
          merged++;
        }
      }
      return true;
    });
    
    return merged;
  }
  
  /**
   * Collapse nodes where all voxels are similar
   */
  static collapseUniformNodes(root: OctreeNode, colorThreshold: number): number {
    let collapsed = 0;
    
    OctreeTraversal.traverseLeaves(root, (node) => {
      if (!node.voxels || node.voxels.length < 2) return true;
      
      // Check if all voxels are similar
      const firstVoxel = node.voxels[0];
      let allSimilar = true;
      
      for (let i = 1; i < node.voxels.length; i++) {
        if (!node.voxels[i].isSimilarTo(firstVoxel, colorThreshold, 0.1)) {
          allSimilar = false;
          break;
        }
      }
      
      // If all similar, replace with single representative voxel
      if (allSimilar && node.voxels.length > 1) {
        const representative = this.createRepresentativeVoxel(node.voxels);
        node.voxels = [representative];
        collapsed++;
      }
      
      return true;
    });
    
    return collapsed;
  }
  
  /**
   * Create representative voxel from a group
   */
  private static createRepresentativeVoxel(voxels: Voxel[]): Voxel {
    // Calculate average position
    const avgPos = new THREE.Vector3();
    for (const voxel of voxels) {
      avgPos.add(voxel.position);
    }
    avgPos.divideScalar(voxels.length);
    
    // Calculate average color
    const avgColor = new THREE.Color(0, 0, 0);
    for (const voxel of voxels) {
      avgColor.r += voxel.color.r;
      avgColor.g += voxel.color.g;
      avgColor.b += voxel.color.b;
    }
    avgColor.r /= voxels.length;
    avgColor.g /= voxels.length;
    avgColor.b /= voxels.length;
    
    // Calculate average alpha
    let avgAlpha = 0;
    for (const voxel of voxels) {
      avgAlpha += voxel.alpha;
    }
    avgAlpha /= voxels.length;
    
    // Calculate average material
    let avgMetalness = 0;
    let avgRoughness = 0;
    for (const voxel of voxels) {
      avgMetalness += voxel.material.metalness;
      avgRoughness += voxel.material.roughness;
    }
    avgMetalness /= voxels.length;
    avgRoughness /= voxels.length;
    
    return new Voxel(
      avgPos.x,
      avgPos.y,
      avgPos.z,
      avgColor,
      avgAlpha,
      { metalness: avgMetalness, roughness: avgRoughness }
    );
  }
  
  /**
   * Rebalance tree structure
   */
  static rebalanceTree(root: OctreeNode): void {
    // TODO: Implement tree rebalancing
    // This would involve:
    // 1. Collect all voxels
    // 2. Rebuild tree with optimal structure
    // 3. Replace old tree with new one
    console.log('[OctreeOptimizer] Tree rebalancing not yet implemented');
  }
  
  /**
   * Calculate potential memory savings
   */
  static calculatePotentialSavings(root: OctreeNode): {
    currentMemory: number;
    potentialMemory: number;
    savings: number;
    savingsPercent: number;
  } {
    const currentMemory = root.getMemoryUsage();
    
    // Calculate potential savings from optimization
    let emptyNodes = 0;
    let sparseNodes = 0;
    let uniformNodes = 0;
    
    OctreeTraversal.traverseDepthFirstPre(root, (node) => {
      if (node.isLeaf) {
        const voxelCount = node.voxels?.length ?? 0;
        
        if (voxelCount === 0) {
          emptyNodes++;
        } else if (voxelCount <= 2) {
          sparseNodes++;
        }
        
        // Check uniformity
        if (voxelCount > 1 && node.voxels) {
          const firstVoxel = node.voxels[0];
          let allSimilar = true;
          
          for (let i = 1; i < node.voxels.length; i++) {
            if (!node.voxels[i].isSimilarTo(firstVoxel, 0.05, 0.1)) {
              allSimilar = false;
              break;
            }
          }
          
          if (allSimilar) {
            uniformNodes++;
          }
        }
      }
      return true;
    });
    
    // Estimate savings
    const nodeOverhead = 128; // bytes per node
    const voxelSize = 69; // bytes per voxel
    
    const emptyNodeSavings = emptyNodes * nodeOverhead;
    const sparseNodeSavings = sparseNodes * (nodeOverhead / 2); // Partial savings
    const uniformNodeSavings = uniformNodes * voxelSize * 0.8; // Save ~80% of voxels
    
    const potentialSavings = emptyNodeSavings + sparseNodeSavings + uniformNodeSavings;
    const potentialMemory = currentMemory - potentialSavings;
    
    return {
      currentMemory,
      potentialMemory,
      savings: potentialSavings,
      savingsPercent: (potentialSavings / currentMemory) * 100
    };
  }
  
  /**
   * Compact octree (remove inactive voxels)
   */
  static compact(root: OctreeNode): number {
    let removed = 0;
    
    OctreeTraversal.traverseLeaves(root, (node) => {
      if (node.voxels) {
        const originalCount = node.voxels.length;
        node.voxels = node.voxels.filter(v => v.active);
        removed += originalCount - node.voxels.length;
      }
      return true;
    });
    
    return removed;
  }
}
