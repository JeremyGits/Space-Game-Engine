/**
 * Instanced Voxel Renderer
 * 
 * Renders massive voxel counts using GPU instancing.
 * Single draw call for 100,000+ voxels!
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * Instanced voxel renderer
 */
export class InstancedVoxelRenderer {
  private mesh: THREE.InstancedMesh | null = null;
  private maxInstances: number;
  
  constructor(maxInstances: number = 100000) {
    this.maxInstances = maxInstances;
  }
  
  /**
   * Initialize renderer
   */
  initialize(): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true
    });
    
    this.mesh = new THREE.InstancedMesh(geometry, material, this.maxInstances);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }
  
  /**
   * Update voxels
   */
  update(voxels: Voxel[]): void {
    if (!this.mesh) return;
    
    const count = Math.min(voxels.length, this.maxInstances);
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      const voxel = voxels[i];
      const size = voxel.size || 1.0;
      
      matrix.compose(
        voxel.position,
        new THREE.Quaternion(),
        new THREE.Vector3(size, size, size)
      );
      
      this.mesh.setMatrixAt(i, matrix);
      this.mesh.setColorAt(i, color.setRGB(voxel.color.r, voxel.color.g, voxel.color.b));
    }
    
    this.mesh.count = count;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }
  
  /**
   * Get mesh
   */
  getMesh(): THREE.InstancedMesh | null {
    return this.mesh;
  }
  
  /**
   * Dispose
   */
  dispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(m => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
      this.mesh = null;
    }
  }
}
