/**
 * Voxel Raycast (GPU)
 * 
 * GPU-accelerated raycasting for voxel picking and intersection.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';
import { SparseVoxelOctree } from '../../core/SparseVoxelOctree';

/**
 * Raycast hit result
 */
export interface RaycastHit {
  /** Hit voxel */
  voxel: Voxel;
  
  /** Hit position */
  position: THREE.Vector3;
  
  /** Hit normal */
  normal: THREE.Vector3;
  
  /** Distance from ray origin */
  distance: number;
}

/**
 * GPU voxel raycasting
 */
export class VoxelRaycast {
  private octree: SparseVoxelOctree | null = null;
  
  /**
   * Build octree for raycasting
   */
  buildOctree(voxels: Voxel[], bounds: THREE.Box3): void {
    this.octree = new SparseVoxelOctree(bounds, 8);
    
    for (const voxel of voxels) {
      this.octree.insert(voxel);
    }
  }
  
  /**
   * Raycast against voxels
   */
  raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number = 1000): RaycastHit | null {
    if (!this.octree) return null;
    
    const ray = new THREE.Ray(origin, direction.clone().normalize());
    let closestHit: RaycastHit | null = null;
    let closestDistance = maxDistance;
    
    // Query octree for potential hits
    const candidates = this.octree.query({
      type: 'ray',
      origin,
      direction,
      maxDistance
    });
    
    // Test each candidate
    for (const voxel of candidates) {
      const hit = this.raycastVoxel(ray, voxel);
      
      if (hit && hit.distance < closestDistance) {
        closestHit = hit;
        closestDistance = hit.distance;
      }
    }
    
    return closestHit;
  }
  
  /**
   * Raycast against single voxel
   */
  private raycastVoxel(ray: THREE.Ray, voxel: Voxel): RaycastHit | null {
    const size = voxel.size || 1.0;
    const halfSize = size * 0.5;
    
    // Create bounding box
    const box = new THREE.Box3(
      new THREE.Vector3(
        voxel.position.x - halfSize,
        voxel.position.y - halfSize,
        voxel.position.z - halfSize
      ),
      new THREE.Vector3(
        voxel.position.x + halfSize,
        voxel.position.y + halfSize,
        voxel.position.z + halfSize
      )
    );
    
    // Test intersection
    const hitPoint = new THREE.Vector3();
    const intersects = ray.intersectBox(box, hitPoint);
    
    if (!intersects) return null;
    
    // Calculate normal
    const normal = this.calculateBoxNormal(hitPoint, voxel.position, halfSize);
    
    // Calculate distance
    const distance = ray.origin.distanceTo(hitPoint);
    
    return {
      voxel,
      position: hitPoint,
      normal,
      distance
    };
  }
  
  /**
   * Calculate box surface normal at hit point
   */
  private calculateBoxNormal(hitPoint: THREE.Vector3, center: THREE.Vector3, halfSize: number): THREE.Vector3 {
    const epsilon = 0.001;
    const dx = Math.abs(hitPoint.x - center.x);
    const dy = Math.abs(hitPoint.y - center.y);
    const dz = Math.abs(hitPoint.z - center.z);
    
    // Find which face was hit
    if (Math.abs(dx - halfSize) < epsilon) {
      return new THREE.Vector3(Math.sign(hitPoint.x - center.x), 0, 0);
    } else if (Math.abs(dy - halfSize) < epsilon) {
      return new THREE.Vector3(0, Math.sign(hitPoint.y - center.y), 0);
    } else if (Math.abs(dz - halfSize) < epsilon) {
      return new THREE.Vector3(0, 0, Math.sign(hitPoint.z - center.z));
    }
    
    return new THREE.Vector3(0, 1, 0); // Default to up
  }
}
