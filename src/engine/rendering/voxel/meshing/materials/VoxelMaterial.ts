/**
 * Voxel Material
 * 
 * Material properties for voxel rendering.
 * Supports PBR workflow with texture atlasing.
 * 
 * Features:
 * - PBR material properties
 * - Texture atlas support
 * - Material blending
 * - LOD support
 */

import * as THREE from 'three';

/**
 * Voxel material properties
 */
export interface VoxelMaterialProperties {
  /** Base color */
  color: THREE.Color;
  
  /** Metalness (0-1) */
  metalness: number;
  
  /** Roughness (0-1) */
  roughness: number;
  
  /** Emissive color */
  emissive?: THREE.Color;
  
  /** Emissive intensity */
  emissiveIntensity?: number;
  
  /** Opacity (0-1) */
  opacity?: number;
  
  /** Texture atlas coordinates */
  atlasCoords?: {
    u: number;
    v: number;
    width: number;
    height: number;
  };
  
  /** Material ID for atlas lookup */
  materialId?: number;
}

/**
 * Voxel material options
 */
export interface VoxelMaterialOptions {
  /** Use texture atlas */
  useAtlas?: boolean;
  
  /** Enable transparency */
  transparent?: boolean;
  
  /** Enable vertex colors */
  vertexColors?: boolean;
  
  /** Enable normal mapping */
  normalMapping?: boolean;
  
  /** Enable AO mapping */
  aoMapping?: boolean;
  
  /** LOD level */
  lodLevel?: number;
}

/**
 * Voxel material class
 */
export class VoxelMaterial {
  private properties: VoxelMaterialProperties;
  private options: Required<VoxelMaterialOptions>;
  private threeMaterial: THREE.MeshStandardMaterial | null = null;
  
  constructor(
    properties: VoxelMaterialProperties,
    options: VoxelMaterialOptions = {}
  ) {
    this.properties = properties;
    this.options = {
      useAtlas: options.useAtlas ?? false,
      transparent: options.transparent ?? false,
      vertexColors: options.vertexColors ?? true,
      normalMapping: options.normalMapping ?? true,
      aoMapping: options.aoMapping ?? true,
      lodLevel: options.lodLevel ?? 0
    };
  }
  
  /**
   * Get material properties
   */
  getProperties(): VoxelMaterialProperties {
    return { ...this.properties };
  }
  
  /**
   * Update properties
   */
  updateProperties(properties: Partial<VoxelMaterialProperties>): void {
    this.properties = { ...this.properties, ...properties };
    this.threeMaterial = null; // Invalidate cached material
  }
  
  /**
   * Create Three.js material
   */
  toThreeMaterial(
    colorMap?: THREE.Texture,
    normalMap?: THREE.Texture,
    aoMap?: THREE.Texture
  ): THREE.MeshStandardMaterial {
    if (this.threeMaterial) {
      return this.threeMaterial;
    }
    
    const material = new THREE.MeshStandardMaterial({
      color: this.properties.color,
      metalness: this.properties.metalness,
      roughness: this.properties.roughness,
      vertexColors: this.options.vertexColors,
      transparent: this.options.transparent,
      opacity: this.properties.opacity ?? 1.0
    });
    
    // Emissive
    if (this.properties.emissive) {
      material.emissive = this.properties.emissive;
      material.emissiveIntensity = this.properties.emissiveIntensity ?? 1.0;
    }
    
    // Textures
    if (colorMap) {
      material.map = colorMap;
    }
    
    if (normalMap && this.options.normalMapping) {
      material.normalMap = normalMap;
      material.normalScale = new THREE.Vector2(1, 1);
    }
    
    if (aoMap && this.options.aoMapping) {
      material.aoMap = aoMap;
      material.aoMapIntensity = 1.0;
    }
    
    this.threeMaterial = material;
    return material;
  }
  
  /**
   * Clone material
   */
  clone(): VoxelMaterial {
    return new VoxelMaterial(
      { ...this.properties },
      { ...this.options }
    );
  }
  
  /**
   * Blend with another material
   */
  blend(other: VoxelMaterial, factor: number): VoxelMaterial {
    const blended: VoxelMaterialProperties = {
      color: new THREE.Color().lerpColors(
        this.properties.color,
        other.properties.color,
        factor
      ),
      metalness: THREE.MathUtils.lerp(
        this.properties.metalness,
        other.properties.metalness,
        factor
      ),
      roughness: THREE.MathUtils.lerp(
        this.properties.roughness,
        other.properties.roughness,
        factor
      )
    };
    
    // Blend emissive if both have it
    if (this.properties.emissive && other.properties.emissive) {
      blended.emissive = new THREE.Color().lerpColors(
        this.properties.emissive,
        other.properties.emissive,
        factor
      );
      
      blended.emissiveIntensity = THREE.MathUtils.lerp(
        this.properties.emissiveIntensity ?? 0,
        other.properties.emissiveIntensity ?? 0,
        factor
      );
    }
    
    // Blend opacity if both have it
    if (this.properties.opacity !== undefined && other.properties.opacity !== undefined) {
      blended.opacity = THREE.MathUtils.lerp(
        this.properties.opacity,
        other.properties.opacity,
        factor
      );
    }
    
    return new VoxelMaterial(blended, this.options);
  }
  
  /**
   * Get material for LOD level
   */
  getLODMaterial(lodLevel: number): VoxelMaterial {
    const lodMaterial = this.clone();
    lodMaterial.options.lodLevel = lodLevel;
    
    // Simplify material at higher LOD levels
    if (lodLevel > 2) {
      lodMaterial.options.normalMapping = false;
      lodMaterial.options.aoMapping = false;
    }
    
    return lodMaterial;
  }
  
  /**
   * Dispose material
   */
  dispose(): void {
    if (this.threeMaterial) {
      this.threeMaterial.dispose();
      this.threeMaterial = null;
    }
  }
}

/**
 * Material presets
 */
export class VoxelMaterialPresets {
  static readonly METAL: VoxelMaterialProperties = {
    color: new THREE.Color(0.8, 0.8, 0.8),
    metalness: 0.9,
    roughness: 0.2
  };
  
  static readonly PLASTIC: VoxelMaterialProperties = {
    color: new THREE.Color(1, 1, 1),
    metalness: 0.0,
    roughness: 0.5
  };
  
  static readonly GLASS: VoxelMaterialProperties = {
    color: new THREE.Color(0.9, 0.9, 1.0),
    metalness: 0.1,
    roughness: 0.0,
    opacity: 0.3
  };
  
  static readonly WOOD: VoxelMaterialProperties = {
    color: new THREE.Color(0.6, 0.4, 0.2),
    metalness: 0.0,
    roughness: 0.8
  };
  
  static readonly STONE: VoxelMaterialProperties = {
    color: new THREE.Color(0.5, 0.5, 0.5),
    metalness: 0.0,
    roughness: 0.9
  };
  
  static readonly EMISSIVE: VoxelMaterialProperties = {
    color: new THREE.Color(1, 1, 1),
    metalness: 0.0,
    roughness: 0.5,
    emissive: new THREE.Color(1, 1, 1),
    emissiveIntensity: 1.0
  };
}
