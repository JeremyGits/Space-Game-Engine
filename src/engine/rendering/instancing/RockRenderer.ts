/**
 * Rock Rendering System
 * 
 * Renders scattered rocks using GPU instancing.
 * Features:
 * - Thousands of rocks with one draw call
 * - Procedural variation
 * - Multiple rock types
 * - LOD support
 */

import * as THREE from 'three';
import { InstancedRenderer, InstanceData } from './InstancedRenderer';

export interface RockConfig {
  count: number;             // Number of rocks
  areaSize: number;          // Size of area to scatter rocks
  minSize: number;           // Minimum rock size
  maxSize: number;           // Maximum rock size
  colorVariation: number;    // 0-1, amount of color variation
}

export class RockRenderer {
  private renderer: InstancedRenderer;
  private material: THREE.MeshStandardMaterial;
  private config: RockConfig;
  private rocks: InstanceData[] = [];
  
  constructor(config: Partial<RockConfig> = {}) {
    this.config = {
      count: 1000,
      areaSize: 50,
      minSize: 0.2,
      maxSize: 0.8,
      colorVariation: 0.3,
      ...config
    };
    
    // Create rock geometry (icosahedron for rocky look)
    const geometry = this.createRockGeometry();
    
    // Create material
    this.material = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.9,
      metalness: 0.1,
      vertexColors: true
    });
    
    // Create instanced renderer
    this.renderer = new InstancedRenderer({
      geometry,
      material: this.material,
      maxInstances: this.config.count,
      castShadow: true,
      receiveShadow: true
    });
    
    // Enable per-instance colors
    this.renderer.enableInstanceColors();
    
    // Generate rocks
    this.generateRocks();
  }
  
  /**
   * Create rock geometry with some irregularity
   */
  private createRockGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.IcosahedronGeometry(0.5, 0);
    
    // Add some randomness to vertices for irregular shape
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      const noise = 0.8 + Math.random() * 0.4;
      positions.setXYZ(i, x * noise, y * noise, z * noise);
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }
  
  /**
   * Generate scattered rocks
   * @param getTerrainHeight - Function to get terrain height at X,Z position
   */
  generateRocks(getTerrainHeight?: (x: number, z: number) => number): void {
    const halfSize = this.config.areaSize / 2;
    
    for (let i = 0; i < this.config.count; i++) {
      const x = (Math.random() - 0.5) * this.config.areaSize;
      const z = (Math.random() - 0.5) * this.config.areaSize;
      
      // Get terrain height at this position
      const terrainHeight = getTerrainHeight ? getTerrainHeight(x, z) : 0;
      
      // Random position
      const position = new THREE.Vector3(x, terrainHeight, z);
      
      // Random rotation
      const rotation = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      // Random size
      const size = this.config.minSize + Math.random() * (this.config.maxSize - this.config.minSize);
      const scale = new THREE.Vector3(
        size * (0.8 + Math.random() * 0.4),
        size * (0.8 + Math.random() * 0.4),
        size * (0.8 + Math.random() * 0.4)
      );
      
      // Color variation (gray tones)
      const colorVar = 0.4 + Math.random() * this.config.colorVariation;
      const color = new THREE.Color(colorVar, colorVar, colorVar);
      
      this.rocks.push({
        position,
        rotation,
        scale,
        color
      });
    }
    
    // Set all instances
    this.renderer.setInstances(this.rocks);
  }
  
  /**
   * Get the Three.js mesh for adding to scene
   */
  getMesh(): THREE.InstancedMesh {
    return this.renderer.getMesh();
  }
  
  /**
   * Get rock count
   */
  getRockCount(): number {
    return this.rocks.length;
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this.renderer.dispose();
    this.material.dispose();
  }
}
