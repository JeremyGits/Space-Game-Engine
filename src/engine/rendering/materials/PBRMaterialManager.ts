import * as THREE from 'three';

/**
 * PBR Material Configuration
 * Supports full PBR workflow with:
 * - Albedo/Base Color
 * - Metallic
 * - Roughness
 * - Normal maps
 * - Ambient Occlusion
 * - Emissive
 * - Height/Displacement
 */
export interface PBRMaterialConfig {
  // Base properties
  name: string;
  
  // Albedo/Base Color
  albedoColor?: THREE.Color | string;
  albedoMap?: THREE.Texture | string;
  
  // Metallic workflow
  metalness?: number;
  metallicMap?: THREE.Texture | string;
  
  // Roughness
  roughness?: number;
  roughnessMap?: THREE.Texture | string;
  
  // Normal mapping
  normalMap?: THREE.Texture | string;
  normalScale?: THREE.Vector2;
  
  // Ambient Occlusion
  aoMap?: THREE.Texture | string;
  aoMapIntensity?: number;
  
  // Emissive
  emissive?: THREE.Color | string;
  emissiveMap?: THREE.Texture | string;
  emissiveIntensity?: number;
  
  // Height/Displacement
  displacementMap?: THREE.Texture | string;
  displacementScale?: number;
  displacementBias?: number;
  
  // Environment mapping
  envMap?: THREE.Texture;
  envMapIntensity?: number;
  
  // Advanced properties
  clearcoat?: number;
  clearcoatRoughness?: number;
  clearcoatMap?: THREE.Texture | string;
  clearcoatRoughnessMap?: THREE.Texture | string;
  clearcoatNormalMap?: THREE.Texture | string;
  
  // Transparency
  transparent?: boolean;
  opacity?: number;
  alphaMap?: THREE.Texture | string;
  
  // Other
  side?: THREE.Side;
  flatShading?: boolean;
}

/**
 * PBR Material Manager
 * Handles creation, caching, and management of PBR materials
 */
export class PBRMaterialManager {
  private materials: Map<string, THREE.MeshPhysicalMaterial>;
  private textureLoader: THREE.TextureLoader;
  private textureCache: Map<string, THREE.Texture>;
  
  constructor() {
    this.materials = new Map();
    this.textureLoader = new THREE.TextureLoader();
    this.textureCache = new Map();
  }
  
  /**
   * Load texture with caching
   */
  private async loadTexture(path: string): Promise<THREE.Texture> {
    if (this.textureCache.has(path)) {
      return this.textureCache.get(path)!;
    }
    
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          this.textureCache.set(path, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }
  
  /**
   * Create PBR material from configuration
   */
  async createMaterial(config: PBRMaterialConfig): Promise<THREE.MeshPhysicalMaterial> {
    // Check cache
    if (this.materials.has(config.name)) {
      return this.materials.get(config.name)!;
    }
    
    const material = new THREE.MeshPhysicalMaterial();
    
    // Base color/albedo
    if (config.albedoColor) {
      material.color = typeof config.albedoColor === 'string' 
        ? new THREE.Color(config.albedoColor)
        : config.albedoColor;
    }
    
    if (config.albedoMap) {
      material.map = typeof config.albedoMap === 'string'
        ? await this.loadTexture(config.albedoMap)
        : config.albedoMap;
    }
    
    // Metallic
    if (config.metalness !== undefined) {
      material.metalness = config.metalness;
    }
    
    if (config.metallicMap) {
      material.metalnessMap = typeof config.metallicMap === 'string'
        ? await this.loadTexture(config.metallicMap)
        : config.metallicMap;
    }
    
    // Roughness
    if (config.roughness !== undefined) {
      material.roughness = config.roughness;
    }
    
    if (config.roughnessMap) {
      material.roughnessMap = typeof config.roughnessMap === 'string'
        ? await this.loadTexture(config.roughnessMap)
        : config.roughnessMap;
    }
    
    // Normal map
    if (config.normalMap) {
      material.normalMap = typeof config.normalMap === 'string'
        ? await this.loadTexture(config.normalMap)
        : config.normalMap;
      
      if (config.normalScale) {
        material.normalScale = config.normalScale;
      }
    }
    
    // Ambient Occlusion
    if (config.aoMap) {
      material.aoMap = typeof config.aoMap === 'string'
        ? await this.loadTexture(config.aoMap)
        : config.aoMap;
      
      if (config.aoMapIntensity !== undefined) {
        material.aoMapIntensity = config.aoMapIntensity;
      }
    }
    
    // Emissive
    if (config.emissive) {
      material.emissive = typeof config.emissive === 'string'
        ? new THREE.Color(config.emissive)
        : config.emissive;
    }
    
    if (config.emissiveMap) {
      material.emissiveMap = typeof config.emissiveMap === 'string'
        ? await this.loadTexture(config.emissiveMap)
        : config.emissiveMap;
    }
    
    if (config.emissiveIntensity !== undefined) {
      material.emissiveIntensity = config.emissiveIntensity;
    }
    
    // Displacement
    if (config.displacementMap) {
      material.displacementMap = typeof config.displacementMap === 'string'
        ? await this.loadTexture(config.displacementMap)
        : config.displacementMap;
      
      if (config.displacementScale !== undefined) {
        material.displacementScale = config.displacementScale;
      }
      
      if (config.displacementBias !== undefined) {
        material.displacementBias = config.displacementBias;
      }
    }
    
    // Environment map
    if (config.envMap) {
      material.envMap = config.envMap;
      
      if (config.envMapIntensity !== undefined) {
        material.envMapIntensity = config.envMapIntensity;
      }
    }
    
    // Clearcoat (for glossy surfaces)
    if (config.clearcoat !== undefined) {
      material.clearcoat = config.clearcoat;
    }
    
    if (config.clearcoatRoughness !== undefined) {
      material.clearcoatRoughness = config.clearcoatRoughness;
    }
    
    if (config.clearcoatMap) {
      material.clearcoatMap = typeof config.clearcoatMap === 'string'
        ? await this.loadTexture(config.clearcoatMap)
        : config.clearcoatMap;
    }
    
    if (config.clearcoatRoughnessMap) {
      material.clearcoatRoughnessMap = typeof config.clearcoatRoughnessMap === 'string'
        ? await this.loadTexture(config.clearcoatRoughnessMap)
        : config.clearcoatRoughnessMap;
    }
    
    if (config.clearcoatNormalMap) {
      material.clearcoatNormalMap = typeof config.clearcoatNormalMap === 'string'
        ? await this.loadTexture(config.clearcoatNormalMap)
        : config.clearcoatNormalMap;
    }
    
    // Transparency
    if (config.transparent !== undefined) {
      material.transparent = config.transparent;
    }
    
    if (config.opacity !== undefined) {
      material.opacity = config.opacity;
    }
    
    if (config.alphaMap) {
      material.alphaMap = typeof config.alphaMap === 'string'
        ? await this.loadTexture(config.alphaMap)
        : config.alphaMap;
    }
    
    // Other properties
    if (config.side !== undefined) {
      material.side = config.side;
    }
    
    if (config.flatShading !== undefined) {
      material.flatShading = config.flatShading;
    }
    
    // Cache material
    this.materials.set(config.name, material);
    
    return material;
  }
  
  /**
   * Get cached material
   */
  getMaterial(name: string): THREE.MeshPhysicalMaterial | undefined {
    return this.materials.get(name);
  }
  
  /**
   * Update material properties
   */
  updateMaterial(name: string, updates: Partial<PBRMaterialConfig>): void {
    const material = this.materials.get(name);
    if (!material) return;
    
    // Update properties
    if (updates.albedoColor) {
      material.color = typeof updates.albedoColor === 'string'
        ? new THREE.Color(updates.albedoColor)
        : updates.albedoColor;
    }
    
    if (updates.metalness !== undefined) {
      material.metalness = updates.metalness;
    }
    
    if (updates.roughness !== undefined) {
      material.roughness = updates.roughness;
    }
    
    if (updates.emissive) {
      material.emissive = typeof updates.emissive === 'string'
        ? new THREE.Color(updates.emissive)
        : updates.emissive;
    }
    
    if (updates.emissiveIntensity !== undefined) {
      material.emissiveIntensity = updates.emissiveIntensity;
    }
    
    material.needsUpdate = true;
  }
  
  /**
   * Dispose material and free resources
   */
  disposeMaterial(name: string): void {
    const material = this.materials.get(name);
    if (material) {
      material.dispose();
      this.materials.delete(name);
    }
  }
  
  /**
   * Dispose all materials
   */
  disposeAll(): void {
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
    
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
  }
  
  /**
   * Create preset materials
   */
  createPresets(): void {
    // Cockpit metal preset
    this.createMaterial({
      name: 'cockpit_metal',
      albedoColor: '#1a1a1a',
      metalness: 0.9,
      roughness: 0.2,
      envMapIntensity: 1.0
    });
    
    // Cockpit plastic preset
    this.createMaterial({
      name: 'cockpit_plastic',
      albedoColor: '#2a2a2a',
      metalness: 0.1,
      roughness: 0.6
    });
    
    // Screen glass preset
    this.createMaterial({
      name: 'screen_glass',
      albedoColor: '#001100',
      metalness: 0.9,
      roughness: 0.1,
      emissive: '#00ff00',
      emissiveIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    
    // Fabric/seat preset
    this.createMaterial({
      name: 'seat_fabric',
      albedoColor: '#1a1a2a',
      metalness: 0.0,
      roughness: 0.9
    });
  }
}

// Singleton instance
export const pbrMaterialManager = new PBRMaterialManager();
