/**
 * Bounds Validator
 * 
 * Validates voxel bounds and spatial properties.
 * Ensures voxels are within acceptable ranges.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';
import { VoxelBounds } from '../../core/VoxelBounds';

/**
 * Bounds validation result
 */
export interface BoundsValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  bounds: THREE.Box3;
  stats: {
    minPosition: THREE.Vector3;
    maxPosition: THREE.Vector3;
    size: THREE.Vector3;
    volume: number;
    center: THREE.Vector3;
  };
}

/**
 * Bounds validator options
 */
export interface BoundsValidatorOptions {
  /** Maximum allowed size */
  maxSize?: number;
  
  /** Minimum allowed size */
  minSize?: number;
  
  /** Warn if bounds are too large */
  warnLargeBounds?: boolean;
  
  /** Maximum volume */
  maxVolume?: number;
}

/**
 * Bounds validator class
 */
export class BoundsValidator {
  private options: Required<BoundsValidatorOptions>;
  
  constructor(options: BoundsValidatorOptions = {}) {
    this.options = {
      maxSize: options.maxSize ?? 10000,
      minSize: options.minSize ?? 0.001,
      warnLargeBounds: options.warnLargeBounds ?? true,
      maxVolume: options.maxVolume ?? 1000000000 // 1 billion cubic units
    };
  }
  
  /**
   * Validate voxel bounds
   */
  validate(voxels: Voxel[]): BoundsValidationResult {
    const result: BoundsValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      bounds: new THREE.Box3(),
      stats: {
        minPosition: new THREE.Vector3(),
        maxPosition: new THREE.Vector3(),
        size: new THREE.Vector3(),
        volume: 0,
        center: new THREE.Vector3()
      }
    };
    
    if (voxels.length === 0) {
      result.errors.push('No voxels to validate bounds');
      result.valid = false;
      return result;
    }
    
    // Calculate bounds
    result.bounds = VoxelBounds.calculateBounds(voxels);
    
    // Get stats
    result.stats.minPosition.copy(result.bounds.min);
    result.stats.maxPosition.copy(result.bounds.max);
    result.stats.size = result.bounds.getSize(new THREE.Vector3());
    result.stats.volume = VoxelBounds.getVolume(result.bounds);
    result.stats.center = result.bounds.getCenter(new THREE.Vector3());
    
    // Validate bounds
    if (!VoxelBounds.isValid(result.bounds)) {
      result.errors.push('Invalid bounds: min > max');
      result.valid = false;
    }
    
    // Check size
    const maxDimension = Math.max(result.stats.size.x, result.stats.size.y, result.stats.size.z);
    const minDimension = Math.min(result.stats.size.x, result.stats.size.y, result.stats.size.z);
    
    if (maxDimension > this.options.maxSize) {
      result.errors.push(`Bounds too large: ${maxDimension.toFixed(2)} > ${this.options.maxSize}`);
      result.valid = false;
    }
    
    if (minDimension < this.options.minSize) {
      result.warnings.push(`Bounds very small: ${minDimension.toFixed(4)} < ${this.options.minSize}`);
    }
    
    // Check volume
    if (result.stats.volume > this.options.maxVolume) {
      result.errors.push(`Volume too large: ${result.stats.volume.toExponential(2)} > ${this.options.maxVolume.toExponential(2)}`);
      result.valid = false;
    }
    
    // Warn if bounds are large
    if (this.options.warnLargeBounds && maxDimension > this.options.maxSize * 0.5) {
      result.warnings.push(`Large bounds detected: ${maxDimension.toFixed(2)} (consider optimization)`);
    }
    
    // Check for degenerate bounds
    if (result.stats.size.x === 0 || result.stats.size.y === 0 || result.stats.size.z === 0) {
      result.warnings.push('Degenerate bounds: one or more dimensions are zero');
    }
    
    return result;
  }
  
  /**
   * Check if voxels fit within target bounds
   */
  validateAgainstBounds(voxels: Voxel[], targetBounds: THREE.Box3): BoundsValidationResult {
    const result = this.validate(voxels);
    
    // Check if voxels fit within target
    if (!targetBounds.containsBox(result.bounds)) {
      result.errors.push('Voxels exceed target bounds');
      result.valid = false;
      
      // Provide details
      if (result.bounds.min.x < targetBounds.min.x) {
        result.errors.push(`  Min X: ${result.bounds.min.x} < ${targetBounds.min.x}`);
      }
      if (result.bounds.max.x > targetBounds.max.x) {
        result.errors.push(`  Max X: ${result.bounds.max.x} > ${targetBounds.max.x}`);
      }
      if (result.bounds.min.y < targetBounds.min.y) {
        result.errors.push(`  Min Y: ${result.bounds.min.y} < ${targetBounds.min.y}`);
      }
      if (result.bounds.max.y > targetBounds.max.y) {
        result.errors.push(`  Max Y: ${result.bounds.max.y} > ${targetBounds.max.y}`);
      }
      if (result.bounds.min.z < targetBounds.min.z) {
        result.errors.push(`  Min Z: ${result.bounds.min.z} < ${targetBounds.min.z}`);
      }
      if (result.bounds.max.z > targetBounds.max.z) {
        result.errors.push(`  Max Z: ${result.bounds.max.z} > ${targetBounds.max.z}`);
      }
    }
    
    return result;
  }
  
  /**
   * Get summary string
   */
  getSummary(result: BoundsValidationResult): string {
    const lines: string[] = [];
    
    lines.push('=== Bounds Validation Summary ===');
    lines.push(`Min: (${result.stats.minPosition.x.toFixed(2)}, ${result.stats.minPosition.y.toFixed(2)}, ${result.stats.minPosition.z.toFixed(2)})`);
    lines.push(`Max: (${result.stats.maxPosition.x.toFixed(2)}, ${result.stats.maxPosition.y.toFixed(2)}, ${result.stats.maxPosition.z.toFixed(2)})`);
    lines.push(`Size: (${result.stats.size.x.toFixed(2)}, ${result.stats.size.y.toFixed(2)}, ${result.stats.size.z.toFixed(2)})`);
    lines.push(`Volume: ${result.stats.volume.toExponential(2)}`);
    lines.push(`Center: (${result.stats.center.x.toFixed(2)}, ${result.stats.center.y.toFixed(2)}, ${result.stats.center.z.toFixed(2)})`);
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
