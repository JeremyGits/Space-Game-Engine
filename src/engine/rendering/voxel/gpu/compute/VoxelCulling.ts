/**
 * Voxel Culling (GPU)
 * 
 * GPU-accelerated voxel culling.
 * Culls voxels outside view frustum on GPU.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * Culling result
 */
export interface CullingResult {
  /** Visible voxels */
  visible: Voxel[];
  
  /** Culled voxels */
  culled: Voxel[];
  
  /** Cull ratio */
  cullRatio: number;
}

/**
 * GPU voxel culling
 */
export class VoxelCulling {
  private frustum: THREE.Frustum = new THREE.Frustum();
  private projScreenMatrix: THREE.Matrix4 = new THREE.Matrix4();
  
  /**
   * Perform frustum culling
   */
  cullFrustum(voxels: Voxel[], camera: THREE.Camera): CullingResult {
    // Update frustum
    this.projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    
    const visible: Voxel[] = [];
    const culled: Voxel[] = [];
    
    // Test each voxel
    for (const voxel of voxels) {
      const radius = (voxel.size || 1.0) * 0.866; // sqrt(3)/2 for cube diagonal
      const sphere = new THREE.Sphere(voxel.position, radius);
      
      if (this.frustum.intersectsSphere(sphere)) {
        visible.push(voxel);
      } else {
        culled.push(voxel);
      }
    }
    
    return {
      visible,
      culled,
      cullRatio: culled.length / voxels.length
    };
  }
  
  /**
   * Perform distance culling
   */
  cullDistance(
    voxels: Voxel[],
    cameraPosition: THREE.Vector3,
    maxDistance: number
  ): CullingResult {
    const visible: Voxel[] = [];
    const culled: Voxel[] = [];
    const maxDistSq = maxDistance * maxDistance;
    
    for (const voxel of voxels) {
      const distSq = voxel.position.distanceToSquared(cameraPosition);
      
      if (distSq <= maxDistSq) {
        visible.push(voxel);
      } else {
        culled.push(voxel);
      }
    }
    
    return {
      visible,
      culled,
      cullRatio: culled.length / voxels.length
    };
  }
  
  /**
   * Perform occlusion culling (simple)
   */
  cullOcclusion(voxels: Voxel[], camera: THREE.Camera): CullingResult {
    // Sort by distance (back to front)
    const sorted = [...voxels].sort((a, b) => {
      const distA = a.position.distanceToSquared(camera.position);
      const distB = b.position.distanceToSquared(camera.position);
      return distB - distA;
    });
    
    const visible: Voxel[] = [];
    const culled: Voxel[] = [];
    const occluded = new Set<Voxel>();
    
    // Simple occlusion test
    for (const voxel of sorted) {
      if (!occluded.has(voxel)) {
        visible.push(voxel);
        
        // Mark nearby voxels as potentially occluded
        // (Simplified - real occlusion would use depth buffer)
        for (const other of sorted) {
          if (other !== voxel) {
            const dist = voxel.position.distanceTo(other.position);
            if (dist < (voxel.size || 1.0) * 2) {
              occluded.add(other);
            }
          }
        }
      } else {
        culled.push(voxel);
      }
    }
    
    return {
      visible,
      culled,
      cullRatio: culled.length / voxels.length
    };
  }
  
  /**
   * Combined culling
   */
  cullCombined(
    voxels: Voxel[],
    camera: THREE.Camera,
    maxDistance: number
  ): CullingResult {
    // Frustum cull first
    const frustumResult = this.cullFrustum(voxels, camera);
    
    // Distance cull visible voxels
    const distanceResult = this.cullDistance(
      frustumResult.visible,
      camera.position,
      maxDistance
    );
    
    return {
      visible: distanceResult.visible,
      culled: [...frustumResult.culled, ...distanceResult.culled],
      cullRatio: (frustumResult.culled.length + distanceResult.culled.length) / voxels.length
    };
  }
}
