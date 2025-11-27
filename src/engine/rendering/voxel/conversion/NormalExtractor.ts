/**
 * Normal Extractor
 * 
 * Calculates surface normals from depth maps.
 * Used for proper lighting and shading of voxel surfaces.
 */

import * as THREE from 'three';

/**
 * Normal extraction options
 */
export interface NormalExtractionOptions {
  /** Strength of normal calculation */
  strength?: number;
  
  /** Smoothing iterations */
  smoothing?: number;
  
  /** Flip normals */
  flipNormals?: boolean;
}

/**
 * Normal extractor class
 */
export class NormalExtractor {
  private options: Required<NormalExtractionOptions>;
  
  constructor(options: NormalExtractionOptions = {}) {
    this.options = {
      strength: options.strength ?? 1.0,
      smoothing: options.smoothing ?? 0,
      flipNormals: options.flipNormals ?? false
    };
  }
  
  /**
   * Extract normals from depth map
   */
  extract(depthMap: Float32Array, width: number, height: number): THREE.Vector3[] {
    console.log('[NormalExtractor] Calculating normals from depth map');
    
    const normals: THREE.Vector3[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const normal = this.calculateNormalAt(depthMap, x, y, width, height);
        normals.push(normal);
      }
    }
    
    // Apply smoothing if requested
    if (this.options.smoothing > 0) {
      return this.smoothNormals(normals, width, height);
    }
    
    return normals;
  }
  
  /**
   * Calculate normal at specific pixel using Sobel operator
   */
  private calculateNormalAt(
    depthMap: Float32Array,
    x: number,
    y: number,
    width: number,
    height: number
  ): THREE.Vector3 {
    // Sample neighboring depths
    const d = (dx: number, dy: number): number => {
      const nx = Math.max(0, Math.min(width - 1, x + dx));
      const ny = Math.max(0, Math.min(height - 1, y + dy));
      return depthMap[ny * width + nx];
    };
    
    // Sobel operator for gradient
    const dzdx = (
      -d(-1, -1) + d(1, -1) +
      -2 * d(-1, 0) + 2 * d(1, 0) +
      -d(-1, 1) + d(1, 1)
    ) / 8.0;
    
    const dzdy = (
      -d(-1, -1) - 2 * d(0, -1) - d(1, -1) +
      d(-1, 1) + 2 * d(0, 1) + d(1, 1)
    ) / 8.0;
    
    // Calculate normal
    const normal = new THREE.Vector3(
      -dzdx * this.options.strength,
      -dzdy * this.options.strength,
      1.0
    );
    
    normal.normalize();
    
    if (this.options.flipNormals) {
      normal.negate();
    }
    
    return normal;
  }
  
  /**
   * Smooth normals using box filter
   */
  private smoothNormals(
    normals: THREE.Vector3[],
    width: number,
    height: number
  ): THREE.Vector3[] {
    const smoothed: THREE.Vector3[] = [];
    const radius = this.options.smoothing;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const avgNormal = new THREE.Vector3();
        let count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              avgNormal.add(normals[ny * width + nx]);
              count++;
            }
          }
        }
        
        avgNormal.divideScalar(count);
        avgNormal.normalize();
        smoothed.push(avgNormal);
      }
    }
    
    return smoothed;
  }
  
  /**
   * Get normal at specific pixel
   */
  getNormalAt(
    normals: THREE.Vector3[],
    x: number,
    y: number,
    width: number
  ): THREE.Vector3 {
    return normals[y * width + x];
  }
  
  /**
   * Convert normals to normal map texture data
   */
  toNormalMapData(normals: THREE.Vector3[], width: number, height: number): Uint8Array {
    const data = new Uint8Array(width * height * 4);
    
    for (let i = 0; i < normals.length; i++) {
      const normal = normals[i];
      
      // Convert from [-1, 1] to [0, 255]
      data[i * 4] = Math.floor((normal.x * 0.5 + 0.5) * 255);
      data[i * 4 + 1] = Math.floor((normal.y * 0.5 + 0.5) * 255);
      data[i * 4 + 2] = Math.floor((normal.z * 0.5 + 0.5) * 255);
      data[i * 4 + 3] = 255; // Alpha
    }
    
    return data;
  }
}
