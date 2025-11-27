/**
 * Voxel Validator
 * 
 * Validates voxel data for correctness and quality.
 * Ensures voxels meet requirements before rendering.
 * 
 * Checks:
 * - Valid positions
 * - Valid colors
 * - Valid materials
 * - No duplicates
 * - Proper bounds
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';
import { VoxelBounds } from '../../core/VoxelBounds';

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is valid */
  valid: boolean;
  
  /** Errors found */
  errors: string[];
  
  /** Warnings */
  warnings: string[];
  
  /** Statistics */
  stats: {
    totalVoxels: number;
    validVoxels: number;
    invalidVoxels: number;
    duplicates: number;
    outOfBounds: number;
  };
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Check for duplicates */
  checkDuplicates?: boolean;
  
  /** Check bounds */
  checkBounds?: boolean;
  
  /** Check colors */
  checkColors?: boolean;
  
  /** Check materials */
  checkMaterials?: boolean;
  
  /** Strict mode (fail on warnings) */
  strict?: boolean;
}

/**
 * Voxel validator class
 */
export class VoxelValidator {
  private options: Required<ValidationOptions>;
  
  constructor(options: ValidationOptions = {}) {
    this.options = {
      checkDuplicates: options.checkDuplicates ?? true,
      checkBounds: options.checkBounds ?? true,
      checkColors: options.checkColors ?? true,
      checkMaterials: options.checkMaterials ?? true,
      strict: options.strict ?? false
    };
  }
  
  /**
   * Validate voxel array
   */
  validate(voxels: Voxel[], bounds?: THREE.Box3): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {
        totalVoxels: voxels.length,
        validVoxels: 0,
        invalidVoxels: 0,
        duplicates: 0,
        outOfBounds: 0
      }
    };
    
    // Check if empty
    if (voxels.length === 0) {
      result.warnings.push('No voxels to validate');
      return result;
    }
    
    // Track seen positions for duplicate detection
    const seenPositions = new Set<string>();
    
    // Validate each voxel
    for (let i = 0; i < voxels.length; i++) {
      const voxel = voxels[i];
      let voxelValid = true;
      
      // Check position
      if (!this.isValidPosition(voxel.position)) {
        result.errors.push(`Voxel ${i}: Invalid position (${voxel.position.x}, ${voxel.position.y}, ${voxel.position.z})`);
        voxelValid = false;
      }
      
      // Check bounds
      if (this.options.checkBounds && bounds) {
        if (!bounds.containsPoint(voxel.position)) {
          result.errors.push(`Voxel ${i}: Out of bounds`);
          result.stats.outOfBounds++;
          voxelValid = false;
        }
      }
      
      // Check for duplicates
      if (this.options.checkDuplicates) {
        const posKey = `${voxel.position.x},${voxel.position.y},${voxel.position.z}`;
        if (seenPositions.has(posKey)) {
          result.warnings.push(`Voxel ${i}: Duplicate position ${posKey}`);
          result.stats.duplicates++;
        } else {
          seenPositions.add(posKey);
        }
      }
      
      // Check color
      if (this.options.checkColors) {
        if (!this.isValidColor(voxel.color)) {
          result.errors.push(`Voxel ${i}: Invalid color`);
          voxelValid = false;
        }
      }
      
      // Check alpha
      if (voxel.alpha !== undefined) {
        if (voxel.alpha < 0 || voxel.alpha > 1 || isNaN(voxel.alpha)) {
          result.errors.push(`Voxel ${i}: Invalid alpha ${voxel.alpha}`);
          voxelValid = false;
        }
      }
      
      // Check material
      if (this.options.checkMaterials && voxel.material) {
        if (!this.isValidMaterial(voxel.material)) {
          result.errors.push(`Voxel ${i}: Invalid material properties`);
          voxelValid = false;
        }
      }
      
      if (voxelValid) {
        result.stats.validVoxels++;
      } else {
        result.stats.invalidVoxels++;
      }
    }
    
    // Determine overall validity
    result.valid = result.errors.length === 0;
    
    if (this.options.strict && result.warnings.length > 0) {
      result.valid = false;
    }
    
    return result;
  }
  
  /**
   * Quick validation (just check counts)
   */
  quickValidate(voxels: Voxel[]): boolean {
    if (voxels.length === 0) return false;
    
    // Sample first, middle, and last voxels
    const samples = [
      voxels[0],
      voxels[Math.floor(voxels.length / 2)],
      voxels[voxels.length - 1]
    ];
    
    for (const voxel of samples) {
      if (!this.isValidPosition(voxel.position)) return false;
      if (!this.isValidColor(voxel.color)) return false;
    }
    
    return true;
  }
  
  /**
   * Check if position is valid
   */
  private isValidPosition(pos: { x: number; y: number; z: number }): boolean {
    return (
      Number.isFinite(pos.x) &&
      Number.isFinite(pos.y) &&
      Number.isFinite(pos.z) &&
      !isNaN(pos.x) &&
      !isNaN(pos.y) &&
      !isNaN(pos.z)
    );
  }
  
  /**
   * Check if color is valid
   */
  private isValidColor(color: { r: number; g: number; b: number }): boolean {
    return (
      color.r >= 0 && color.r <= 1 &&
      color.g >= 0 && color.g <= 1 &&
      color.b >= 0 && color.b <= 1 &&
      !isNaN(color.r) &&
      !isNaN(color.g) &&
      !isNaN(color.b)
    );
  }
  
  /**
   * Check if material is valid
   */
  private isValidMaterial(material: { metalness?: number; roughness?: number }): boolean {
    if (material.metalness !== undefined) {
      if (material.metalness < 0 || material.metalness > 1 || isNaN(material.metalness)) {
        return false;
      }
    }
    
    if (material.roughness !== undefined) {
      if (material.roughness < 0 || material.roughness > 1 || isNaN(material.roughness)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get validation summary
   */
  getSummary(result: ValidationResult): string {
    const lines: string[] = [];
    
    lines.push('=== Voxel Validation Summary ===');
    lines.push(`Total Voxels: ${result.stats.totalVoxels}`);
    lines.push(`Valid: ${result.stats.validVoxels}`);
    lines.push(`Invalid: ${result.stats.invalidVoxels}`);
    lines.push(`Duplicates: ${result.stats.duplicates}`);
    lines.push(`Out of Bounds: ${result.stats.outOfBounds}`);
    lines.push(`Errors: ${result.errors.length}`);
    lines.push(`Warnings: ${result.warnings.length}`);
    lines.push(`Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (result.errors.length > 0) {
      lines.push('\nErrors:');
      result.errors.slice(0, 10).forEach(err => lines.push(`  - ${err}`));
      if (result.errors.length > 10) {
        lines.push(`  ... and ${result.errors.length - 10} more`);
      }
    }
    
    if (result.warnings.length > 0) {
      lines.push('\nWarnings:');
      result.warnings.slice(0, 10).forEach(warn => lines.push(`  - ${warn}`));
      if (result.warnings.length > 10) {
        lines.push(`  ... and ${result.warnings.length - 10} more`);
      }
    }
    
    return lines.join('\n');
  }
}
