    /**
 * Voxel - Single Voxel Data Structure
 * 
 * Represents a single voxel (3D pixel) with position, color, and material properties.
 * This is the fundamental building block of the voxel rendering system.
 */

import * as THREE from 'three';

/**
 * Voxel material properties
 */
export interface VoxelMaterial {
  /** Metalness (0 = dielectric, 1 = metal) */
  metalness: number;
  
  /** Roughness (0 = smooth, 1 = rough) */
  roughness: number;
  
  /** Emissive intensity (0 = no emission, 1 = full emission) */
  emissive?: number;
  
  /** Transparency (0 = opaque, 1 = fully transparent) */
  transparency?: number;
  
  /** Index of refraction (for transparent materials) */
  ior?: number;
}

/**
 * Voxel class - represents a single voxel in 3D space
 */
export class Voxel {
  /** 3D position in voxel grid coordinates */
  public position: THREE.Vector3;
  
  /** RGBA color (0-255 for RGB, 0-1 for A) */
  public color: THREE.Color;
  public alpha: number;
  
  /** Material properties for PBR rendering */
  public material: VoxelMaterial;
  
  /** Voxel size (typically 1.0 for unit voxels) */
  public size: number;
  
  /** Whether this voxel is active/visible */
  public active: boolean;
  
  /** User data for custom properties */
  public userData: Record<string, any>;
  
  constructor(
    x: number,
    y: number,
    z: number,
    color: THREE.Color = new THREE.Color(0xffffff),
    alpha: number = 1.0,
    material: Partial<VoxelMaterial> = {}
  ) {
    this.position = new THREE.Vector3(x, y, z);
    this.color = color.clone();
    this.alpha = alpha;
    this.material = {
      metalness: material.metalness ?? 0.0,
      roughness: material.roughness ?? 0.5,
      emissive: material.emissive ?? 0.0,
      transparency: material.transparency ?? 0.0,
      ior: material.ior ?? 1.45
    };
    this.size = 1.0;
    this.active = true;
    this.userData = {};
  }
  
  /**
   * Create voxel from RGB values
   */
  static fromRGB(
    x: number,
    y: number,
    z: number,
    r: number,
    g: number,
    b: number,
    a: number = 1.0
  ): Voxel {
    const color = new THREE.Color(r / 255, g / 255, b / 255);
    return new Voxel(x, y, z, color, a);
  }
  
  /**
   * Create voxel from hex color
   */
  static fromHex(
    x: number,
    y: number,
    z: number,
    hex: number,
    alpha: number = 1.0
  ): Voxel {
    const color = new THREE.Color(hex);
    return new Voxel(x, y, z, color, alpha);
  }
  
  /**
   * Clone this voxel
   */
  clone(): Voxel {
    const voxel = new Voxel(
      this.position.x,
      this.position.y,
      this.position.z,
      this.color,
      this.alpha,
      this.material
    );
    voxel.size = this.size;
    voxel.active = this.active;
    voxel.userData = { ...this.userData };
    return voxel;
  }
  
  /**
   * Get voxel bounds as Box3
   */
  getBounds(): THREE.Box3 {
    const halfSize = this.size / 2;
    return new THREE.Box3(
      new THREE.Vector3(
        this.position.x - halfSize,
        this.position.y - halfSize,
        this.position.z - halfSize
      ),
      new THREE.Vector3(
        this.position.x + halfSize,
        this.position.y + halfSize,
        this.position.z + halfSize
      )
    );
  }
  
  /**
   * Get voxel center position
   */
  getCenter(): THREE.Vector3 {
    return this.position.clone();
  }
  
  /**
   * Check if this voxel is similar to another (for clustering)
   */
  isSimilarTo(other: Voxel, colorThreshold: number = 0.1, materialThreshold: number = 0.1): boolean {
    // Check color similarity (Euclidean distance in RGB space)
    const dr = this.color.r - other.color.r;
    const dg = this.color.g - other.color.g;
    const db = this.color.b - other.color.b;
    const colorDist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (colorDist > colorThreshold) return false;
    
    // Check alpha similarity
    if (Math.abs(this.alpha - other.alpha) > 0.1) return false;
    
    // Check material similarity
    const metalnessDiff = Math.abs(this.material.metalness - other.material.metalness);
    const roughnessDiff = Math.abs(this.material.roughness - other.material.roughness);
    
    if (metalnessDiff > materialThreshold || roughnessDiff > materialThreshold) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if this voxel is adjacent to another
   */
  isAdjacentTo(other: Voxel): boolean {
    const dx = Math.abs(this.position.x - other.position.x);
    const dy = Math.abs(this.position.y - other.position.y);
    const dz = Math.abs(this.position.z - other.position.z);
    
    // Adjacent if exactly one coordinate differs by 1
    const adjacentCount = (dx === 1 ? 1 : 0) + (dy === 1 ? 1 : 0) + (dz === 1 ? 1 : 0);
    const sameCount = (dx === 0 ? 1 : 0) + (dy === 0 ? 1 : 0) + (dz === 0 ? 1 : 0);
    
    return adjacentCount === 1 && sameCount === 2;
  }
  
  /**
   * Get distance to another voxel
   */
  distanceTo(other: Voxel): number {
    return this.position.distanceTo(other.position);
  }
  
  /**
   * Get squared distance to another voxel (faster, no sqrt)
   */
  distanceToSquared(other: Voxel): number {
    return this.position.distanceToSquared(other.position);
  }
  
  /**
   * Serialize voxel to JSON
   */
  toJSON(): any {
    return {
      position: this.position.toArray(),
      color: '#' + this.color.getHexString(),
      alpha: this.alpha,
      material: this.material,
      size: this.size,
      active: this.active,
      userData: this.userData
    };
  }
  
  /**
   * Deserialize voxel from JSON
   */
  static fromJSON(data: any): Voxel {
    const voxel = new Voxel(
      data.position[0],
      data.position[1],
      data.position[2],
      new THREE.Color(data.color),
      data.alpha,
      data.material
    );
    voxel.size = data.size;
    voxel.active = data.active;
    voxel.userData = data.userData || {};
    return voxel;
  }
  
  /**
   * Get memory footprint in bytes
   */
  getMemorySize(): number {
    // Position: 3 floats = 12 bytes
    // Color: 3 floats = 12 bytes
    // Alpha: 1 float = 4 bytes
    // Material: 5 floats = 20 bytes
    // Size: 1 float = 4 bytes
    // Active: 1 boolean = 1 byte
    // Overhead: ~16 bytes (object overhead)
    return 69;
  }
  
  /**
   * Convert to string for debugging
   */
  toString(): string {
    return `Voxel(${this.position.x}, ${this.position.y}, ${this.position.z}) [${this.color.getHexString()}]`;
  }
}

/**
 * Voxel utility functions
 */
export class VoxelUtils {
  /**
   * Calculate voxel grid position from world position
   */
  static worldToVoxel(worldPos: THREE.Vector3, voxelSize: number = 1.0): THREE.Vector3 {
    return new THREE.Vector3(
      Math.floor(worldPos.x / voxelSize),
      Math.floor(worldPos.y / voxelSize),
      Math.floor(worldPos.z / voxelSize)
    );
  }
  
  /**
   * Calculate world position from voxel grid position
   */
  static voxelToWorld(voxelPos: THREE.Vector3, voxelSize: number = 1.0): THREE.Vector3 {
    return new THREE.Vector3(
      voxelPos.x * voxelSize + voxelSize / 2,
      voxelPos.y * voxelSize + voxelSize / 2,
      voxelPos.z * voxelSize + voxelSize / 2
    );
  }
  
  /**
   * Get voxel key for hash map storage
   */
  static getVoxelKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }
  
  /**
   * Parse voxel key back to coordinates
   */
  static parseVoxelKey(key: string): [number, number, number] {
    const parts = key.split(',').map(Number);
    return [parts[0], parts[1], parts[2]];
  }
  
  /**
   * Get 6 face neighbors of a voxel position
   */
  static getFaceNeighbors(x: number, y: number, z: number): Array<[number, number, number]> {
    return [
      [x + 1, y, z],  // Right
      [x - 1, y, z],  // Left
      [x, y + 1, z],  // Top
      [x, y - 1, z],  // Bottom
      [x, y, z + 1],  // Front
      [x, y, z - 1]   // Back
    ];
  }
  
  /**
   * Get all 26 neighbors (faces + edges + corners)
   */
  static getAllNeighbors(x: number, y: number, z: number): Array<[number, number, number]> {
    const neighbors: Array<[number, number, number]> = [];
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue; // Skip self
          neighbors.push([x + dx, y + dy, z + dz]);
        }
      }
    }
    
    return neighbors;
  }
  
  /**
   * Interpolate between two voxels
   */
  static lerp(a: Voxel, b: Voxel, t: number): Voxel {
    const position = new THREE.Vector3().lerpVectors(a.position, b.position, t);
    const color = new THREE.Color().lerpColors(a.color, b.color, t);
    const alpha = THREE.MathUtils.lerp(a.alpha, b.alpha, t);
    
    const material: VoxelMaterial = {
      metalness: THREE.MathUtils.lerp(a.material.metalness, b.material.metalness, t),
      roughness: THREE.MathUtils.lerp(a.material.roughness, b.material.roughness, t),
      emissive: THREE.MathUtils.lerp(a.material.emissive ?? 0, b.material.emissive ?? 0, t),
      transparency: THREE.MathUtils.lerp(a.material.transparency ?? 0, b.material.transparency ?? 0, t)
    };
    
    return new Voxel(position.x, position.y, position.z, color, alpha, material);
  }
}
