/**
 * GPU Instancing Renderer
 * 
 * Renders thousands/millions of similar objects with a single draw call.
 * Uses GPU instancing to achieve massive performance gains.
 */

import * as THREE from 'three';

export interface InstanceData {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  color?: THREE.Color;
  customData?: Float32Array;
}

export interface InstancedRendererConfig {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  maxInstances: number;
  frustumCulled?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export class InstancedRenderer {
  private mesh: THREE.InstancedMesh;
  private instanceCount: number = 0;
  private maxInstances: number;
  private dummy = new THREE.Object3D();
  
  // Optional per-instance color
  private colorAttribute?: THREE.InstancedBufferAttribute;
  
  constructor(config: InstancedRendererConfig) {
    this.maxInstances = config.maxInstances;
    
    // Create instanced mesh
    this.mesh = new THREE.InstancedMesh(
      config.geometry,
      config.material,
      config.maxInstances
    );
    
    this.mesh.frustumCulled = config.frustumCulled ?? true;
    this.mesh.castShadow = config.castShadow ?? true;
    this.mesh.receiveShadow = config.receiveShadow ?? true;
    
    // Initialize with identity matrices
    for (let i = 0; i < config.maxInstances; i++) {
      this.mesh.setMatrixAt(i, new THREE.Matrix4());
    }
  }
  
  /**
   * Set instance data
   */
  setInstance(index: number, data: InstanceData): void {
    if (index >= this.maxInstances) {
      console.warn(`Instance index ${index} exceeds max instances ${this.maxInstances}`);
      return;
    }
    
    // Update transform
    this.dummy.position.copy(data.position);
    this.dummy.rotation.copy(data.rotation);
    this.dummy.scale.copy(data.scale);
    this.dummy.updateMatrix();
    
    this.mesh.setMatrixAt(index, this.dummy.matrix);
    
    // Update color if provided
    if (data.color && this.colorAttribute) {
      this.colorAttribute.setXYZ(index, data.color.r, data.color.g, data.color.b);
    }
    
    this.instanceCount = Math.max(this.instanceCount, index + 1);
  }
  
  /**
   * Batch set multiple instances
   */
  setInstances(instances: InstanceData[]): void {
    for (let i = 0; i < instances.length && i < this.maxInstances; i++) {
      this.setInstance(i, instances[i]);
    }
    this.updateMatrices();
  }
  
  /**
   * Enable per-instance colors
   */
  enableInstanceColors(): void {
    const colors = new Float32Array(this.maxInstances * 3);
    this.colorAttribute = new THREE.InstancedBufferAttribute(colors, 3);
    this.mesh.geometry.setAttribute('instanceColor', this.colorAttribute);
    
    // Update material to use instance colors
    if (this.mesh.material instanceof THREE.ShaderMaterial) {
      // Custom shader material - user handles it
    } else if (this.mesh.material instanceof THREE.MeshStandardMaterial) {
      this.mesh.material.vertexColors = true;
    }
  }
  
  /**
   * Update instance matrices (call after setting instances)
   */
  updateMatrices(): void {
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.colorAttribute) {
      this.colorAttribute.needsUpdate = true;
    }
  }
  
  /**
   * Set visible instance count (for LOD)
   */
  setCount(count: number): void {
    this.mesh.count = Math.min(count, this.maxInstances);
  }
  
  /**
   * Get the Three.js mesh
   */
  getMesh(): THREE.InstancedMesh {
    return this.mesh;
  }
  
  /**
   * Get current instance count
   */
  getCount(): number {
    return this.instanceCount;
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(m => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}
