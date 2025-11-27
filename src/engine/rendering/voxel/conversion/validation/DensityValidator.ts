/**
 * Density Validator
 * 
 * Validates voxel density and distribution.
 * Ensures voxels are properly distributed in space.
 * 
 * Checks:
 * - Voxel density (voxels per unit volume)
 * - Distribution uniformity
 * - Clustering detection
 * - Sparse regions
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';
import { VoxelBounds } from '../../core/VoxelBounds';

/**
 * Density validation result
 */
export interface DensityValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalVoxels: number;
    volume: number;
    density: number;
    averageSpacing: number;
    minSpacing: number;
    maxSpacing: number;
    clusterCount: number;
    sparseRegions: number;
  };
}

/**
 * Density validator options
 */
export interface DensityValidatorOptions {
  /** Minimum acceptable density (voxels per cubic unit) */
  minDensity?: number;
  
  /** Maximum acceptable density */
  maxDensity?: number;
  
  /** Clustering threshold (distance) */
  clusterThreshold?: number;
  
  /** Sparse region threshold */
  sparseThreshold?: number;
  
  /** Sample size for spacing analysis */
  sampleSize?: number;
}

/**
 * Density validator class
 */
export class DensityValidator {
  private options: Required<DensityValidatorOptions>;
  
  constructor(options: DensityValidatorOptions = {}) {
    this.options = {
      minDensity: options.minDensity ?? 0.001,
      maxDensity: options.maxDensity ?? 1000,
      clusterThreshold: options.clusterThreshold ?? 2.0,
      sparseThreshold: options.sparseThreshold ?? 10.0,
      sampleSize: options.sampleSize ?? 1000
    };
  }
  
  /**
   * Validate voxel density
   */
  validate(voxels: Voxel[]): DensityValidationResult {
    const result: DensityValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {
        totalVoxels: voxels.length,
        volume: 0,
        density: 0,
        averageSpacing: 0,
        minSpacing: Infinity,
        maxSpacing: 0,
        clusterCount: 0,
        sparseRegions: 0
      }
    };
    
    if (voxels.length === 0) {
      result.errors.push('No voxels to validate density');
      result.valid = false;
      return result;
    }
    
    // Calculate bounds and volume
    const bounds = VoxelBounds.calculateBounds(voxels);
    result.stats.volume = VoxelBounds.getVolume(bounds);
    
    if (result.stats.volume === 0) {
      result.errors.push('Zero volume - cannot calculate density');
      result.valid = false;
      return result;
    }
    
    // Calculate density
    result.stats.density = voxels.length / result.stats.volume;
    
    // Check density range
    if (result.stats.density < this.options.minDensity) {
      result.warnings.push(`Low density: ${result.stats.density.toFixed(4)} < ${this.options.minDensity}`);
    }
    
    if (result.stats.density > this.options.maxDensity) {
      result.errors.push(`High density: ${result.stats.density.toFixed(4)} > ${this.options.maxDensity}`);
      result.valid = false;
    }
    
    // Analyze spacing (sample for performance)
    const sampleCount = Math.min(this.options.sampleSize, voxels.length);
    const spacing = this.analyzeSpacing(voxels, sampleCount);
    
    result.stats.averageSpacing = spacing.average;
    result.stats.minSpacing = spacing.min;
    result.stats.maxSpacing = spacing.max;
    
    // Detect clusters
    result.stats.clusterCount = this.detectClusters(voxels, sampleCount);
    
    if (result.stats.clusterCount > voxels.length * 0.1) {
      result.warnings.push(`High clustering detected: ${result.stats.clusterCount} clusters`);
    }
    
    // Detect sparse regions
    result.stats.sparseRegions = this.detectSparseRegions(voxels, bounds);
    
    if (result.stats.sparseRegions > 0) {
      result.warnings.push(`Sparse regions detected: ${result.stats.sparseRegions}`);
    }
    
    return result;
  }
  
  /**
   * Analyze voxel spacing
   */
  private analyzeSpacing(
    voxels: Voxel[],
    sampleCount: number
  ): { average: number; min: number; max: number } {
    let totalSpacing = 0;
    let minSpacing = Infinity;
    let maxSpacing = 0;
    let count = 0;
    
    // Sample random voxels
    const step = Math.max(1, Math.floor(voxels.length / sampleCount));
    
    for (let i = 0; i < voxels.length; i += step) {
      const voxel = voxels[i];
      
      // Find nearest neighbor
      let nearestDist = Infinity;
      
      for (let j = 0; j < voxels.length; j++) {
        if (i === j) continue;
        
        const dist = voxel.position.distanceTo(voxels[j].position);
        nearestDist = Math.min(nearestDist, dist);
      }
      
      if (nearestDist < Infinity) {
        totalSpacing += nearestDist;
        minSpacing = Math.min(minSpacing, nearestDist);
        maxSpacing = Math.max(maxSpacing, nearestDist);
        count++;
      }
    }
    
    return {
      average: count > 0 ? totalSpacing / count : 0,
      min: minSpacing < Infinity ? minSpacing : 0,
      max: maxSpacing
    };
  }
  
  /**
   * Detect clusters (groups of nearby voxels)
   */
  private detectClusters(voxels: Voxel[], sampleCount: number): number {
    let clusterCount = 0;
    const step = Math.max(1, Math.floor(voxels.length / sampleCount));
    
    for (let i = 0; i < voxels.length; i += step) {
      const voxel = voxels[i];
      let nearbyCount = 0;
      
      // Count nearby voxels
      for (const other of voxels) {
        if (voxel === other) continue;
        
        const dist = voxel.position.distanceTo(other.position);
        if (dist < this.options.clusterThreshold) {
          nearbyCount++;
        }
      }
      
      // If many nearby voxels, it's a cluster
      if (nearbyCount > 5) {
        clusterCount++;
      }
    }
    
    return clusterCount;
  }
  
  /**
   * Detect sparse regions (large empty spaces)
   */
  private detectSparseRegions(voxels: Voxel[], bounds: THREE.Box3): number {
    // Divide space into grid
    const gridSize = 10;
    const size = bounds.getSize(new THREE.Vector3());
    const cellSize = new THREE.Vector3(
      size.x / gridSize,
      size.y / gridSize,
      size.z / gridSize
    );
    
    // Count voxels in each cell
    const grid = new Map<string, number>();
    
    for (const voxel of voxels) {
      const cellX = Math.floor((voxel.position.x - bounds.min.x) / cellSize.x);
      const cellY = Math.floor((voxel.position.y - bounds.min.y) / cellSize.y);
      const cellZ = Math.floor((voxel.position.z - bounds.min.z) / cellSize.z);
      
      const key = `${cellX},${cellY},${cellZ}`;
      grid.set(key, (grid.get(key) || 0) + 1);
    }
    
    // Count sparse cells
    let sparseCount = 0;
    const expectedDensity = voxels.length / (gridSize * gridSize * gridSize);
    
    for (let z = 0; z < gridSize; z++) {
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const key = `${x},${y},${z}`;
          const count = grid.get(key) || 0;
          
          if (count < expectedDensity * 0.1) {
            sparseCount++;
          }
        }
      }
    }
    
    return sparseCount;
  }
  
  /**
   * Get summary string
   */
  getSummary(result: DensityValidationResult): string {
    const lines: string[] = [];
    
    lines.push('=== Density Validation Summary ===');
    lines.push(`Total Voxels: ${result.stats.totalVoxels}`);
    lines.push(`Volume: ${result.stats.volume.toFixed(2)} cubic units`);
    lines.push(`Density: ${result.stats.density.toFixed(4)} voxels/unit³`);
    lines.push(`Average Spacing: ${result.stats.averageSpacing.toFixed(4)}`);
    lines.push(`Min Spacing: ${result.stats.minSpacing.toFixed(4)}`);
    lines.push(`Max Spacing: ${result.stats.maxSpacing.toFixed(4)}`);
    lines.push(`Clusters: ${result.stats.clusterCount}`);
    lines.push(`Sparse Regions: ${result.stats.sparseRegions}`);
    lines.push(`Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (result.errors.length > 0) {
      lines.push('\nErrors:');
      result.errors.forEach(err => lines.push(`  - ${err}`));
    }
    
    if (result.warnings.length > 0) {
      lines.push('\nWarnings:');
      result.warnings.forEach(warn => lines.push(`  - ${warn}`));
    }
    
    return lines.join('\n');
  }
}
