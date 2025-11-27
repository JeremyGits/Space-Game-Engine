/**
 * Voxel Bounds
 * 
 * Utility class for working with voxel bounding volumes.
 * Provides efficient bounds calculations and intersection tests.
 */

import * as THREE from 'three';
import { Voxel } from './Voxel';

/**
 * Voxel bounds utility class
 */
export class VoxelBounds {
  /**
   * Calculate bounding box for an array of voxels
   */
  static calculateBounds(voxels: Voxel[]): THREE.Box3 {
    if (voxels.length === 0) {
      return new THREE.Box3();
    }
    
    const bounds = new THREE.Box3();
    bounds.makeEmpty();
    
    for (const voxel of voxels) {
      bounds.expandByPoint(voxel.position);
    }
    
    return bounds;
  }
  
  /**
   * Calculate tight bounding box considering voxel size
   */
  static calculateTightBounds(voxels: Voxel[]): THREE.Box3 {
    if (voxels.length === 0) {
      return new THREE.Box3();
    }
    
    const bounds = new THREE.Box3();
    bounds.makeEmpty();
    
    for (const voxel of voxels) {
      const voxelBounds = voxel.getBounds();
      bounds.union(voxelBounds);
    }
    
    return bounds;
  }
  
  /**
   * Calculate bounding sphere for voxels
   */
  static calculateBoundingSphere(voxels: Voxel[]): THREE.Sphere {
    if (voxels.length === 0) {
      return new THREE.Sphere(new THREE.Vector3(), 0);
    }
    
    // Calculate center
    const center = new THREE.Vector3();
    for (const voxel of voxels) {
      center.add(voxel.position);
    }
    center.divideScalar(voxels.length);
    
    // Calculate radius
    let radiusSquared = 0;
    for (const voxel of voxels) {
      const distSquared = voxel.position.distanceToSquared(center);
      radiusSquared = Math.max(radiusSquared, distSquared);
    }
    
    return new THREE.Sphere(center, Math.sqrt(radiusSquared));
  }
  
  /**
   * Expand bounds to include a voxel
   */
  static expandByVoxel(bounds: THREE.Box3, voxel: Voxel): THREE.Box3 {
    const voxelBounds = voxel.getBounds();
    return bounds.union(voxelBounds);
  }
  
  /**
   * Check if bounds contain a voxel
   */
  static containsVoxel(bounds: THREE.Box3, voxel: Voxel): boolean {
    return bounds.containsPoint(voxel.position);
  }
  
  /**
   * Check if bounds intersect with voxel
   */
  static intersectsVoxel(bounds: THREE.Box3, voxel: Voxel): boolean {
    const voxelBounds = voxel.getBounds();
    return bounds.intersectsBox(voxelBounds);
  }
  
  /**
   * Get voxels within bounds
   */
  static getVoxelsInBounds(voxels: Voxel[], bounds: THREE.Box3): Voxel[] {
    return voxels.filter(voxel => bounds.containsPoint(voxel.position));
  }
  
  /**
   * Get voxels intersecting bounds
   */
  static getVoxelsIntersectingBounds(voxels: Voxel[], bounds: THREE.Box3): Voxel[] {
    return voxels.filter(voxel => {
      const voxelBounds = voxel.getBounds();
      return bounds.intersectsBox(voxelBounds);
    });
  }
  
  /**
   * Calculate bounds for a grid region
   */
  static calculateGridBounds(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
    voxelSize: number = 1.0
  ): THREE.Box3 {
    return new THREE.Box3(
      new THREE.Vector3(minX * voxelSize, minY * voxelSize, minZ * voxelSize),
      new THREE.Vector3((maxX + 1) * voxelSize, (maxY + 1) * voxelSize, (maxZ + 1) * voxelSize)
    );
  }
  
  /**
   * Split bounds into 8 octants
   */
  static splitBounds(bounds: THREE.Box3): THREE.Box3[] {
    const center = bounds.getCenter(new THREE.Vector3());
    const min = bounds.min;
    const max = bounds.max;
    
    return [
      // Bottom 4 octants
      new THREE.Box3(new THREE.Vector3(min.x, min.y, min.z), new THREE.Vector3(center.x, center.y, center.z)),
      new THREE.Box3(new THREE.Vector3(center.x, min.y, min.z), new THREE.Vector3(max.x, center.y, center.z)),
      new THREE.Box3(new THREE.Vector3(min.x, min.y, center.z), new THREE.Vector3(center.x, center.y, max.z)),
      new THREE.Box3(new THREE.Vector3(center.x, min.y, center.z), new THREE.Vector3(max.x, center.y, max.z)),
      // Top 4 octants
      new THREE.Box3(new THREE.Vector3(min.x, center.y, min.z), new THREE.Vector3(center.x, max.y, center.z)),
      new THREE.Box3(new THREE.Vector3(center.x, center.y, min.z), new THREE.Vector3(max.x, max.y, center.z)),
      new THREE.Box3(new THREE.Vector3(min.x, center.y, center.z), new THREE.Vector3(center.x, max.y, max.z)),
      new THREE.Box3(new THREE.Vector3(center.x, center.y, center.z), new THREE.Vector3(max.x, max.y, max.z))
    ];
  }
  
  /**
   * Get octant index for a point within bounds
   */
  static getOctantIndex(bounds: THREE.Box3, point: THREE.Vector3): number {
    const center = bounds.getCenter(new THREE.Vector3());
    
    let index = 0;
    if (point.x >= center.x) index |= 1;  // Right half
    if (point.y >= center.y) index |= 2;  // Top half
    if (point.z >= center.z) index |= 4;  // Front half
    
    return index;
  }
  
  /**
   * Get bounds volume
   */
  static getVolume(bounds: THREE.Box3): number {
    const size = bounds.getSize(new THREE.Vector3());
    return size.x * size.y * size.z;
  }
  
  /**
   * Get bounds surface area
   */
  static getSurfaceArea(bounds: THREE.Box3): number {
    const size = bounds.getSize(new THREE.Vector3());
    return 2 * (size.x * size.y + size.y * size.z + size.z * size.x);
  }
  
  /**
   * Check if bounds are valid (min < max)
   */
  static isValid(bounds: THREE.Box3): boolean {
    return bounds.min.x <= bounds.max.x &&
           bounds.min.y <= bounds.max.y &&
           bounds.min.z <= bounds.max.z;
  }
  
  /**
   * Clamp bounds to a maximum size
   */
  static clampSize(bounds: THREE.Box3, maxSize: number): THREE.Box3 {
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    
    const clampedSize = new THREE.Vector3(
      Math.min(size.x, maxSize),
      Math.min(size.y, maxSize),
      Math.min(size.z, maxSize)
    );
    
    const halfSize = clampedSize.multiplyScalar(0.5);
    
    return new THREE.Box3(
      new THREE.Vector3().subVectors(center, halfSize),
      new THREE.Vector3().addVectors(center, halfSize)
    );
  }
  
  /**
   * Expand bounds by a margin
   */
  static expand(bounds: THREE.Box3, margin: number): THREE.Box3 {
    const expanded = bounds.clone();
    expanded.min.subScalar(margin);
    expanded.max.addScalar(margin);
    return expanded;
  }
  
  /**
   * Contract bounds by a margin
   */
  static contract(bounds: THREE.Box3, margin: number): THREE.Box3 {
    const contracted = bounds.clone();
    contracted.min.addScalar(margin);
    contracted.max.subScalar(margin);
    
    // Ensure bounds remain valid
    if (!this.isValid(contracted)) {
      const center = bounds.getCenter(new THREE.Vector3());
      return new THREE.Box3(center, center);
    }
    
    return contracted;
  }
  
  /**
   * Get corners of bounds
   */
  static getCorners(bounds: THREE.Box3): THREE.Vector3[] {
    const min = bounds.min;
    const max = bounds.max;
    
    return [
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(max.x, min.y, min.z),
      new THREE.Vector3(min.x, max.y, min.z),
      new THREE.Vector3(max.x, max.y, min.z),
      new THREE.Vector3(min.x, min.y, max.z),
      new THREE.Vector3(max.x, min.y, max.z),
      new THREE.Vector3(min.x, max.y, max.z),
      new THREE.Vector3(max.x, max.y, max.z)
    ];
  }
  
  /**
   * Check if bounds are completely inside frustum
   */
  static isInsideFrustum(bounds: THREE.Box3, frustum: THREE.Frustum): boolean {
    const corners = this.getCorners(bounds);
    
    for (const corner of corners) {
      if (!frustum.containsPoint(corner)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Merge multiple bounds into one
   */
  static mergeBounds(boundsArray: THREE.Box3[]): THREE.Box3 {
    if (boundsArray.length === 0) {
      return new THREE.Box3();
    }
    
    const merged = boundsArray[0].clone();
    
    for (let i = 1; i < boundsArray.length; i++) {
      merged.union(boundsArray[i]);
    }
    
    return merged;
  }
}
