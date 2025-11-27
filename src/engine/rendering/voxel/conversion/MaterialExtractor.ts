/**
 * Material Extractor
 * 
 * Extracts PBR material properties from images.
 * Estimates metalness, roughness, and other material properties.
 */

import * as THREE from 'three';
import type { VoxelMaterial } from '../core/Voxel';

/**
 * Material extraction options
 */
export interface MaterialExtractionOptions {
  /** Default metalness value */
  defaultMetalness?: number;
  
  /** Default roughness value */
  defaultRoughness?: number;
  
  /** Use color saturation for metalness estimation */
  useColorForMetalness?: boolean;
  
  /** Use luminance variance for roughness estimation */
  useLuminanceForRoughness?: boolean;
  
  /** Metalness threshold (colors above this are metallic) */
  metalnessThreshold?: number;
}

/**
 * Material extractor class
 */
export class MaterialExtractor {
  private options: Required<MaterialExtractionOptions>;
  
  constructor(options: MaterialExtractionOptions = {}) {
    this.options = {
      defaultMetalness: options.defaultMetalness ?? 0.3,
      defaultRoughness: options.defaultRoughness ?? 0.5,
      useColorForMetalness: options.useColorForMetalness ?? true,
      useLuminanceForRoughness: options.useLuminanceForRoughness ?? true,
      metalnessThreshold: options.metalnessThreshold ?? 0.7
    };
  }
  
  /**
   * Extract materials from image data
   */
  extract(imageData: ImageData, depthMap?: Float32Array): VoxelMaterial[] {
    const { width, height } = imageData;
    const materials: VoxelMaterial[] = [];
    
    for (let i = 0; i < width * height; i++) {
      const material = this.extractMaterialAt(imageData, i, depthMap);
      materials.push(material);
    }
    
    return materials;
  }
  
  /**
   * Extract material at specific pixel
   */
  private extractMaterialAt(
    imageData: ImageData,
    index: number,
    depthMap?: Float32Array
  ): VoxelMaterial {
    const data = imageData.data;
    const r = data[index * 4] / 255;
    const g = data[index * 4 + 1] / 255;
    const b = data[index * 4 + 2] / 255;
    
    const color = new THREE.Color(r, g, b);
    
    // Estimate metalness
    let metalness = this.options.defaultMetalness;
    if (this.options.useColorForMetalness) {
      metalness = this.estimateMetalness(color);
    }
    
    // Estimate roughness
    let roughness = this.options.defaultRoughness;
    if (this.options.useLuminanceForRoughness) {
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      roughness = this.estimateRoughness(luminance, depthMap?.[index]);
    }
    
    return {
      metalness,
      roughness,
      emissive: 0
    };
  }
  
  /**
   * Estimate metalness from color
   * 
   * Metallic surfaces tend to have:
   * - High saturation
   * - Specific color ranges (gold, silver, copper)
   */
  private estimateMetalness(color: THREE.Color): number {
    // Convert to HSL
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    
    // High saturation suggests metallic
    let metalness = hsl.s * 0.5;
    
    // Check for metallic color ranges
    const h = hsl.h;
    
    // Gold range (yellow-orange)
    if (h >= 0.08 && h <= 0.15) {
      metalness = Math.max(metalness, 0.8);
    }
    
    // Silver range (desaturated)
    if (hsl.s < 0.1 && hsl.l > 0.5) {
      metalness = Math.max(metalness, 0.9);
    }
    
    // Copper range (red-orange)
    if (h >= 0.0 && h <= 0.08) {
      metalness = Math.max(metalness, 0.7);
    }
    
    return Math.min(1, metalness);
  }
  
  /**
   * Estimate roughness from luminance and depth
   * 
   * Rough surfaces tend to have:
   * - Lower luminance (less reflective)
   * - Higher depth variation
   */
  private estimateRoughness(luminance: number, depth?: number): number {
    // Base roughness from luminance (darker = rougher)
    let roughness = 1 - luminance * 0.5;
    
    // Adjust based on depth if available
    if (depth !== undefined) {
      // Higher depth variation suggests rougher surface
      roughness = roughness * 0.7 + depth * 0.3;
    }
    
    return Math.max(0.1, Math.min(1, roughness));
  }
  
  /**
   * Get material at specific pixel
   */
  getMaterialAt(
    imageData: ImageData,
    x: number,
    y: number,
    depthMap?: Float32Array
  ): VoxelMaterial {
    const index = y * imageData.width + x;
    return this.extractMaterialAt(imageData, index, depthMap);
  }
  
  /**
   * Create uniform material
   */
  static createUniform(
    metalness: number = 0.3,
    roughness: number = 0.5
  ): VoxelMaterial {
    return {
      metalness,
      roughness,
      emissive: 0
    };
  }
  
  /**
   * Create metallic material
   */
  static createMetallic(roughness: number = 0.2): VoxelMaterial {
    return {
      metalness: 1.0,
      roughness,
      emissive: 0
    };
  }
  
  /**
   * Create dielectric material
   */
  static createDielectric(roughness: number = 0.5): VoxelMaterial {
    return {
      metalness: 0.0,
      roughness,
      emissive: 0
    };
  }
  
  /**
   * Create emissive material
   */
  static createEmissive(intensity: number = 1.0): VoxelMaterial {
    return {
      metalness: 0.0,
      roughness: 1.0,
      emissive: intensity
    };
  }
}
