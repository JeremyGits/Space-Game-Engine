/**
 * Voxel LOD (GPU)
 * 
 * GPU-accelerated Level of Detail management.
 * Dynamically adjusts voxel detail based on distance.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * LOD level
 */
export interface LODLevel {
  /** Level index (0 = highest detail) */
  level: number;
  
  /** Distance threshold */
  distance: number;
  
  /** Voxel size multiplier */
  sizeMultiplier: number;
  
  /** Voxels at this level */
  voxels: Voxel[];
}

/**
 * LOD configuration
 */
export interface LODConfig {
  /** Number of LOD levels */
  levels: number;
  
  /** Distance multiplier between levels */
  distanceMultiplier: number;
  
  /** Base distance */
  baseDistance: number;
  
  /** Enable smooth transitions */
  smoothTransitions: boolean;
}

/**
 * GPU voxel LOD
 */
export class VoxelLOD {
  private config: LODConfig;
  private lodLevels: LODLevel[] = [];
  
  constructor(config: Partial<LODConfig> = {}) {
    this.config = {
      levels: config.levels ?? 8,
      distanceMultiplier: config.distanceMultiplier ?? 2.0,
      baseDistance: config.baseDistance ?? 10.0,
      smoothTransitions: config.smoothTransitions ?? true
    };
    
    this.initializeLevels();
  }
  
  /**
   * Initialize LOD levels
   */
  private initializeLevels(): void {
    this.lodLevels = [];
    
    for (let i = 0; i < this.config.levels; i++) {
      const distance = this.config.baseDistance * Math.pow(this.config.distanceMultiplier, i);
      const sizeMultiplier = Math.pow(2, i);
      
      this.lodLevels.push({
        level: i,
        distance,
        sizeMultiplier,
        voxels: []
      });
    }
  }
  
  /**
   * Assign voxels to LOD levels
   */
  assignLOD(voxels: Voxel[], cameraPosition: THREE.Vector3): void {
    // Clear existing assignments
    for (const level of this.lodLevels) {
      level.voxels = [];
    }
    
    // Assign each voxel to appropriate LOD
    for (const voxel of voxels) {
      const distance = voxel.position.distanceTo(cameraPosition);
      const lodLevel = this.selectLOD(distance);
      
      this.lodLevels[lodLevel].voxels.push(voxel);
    }
  }
  
  /**
   * Select LOD level based on distance
   */
  private selectLOD(distance: number): number {
    for (let i = 0; i < this.lodLevels.length; i++) {
      if (distance < this.lodLevels[i].distance) {
        return i;
      }
    }
    return this.lodLevels.length - 1;
  }
  
  /**
   * Get voxels for LOD level
   */
  getVoxelsForLevel(level: number): Voxel[] {
    if (level < 0 || level >= this.lodLevels.length) {
      return [];
    }
    return this.lodLevels[level].voxels;
  }
  
  /**
   * Get all LOD levels
   */
  getLevels(): LODLevel[] {
    return [...this.lodLevels];
  }
  
  /**
   * Get LOD statistics
   */
  getStats(): {
    totalVoxels: number;
    voxelsPerLevel: number[];
    averageLevel: number;
  } {
    const voxelsPerLevel = this.lodLevels.map(l => l.voxels.length);
    const totalVoxels = voxelsPerLevel.reduce((sum, count) => sum + count, 0);
    
    let weightedSum = 0;
    for (let i = 0; i < voxelsPerLevel.length; i++) {
      weightedSum += i * voxelsPerLevel[i];
    }
    const averageLevel = totalVoxels > 0 ? weightedSum / totalVoxels : 0;
    
    return {
      totalVoxels,
      voxelsPerLevel,
      averageLevel
    };
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<LODConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeLevels();
  }
  
  /**
   * Get configuration
   */
  getConfig(): LODConfig {
    return { ...this.config };
  }
}
