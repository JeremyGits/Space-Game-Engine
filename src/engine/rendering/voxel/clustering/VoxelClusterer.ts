/**
 * Voxel Clusterer
 * 
 * Main clustering system that coordinates different clustering algorithms.
 * Implements nearest neighbor gap filling with triangles/voxels.
 * 
 * Features:
 * - Multiple clustering algorithms
 * - Adaptive algorithm selection
 * - Gap detection and filling
 * - Triangle generation for gaps
 * - Performance optimization
 */

import * as THREE from 'three';
import { Voxel } from '../core/Voxel';
import {
  KMeansClustering,
  DBSCANClustering,
  SpatialClustering,
  ColorClustering
} from './algorithms';

/**
 * Clustering algorithm type
 */
export enum ClusteringAlgorithm {
  KMEANS = 'kmeans',
  DBSCAN = 'dbscan',
  SPATIAL = 'spatial',
  COLOR = 'color',
  HYBRID = 'hybrid'
}

/**
 * Cluster data
 */
export interface Cluster {
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
    size: THREE.Vector3;
  };
  
  /** Average color */
  color: THREE.Color;
  
  /** Neighbor cluster IDs */
  neighbors: number[];
  
  /** Density */
  density: number;
  
  /** Quality score */
  quality: number;
}

/**
 * Gap fill data
 */
export interface GapFill {
  /** Gap position */
  position: THREE.Vector3;
  
  /** Neighbor clusters */
  neighborClusters: number[];
  
  /** Interpolated color */
  color: THREE.Color;
  
  /** Fill type */
  type: 'voxel' | 'triangle';
  
  /** Triangle vertices (if type is triangle) */
  triangleVertices?: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
}

/**
 * Clustering options
 */
export interface ClusteringOptions {
  /** Algorithm to use */
  algorithm?: ClusteringAlgorithm;
  
  /** Maximum cluster size */
  maxClusterSize?: number;
  
  /** Minimum cluster size */
  minClusterSize?: number;
  
  /** Enable gap filling */
  enableGapFilling?: boolean;
  
  /** Gap threshold distance */
  gapThreshold?: number;
  
  /** Color threshold for grouping */
  colorThreshold?: number;
  
  /** Spatial threshold for grouping */
  spatialThreshold?: number;
}

/**
 * Clustering result
 */
export interface ClusteringResult {
  /** Clusters */
  clusters: Cluster[];
  
  /** Gap fills */
  gapFills: GapFill[];
  
  /** Metrics */
  metrics: {
    clusterCount: number;
    averageClusterSize: number;
    gapsFilled: number;
    processingTime: number;
  };
}

/**
 * Voxel clusterer class
 */
export class VoxelClusterer {
  private options: Required<ClusteringOptions>;
  private kmeansAlgorithm: KMeansClustering;
  private dbscanAlgorithm: DBSCANClustering;
  private spatialAlgorithm: SpatialClustering;
  private colorAlgorithm: ColorClustering;
  
  constructor(options: ClusteringOptions = {}) {
    this.options = {
      algorithm: options.algorithm ?? ClusteringAlgorithm.SPATIAL,
      maxClusterSize: options.maxClusterSize ?? 1000,
      minClusterSize: options.minClusterSize ?? 10,
      enableGapFilling: options.enableGapFilling ?? true,
      gapThreshold: options.gapThreshold ?? 2.0,
      colorThreshold: options.colorThreshold ?? 0.1,
      spatialThreshold: options.spatialThreshold ?? 5.0
    };
    
    // Initialize algorithms
    this.kmeansAlgorithm = new KMeansClustering();
    this.dbscanAlgorithm = new DBSCANClustering();
    this.spatialAlgorithm = new SpatialClustering();
    this.colorAlgorithm = new ColorClustering();
  }
  
  /**
   * Perform clustering
   */
  async cluster(voxels: Voxel[]): Promise<ClusteringResult> {
    const startTime = performance.now();
    
    if (voxels.length === 0) {
      return this.createEmptyResult();
    }
    
    // Run clustering algorithm
    const rawClusters = await this.runAlgorithm(voxels);
    
    // Process clusters
    let clusters = this.processClusters(rawClusters);
    
    // Merge small clusters
    clusters = this.mergeSmallClusters(clusters);
    
    // Split large clusters
    clusters = this.splitLargeClusters(clusters);
    
    // Update neighbors
    this.updateNeighbors(clusters);
    
    // Fill gaps if enabled
    const gapFills = this.options.enableGapFilling
      ? this.fillGaps(clusters)
      : [];
    
    // Calculate metrics
    const processingTime = performance.now() - startTime;
    const metrics = this.calculateMetrics(clusters, gapFills, processingTime);
    
    return {
      clusters,
      gapFills,
      metrics
    };
  }
  
  /**
   * Run clustering algorithm
   */
  private async runAlgorithm(voxels: Voxel[]): Promise<any[]> {
    let result: any;
    
    switch (this.options.algorithm) {
      case ClusteringAlgorithm.KMEANS:
        result = await this.kmeansAlgorithm.cluster(voxels);
        break;
      
      case ClusteringAlgorithm.DBSCAN:
        result = await this.dbscanAlgorithm.cluster(voxels);
        break;
      
      case ClusteringAlgorithm.SPATIAL:
        result = await this.spatialAlgorithm.cluster(voxels);
        break;
      
      case ClusteringAlgorithm.COLOR:
        result = await this.colorAlgorithm.cluster(voxels);
        break;
      
      default:
        result = await this.spatialAlgorithm.cluster(voxels);
    }
    
    return result.clusters || [];
  }
  
  /**
   * Process raw clusters into standard format
   */
  private processClusters(rawClusters: any[]): Cluster[] {
    return rawClusters.map((raw, index) => {
      const voxels = raw.voxels || [];
      const center = raw.center || raw.centroid || this.calculateCenter(voxels);
      const bounds = this.calculateBounds(voxels);
      const color = raw.color || this.calculateAverageColor(voxels);
      const density = voxels.length / this.calculateVolume(bounds);
      
      return {
        id: index,
        voxels,
        center,
        bounds,
        color,
        neighbors: [],
        density,
        quality: this.calculateQuality(voxels, bounds)
      };
    });
  }
  
  /**
   * Merge small clusters with nearest neighbor
   */
  private mergeSmallClusters(clusters: Cluster[]): Cluster[] {
    const merged: Cluster[] = [];
    const toMerge: number[] = [];
    
    // Find small clusters
    for (let i = 0; i < clusters.length; i++) {
      if (clusters[i].voxels.length < this.options.minClusterSize) {
        toMerge.push(i);
      } else {
        merged.push(clusters[i]);
      }
    }
    
    // Merge each small cluster with nearest
    for (const smallIndex of toMerge) {
      const small = clusters[smallIndex];
      const nearestIndex = this.findNearestCluster(small, merged);
      
      if (nearestIndex !== null) {
        // Merge into nearest
        merged[nearestIndex].voxels.push(...small.voxels);
        merged[nearestIndex].center = this.calculateCenter(merged[nearestIndex].voxels);
        merged[nearestIndex].bounds = this.calculateBounds(merged[nearestIndex].voxels);
        merged[nearestIndex].color = this.calculateAverageColor(merged[nearestIndex].voxels);
      } else {
        // Keep as separate cluster if no merge target
        merged.push(small);
      }
    }
    
    // Reassign IDs
    merged.forEach((cluster, index) => {
      cluster.id = index;
    });
    
    return merged;
  }
  
  /**
   * Split large clusters
   */
  private splitLargeClusters(clusters: Cluster[]): Cluster[] {
    const result: Cluster[] = [];
    
    for (const cluster of clusters) {
      if (cluster.voxels.length > this.options.maxClusterSize) {
        // Split using spatial partitioning
        const subclusters = this.spatialSplit(cluster);
        result.push(...subclusters);
      } else {
        result.push(cluster);
      }
    }
    
    // Reassign IDs
    result.forEach((cluster, index) => {
      cluster.id = index;
    });
    
    return result;
  }
  
  /**
   * Split cluster spatially
   */
  private spatialSplit(cluster: Cluster): Cluster[] {
    const subclusters: Cluster[] = [];
    const center = cluster.center;
    
    // Create 8 octants
    const octants: Voxel[][] = Array.from({ length: 8 }, () => []);
    
    for (const voxel of cluster.voxels) {
      const octant =
        (voxel.position.x >= center.x ? 1 : 0) +
        (voxel.position.y >= center.y ? 2 : 0) +
        (voxel.position.z >= center.z ? 4 : 0);
      
      octants[octant].push(voxel);
    }
    
    // Create subclusters from non-empty octants
    for (const voxels of octants) {
      if (voxels.length > 0) {
        const subCenter = this.calculateCenter(voxels);
        const subBounds = this.calculateBounds(voxels);
        const subColor = this.calculateAverageColor(voxels);
        
        subclusters.push({
          id: 0, // Will be reassigned
          voxels,
          center: subCenter,
          bounds: subBounds,
          color: subColor,
          neighbors: [],
          density: voxels.length / this.calculateVolume(subBounds),
          quality: this.calculateQuality(voxels, subBounds)
        });
      }
    }
    
    return subclusters;
  }
  
  /**
   * Update neighbor relationships
   */
  private updateNeighbors(clusters: Cluster[]): void {
    // Clear existing neighbors
    for (const cluster of clusters) {
      cluster.neighbors = [];
    }
    
    // Find new neighbors
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        if (this.areNeighbors(clusters[i], clusters[j])) {
          clusters[i].neighbors.push(j);
          clusters[j].neighbors.push(i);
        }
      }
    }
  }
  
  /**
   * Check if two clusters are neighbors
   */
  private areNeighbors(clusterA: Cluster, clusterB: Cluster): boolean {
    const distance = clusterA.center.distanceTo(clusterB.center);
    const radiusA = this.calculateRadius(clusterA.bounds);
    const radiusB = this.calculateRadius(clusterB.bounds);
    
    return distance <= (radiusA + radiusB) * 1.5;
  }
  
  /**
   * Find nearest cluster
   */
  private findNearestCluster(cluster: Cluster, clusters: Cluster[]): number | null {
    let nearestIndex: number | null = null;
    let minDistance = Infinity;
    
    for (let i = 0; i < clusters.length; i++) {
      if (clusters[i].id === cluster.id) continue;
      
      const distance = cluster.center.distanceTo(clusters[i].center);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }
    
    return nearestIndex;
  }
  
  /**
   * Fill gaps between clusters
   */
  private fillGaps(clusters: Cluster[]): GapFill[] {
    const gaps: GapFill[] = [];
    
    for (const cluster of clusters) {
      for (const neighborId of cluster.neighbors) {
        const neighbor = clusters[neighborId];
        const distance = cluster.center.distanceTo(neighbor.center);
        
        // Check if gap is large enough to fill
        if (distance > this.options.gapThreshold) {
          const gapFill = this.createGapFill(cluster, neighbor, distance);
          if (gapFill) {
            gaps.push(gapFill);
          }
        }
      }
    }
    
    return gaps;
  }
  
  /**
   * Create gap fill between two clusters
   */
  private createGapFill(
    clusterA: Cluster,
    clusterB: Cluster,
    distance: number
  ): GapFill | null {
    // Calculate midpoint
    const midpoint = new THREE.Vector3()
      .addVectors(clusterA.center, clusterB.center)
      .multiplyScalar(0.5);
    
    // Interpolate color
    const factor = 0.5;
    const color = new THREE.Color(
      clusterA.color.r * (1 - factor) + clusterB.color.r * factor,
      clusterA.color.g * (1 - factor) + clusterB.color.g * factor,
      clusterA.color.b * (1 - factor) + clusterB.color.b * factor
    );
    
    // Determine fill type based on distance
    if (distance < this.options.gapThreshold * 2) {
      // Small gap - fill with voxel
      return {
        position: midpoint,
        neighborClusters: [clusterA.id, clusterB.id],
        color,
        type: 'voxel'
      };
    } else {
      // Large gap - fill with triangle
      // Find nearest voxels from each cluster
      const voxelA = this.findNearestVoxel(clusterA.voxels, midpoint);
      const voxelB = this.findNearestVoxel(clusterB.voxels, midpoint);
      
      if (!voxelA || !voxelB) return null;
      
      return {
        position: midpoint,
        neighborClusters: [clusterA.id, clusterB.id],
        color,
        type: 'triangle',
        triangleVertices: [
          voxelA.position,
          midpoint,
          voxelB.position
        ]
      };
    }
  }
  
  /**
   * Find nearest voxel to position
   */
  private findNearestVoxel(voxels: Voxel[], position: THREE.Vector3): Voxel | null {
    if (voxels.length === 0) return null;
    
    let nearest = voxels[0];
    let minDistance = position.distanceTo(voxels[0].position);
    
    for (let i = 1; i < voxels.length; i++) {
      const distance = position.distanceTo(voxels[i].position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = voxels[i];
      }
    }
    
    return nearest;
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
  private calculateBounds(voxels: Voxel[]): Cluster['bounds'] {
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    
    for (const voxel of voxels) {
      min.min(voxel.position);
      max.max(voxel.position);
    }
    
    const size = new THREE.Vector3().subVectors(max, min);
    
    return { min, max, size };
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
   * Calculate volume of bounds
   */
  private calculateVolume(bounds: Cluster['bounds']): number {
    return bounds.size.x * bounds.size.y * bounds.size.z;
  }
  
  /**
   * Calculate radius from bounds
   */
  private calculateRadius(bounds: Cluster['bounds']): number {
    return bounds.size.length() / 2;
  }
  
  /**
   * Calculate cluster quality
   */
  private calculateQuality(voxels: Voxel[], bounds: Cluster['bounds']): number {
    if (voxels.length === 0) return 0;
    
    // Quality based on density and compactness
    const volume = this.calculateVolume(bounds);
    const density = voxels.length / Math.max(volume, 0.001);
    
    // Normalize to 0-1 range
    return Math.min(density / 10, 1.0);
  }
  
  /**
   * Calculate metrics
   */
  private calculateMetrics(
    clusters: Cluster[],
    gapFills: GapFill[],
    processingTime: number
  ): ClusteringResult['metrics'] {
    const totalVoxels = clusters.reduce((sum, c) => sum + c.voxels.length, 0);
    
    return {
      clusterCount: clusters.length,
      averageClusterSize: clusters.length > 0 ? totalVoxels / clusters.length : 0,
      gapsFilled: gapFills.length,
      processingTime
    };
  }
  
  /**
   * Create empty result
   */
  private createEmptyResult(): ClusteringResult {
    return {
      clusters: [],
      gapFills: [],
      metrics: {
        clusterCount: 0,
        averageClusterSize: 0,
        gapsFilled: 0,
        processingTime: 0
      }
    };
  }
  
  /**
   * Update options
   */
  updateOptions(options: Partial<ClusteringOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * Get current options
   */
  getOptions(): ClusteringOptions {
    return { ...this.options };
  }
}
