/**
 * K-Means Clustering
 *
 * Partitions voxels into k clusters where each voxel belongs to the cluster
 * with the nearest mean (centroid).
 *
 * Features:
 * - Iterative centroid calculation
 * - Convergence detection
 * - Multiple initialization methods
 * - Outlier handling
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * K-means configuration
 */
export interface KMeansConfig {
  /** Number of clusters (k) */
  k?: number;

  /** Maximum iterations */
  maxIterations?: number;

  /** Convergence threshold */
  convergenceThreshold?: number;

  /** Initialization method */
  initialization?: 'random' | 'farthest' | 'k-means++';

  /** Distance metric */
  distanceMetric?: 'euclidean' | 'manhattan' | 'chebyshev';

  /** Enable outlier detection */
  enableOutliers?: boolean;

  /** Outlier threshold (standard deviations) */
  outlierThreshold?: number;
}

/**
 * K-means result
 */
export interface KMeansResult {
  /** Clusters */
  clusters: Array<{
    centroid: THREE.Vector3;
    voxels: Voxel[];
    color: THREE.Color;
  }>;

  /** Number of iterations */
  iterations: number;

  /** Convergence achieved */
  converged: boolean;

  /** Final error */
  error: number;
}

/**
 * K-means clustering class
 */
export class KMeansClustering {
  private config: Required<KMeansConfig>;

  constructor(config: KMeansConfig = {}) {
    this.config = {
      k: config.k ?? 10,
      maxIterations: config.maxIterations ?? 100,
      convergenceThreshold: config.convergenceThreshold ?? 0.001,
      initialization: config.initialization ?? 'k-means++',
      distanceMetric: config.distanceMetric ?? 'euclidean',
      enableOutliers: config.enableOutliers ?? false,
      outlierThreshold: config.outlierThreshold ?? 2.0
    };
  }

  /**
   * Perform K-means clustering
   */
  async cluster(voxels: Voxel[], config?: Partial<KMeansConfig>): Promise<KMeansResult> {
    const finalConfig = { ...this.config, ...config };
    const k = Math.min(finalConfig.k, voxels.length);

    if (k <= 0 || voxels.length === 0) {
      return this.createEmptyResult();
    }

    // Initialize centroids
    let centroids = this.initializeCentroids(voxels, k);

    let iterations = 0;
    let converged = false;
    let previousError = Infinity;

    while (iterations < finalConfig.maxIterations && !converged) {
      // Assign voxels to nearest centroids
      const clusters = this.assignVoxelsToCentroids(voxels, centroids);

      // Update centroids
      const newCentroids = this.updateCentroids(clusters);

      // Check convergence
      const currentError = this.calculateError(clusters, newCentroids);
      converged = Math.abs(previousError - currentError) < finalConfig.convergenceThreshold;

      centroids = newCentroids;
      previousError = currentError;
      iterations++;
    }

    // Create final clusters
    const finalClusters = this.assignVoxelsToCentroids(voxels, centroids);
    const resultClusters = this.createResultClusters(finalClusters, centroids);

    // Handle outliers if enabled
    if (finalConfig.enableOutliers) {
      this.handleOutliers(resultClusters, finalConfig.outlierThreshold);
    }

    return {
      clusters: resultClusters,
      iterations,
      converged,
      error: previousError
    };
  }

  /**
   * Initialize centroids
   */
  private initializeCentroids(voxels: Voxel[], k: number): THREE.Vector3[] {
    switch (this.config.initialization) {
      case 'random':
        return this.initializeRandom(voxels, k);

      case 'farthest':
        return this.initializeFarthest(voxels, k);

      case 'k-means++':
        return this.initializeKMeansPlusPlus(voxels, k);

      default:
        return this.initializeRandom(voxels, k);
    }
  }

  /**
   * Random initialization
   */
  private initializeRandom(voxels: Voxel[], k: number): THREE.Vector3[] {
    const centroids: THREE.Vector3[] = [];
    const used = new Set<number>();

    for (let i = 0; i < k; i++) {
      let index: number;
      do {
        index = Math.floor(Math.random() * voxels.length);
      } while (used.has(index));

      used.add(index);
      centroids.push(voxels[index].position.clone());
    }

    return centroids;
  }

  /**
   * Farthest-first initialization
   */
  private initializeFarthest(voxels: Voxel[], k: number): THREE.Vector3[] {
    const centroids: THREE.Vector3[] = [];

    // Start with random centroid
    centroids.push(voxels[Math.floor(Math.random() * voxels.length)].position.clone());

    for (let i = 1; i < k; i++) {
      let farthestIndex = 0;
      let maxDistance = 0;

      // Find voxel farthest from all existing centroids
      for (let j = 0; j < voxels.length; j++) {
        const minDistance = Math.min(
          ...centroids.map(centroid => voxels[j].position.distanceTo(centroid))
        );

        if (minDistance > maxDistance) {
          maxDistance = minDistance;
          farthestIndex = j;
        }
      }

      centroids.push(voxels[farthestIndex].position.clone());
    }

    return centroids;
  }

  /**
   * K-means++ initialization
   */
  private initializeKMeansPlusPlus(voxels: Voxel[], k: number): THREE.Vector3[] {
    const centroids: THREE.Vector3[] = [];

    // Choose first centroid randomly
    centroids.push(voxels[Math.floor(Math.random() * voxels.length)].position.clone());

    for (let i = 1; i < k; i++) {
      const distances = new Array(voxels.length).fill(0);

      // Calculate squared distances to nearest centroid
      for (let j = 0; j < voxels.length; j++) {
        let minDistance = Infinity;
        for (const centroid of centroids) {
          const distance = voxels[j].position.distanceToSquared(centroid);
          minDistance = Math.min(minDistance, distance);
        }
        distances[j] = minDistance;
      }

      // Choose next centroid with probability proportional to distance squared
      const totalDistance = distances.reduce((sum, d) => sum + d, 0);
      let random = Math.random() * totalDistance;

      for (let j = 0; j < distances.length; j++) {
        random -= distances[j];
        if (random <= 0) {
          centroids.push(voxels[j].position.clone());
          break;
        }
      }
    }

    return centroids;
  }

  /**
   * Assign voxels to nearest centroids
   */
  private assignVoxelsToCentroids(
    voxels: Voxel[],
    centroids: THREE.Vector3[]
  ): Voxel[][] {
    const clusters: Voxel[][] = Array.from({ length: centroids.length }, () => []);

    for (const voxel of voxels) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < centroids.length; i++) {
        const distance = this.calculateDistance(voxel.position, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      clusters[nearestIndex].push(voxel);
    }

    return clusters;
  }

  /**
   * Update centroids based on cluster assignments
   */
  private updateCentroids(clusters: Voxel[][]): THREE.Vector3[] {
    return clusters.map(cluster => {
      if (cluster.length === 0) {
        // Keep centroid unchanged if cluster is empty
        return new THREE.Vector3();
      }

      const centroid = new THREE.Vector3();
      for (const voxel of cluster) {
        centroid.add(voxel.position);
      }
      centroid.divideScalar(cluster.length);

      return centroid;
    });
  }

  /**
   * Calculate total error (sum of squared distances)
   */
  private calculateError(clusters: Voxel[][], centroids: THREE.Vector3[]): number {
    let totalError = 0;

    for (let i = 0; i < clusters.length; i++) {
      for (const voxel of clusters[i]) {
        const distance = this.calculateDistance(voxel.position, centroids[i]);
        totalError += distance * distance;
      }
    }

    return totalError;
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
    clusters: Voxel[][],
    centroids: THREE.Vector3[]
  ): KMeansResult['clusters'] {
    return clusters.map((voxels, index) => {
      // Calculate average color
      const color = this.calculateAverageColor(voxels);

      return {
        centroid: centroids[index],
        voxels,
        color
      };
    });
  }

  /**
   * Handle outliers
   */
  private handleOutliers(
    clusters: KMeansResult['clusters'],
    threshold: number
  ): void {
    for (const cluster of clusters) {
      if (cluster.voxels.length < 3) continue;

      // Calculate distances from centroid
      const distances = cluster.voxels.map(voxel =>
        voxel.position.distanceTo(cluster.centroid)
      );

      // Calculate mean and standard deviation
      const mean = distances.reduce((sum, d) => sum + d, 0) / distances.length;
      const variance = distances.reduce((sum, d) => sum + (d - mean) ** 2, 0) / distances.length;
      const stdDev = Math.sqrt(variance);

      // Remove outliers
      const thresholdDistance = mean + threshold * stdDev;
      cluster.voxels = cluster.voxels.filter((_, index) => distances[index] <= thresholdDistance);
    }
  }

  /**
   * Calculate average color of voxels
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
  private createEmptyResult(): KMeansResult {
    return {
      clusters: [],
      iterations: 0,
      converged: true,
      error: 0
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<KMeansConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): KMeansConfig {
    return { ...this.config };
  }
}
