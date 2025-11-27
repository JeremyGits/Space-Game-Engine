/**
 * Quality Validator
 * 
 * Validates overall quality of voxel conversion.
 * Provides quality scores and recommendations.
 * 
 * Metrics:
 * - Color fidelity
 * - Depth accuracy
 * - Material consistency
 * - Overall quality score
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * Quality validation result
 */
export interface QualityValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  scores: {
    overall: number;
    colorFidelity: number;
    depthAccuracy: number;
    materialConsistency: number;
    distribution: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

/**
 * Quality validator options
 */
export interface QualityValidatorOptions {
  /** Minimum acceptable quality score (0-1) */
  minQualityScore?: number;
  
  /** Check color variance */
  checkColorVariance?: boolean;
  
  /** Check depth smoothness */
  checkDepthSmoothness?: boolean;
  
  /** Check material consistency */
  checkMaterialConsistency?: boolean;
}

/**
 * Quality validator class
 */
export class QualityValidator {
  private options: Required<QualityValidatorOptions>;
  
  constructor(options: QualityValidatorOptions = {}) {
    this.options = {
      minQualityScore: options.minQualityScore ?? 0.6,
      checkColorVariance: options.checkColorVariance ?? true,
      checkDepthSmoothness: options.checkDepthSmoothness ?? true,
      checkMaterialConsistency: options.checkMaterialConsistency ?? true
    };
  }
  
  /**
   * Validate voxel quality
   */
  validate(voxels: Voxel[]): QualityValidationResult {
    const result: QualityValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      scores: {
        overall: 0,
        colorFidelity: 0,
        depthAccuracy: 0,
        materialConsistency: 0,
        distribution: 0
      },
      grade: 'F',
      recommendations: []
    };
    
    if (voxels.length === 0) {
      result.errors.push('No voxels to validate quality');
      result.valid = false;
      return result;
    }
    
    // Calculate individual scores
    result.scores.colorFidelity = this.calculateColorFidelity(voxels);
    result.scores.depthAccuracy = this.calculateDepthAccuracy(voxels);
    result.scores.materialConsistency = this.calculateMaterialConsistency(voxels);
    result.scores.distribution = this.calculateDistribution(voxels);
    
    // Calculate overall score (weighted average)
    result.scores.overall = (
      result.scores.colorFidelity * 0.3 +
      result.scores.depthAccuracy * 0.3 +
      result.scores.materialConsistency * 0.2 +
      result.scores.distribution * 0.2
    );
    
    // Assign grade
    result.grade = this.getGrade(result.scores.overall);
    
    // Check if meets minimum quality
    if (result.scores.overall < this.options.minQualityScore) {
      result.errors.push(`Quality score ${result.scores.overall.toFixed(2)} below minimum ${this.options.minQualityScore}`);
      result.valid = false;
    }
    
    // Generate recommendations
    result.recommendations = this.generateRecommendations(result.scores);
    
    // Add warnings for low scores
    if (result.scores.colorFidelity < 0.7) {
      result.warnings.push('Low color fidelity - consider using better sampling');
    }
    
    if (result.scores.depthAccuracy < 0.7) {
      result.warnings.push('Low depth accuracy - consider using edge detection');
    }
    
    if (result.scores.materialConsistency < 0.7) {
      result.warnings.push('Low material consistency - check material extraction');
    }
    
    if (result.scores.distribution < 0.7) {
      result.warnings.push('Poor distribution - voxels may be clustered');
    }
    
    return result;
  }
  
  /**
   * Calculate color fidelity score
   */
  private calculateColorFidelity(voxels: Voxel[]): number {
    if (!this.options.checkColorVariance) return 1.0;
    
    // Check color variance (higher variance = better fidelity)
    let rVariance = 0, gVariance = 0, bVariance = 0;
    let rMean = 0, gMean = 0, bMean = 0;
    
    // Calculate means
    for (const voxel of voxels) {
      rMean += voxel.color.r;
      gMean += voxel.color.g;
      bMean += voxel.color.b;
    }
    
    rMean /= voxels.length;
    gMean /= voxels.length;
    bMean /= voxels.length;
    
    // Calculate variance
    for (const voxel of voxels) {
      rVariance += Math.pow(voxel.color.r - rMean, 2);
      gVariance += Math.pow(voxel.color.g - gMean, 2);
      bVariance += Math.pow(voxel.color.b - bMean, 2);
    }
    
    rVariance /= voxels.length;
    gVariance /= voxels.length;
    bVariance /= voxels.length;
    
    // Average variance (0-1 range, higher is better)
    const avgVariance = (rVariance + gVariance + bVariance) / 3;
    
    // Convert to score (0-1)
    return Math.min(1, avgVariance * 10);
  }
  
  /**
   * Calculate depth accuracy score
   */
  private calculateDepthAccuracy(voxels: Voxel[]): number {
    if (!this.options.checkDepthSmoothness) return 1.0;
    
    // Check depth smoothness (gradual changes = better)
    let smoothnessScore = 0;
    let count = 0;
    
    // Sample voxels
    const sampleSize = Math.min(100, voxels.length);
    const step = Math.floor(voxels.length / sampleSize);
    
    for (let i = 0; i < voxels.length - step; i += step) {
      const v1 = voxels[i];
      const v2 = voxels[i + step];
      
      const depthDiff = Math.abs(v1.position.z - v2.position.z);
      const distance = v1.position.distanceTo(v2.position);
      
      if (distance > 0) {
        const gradient = depthDiff / distance;
        // Prefer gradual changes (gradient < 1)
        smoothnessScore += Math.min(1, 1 / (1 + gradient));
        count++;
      }
    }
    
    return count > 0 ? smoothnessScore / count : 0.5;
  }
  
  /**
   * Calculate material consistency score
   */
  private calculateMaterialConsistency(voxels: Voxel[]): number {
    if (!this.options.checkMaterialConsistency) return 1.0;
    
    // Check if materials are consistent
    let metalnessVariance = 0;
    let roughnessVariance = 0;
    let metalnessMean = 0;
    let roughnessMean = 0;
    let count = 0;
    
    // Calculate means
    for (const voxel of voxels) {
      if (voxel.material) {
        if (voxel.material.metalness !== undefined) {
          metalnessMean += voxel.material.metalness;
        }
        if (voxel.material.roughness !== undefined) {
          roughnessMean += voxel.material.roughness;
        }
        count++;
      }
    }
    
    if (count === 0) return 0.5; // No materials to check
    
    metalnessMean /= count;
    roughnessMean /= count;
    
    // Calculate variance
    for (const voxel of voxels) {
      if (voxel.material) {
        if (voxel.material.metalness !== undefined) {
          metalnessVariance += Math.pow(voxel.material.metalness - metalnessMean, 2);
        }
        if (voxel.material.roughness !== undefined) {
          roughnessVariance += Math.pow(voxel.material.roughness - roughnessMean, 2);
        }
      }
    }
    
    metalnessVariance /= count;
    roughnessVariance /= count;
    
    // Lower variance = more consistent = better score
    const consistency = 1 - Math.min(1, (metalnessVariance + roughnessVariance) / 2);
    
    return consistency;
  }
  
  /**
   * Calculate distribution score
   */
  private calculateDistribution(voxels: Voxel[]): number {
    // Check if voxels are well-distributed
    // Use coefficient of variation of nearest neighbor distances
    
    const sampleSize = Math.min(100, voxels.length);
    const step = Math.floor(voxels.length / sampleSize);
    
    const distances: number[] = [];
    
    for (let i = 0; i < voxels.length; i += step) {
      const voxel = voxels[i];
      let nearestDist = Infinity;
      
      // Find nearest neighbor
      for (let j = 0; j < voxels.length; j++) {
        if (i === j) continue;
        
        const dist = voxel.position.distanceTo(voxels[j].position);
        nearestDist = Math.min(nearestDist, dist);
      }
      
      if (nearestDist < Infinity) {
        distances.push(nearestDist);
      }
    }
    
    if (distances.length === 0) return 0.5;
    
    // Calculate mean and standard deviation
    const mean = distances.reduce((a, b) => a + b, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);
    
    // Coefficient of variation (lower = more uniform = better)
    const cv = mean > 0 ? stdDev / mean : 1;
    
    // Convert to score (0-1, lower CV = higher score)
    return Math.max(0, 1 - cv);
  }
  
  /**
   * Get letter grade from score
   */
  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.7) return 'C';
    if (score >= 0.6) return 'D';
    return 'F';
  }
  
  /**
   * Generate recommendations based on scores
   */
  private generateRecommendations(scores: QualityValidationResult['scores']): string[] {
    const recommendations: string[] = [];
    
    if (scores.colorFidelity < 0.8) {
      recommendations.push('Use BilinearSampler or BicubicSampler for better color fidelity');
      recommendations.push('Consider SuperSampler with Poisson disk pattern');
    }
    
    if (scores.depthAccuracy < 0.8) {
      recommendations.push('Use EdgeDepth with Canny detection for better depth');
      recommendations.push('Apply DepthEnhancer with bilateral filtering');
    }
    
    if (scores.materialConsistency < 0.8) {
      recommendations.push('Review material extraction settings');
      recommendations.push('Consider using material presets');
    }
    
    if (scores.distribution < 0.8) {
      recommendations.push('Increase voxel resolution for better distribution');
      recommendations.push('Check for clustering in source image');
    }
    
    if (scores.overall >= 0.9) {
      recommendations.push('Excellent quality! Ready for production use');
    } else if (scores.overall >= 0.7) {
      recommendations.push('Good quality - minor improvements possible');
    } else {
      recommendations.push('Quality needs improvement - review settings');
    }
    
    return recommendations;
  }
  
  /**
   * Get summary string
   */
  getSummary(result: QualityValidationResult): string {
    const lines: string[] = [];
    
    lines.push('=== Quality Validation Summary ===');
    lines.push(`Overall Score: ${(result.scores.overall * 100).toFixed(1)}% (Grade: ${result.grade})`);
    lines.push(`Color Fidelity: ${(result.scores.colorFidelity * 100).toFixed(1)}%`);
    lines.push(`Depth Accuracy: ${(result.scores.depthAccuracy * 100).toFixed(1)}%`);
    lines.push(`Material Consistency: ${(result.scores.materialConsistency * 100).toFixed(1)}%`);
    lines.push(`Distribution: ${(result.scores.distribution * 100).toFixed(1)}%`);
    lines.push(`Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (result.errors.length > 0) {
      lines.push('\nErrors:');
      result.errors.forEach(err => lines.push(`  - ${err}`));
    }
    
    if (result.warnings.length > 0) {
      lines.push('\nWarnings:');
      result.warnings.forEach(warn => lines.push(`  - ${warn}`));
    }
    
    if (result.recommendations.length > 0) {
      lines.push('\nRecommendations:');
      result.recommendations.forEach(rec => lines.push(`  💡 ${rec}`));
    }
    
    return lines.join('\n');
  }
}
