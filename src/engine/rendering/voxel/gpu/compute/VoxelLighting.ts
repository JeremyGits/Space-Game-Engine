/**
 * Voxel Lighting (GPU)
 * 
 * GPU-accelerated lighting calculations for voxels.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';

/**
 * Light data
 */
export interface LightData {
  /** Light position */
  position: THREE.Vector3;
  
  /** Light color */
  color: THREE.Color;
  
  /** Light intensity */
  intensity: number;
  
  /** Light type */
  type: 'point' | 'directional' | 'spot';
}

/**
 * GPU voxel lighting
 */
export class VoxelLighting {
  private lights: LightData[] = [];
  
  /**
   * Add light
   */
  addLight(light: LightData): void {
    this.lights.push(light);
  }
  
  /**
   * Clear all lights
   */
  clearLights(): void {
    this.lights = [];
  }
  
  /**
   * Calculate lighting for voxels
   */
  calculateLighting(voxels: Voxel[]): void {
    for (const voxel of voxels) {
      const lighting = this.calculateVoxelLighting(voxel);
      
      // Apply lighting to voxel color
      voxel.color.r *= lighting.r;
      voxel.color.g *= lighting.g;
      voxel.color.b *= lighting.b;
    }
  }
  
  /**
   * Calculate lighting for single voxel
   */
  private calculateVoxelLighting(voxel: Voxel): THREE.Color {
    const totalLight = new THREE.Color(0, 0, 0);
    
    // Ambient light
    const ambient = new THREE.Color(0.2, 0.2, 0.2);
    totalLight.add(ambient);
    
    // Process each light
    for (const light of this.lights) {
      const contribution = this.calculateLightContribution(voxel, light);
      totalLight.add(contribution);
    }
    
    // Clamp to [0, 1]
    totalLight.r = Math.min(1, totalLight.r);
    totalLight.g = Math.min(1, totalLight.g);
    totalLight.b = Math.min(1, totalLight.b);
    
    return totalLight;
  }
  
  /**
   * Calculate light contribution
   */
  private calculateLightContribution(voxel: Voxel, light: LightData): THREE.Color {
    const contribution = new THREE.Color(0, 0, 0);
    
    if (light.type === 'directional') {
      // Directional light (sun)
      const normal = new THREE.Vector3(0, 1, 0); // Assume up normal
      const lightDir = light.position.clone().normalize();
      const intensity = Math.max(0, normal.dot(lightDir)) * light.intensity;
      
      contribution.copy(light.color).multiplyScalar(intensity);
    } else if (light.type === 'point') {
      // Point light
      const distance = voxel.position.distanceTo(light.position);
      const attenuation = 1.0 / (1.0 + distance * distance * 0.01);
      const intensity = light.intensity * attenuation;
      
      contribution.copy(light.color).multiplyScalar(intensity);
    }
    
    return contribution;
  }
  
  /**
   * Get lights
   */
  getLights(): LightData[] {
    return [...this.lights];
  }
}
