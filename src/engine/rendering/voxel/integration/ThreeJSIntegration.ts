/**
 * Three.js Integration
 * 
 * Integrates voxel system with Three.js.
 */

import * as THREE from 'three';
import { Voxel } from '../core/Voxel';
import { VoxelPipeline } from '../pipeline/VoxelPipeline';

export class ThreeJSIntegration {
  private pipeline: VoxelPipeline;
  
  constructor(maxVoxels: number = 100000) {
    this.pipeline = new VoxelPipeline(maxVoxels);
  }
  
  /**
   * Convert image to Three.js mesh
   */
  async imageToMesh(imageUrl: string, config?: any): Promise<THREE.InstancedMesh> {
    return await this.pipeline.process(imageUrl, config);
  }
  
  /**
   * Create voxel mesh from voxels
   */
  createMesh(voxels: Voxel[]): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geometry, material);
    
    return mesh;
  }
  
  /**
   * Add to scene
   */
  addToScene(mesh: THREE.Object3D, scene: THREE.Scene): void {
    scene.add(mesh);
  }
  
  /**
   * Dispose
   */
  dispose(): void {
    this.pipeline.dispose();
  }
}
