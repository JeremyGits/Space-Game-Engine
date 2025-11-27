/**
 * Screen Space LOD Strategy
 * 
 * LOD based on projected screen size.
 * More accurate than distance-based.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * Screen space LOD strategy
 */
export class ScreenSpaceLOD {
  private screenHeight: number = 1080;
  private pixelThresholds: number[] = [160, 80, 40, 20, 10, 5, 2, 1];
  
  constructor(screenHeight: number = 1080) {
    this.screenHeight = screenHeight;
  }
  
  /**
   * Calculate LOD based on screen space
   */
  calculate(voxel: Voxel, camera: THREE.PerspectiveCamera): { level: number; screenSize: number } {
    const voxelSize = voxel.size || 1.0;
    const distance = voxel.position.distanceTo(camera.position);
    
    // Calculate screen size in pixels
    const screenSize = this.projectToScreenSize(voxelSize, distance, camera);
    
    // Determine LOD level
    let level = this.pixelThresholds.length - 1;
    
    for (let i = 0; i < this.pixelThresholds.length; i++) {
      if (screenSize >= this.pixelThresholds[i]) {
        level = i;
        break;
      }
    }
    
    return { level, screenSize };
  }
  
  /**
   * Project voxel size to screen space
   */
  private projectToScreenSize(
    voxelSize: number,
    distance: number,
    camera: THREE.PerspectiveCamera
  ): number {
    const fov = camera.fov;
    const fovRad = (fov * Math.PI) / 180;
    
    // Angular size of voxel
    const angularSize = (voxelSize / distance) * (180 / Math.PI);
    
    // Screen size in pixels
    const screenSize = (angularSize / fov) * this.screenHeight;
    
    return screenSize;
  }
  
  /**
   * Set screen height
   */
  setScreenHeight(height: number): void {
    this.screenHeight = height;
  }
  
  /**
   * Set pixel thresholds
   */
  setPixelThresholds(thresholds: number[]): void {
    this.pixelThresholds = [...thresholds];
  }
}
