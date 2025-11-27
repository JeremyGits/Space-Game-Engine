/**
 * Octree Traversal
 * 
 * Provides various algorithms for traversing the sparse voxel octree.
 * Includes depth-first, breadth-first, and custom traversal strategies.
 */

import { OctreeNode } from '../core/OctreeNode';
import { Voxel } from '../core/Voxel';

/**
 * Traversal order
 */
export enum TraversalOrder {
  /** Depth-first (pre-order) */
  DEPTH_FIRST_PRE = 'depth-first-pre',
  
  /** Depth-first (post-order) */
  DEPTH_FIRST_POST = 'depth-first-post',
  
  /** Breadth-first (level-order) */
  BREADTH_FIRST = 'breadth-first',
  
  /** Front-to-back (for rendering) */
  FRONT_TO_BACK = 'front-to-back',
  
  /** Back-to-front (for transparency) */
  BACK_TO_FRONT = 'back-to-front'
}

/**
 * Traversal callback
 */
export type TraversalCallback = (node: OctreeNode, depth: number) => boolean | void;

/**
 * Voxel callback
 */
export type VoxelCallback = (voxel: Voxel, depth: number) => boolean | void;

/**
 * Octree traversal utility class
 */
export class OctreeTraversal {
  /**
   * Traverse octree with specified order
   */
  static traverse(
    root: OctreeNode,
    callback: TraversalCallback,
    order: TraversalOrder = TraversalOrder.DEPTH_FIRST_PRE
  ): void {
    switch (order) {
      case TraversalOrder.DEPTH_FIRST_PRE:
        this.traverseDepthFirstPre(root, callback);
        break;
      
      case TraversalOrder.DEPTH_FIRST_POST:
        this.traverseDepthFirstPost(root, callback);
        break;
      
      case TraversalOrder.BREADTH_FIRST:
        this.traverseBreadthFirst(root, callback);
        break;
      
      default:
        this.traverseDepthFirstPre(root, callback);
    }
  }
  
  /**
   * Depth-first traversal (pre-order)
   */
  static traverseDepthFirstPre(
    node: OctreeNode,
    callback: TraversalCallback,
    depth: number = 0
  ): void {
    // Visit node first
    const shouldContinue = callback(node, depth);
    if (shouldContinue === false) return;
    
    // Then visit children
    if (node.children) {
      for (const child of node.children) {
        this.traverseDepthFirstPre(child, callback, depth + 1);
      }
    }
  }
  
  /**
   * Depth-first traversal (post-order)
   */
  static traverseDepthFirstPost(
    node: OctreeNode,
    callback: TraversalCallback,
    depth: number = 0
  ): void {
    // Visit children first
    if (node.children) {
      for (const child of node.children) {
        this.traverseDepthFirstPost(child, callback, depth + 1);
      }
    }
    
    // Then visit node
    callback(node, depth);
  }
  
  /**
   * Breadth-first traversal (level-order)
   */
  static traverseBreadthFirst(
    root: OctreeNode,
    callback: TraversalCallback
  ): void {
    const queue: Array<{ node: OctreeNode; depth: number }> = [{ node: root, depth: 0 }];
    
    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;
      
      // Visit node
      const shouldContinue = callback(node, depth);
      if (shouldContinue === false) continue;
      
      // Add children to queue
      if (node.children) {
        for (const child of node.children) {
          queue.push({ node: child, depth: depth + 1 });
        }
      }
    }
  }
  
  /**
   * Traverse only leaf nodes
   */
  static traverseLeaves(
    root: OctreeNode,
    callback: TraversalCallback
  ): void {
    this.traverseDepthFirstPre(root, (node, depth) => {
      if (node.isLeaf) {
        return callback(node, depth);
      }
      return true; // Continue to children
    });
  }
  
  /**
   * Traverse nodes at a specific depth level
   */
  static traverseLevel(
    root: OctreeNode,
    targetLevel: number,
    callback: TraversalCallback
  ): void {
    this.traverseDepthFirstPre(root, (node, depth) => {
      if (depth === targetLevel) {
        callback(node, depth);
        return false; // Don't go deeper
      }
      return true; // Continue to children
    });
  }
  
  /**
   * Traverse all voxels in the octree
   */
  static traverseVoxels(
    root: OctreeNode,
    callback: VoxelCallback
  ): void {
    this.traverseLeaves(root, (node, depth) => {
      if (node.voxels) {
        for (const voxel of node.voxels) {
          if (voxel.active) {
            const shouldContinue = callback(voxel, depth);
            if (shouldContinue === false) return false;
          }
        }
      }
      return true;
    });
  }
  
  /**
   * Collect all nodes at each depth level
   */
  static collectByLevel(root: OctreeNode): Map<number, OctreeNode[]> {
    const levels = new Map<number, OctreeNode[]>();
    
    this.traverseDepthFirstPre(root, (node, depth) => {
      const nodesAtLevel = levels.get(depth) || [];
      nodesAtLevel.push(node);
      levels.set(depth, nodesAtLevel);
      return true;
    });
    
    return levels;
  }
  
  /**
   * Find first node matching predicate
   */
  static findNode(
    root: OctreeNode,
    predicate: (node: OctreeNode) => boolean
  ): OctreeNode | null {
    let found: OctreeNode | null = null;
    
    this.traverseDepthFirstPre(root, (node) => {
      if (predicate(node)) {
        found = node;
        return false; // Stop traversal
      }
      return true;
    });
    
    return found;
  }
  
  /**
   * Find all nodes matching predicate
   */
  static findNodes(
    root: OctreeNode,
    predicate: (node: OctreeNode) => boolean
  ): OctreeNode[] {
    const nodes: OctreeNode[] = [];
    
    this.traverseDepthFirstPre(root, (node) => {
      if (predicate(node)) {
        nodes.push(node);
      }
      return true;
    });
    
    return nodes;
  }
  
  /**
   * Count nodes matching predicate
   */
  static countNodes(
    root: OctreeNode,
    predicate: (node: OctreeNode) => boolean
  ): number {
    let count = 0;
    
    this.traverseDepthFirstPre(root, (node) => {
      if (predicate(node)) {
        count++;
      }
      return true;
    });
    
    return count;
  }
  
  /**
   * Get path from root to a specific node
   */
  static getPathToNode(
    root: OctreeNode,
    targetNode: OctreeNode
  ): OctreeNode[] | null {
    const path: OctreeNode[] = [];
    
    const found = this.findPath(root, targetNode, path);
    return found ? path : null;
  }
  
  /**
   * Helper to find path recursively
   */
  private static findPath(
    node: OctreeNode,
    target: OctreeNode,
    path: OctreeNode[]
  ): boolean {
    path.push(node);
    
    if (node === target) {
      return true;
    }
    
    if (node.children) {
      for (const child of node.children) {
        if (this.findPath(child, target, path)) {
          return true;
        }
      }
    }
    
    path.pop();
    return false;
  }
  
  /**
   * Get all leaf nodes
   */
  static getLeafNodes(root: OctreeNode): OctreeNode[] {
    const leaves: OctreeNode[] = [];
    
    this.traverseLeaves(root, (node) => {
      leaves.push(node);
      return true;
    });
    
    return leaves;
  }
  
  /**
   * Get all nodes at a specific depth
   */
  static getNodesAtDepth(root: OctreeNode, depth: number): OctreeNode[] {
    const nodes: OctreeNode[] = [];
    
    this.traverseLevel(root, depth, (node) => {
      nodes.push(node);
      return true;
    });
    
    return nodes;
  }
  
  /**
   * Calculate tree statistics
   */
  static calculateStatistics(root: OctreeNode): {
    totalNodes: number;
    leafNodes: number;
    branchNodes: number;
    maxDepth: number;
    avgDepth: number;
    totalVoxels: number;
    avgVoxelsPerLeaf: number;
  } {
    let totalNodes = 0;
    let leafNodes = 0;
    let branchNodes = 0;
    let maxDepth = 0;
    let depthSum = 0;
    let totalVoxels = 0;
    
    this.traverseDepthFirstPre(root, (node, depth) => {
      totalNodes++;
      maxDepth = Math.max(maxDepth, depth);
      depthSum += depth;
      
      if (node.isLeaf) {
        leafNodes++;
        totalVoxels += node.voxels?.length ?? 0;
      } else {
        branchNodes++;
      }
      
      return true;
    });
    
    return {
      totalNodes,
      leafNodes,
      branchNodes,
      maxDepth,
      avgDepth: depthSum / totalNodes,
      totalVoxels,
      avgVoxelsPerLeaf: leafNodes > 0 ? totalVoxels / leafNodes : 0
    };
  }
}
