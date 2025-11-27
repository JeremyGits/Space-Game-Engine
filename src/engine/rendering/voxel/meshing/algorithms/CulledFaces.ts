/**
 * Culled Faces Algorithm
 * 
 * Removes faces that are completely hidden by neighboring voxels.
 * Essential optimization for voxel rendering.
 * 
 * Process:
 * 1. Check each voxel's 6 faces
 * 2. If neighbor exists in that direction, cull the face
 * 3. Only generate visible faces
 * 
 * Performance: 80-95% reduction in faces for solid volumes!
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * Face data
 */
export interface VoxelFace {
  /** Voxel this face belongs to */
  voxel: Voxel;
  
  /** Face direction */
  direction: FaceDirection;
  
  /** Face vertices (4 corners) */
  vertices: THREE.Vector3[];
  
  /** Face normal */
  normal: THREE.Vector3;
  
  /** Face color */
  color: THREE.Color;
  
  /** UV coordinates */
  uvs: THREE.Vector2[];
}

/**
 * Face direction
 */
export enum FaceDirection {
  FRONT = 0,   // +Z
  BACK = 1,    // -Z
  TOP = 2,     // +Y
  BOTTOM = 3,  // -Y
  RIGHT = 4,   // +X
  LEFT = 5     // -X
}

/**
 * Culling options
 */
export interface CullingOptions {
  /** Enable face culling */
  enabled?: boolean;
  
  /** Cull internal faces */
  cullInternal?: boolean;
  
  /** Cull back faces */
  cullBackFaces?: boolean;
  
  /** Voxel size */
  voxelSize?: number;
}

/**
 * Culling result
 */
export interface CullingResult {
  /** Visible faces */
  faces: VoxelFace[];
  
  /** Statistics */
  stats: {
    totalFaces: number;
    visibleFaces: number;
    culledFaces: number;
    reductionPercent: number;
  };
}

/**
 * Culled faces algorithm
 */
export class CulledFaces {
  private options: Required<CullingOptions>;
  
  constructor(options: CullingOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      cullInternal: options.cullInternal ?? true,
      cullBackFaces: options.cullBackFaces ?? false,
      voxelSize: options.voxelSize ?? 1.0
    };
  }
  
  /**
   * Generate culled faces from voxels
   */
  generateFaces(voxels: Voxel[]): CullingResult {
    const result: CullingResult = {
      faces: [],
      stats: {
        totalFaces: voxels.length * 6,
        visibleFaces: 0,
        culledFaces: 0,
        reductionPercent: 0
      }
    };
    
    if (!this.options.enabled || voxels.length === 0) {
      return result;
    }
    
    // Build voxel grid for fast neighbor lookup
    const grid = this.buildVoxelGrid(voxels);
    
    // Generate faces for each voxel
    for (const voxel of voxels) {
      const voxelFaces = this.generateVoxelFaces(voxel, grid);
      result.faces.push(...voxelFaces);
    }
    
    // Calculate statistics
    result.stats.visibleFaces = result.faces.length;
    result.stats.culledFaces = result.stats.totalFaces - result.stats.visibleFaces;
    result.stats.reductionPercent = (result.stats.culledFaces / result.stats.totalFaces) * 100;
    
    return result;
  }
  
  /**
   * Generate faces for a single voxel
   */
  private generateVoxelFaces(voxel: Voxel, grid: Map<string, Voxel>): VoxelFace[] {
    const faces: VoxelFace[] = [];
    const pos = voxel.position;
    const size = this.options.voxelSize;
    
    // Check each of 6 faces
    for (let dir = 0; dir < 6; dir++) {
      const direction = dir as FaceDirection;
      
      // Check if face should be culled
      if (this.shouldCullFace(voxel, grid, direction)) {
        continue;
      }
      
      // Generate face
      const face = this.createFace(voxel, direction, size);
      faces.push(face);
    }
    
    return faces;
  }
  
  /**
   * Check if face should be culled
   */
  private shouldCullFace(
    voxel: Voxel,
    grid: Map<string, Voxel>,
    direction: FaceDirection
  ): boolean {
    if (!this.options.cullInternal) {
      return false;
    }
    
    // Get neighbor position
    const offset = this.getDirectionOffset(direction);
    const neighborPos = voxel.position.clone().add(
      new THREE.Vector3(offset[0], offset[1], offset[2])
    );
    
    // Check if neighbor exists
    const neighborKey = this.getGridKey(
      Math.floor(neighborPos.x),
      Math.floor(neighborPos.y),
      Math.floor(neighborPos.z)
    );
    
    return grid.has(neighborKey);
  }
  
  /**
   * Create face geometry
   */
  private createFace(
    voxel: Voxel,
    direction: FaceDirection,
    size: number
  ): VoxelFace {
    const pos = voxel.position;
    const vertices = this.getFaceVertices(pos, direction, size);
    const normal = this.getFaceNormal(direction);
    const uvs = this.getFaceUVs();
    
    return {
      voxel,
      direction,
      vertices,
      normal,
      color: new THREE.Color(voxel.color.r, voxel.color.g, voxel.color.b),
      uvs
    };
  }
  
  /**
   * Get face vertices
   */
  private getFaceVertices(
    pos: THREE.Vector3,
    direction: FaceDirection,
    size: number
  ): THREE.Vector3[] {
    const s = size / 2;
    
    switch (direction) {
      case FaceDirection.FRONT: // +Z
        return [
          new THREE.Vector3(pos.x - s, pos.y - s, pos.z + s),
          new THREE.Vector3(pos.x + s, pos.y - s, pos.z + s),
          new THREE.Vector3(pos.x + s, pos.y + s, pos.z + s),
          new THREE.Vector3(pos.x - s, pos.y + s, pos.z + s)
        ];
      
      case FaceDirection.BACK: // -Z
        return [
          new THREE.Vector3(pos.x + s, pos.y - s, pos.z - s),
          new THREE.Vector3(pos.x - s, pos.y - s, pos.z - s),
          new THREE.Vector3(pos.x - s, pos.y + s, pos.z - s),
          new THREE.Vector3(pos.x + s, pos.y + s, pos.z - s)
        ];
      
      case FaceDirection.TOP: // +Y
        return [
          new THREE.Vector3(pos.x - s, pos.y + s, pos.z - s),
          new THREE.Vector3(pos.x + s, pos.y + s, pos.z - s),
          new THREE.Vector3(pos.x + s, pos.y + s, pos.z + s),
          new THREE.Vector3(pos.x - s, pos.y + s, pos.z + s)
        ];
      
      case FaceDirection.BOTTOM: // -Y
        return [
          new THREE.Vector3(pos.x - s, pos.y - s, pos.z + s),
          new THREE.Vector3(pos.x + s, pos.y - s, pos.z + s),
          new THREE.Vector3(pos.x + s, pos.y - s, pos.z - s),
          new THREE.Vector3(pos.x - s, pos.y - s, pos.z - s)
        ];
      
      case FaceDirection.RIGHT: // +X
        return [
          new THREE.Vector3(pos.x + s, pos.y - s, pos.z - s),
          new THREE.Vector3(pos.x + s, pos.y - s, pos.z + s),
          new THREE.Vector3(pos.x + s, pos.y + s, pos.z + s),
          new THREE.Vector3(pos.x + s, pos.y + s, pos.z - s)
        ];
      
      case FaceDirection.LEFT: // -X
        return [
          new THREE.Vector3(pos.x - s, pos.y - s, pos.z + s),
          new THREE.Vector3(pos.x - s, pos.y - s, pos.z - s),
          new THREE.Vector3(pos.x - s, pos.y + s, pos.z - s),
          new THREE.Vector3(pos.x - s, pos.y + s, pos.z + s)
        ];
    }
  }
  
  /**
   * Get face normal
   */
  private getFaceNormal(direction: FaceDirection): THREE.Vector3 {
    switch (direction) {
      case FaceDirection.FRONT: return new THREE.Vector3(0, 0, 1);
      case FaceDirection.BACK: return new THREE.Vector3(0, 0, -1);
      case FaceDirection.TOP: return new THREE.Vector3(0, 1, 0);
      case FaceDirection.BOTTOM: return new THREE.Vector3(0, -1, 0);
      case FaceDirection.RIGHT: return new THREE.Vector3(1, 0, 0);
      case FaceDirection.LEFT: return new THREE.Vector3(-1, 0, 0);
    }
  }
  
  /**
   * Get face UVs
   */
  private getFaceUVs(): THREE.Vector2[] {
    return [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(1, 0),
      new THREE.Vector2(1, 1),
      new THREE.Vector2(0, 1)
    ];
  }
  
  /**
   * Get direction offset
   */
  private getDirectionOffset(direction: FaceDirection): [number, number, number] {
    switch (direction) {
      case FaceDirection.FRONT: return [0, 0, 1];
      case FaceDirection.BACK: return [0, 0, -1];
      case FaceDirection.TOP: return [0, 1, 0];
      case FaceDirection.BOTTOM: return [0, -1, 0];
      case FaceDirection.RIGHT: return [1, 0, 0];
      case FaceDirection.LEFT: return [-1, 0, 0];
    }
  }
  
  /**
   * Build voxel grid for fast lookup
   */
  private buildVoxelGrid(voxels: Voxel[]): Map<string, Voxel> {
    const grid = new Map<string, Voxel>();
    
    for (const voxel of voxels) {
      const key = this.getGridKey(
        Math.floor(voxel.position.x),
        Math.floor(voxel.position.y),
        Math.floor(voxel.position.z)
      );
      grid.set(key, voxel);
    }
    
    return grid;
  }
  
  /**
   * Get grid key
   */
  private getGridKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }
}
