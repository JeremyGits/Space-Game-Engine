/**
 * LOD Calculator
 * 
 * Calculates appropriate LOD level for voxels.
 * Supports multiple calculation strategies.
 */

import * as THREE from 'three';
import { Voxel } from '../core/Voxel';

/**
 * LOD calculation method
 */
export type LODCalculationMethod = 'distance' | 'screenSpace' | 'importance' | 'hybrid';

/**
 * LOD calculation result
 */
export interface LODCalculationResult {
  /** Calculated LOD level */
  level: number;
  
  /** Blend factor (0-1) */
  blendFactor: number;
  
  /** Calculation method used */
  method: LODCalculationMethod;
  
  /** Distance to camera */
  distance: number;
}

/**
 * LOD calculator
 */
export class LODCalculator {
  private lodDistances: number[] = [];
  private maxLOD: number = 8;
  
  constructor(maxLOD: number = 8, baseDistance: number = 10, multiplier: number = 2) {
    this.maxLOD = maxLOD;
    this.initializeDistances(baseDistance, multiplier);
  }
  
  /**
   * Initialize LOD distances
   */
  private initializeDistances(baseDistance: number, multiplier: number): void {
    this.lodDistances = [];
    
    for (let i = 0; i < this.maxLOD; i++) {
      this.lodDistances.push(baseDistance * Math.pow(multiplier, i));
    }
  }
  
  /**
   * Calculate LOD for voxel
   */
  calculate(
    voxel: Voxel,
    camera: THREE.Camera,
    method: LODCalculationMethod = 'distance'
  ): LODCalculationResult {
    const distance = voxel.position.distanceTo(camera.position);
    
    switch (method) {
      case 'distance':
        return this.calculateDistanceLOD(distance);
      case 'screenSpace':
        return this.calculateScreenSpaceLOD(voxel, camera, distance);
      case 'importance':
        return this.calculateImportanceLOD(voxel, distance);
      case 'hybrid':
        return this.calculateHybridLOD(voxel, camera, distance);
      default:
        return this.calculateDistanceLOD(distance);
    }
  }
  
  /**
   * Calculate distance-based LOD
   */
  private calculateDistanceLOD(distance: number): LODCalculationResult {
    let level = this.maxLOD - 1;
    let blendFactor = 0;
    
    for (let i = 0; i < this.lodDistances.length; i++) {
      if (distance < this.lodDistances[i]) {
        level = i;
        
        // Calculate blend factor
        if (i < this.lodDistances.length - 1) {
          const currentDist = this.lodDistances[i];
          const nextDist = this.lodDistances[i + 1];
          blendFactor = (distance - currentDist) / (nextDist - currentDist);
        }
        
        break;
      }
    }
    
    return {
      level,
      blendFactor,
      method: 'distance',
      distance
    };
  }
  
  /**
   * Calculate screen-space LOD
   */
  private calculateScreenSpaceLOD(
    voxel: Voxel,
    camera: THREE.Camera,
    distance: number
  ): LODCalculationResult {
    // Project voxel to screen space
    const voxelSize = voxel.size || 1.0;
    const screenSize = this.projectToScreenSize(voxelSize, distance, camera);
    
    // Determine LOD based on screen size
    let level = 0;
    if (screenSize < 2) level = 7;
    else if (screenSize < 5) level = 6;
    else if (screenSize < 10) level = 5;
    else if (screenSize < 20) level = 4;
    else if (screenSize < 40) level = 3;
    else if (screenSize < 80) level = 2;
    else if (screenSize < 160) level = 1;
    
    return {
      level,
      blendFactor: 0,
      method: 'screenSpace',
      distance
    };
  }
  
  /**
   * Calculate importance-based LOD
   */
  private calculateImportanceLOD(voxel: Voxel, distance: number): LODCalculationResult {
    // Get base distance LOD
    const baseLOD = this.calculateDistanceLOD(distance);
    
    // Adjust based on importance (if voxel has importance property)
    const importance = (voxel as any).importance || 1.0;
    const adjustedLevel = Math.max(0, baseLOD.level - Math.floor(importance * 2));
    
    return {
      level: Math.min(this.maxLOD - 1, adjustedLevel),
      blendFactor: baseLOD.blendFactor,
      method: 'importance',
      distance
    };
  }
  
  /**
   * Calculate hybrid LOD
   */
  private calculateHybridLOD(
    voxel: Voxel,
    camera: THREE.Camera,
    distance: number
  ): LODCalculationResult {
    // Combine distance and screen-space
    const distanceLOD = this.calculateDistanceLOD(distance);
    const screenLOD = this.calculateScreenSpaceLOD(voxel, camera, distance);
    
    // Use more conservative (higher detail) of the two
    const level = Math.min(distanceLOD.level, screenLOD.level);
    
    return {
      level,
      blendFactor: distanceLOD.blendFactor,
      method: 'hybrid',
      distance
    };
  }
  
  /**
   * Project voxel size to screen space
   */
  private projectToScreenSize(
    voxelSize: number,
    distance: number,
    camera: THREE.Camera
  ): number {
    // Approximate screen size in pixels
    const fov = (camera as THREE.PerspectiveCamera).fov || 75;
    const fovRad = (fov * Math.PI) / 180;
    const screenHeight = 1080; // Assume 1080p
    
    const angularSize = (voxelSize / distance) * (180 / Math.PI);
    const screenSize = (angularSize / fov) * screenHeight;
    
    return screenSize;
  }
  
  /**
   * Get LOD distances
   */
  getLODDistances(): number[] {
    return [...this.lodDistances];
  }
  
  /**
   * Set LOD distances
   */
  setLODDistances(distances: number[]): void {
    this.lodDistances = [...distances];
    this.maxLOD = distances.length;
  }
}
