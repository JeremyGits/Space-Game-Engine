/**
 * Octree Culling
 * 
 * Efficient frustum and occlusion culling for voxel octrees.
 * Optimized for rendering performance.
 */

import * as THREE from 'three';
import { OctreeNode } from '../core/OctreeNode';
import { Voxel } from '../core/Voxel';
import { OctreeTraversal } from './OctreeTraversal';

/**
 * Culling result
 */
export interface CullingResult {
  /** Visible voxels */
  visibleVoxels: Voxel[];
  
  /** Visible nodes */
  visibleNodes: OctreeNode[];
  
  /** Culled nodes */
  culledNodes: number;
  
  /** Culling time in ms */
  cullingTime: number;
}

/**
 * Culling statistics
 */
export interface CullingStats {
  totalNodes: number;
  visibleNodes: number;
  culledNodes: number;
  totalVoxels: number;
  visibleVoxels: number;
  culledVoxels: number;
  cullingRatio: number;
}

/**
 * Octree culling utility class
 */
export class OctreeCulling {
  /**
   * Perform frustum culling on octree
   */
  static frustumCull(
    root: OctreeNode,
    frustum: THREE.Frustum
  ): CullingResult {
    const startTime = performance.now();
    
    const visibleVoxels: Voxel[] = [];
    const visibleNodes: OctreeNode[] = [];
    let culledNodes = 0;
    
    // Traverse octree and test against frustum
    OctreeTraversal.traverseDepthFirstPre(root, (node) => {
      // Test node bounds against frustum
      if (!frustum.intersectsBox(node.bounds)) {
        // Node is completely outside frustum - cull entire subtree
        culledNodes += this.countNodesInSubtree(node);
        return false; // Stop traversing this branch
      }
      
      // Node is visible
      visibleNodes.push(node);
      
      // If leaf, add voxels
      if (node.isLeaf && node.voxels) {
        visibleVoxels.push(...node.voxels.filter(v => v.active));
      }
      
      return true; // Continue traversing
    });
    
    const cullingTime = performance.now() - startTime;
    
    return {
      visibleVoxels,
      visibleNodes,
      culledNodes,
      cullingTime
    };
  }
  
  /**
   * Perform distance-based culling
   */
  static distanceCull(
    root: OctreeNode,
    cameraPosition: THREE.Vector3,
    maxDistance: number
  ): CullingResult {
    const startTime = performance.now();
    
    const visibleVoxels: Voxel[] = [];
    const visibleNodes: OctreeNode[] = [];
    let culledNodes = 0;
    const maxDistSquared = maxDistance * maxDistance;
    
    OctreeTraversal.traverseDepthFirstPre(root, (node) => {
      // Calculate distance from camera to node bounds
      const closestPoint = node.bounds.clampPoint(cameraPosition, new THREE.Vector3());
      const distSquared = cameraPosition.distanceToSquared(closestPoint);
      
      // Cull if too far
      if (distSquared > maxDistSquared) {
        culledNodes += this.countNodesInSubtree(node);
        return false;
      }
      
      visibleNodes.push(node);
      
      if (node.isLeaf && node.voxels) {
        // Further filter voxels by distance
        for (const voxel of node.voxels) {
          if (voxel.active && voxel.position.distanceToSquared(cameraPosition) <= maxDistSquared) {
            visibleVoxels.push(voxel);
          }
        }
      }
      
      return true;
    });
    
    const cullingTime = performance.now() - startTime;
    
    return {
      visibleVoxels,
      visibleNodes,
      culledNodes,
      cullingTime
    };
  }
  
  /**
   * Combined frustum + distance culling
   */
  static combinedCull(
    root: OctreeNode,
    frustum: THREE.Frustum,
    cameraPosition: THREE.Vector3,
    maxDistance: number
  ): CullingResult {
    const startTime = performance.now();
    
    const visibleVoxels: Voxel[] = [];
    const visibleNodes: OctreeNode[] = [];
    let culledNodes = 0;
    const maxDistSquared = maxDistance * maxDistance;
    
    OctreeTraversal.traverseDepthFirstPre(root, (node) => {
      // Test frustum first (cheaper test)
      if (!frustum.intersectsBox(node.bounds)) {
        culledNodes += this.countNodesInSubtree(node);
        return false;
      }
      
      // Then test distance
      const closestPoint = node.bounds.clampPoint(cameraPosition, new THREE.Vector3());
      const distSquared = cameraPosition.distanceToSquared(closestPoint);
      
      if (distSquared > maxDistSquared) {
        culledNodes += this.countNodesInSubtree(node);
        return false;
      }
      
      visibleNodes.push(node);
      
      if (node.isLeaf && node.voxels) {
        for (const voxel of node.voxels) {
          if (voxel.active) {
            visibleVoxels.push(voxel);
          }
        }
      }
      
      return true;
    });
    
    const cullingTime = performance.now() - startTime;
    
    return {
      visibleVoxels,
      visibleNodes,
      culledNodes,
      cullingTime
    };
  }
  
  /**
   * Occlusion culling (simple version)
   */
  static occlusionCull(
    root: OctreeNode,
    frustum: THREE.Frustum,
    cameraPosition: THREE.Vector3
  ): CullingResult {
    // For now, just do frustum culling
    // TODO: Implement proper occlusion culling with depth buffer
    return this.frustumCull(root, frustum);
  }
  
  /**
   * Count nodes in subtree
   */
  private static countNodesInSubtree(node: OctreeNode): number {
    return node.getNodeCount();
  }
  
  /**
   * Calculate culling statistics
   */
  static calculateStats(
    root: OctreeNode,
    result: CullingResult
  ): CullingStats {
    const totalNodes = root.getNodeCount();
    const totalVoxels = root.getVoxelCount();
    
    return {
      totalNodes,
      visibleNodes: result.visibleNodes.length,
      culledNodes: result.culledNodes,
      totalVoxels,
      visibleVoxels: result.visibleVoxels.length,
      culledVoxels: totalVoxels - result.visibleVoxels.length,
      cullingRatio: result.culledNodes / totalNodes
    };
  }
  
  /**
   * Get nodes at LOD level for distance
   */
  static getLODNodesForDistance(
    root: OctreeNode,
    cameraPosition: THREE.Vector3,
    lodDistances: number[]
  ): Map<number, OctreeNode[]> {
    const lodNodes = new Map<number, OctreeNode[]>();
    
    // Initialize LOD levels
    for (let i = 0; i < lodDistances.length; i++) {
      lodNodes.set(i, []);
    }
    
    OctreeTraversal.traverseDepthFirstPre(root, (node) => {
      // Calculate distance to node
      const closestPoint = node.bounds.clampPoint(cameraPosition, new THREE.Vector3());
      const distance = cameraPosition.distanceTo(closestPoint);
      
      // Determine LOD level
      let lodLevel = lodDistances.length - 1;
      for (let i = 0; i < lodDistances.length; i++) {
        if (distance < lodDistances[i]) {
          lodLevel = i;
          break;
        }
      }
      
      // Add to appropriate LOD level
      const nodes = lodNodes.get(lodLevel) || [];
      nodes.push(node);
      lodNodes.set(lodLevel, nodes);
      
      return true;
    });
    
    return lodNodes;
  }
}
