/**
 * Spatial Clustering
 * 
 * Groups voxels based on spatial proximity using grid-based partitioning.
 * Optimized for finding nearest neighbors and gap filling.
 * 
 * Features:
 * - Grid-based spatial hashing
 * - Fast nearest neighbor queries
 * - Gap detection
 * - Triangle filling for gaps
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * Spatial clustering configuration
 */
export interface SpatialClusteringConfig {
  /** Grid cell size */
  cellSize?: number;
  
  /** Maximum cluster radius */
  maxRadius?: number;
  
  /** Enable gap filling */
  enableGapFilling?: boolean;
  
  /** Gap threshold distance */
  gapThreshold?: number;
  
  /** Maximum neighbors to check */
  maxNeighbors?: number;
}

/**
 * Spatial cluster
 */
export interface SpatialCluster {
  /** Cluster ID */
  id: number;
  
  /** Voxels in cluster */
  voxels: Voxel[];
  
  /** Cluster center */
  center: THREE.Vector3;
  
  /** Cluster bounds */
  bounds: {
    min: THREE.Vector3;
    max: THREE.Vector3;
  };
  
  /** Average color */
  color: THREE.Color;
  
  /** Neighbor clusters */
  neighbors: number[];
  
  /** Gaps to fill */
  gaps?: Array<{
    position: THREE.Vector3;
    neighbors: number[];
  }>;
}

/**
 * Spatial clustering result
 */
export interface SpatialClusteringResult {
  /** Clusters */
  clusters: SpatialCluster[];
  
  /** Total gaps found */
  gapsFound: number;
  
  /** Grid statistics */
  gridStats: {
    cellCount: number;
    averageVoxelsPerCell: number;
    maxVoxelsPerCell: number;
  };
}

/**
 * Spatial clustering class
 */
export class SpatialClustering {
  private config: Required<SpatialClusteringConfig>;
  private grid: Map<string, Voxel[]> = new Map();
  
  constructor(config: SpatialClusteringConfig = {}) {
    this.config = {
      cellSize: config.cellSize ?? 2.0,
      maxRadius: config.maxRadius ?? 5.0,
      enableGapFilling: config.enableGapFilling ?? true,
      gapThreshold: config.gapThreshold ?? 1.5,
      maxNeighbors: config.maxNeighbors ?? 26
    };
  }
  
  /**
   * Perform spatial clustering
   */
  async cluster(voxels: Voxel[], config?: Partial<SpatialClusteringConfig>): Promise<SpatialClusteringResult> {
    const finalConfig = { ...this.config, ...config };
    
    if (voxels.length === 0) {
      return this.createEmptyResult();
    }
    
    // Build spatial grid
    this.buildGrid(voxels, finalConfig.cellSize);
    
    // Create clusters from grid cells
    const clusters = this.createClustersFromGrid();
    
    // Find neighbors
    this.findNeighbors(clusters, finalConfig.maxRadius);
    
    // Find gaps if enabled
    let gapsFound = 0;
    if (finalConfig.enableGapFilling) {
      gapsFound = this.findGaps(clusters, finalConfig.gapThreshold);
    }
    
    // Calculate grid statistics
    const gridStats = this.calculateGridStats();
    
    return {
      clusters,
      gapsFound,
      gridStats
    };
  }
  
  /**
   * Build spatial grid
   */
  private buildGrid(voxels: Voxel[], cellSize: number): void {
    this.grid.clear();
    
    for (const voxel of voxels) {
      const key = this.getGridKey(voxel.position, cellSize);
      
      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }
      
      this.grid.get(key)!.push(voxel);
    }
  }
  
  /**
   * Get grid key for position
   */
  private getGridKey(position: THREE.Vector3, cellSize: number): string {
    const x = Math.floor(position.x / cellSize);
    const y = Math.floor(position.y / cellSize);
    const z = Math.floor(position.z / cellSize);
    return `${x},${y},${z}`;
  }
  
  /**
   * Create clusters from grid cells
   */
  private createClustersFromGrid(): SpatialCluster[] {
    const clusters: SpatialCluster[] = [];
    let id = 0;
    
    for (const [key, voxels] of this.grid) {
      if (voxels.length === 0) continue;
      
      const center = this.calculateCenter(voxels);
      const bounds = this.calculateBounds(voxels);
      const color = this.calculateAverageColor(voxels);
      
      clusters.push({
        id: id++,
        voxels,
        center,
        bounds,
        color,
        neighbors: []
      });
    }
    
    return clusters;
  }
  
  /**
   * Find neighbor clusters
   */
  private findNeighbors(clusters: SpatialCluster[], maxRadius: number): void {
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const distance = clusters[i].center.distanceTo(clusters[j].center);
        
        if (distance <= maxRadius) {
          clusters[i].neighbors.push(j);
          clusters[j].neighbors.push(i);
        }
      }
    }
  }
  
  /**
   * Find gaps between clusters
   */
  private findGaps(clusters: SpatialCluster[], threshold: number): number {
    let totalGaps = 0;
    
    for (const cluster of clusters) {
      const gaps: SpatialCluster['gaps'] = [];
      
      // Check each neighbor
      for (const neighborId of cluster.neighbors) {
        const neighbor = clusters[neighborId];
        const distance = cluster.center.distanceTo(neighbor.center);
        
        // If gap is large enough, mark for filling
        if (distance > threshold) {
          // Calculate midpoint
          const midpoint = new THREE.Vector3()
            .addVectors(cluster.center, neighbor.center)
            .multiplyScalar(0.5);
          
          gaps.push({
            position: midpoint,
            neighbors: [cluster.id, neighborId]
          });
          
          totalGaps++;
        }
      }
      
      if (gaps.length > 0) {
        cluster.gaps = gaps;
      }
    }
    
    return totalGaps;
  }
  
  /**
   * Get nearest neighbors for position
   */
  getNearestNeighbors(
    position: THREE.Vector3,
    count: number = 3
  ): Voxel[] {
    const cellKey = this.getGridKey(position, this.config.cellSize);
    const neighbors: Array<{ voxel: Voxel; distance: number }> = [];
    
    // Check current cell and adjacent cells
    const [x, y, z] = cellKey.split(',').map(Number);
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${x + dx},${y + dy},${z + dz}`;
          const voxels = this.grid.get(key);
          
          if (voxels) {
            for (const voxel of voxels) {
              const distance = position.distanceTo(voxel.position);
              neighbors.push({ voxel, distance });
            }
          }
        }
      }
    }
    
    // Sort by distance and return top N
    neighbors.sort((a, b) => a.distance - b.distance);
    return neighbors.slice(0, count).map(n => n.voxel);
  }
  
  /**
   * Calculate cluster center
   */
  private calculateCenter(voxels: Voxel[]): THREE.Vector3 {
    const center = new THREE.Vector3();
    for (const voxel of voxels) {
      center.add(voxel.position);
    }
    center.divideScalar(voxels.length);
    return center;
  }
  
  /**
   * Calculate cluster bounds
   */
  private calculateBounds(voxels: Voxel[]): { min: THREE.Vector3; max: THREE.Vector3 } {
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    
    for (const voxel of voxels) {
      min.min(voxel.position);
      max.max(voxel.position);
    }
    
    return { min, max };
  }
  
  /**
   * Calculate average color
   */
  private calculateAverageColor(voxels: Voxel[]): THREE.Color {
    if (voxels.length === 0) {
      return new THREE.Color(0.5, 0.5, 0.5);
    }
    
    let r = 0, g = 0, b = 0;
    for (const voxel of voxels) {
      r += voxel.color.r;
      g += voxel.color.g;
      b += voxel.color.b;
    }
    
    return new THREE.Color(
      r / voxels.length,
      g / voxels.length,
      b / voxels.length
    );
  }
  
  /**
   * Calculate grid statistics
   */
  private calculateGridStats(): SpatialClusteringResult['gridStats'] {
    let totalVoxels = 0;
    let maxVoxels = 0;
    
    for (const voxels of this.grid.values()) {
      totalVoxels += voxels.length;
      maxVoxels = Math.max(maxVoxels, voxels.length);
    }
    
    return {
      cellCount: this.grid.size,
      averageVoxelsPerCell: this.grid.size > 0 ? totalVoxels / this.grid.size : 0,
      maxVoxelsPerCell: maxVoxels
    };
  }
  
  /**
   * Create empty result
   */
  private createEmptyResult(): SpatialClusteringResult {
    return {
      clusters: [],
      gapsFound: 0,
      gridStats: {
        cellCount: 0,
        averageVoxelsPerCell: 0,
        maxVoxelsPerCell: 0
      }
    };
  }
  
  /**
   * Clear grid
   */
  clear(): void {
    this.grid.clear();
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<SpatialClusteringConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): SpatialClusteringConfig {
    return { ...this.config };
  }
}
