/**
 * Color Clustering
 * 
 * Groups voxels based on color similarity.
 * Useful for material segmentation and texture optimization.
 * 
 * Features:
 * - RGB/HSV color space
 * - Perceptual color distance
 * - Adaptive thresholds
 * - Material grouping
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * Color space
 */
export enum ColorSpace {
  RGB = 'rgb',
  HSV = 'hsv',
  LAB = 'lab'
}

/**
 * Color clustering configuration
 */
export interface ColorClusteringConfig {
  /** Color space to use */
  colorSpace?: ColorSpace;
  
  /** Color distance threshold */
  threshold?: number;
  
  /** Minimum cluster size */
  minClusterSize?: number;
  
  /** Use perceptual distance */
  perceptual?: boolean;
  
  /** Weight for spatial proximity */
  spatialWeight?: number;
}

/**
 * Color cluster
 */
export interface ColorCluster {
  /** Cluster ID */
  id: number;
  
  /** Voxels in cluster */
  voxels: Voxel[];
  
  /** Representative color */
  color: THREE.Color;
  
  /** Color variance */
  variance: number;
  
  /** Spatial center */
  center: THREE.Vector3;
}

/**
 * Color clustering result
 */
export interface ColorClusteringResult {
  /** Clusters */
  clusters: ColorCluster[];
  
  /** Number of unique colors */
  uniqueColors: number;
  
  /** Color palette */
  palette: THREE.Color[];
}

/**
 * Color clustering class
 */
export class ColorClustering {
  private config: Required<ColorClusteringConfig>;
  
  constructor(config: ColorClusteringConfig = {}) {
    this.config = {
      colorSpace: config.colorSpace ?? ColorSpace.RGB,
      threshold: config.threshold ?? 0.1,
      minClusterSize: config.minClusterSize ?? 1,
      perceptual: config.perceptual ?? true,
      spatialWeight: config.spatialWeight ?? 0.1
    };
  }
  
  /**
   * Perform color clustering
   */
  async cluster(voxels: Voxel[], config?: Partial<ColorClusteringConfig>): Promise<ColorClusteringResult> {
    const finalConfig = { ...this.config, ...config };
    
    if (voxels.length === 0) {
      return this.createEmptyResult();
    }
    
    // Group by color similarity
    const colorGroups = this.groupByColor(voxels, finalConfig);
    
    // Create clusters
    const clusters = this.createClusters(colorGroups);
    
    // Extract palette
    const palette = clusters.map(c => c.color);
    
    return {
      clusters,
      uniqueColors: clusters.length,
      palette
    };
  }
  
  /**
   * Group voxels by color similarity
   */
  private groupByColor(
    voxels: Voxel[],
    config: Required<ColorClusteringConfig>
  ): Map<number, Voxel[]> {
    const groups = new Map<number, Voxel[]>();
    const representatives: THREE.Color[] = [];
    let nextId = 0;
    
    for (const voxel of voxels) {
      let assignedGroup = -1;
      let minDistance = Infinity;
      
      // Find closest color group
      for (let i = 0; i < representatives.length; i++) {
        const distance = this.calculateColorDistance(
          voxel.color,
          representatives[i],
          config.colorSpace,
          config.perceptual
        );
        
        // Consider spatial proximity if weight > 0
        let finalDistance = distance;
        if (config.spatialWeight > 0 && groups.get(i)) {
          const spatialDist = this.calculateSpatialDistance(
            voxel,
            groups.get(i)!
          );
          finalDistance = distance * (1 - config.spatialWeight) + spatialDist * config.spatialWeight;
        }
        
        if (finalDistance < config.threshold && finalDistance < minDistance) {
          minDistance = finalDistance;
          assignedGroup = i;
        }
      }
      
      // Create new group if no match
      if (assignedGroup === -1) {
        assignedGroup = nextId++;
        representatives.push(voxel.color.clone());
        groups.set(assignedGroup, []);
      }
      
      groups.get(assignedGroup)!.push(voxel);
    }
    
    return groups;
  }
  
  /**
   * Calculate color distance
   */
  private calculateColorDistance(
    colorA: THREE.Color,
    colorB: THREE.Color,
    colorSpace: ColorSpace,
    perceptual: boolean
  ): number {
    switch (colorSpace) {
      case ColorSpace.RGB:
        return this.rgbDistance(colorA, colorB, perceptual);
      
      case ColorSpace.HSV:
        return this.hsvDistance(colorA, colorB);
      
      case ColorSpace.LAB:
        return this.labDistance(colorA, colorB);
      
      default:
        return this.rgbDistance(colorA, colorB, perceptual);
    }
  }
  
  /**
   * RGB color distance
   */
  private rgbDistance(colorA: THREE.Color, colorB: THREE.Color, perceptual: boolean): number {
    if (perceptual) {
      // Weighted Euclidean distance (perceptual)
      const dr = colorA.r - colorB.r;
      const dg = colorA.g - colorB.g;
      const db = colorA.b - colorB.b;
      
      // Weights based on human perception
      return Math.sqrt(
        0.299 * dr * dr +
        0.587 * dg * dg +
        0.114 * db * db
      );
    } else {
      // Simple Euclidean distance
      const dr = colorA.r - colorB.r;
      const dg = colorA.g - colorB.g;
      const db = colorA.b - colorB.b;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    }
  }
  
  /**
   * HSV color distance
   */
  private hsvDistance(colorA: THREE.Color, colorB: THREE.Color): number {
    const hsvA = this.rgbToHsv(colorA);
    const hsvB = this.rgbToHsv(colorB);
    
    // Circular hue distance
    let dh = Math.abs(hsvA.h - hsvB.h);
    if (dh > 0.5) dh = 1 - dh;
    
    const ds = hsvA.s - hsvB.s;
    const dv = hsvA.v - hsvB.v;
    
    return Math.sqrt(dh * dh + ds * ds + dv * dv);
  }
  
  /**
   * LAB color distance (CIE76)
   */
  private labDistance(colorA: THREE.Color, colorB: THREE.Color): number {
    const labA = this.rgbToLab(colorA);
    const labB = this.rgbToLab(colorB);
    
    const dL = labA.L - labB.L;
    const da = labA.a - labB.a;
    const db = labA.b - labB.b;
    
    return Math.sqrt(dL * dL + da * da + db * db) / 100; // Normalize
  }
  
  /**
   * Convert RGB to HSV
   */
  private rgbToHsv(color: THREE.Color): { h: number; s: number; v: number } {
    const r = color.r;
    const g = color.g;
    const b = color.b;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : delta / max;
    const v = max;
    
    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
      } else if (max === g) {
        h = ((b - r) / delta + 2) / 6;
      } else {
        h = ((r - g) / delta + 4) / 6;
      }
    }
    
    return { h, s, v };
  }
  
  /**
   * Convert RGB to LAB
   */
  private rgbToLab(color: THREE.Color): { L: number; a: number; b: number } {
    // Simplified RGB to LAB conversion
    // For production, use proper XYZ intermediate step
    const r = color.r;
    const g = color.g;
    const b = color.b;
    
    const L = 0.299 * r + 0.587 * g + 0.114 * b;
    const a = (r - g) * 0.5;
    const bVal = (r + g - 2 * b) * 0.25;
    
    return { L: L * 100, a: a * 100, b: bVal * 100 };
  }
  
  /**
   * Calculate spatial distance to cluster
   */
  private calculateSpatialDistance(voxel: Voxel, cluster: Voxel[]): number {
    if (cluster.length === 0) return Infinity;
    
    // Find nearest voxel in cluster
    let minDistance = Infinity;
    for (const clusterVoxel of cluster) {
      const distance = voxel.position.distanceTo(clusterVoxel.position);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }
  
  /**
   * Create clusters from groups
   */
  private createClusters(groups: Map<number, Voxel[]>): ColorCluster[] {
    const clusters: ColorCluster[] = [];
    
    for (const [id, voxels] of groups) {
      if (voxels.length < this.config.minClusterSize) continue;
      
      const color = this.calculateAverageColor(voxels);
      const variance = this.calculateColorVariance(voxels, color);
      const center = this.calculateCenter(voxels);
      
      clusters.push({
        id,
        voxels,
        color,
        variance,
        center
      });
    }
    
    return clusters;
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
   * Calculate color variance
   */
  private calculateColorVariance(voxels: Voxel[], avgColor: THREE.Color): number {
    if (voxels.length === 0) return 0;
    
    let variance = 0;
    for (const voxel of voxels) {
      const dr = voxel.color.r - avgColor.r;
      const dg = voxel.color.g - avgColor.g;
      const db = voxel.color.b - avgColor.b;
      variance += dr * dr + dg * dg + db * db;
    }
    
    return variance / voxels.length;
  }
  
  /**
   * Calculate spatial center
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
   * Create empty result
   */
  private createEmptyResult(): ColorClusteringResult {
    return {
      clusters: [],
      uniqueColors: 0,
      palette: []
    };
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<ColorClusteringConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): ColorClusteringConfig {
    return { ...this.config };
  }
}
