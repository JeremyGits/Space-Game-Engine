/**
 * Fast Similarity Search using KD-Tree
 * Efficiently finds similar components in large databases
 * O(log n) search complexity
 */

import type { ComponentSignature } from '../../../../types/cv/SegmentationTypes';

interface KDNode {
  signature: ComponentSignature;
  left: KDNode | null;
  right: KDNode | null;
  axis: number;
}

export class SimilaritySearch {
  private root: KDNode | null = null;
  private dimensions: number = 5; // Number of features in descriptor
  
  /**
   * Build KD-tree from signatures
   */
  buildIndex(signatures: ComponentSignature[]): void {
    if (signatures.length === 0) {
      this.root = null;
      return;
    }
    
    this.root = this.buildTree(signatures, 0);
    console.log(`🌳 Built KD-tree index with ${signatures.length} signatures`);
  }
  
  /**
   * Build KD-tree recursively
   */
  private buildTree(signatures: ComponentSignature[], depth: number): KDNode | null {
    if (signatures.length === 0) return null;
    
    const axis = depth % this.dimensions;
    
    // Sort by current axis
    signatures.sort((a, b) => {
      const valA = this.getFeatureValue(a, axis);
      const valB = this.getFeatureValue(b, axis);
      return valA - valB;
    });
    
    const median = Math.floor(signatures.length / 2);
    
    return {
      signature: signatures[median],
      axis,
      left: this.buildTree(signatures.slice(0, median), depth + 1),
      right: this.buildTree(signatures.slice(median + 1), depth + 1),
    };
  }
  
  /**
   * Find k nearest neighbors
   */
  findNearest(
    query: number[],
    k: number = 5
  ): Array<{ signature: ComponentSignature; distance: number }> {
    if (!this.root) return [];
    
    const results: Array<{ signature: ComponentSignature; distance: number }> = [];
    this.searchTree(this.root, query, k, results);
    
    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);
    
    return results.slice(0, k);
  }
  
  /**
   * Search KD-tree
   */
  private searchTree(
    node: KDNode | null,
    query: number[],
    k: number,
    results: Array<{ signature: ComponentSignature; distance: number }>
  ): void {
    if (!node) return;
    
    // Calculate distance to current node
    const distance = this.calculateDistance(query, node.signature.shapeDescriptor);
    
    // Add to results
    results.push({ signature: node.signature, distance });
    
    // Keep only k best
    if (results.length > k) {
      results.sort((a, b) => a.distance - b.distance);
      results.pop();
    }
    
    // Determine which subtree to search first
    const queryValue = query[node.axis] || 0;
    const nodeValue = this.getFeatureValue(node.signature, node.axis);
    
    const goLeft = queryValue < nodeValue;
    const nearNode = goLeft ? node.left : node.right;
    const farNode = goLeft ? node.right : node.left;
    
    // Search near subtree
    this.searchTree(nearNode, query, k, results);
    
    // Check if we need to search far subtree
    const worstDistance = results.length < k ? Infinity : results[results.length - 1].distance;
    const axisDiff = Math.abs(queryValue - nodeValue);
    
    if (axisDiff < worstDistance) {
      this.searchTree(farNode, query, k, results);
    }
  }
  
  /**
   * Calculate Euclidean distance
   */
  private calculateDistance(vec1: number[], vec2: number[]): number {
    let sum = 0;
    const len = Math.min(vec1.length, vec2.length);
    
    for (let i = 0; i < len; i++) {
      const diff = (vec1[i] || 0) - (vec2[i] || 0);
      sum += diff * diff;
    }
    
    return Math.sqrt(sum);
  }
  
  /**
   * Get feature value by axis
   */
  private getFeatureValue(signature: ComponentSignature, axis: number): number {
    return signature.shapeDescriptor[axis] || 0;
  }
  
  /**
   * Get index statistics
   */
  getStats(): { indexed: boolean; nodeCount: number } {
    return {
      indexed: this.root !== null,
      nodeCount: this.countNodes(this.root),
    };
  }
  
  /**
   * Count nodes in tree
   */
  private countNodes(node: KDNode | null): number {
    if (!node) return 0;
    return 1 + this.countNodes(node.left) + this.countNodes(node.right);
  }
  
  /**
   * Clear index
   */
  clear(): void {
    this.root = null;
  }
}
