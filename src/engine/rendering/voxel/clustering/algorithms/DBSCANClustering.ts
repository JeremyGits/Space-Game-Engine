/**
 * DBSCAN Clustering
 * 
 * Density-Based Spatial Clustering of Applications with Noise.
 * Groups voxels based on density, can find arbitrarily shaped clusters.
 * 
 * Features:
 * - Density-based clustering
 * - Noise detection
 * - No need to specify cluster count
 * - Handles arbitrary shapes
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * DBSCAN configuration
 */
export interface DBSCANConfig {
  /** Epsilon - maximum distance for neighbors */
  epsilon?: number;
  
  /** Minimum points to form dense region */
  minPoints?: number;
  
  /** Distance metric */
  distanceMetric?: 'euclidean' | 'manhattan' | 'chebyshev';
  
  /** Include noise points in separate cluster */
  includeNoise?: boolean;
}

/**
 * DBSCAN result
 */
export interface DBSCANResult {
  /** Clusters */
  clusters: Array<{
    id: number;
    voxels: Voxel[];
    center: THREE.Vector3;
    color: THREE.Color;
    isNoise: boolean;
  }>;
  
  /** Number of clusters found */
  clusterCount: number;
  
  /** Number of noise points */
  noiseCount: number;
}

/**
 * Point classification
 */
enum PointType {
  UNVISITED = 0,
  NOISE = -1,
  CLUSTERED = 1
}

/**
 * DBSCAN clustering class
 */
export class DBSCANClustering {
  private config: Required<DBSCANConfig>;
  
  constructor(config: DBSCANConfig = {}) {
    this.config = {
      epsilon: config.epsilon ?? 1.0,
      minPoints: config.minPoints ?? 5,
      distanceMetric: config.distanceMetric ?? 'euclidean',
      includeNoise: config.includeNoise ?? true
    };
  }
  
  /**
   * Perform DBSCAN clustering
   */
  async cluster(voxels: Voxel[], config?: Partial<DBSCANConfig>): Promise<DBSCANResult> {
    const finalConfig = { ...this.config, ...config };
    
    if (voxels.length === 0) {
      return this.createEmptyResult();
    }
    
    // Initialize point classifications
    const labels = new Array(voxels.length).fill(PointType.UNVISITED);
    let clusterId = 0;
    
    // Process each point
    for (let i = 0; i < voxels.length; i++) {
      if (labels[i] !== PointType.UNVISITED) continue;
      
      // Find neighbors
      const neighbors = this.findNeighbors(voxels, i, finalConfig.epsilon);
      
      if (neighbors.length < finalConfig.minPoints) {
        // Mark as noise
        labels[i] = PointType.NOISE;
      } else {
        // Start new cluster
        this.expandCluster(voxels, labels, i, neighbors, clusterId, finalConfig);
        clusterId++;
      }
    }
    
    // Create result clusters
    return this.createResultClusters(voxels, labels, clusterId, finalConfig.includeNoise);
  }
  
  /**
   * Find neighbors within epsilon distance
   */
  private findNeighbors(voxels: Voxel[], index: number, epsilon: number): number[] {
    const neighbors: number[] = [];
    const point = voxels[index].position;
    
    for (let i = 0; i < voxels.length; i++) {
      if (i === index) continue;
      
      const distance = this.calculateDistance(point, voxels[i].position);
      if (distance <= epsilon) {
        neighbors.push(i);
      }
    }
    
    return neighbors;
  }
  
  /**
   * Expand cluster from seed point
   */
  private expandCluster(
    voxels: Voxel[],
    labels: number[],
    seedIndex: number,
    neighbors: number[],
    clusterId: number,
    config: Required<DBSCANConfig>
  ): void {
    labels[seedIndex] = clusterId;
    
    const queue = [...neighbors];
    
    while (queue.length > 0) {
      const currentIndex = queue.shift()!;
      
      // If noise, add to cluster
      if (labels[currentIndex] === PointType.NOISE) {
        labels[currentIndex] = clusterId;
      }
      
      // If already clustered, skip
      if (labels[currentIndex] !== PointType.UNVISITED) continue;
      
      // Add to cluster
      labels[currentIndex] = clusterId;
      
      // Find neighbors of current point
      const currentNeighbors = this.findNeighbors(voxels, currentIndex, config.epsilon);
      
      // If dense enough, add neighbors to queue
      if (currentNeighbors.length >= config.minPoints) {
        queue.push(...currentNeighbors);
      }
    }
  }
  
  /**
   * Calculate distance between two points
   */
  private calculateDistance(a: THREE.Vector3, b: THREE.Vector3): number {
    switch (this.config.distanceMetric) {
      case 'euclidean':
        return a.distanceTo(b);
      
      case 'manhattan':
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
      
      case 'chebyshev':
        return Math.max(
          Math.abs(a.x - b.x),
          Math.abs(a.y - b.y),
          Math.abs(a.z - b.z)
        );
      
      default:
        return a.distanceTo(b);
    }
  }
  
  /**
   * Create result clusters
   */
  private createResultClusters(
    voxels: Voxel[],
    labels: number[],
    clusterCount: number,
    includeNoise: boolean
  ): DBSCANResult {
    const clusterMap = new Map<number, Voxel[]>();
    let noiseCount = 0;
    
    // Group voxels by cluster
    for (let i = 0; i < voxels.length; i++) {
      const label = labels[i];
      
      if (label === PointType.NOISE) {
        noiseCount++;
        if (includeNoise) {
          if (!clusterMap.has(-1)) {
            clusterMap.set(-1, []);
          }
          clusterMap.get(-1)!.push(voxels[i]);
        }
      } else {
        if (!clusterMap.has(label)) {
          clusterMap.set(label, []);
        }
        clusterMap.get(label)!.push(voxels[i]);
      }
    }
    
    // Create cluster objects
    const clusters = Array.from(clusterMap.entries()).map(([id, voxels]) => {
      const center = this.calculateCenter(voxels);
      const color = this.calculateAverageColor(voxels);
      
      return {
        id,
        voxels,
        center,
        color,
        isNoise: id === -1
      };
    });
    
    return {
      clusters,
      clusterCount,
      noiseCount
    };
  }
  
  /**
   * Calculate cluster center
   */
  private calculateCenter(voxels: Voxel[]): THREE.Vector3 {
    if (voxels.length === 0) {
      return new THREE.Vector3();
    }
    
    const center = new THREE.Vector3();
    for (const voxel of voxels) {
      center.add(voxel.position);
    }
    center.divideScalar(voxels.length);
    
    return center;
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
   * Create empty result
   */
  private createEmptyResult(): DBSCANResult {
    return {
      clusters: [],
      clusterCount: 0,
      noiseCount: 0
    };
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<DBSCANConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): DBSCANConfig {
    return { ...this.config };
  }
}
