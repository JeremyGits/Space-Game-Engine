/**
 * Material Blending
 * 
 * Handles blending between different voxel materials.
 * Supports smooth transitions and material mixing.
 * 
 * Features:
 * - Material interpolation
 * - Blend modes
 * - Transition zones
 * - Quality preservation
 */

import * as THREE from 'three';
import { VoxelMaterial, VoxelMaterialProperties } from './VoxelMaterial';

/**
 * Blend mode
 */
export enum BlendMode {
  LINEAR = 'linear',
  SMOOTHSTEP = 'smoothstep',
  EASE_IN = 'ease_in',
  EASE_OUT = 'ease_out',
  EASE_IN_OUT = 'ease_in_out'
}

/**
 * Material blend options
 */
export interface MaterialBlendOptions {
  /** Blend mode */
  mode?: BlendMode;
  
  /** Blend factor (0-1) */
  factor?: number;
  
  /** Transition sharpness */
  sharpness?: number;
  
  /** Preserve quality */
  preserveQuality?: boolean;
}

/**
 * Material blending class
 */
export class MaterialBlending {
  private options: Required<MaterialBlendOptions>;
  
  constructor(options: MaterialBlendOptions = {}) {
    this.options = {
      mode: options.mode ?? BlendMode.LINEAR,
      factor: options.factor ?? 0.5,
      sharpness: options.sharpness ?? 1.0,
      preserveQuality: options.preserveQuality ?? true
    };
  }
  
  /**
   * Blend two materials
   */
  blendMaterials(
    materialA: VoxelMaterial,
    materialB: VoxelMaterial,
    factor: number = this.options.factor
  ): VoxelMaterial {
    const propsA = materialA.getProperties();
    const propsB = materialB.getProperties();
    
    // Apply blend mode
    const blendedFactor = this.applyBlendMode(factor);
    
    // Interpolate properties
    const blendedProps: VoxelMaterialProperties = {
      color: this.interpolateColor(propsA.color, propsB.color, blendedFactor),
      metalness: THREE.MathUtils.lerp(propsA.metalness, propsB.metalness, blendedFactor),
      roughness: THREE.MathUtils.lerp(propsA.roughness, propsB.roughness, blendedFactor)
    };
    
    // Blend emissive if both have it
    if (propsA.emissive && propsB.emissive) {
      blendedProps.emissive = this.interpolateColor(propsA.emissive, propsB.emissive, blendedFactor);
      blendedProps.emissiveIntensity = THREE.MathUtils.lerp(
        propsA.emissiveIntensity ?? 0,
        propsB.emissiveIntensity ?? 0,
        blendedFactor
      );
    }
    
    // Blend opacity if both have it
    if (propsA.opacity !== undefined && propsB.opacity !== undefined) {
      blendedProps.opacity = THREE.MathUtils.lerp(propsA.opacity, propsB.opacity, blendedFactor);
    }
    
    return new VoxelMaterial(blendedProps);
  }
  
  /**
   * Create transition zone between materials
   */
  createTransitionZone(
    materialA: VoxelMaterial,
    materialB: VoxelMaterial,
    width: number
  ): VoxelMaterial[] {
    const materials: VoxelMaterial[] = [];
    const steps = Math.ceil(width);
    
    for (let i = 0; i <= steps; i++) {
      const factor = i / steps;
      const blended = this.blendMaterials(materialA, materialB, factor);
      materials.push(blended);
    }
    
    return materials;
  }
  
  /**
   * Blend material array with weights
   */
  blendWeightedMaterials(
    materials: VoxelMaterial[],
    weights: number[]
  ): VoxelMaterial {
    if (materials.length !== weights.length) {
      throw new Error('Materials and weights arrays must have same length');
    }
    
    if (materials.length === 0) {
      throw new Error('No materials to blend');
    }
    
    if (materials.length === 1) {
      return materials[0].clone();
    }
    
    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);
    
    // Start with first material
    let result = materials[0].clone();
    
    // Blend in remaining materials
    for (let i = 1; i < materials.length; i++) {
      const factor = normalizedWeights[i];
      result = this.blendMaterials(result, materials[i], factor);
    }
    
    return result;
  }
  
  /**
   * Create material gradient
   */
  createMaterialGradient(
    startMaterial: VoxelMaterial,
    endMaterial: VoxelMaterial,
    steps: number
  ): VoxelMaterial[] {
    const materials: VoxelMaterial[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const factor = i / steps;
      const blended = this.blendMaterials(startMaterial, endMaterial, factor);
      materials.push(blended);
    }
    
    return materials;
  }
  
  /**
   * Apply blend mode
   */
  private applyBlendMode(factor: number): number {
    switch (this.options.mode) {
      case BlendMode.LINEAR:
        return factor;
      
      case BlendMode.SMOOTHSTEP:
        return factor * factor * (3 - 2 * factor);
      
      case BlendMode.EASE_IN:
        return factor * factor;
      
      case BlendMode.EASE_OUT:
        return 1 - (1 - factor) * (1 - factor);
      
      case BlendMode.EASE_IN_OUT:
        return factor < 0.5
          ? 2 * factor * factor
          : 1 - Math.pow(-2 * factor + 2, 2) / 2;
      
      default:
        return factor;
    }
  }
  
  /**
   * Interpolate colors
   */
  private interpolateColor(colorA: THREE.Color, colorB: THREE.Color, factor: number): THREE.Color {
    return new THREE.Color().lerpColors(colorA, colorB, factor);
  }
  
  /**
   * Create noise-based material blending
   */
  createNoiseBlend(
    materialA: VoxelMaterial,
    materialB: VoxelMaterial,
    noiseScale: number = 1.0,
    seed: number = 0
  ): (position: THREE.Vector3) => VoxelMaterial {
    return (position: THREE.Vector3) => {
      // Simple noise function
      const noise = this.simplexNoise(
        position.x * noiseScale + seed,
        position.y * noiseScale + seed,
        position.z * noiseScale + seed
      );
      
      // Convert to 0-1 range
      const factor = (noise + 1) * 0.5;
      
      return this.blendMaterials(materialA, materialB, factor);
    };
  }
  
  /**
   * Create distance-based material blending
   */
  createDistanceBlend(
    materialA: VoxelMaterial,
    materialB: VoxelMaterial,
    center: THREE.Vector3,
    radius: number
  ): (position: THREE.Vector3) => VoxelMaterial {
    return (position: THREE.Vector3) => {
      const distance = position.distanceTo(center);
      const factor = Math.min(distance / radius, 1.0);
      
      return this.blendMaterials(materialA, materialB, factor);
    };
  }
  
  /**
   * Create height-based material blending
   */
  createHeightBlend(
    materialA: VoxelMaterial,
    materialB: VoxelMaterial,
    minHeight: number,
    maxHeight: number
  ): (position: THREE.Vector3) => VoxelMaterial {
    return (position: THREE.Vector3) => {
      const factor = THREE.MathUtils.clamp(
        (position.y - minHeight) / (maxHeight - minHeight),
        0,
        1
      );
      
      return this.blendMaterials(materialA, materialB, factor);
    };
  }
  
  /**
   * Simple simplex noise (for demonstration)
   */
  private simplexNoise(x: number, y: number, z: number): number {
    // Simple pseudo-random noise
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return Math.sin(n) * 2 - 1;
  }
  
  /**
   * Update blend options
   */
  updateOptions(options: Partial<MaterialBlendOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * Get current options
   */
  getOptions(): MaterialBlendOptions {
    return { ...this.options };
  }
}

/**
 * Material blending presets
 */
export class MaterialBlendPresets {
  static createSmoothBlend(): MaterialBlending {
    return new MaterialBlending({
      mode: BlendMode.SMOOTHSTEP,
      sharpness: 2.0,
      preserveQuality: true
    });
  }
  
  static createSharpBlend(): MaterialBlending {
    return new MaterialBlending({
      mode: BlendMode.LINEAR,
      sharpness: 10.0,
      preserveQuality: true
    });
  }
  
  static createEaseBlend(): MaterialBlending {
    return new MaterialBlending({
      mode: BlendMode.EASE_IN_OUT,
      sharpness: 1.5,
      preserveQuality: true
    });
  }
}
