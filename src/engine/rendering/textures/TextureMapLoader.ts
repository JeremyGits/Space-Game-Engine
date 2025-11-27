import * as THREE from 'three';

/**
 * PBR Texture Set
 * Complete set of textures for PBR workflow
 */
export interface PBRTextureSet {
  name: string;
  albedo?: THREE.Texture;
  normal?: THREE.Texture;
  roughness?: THREE.Texture;
  metallic?: THREE.Texture;
  ao?: THREE.Texture;
  emissive?: THREE.Texture;
  displacement?: THREE.Texture;
  alpha?: THREE.Texture;
}

/**
 * Texture Map Configuration
 */
export interface TextureMapConfig {
  name: string;
  basePath: string;
  maps: {
    albedo?: string;
    normal?: string;
    roughness?: string;
    metallic?: string;
    ao?: string;
    emissive?: string;
    displacement?: string;
    alpha?: string;
  };
  options?: {
    anisotropy?: number;
    wrapS?: THREE.Wrapping;
    wrapT?: THREE.Wrapping;
    repeat?: [number, number];
    offset?: [number, number];
    generateMipmaps?: boolean;
    flipY?: boolean;
  };
}

/**
 * Texture Map Loader
 * Loads and manages PBR texture sets with caching and optimization
 */
export class TextureMapLoader {
  private textureCache: Map<string, THREE.Texture>;
  private textureSetCache: Map<string, PBRTextureSet>;
  private loader: THREE.TextureLoader;
  private loadingPromises: Map<string, Promise<THREE.Texture>>;
  
  constructor() {
    this.textureCache = new Map();
    this.textureSetCache = new Map();
    this.loader = new THREE.TextureLoader();
    this.loadingPromises = new Map();
  }
  
  /**
   * Load single texture with caching
   */
  async loadTexture(
    path: string,
    options?: {
      anisotropy?: number;
      wrapS?: THREE.Wrapping;
      wrapT?: THREE.Wrapping;
      repeat?: [number, number];
      offset?: [number, number];
      generateMipmaps?: boolean;
      flipY?: boolean;
      colorSpace?: THREE.ColorSpace;
    }
  ): Promise<THREE.Texture> {
    // Check cache
    if (this.textureCache.has(path)) {
      return this.textureCache.get(path)!;
    }
    
    // Check if already loading
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path)!;
    }
    
    // Load texture
    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      this.loader.load(
        path,
        (texture) => {
          // Apply options
          if (options) {
            if (options.anisotropy) {
              texture.anisotropy = options.anisotropy;
            }
            if (options.wrapS) {
              texture.wrapS = options.wrapS;
            }
            if (options.wrapT) {
              texture.wrapT = options.wrapT;
            }
            if (options.repeat) {
              texture.repeat.set(options.repeat[0], options.repeat[1]);
            }
            if (options.offset) {
              texture.offset.set(options.offset[0], options.offset[1]);
            }
            if (options.generateMipmaps !== undefined) {
              texture.generateMipmaps = options.generateMipmaps;
            }
            if (options.flipY !== undefined) {
              texture.flipY = options.flipY;
            }
            if (options.colorSpace) {
              texture.colorSpace = options.colorSpace;
            }
          }
          
          // Cache texture
          this.textureCache.set(path, texture);
          this.loadingPromises.delete(path);
          resolve(texture);
        },
        undefined,
        (error) => {
          this.loadingPromises.delete(path);
          reject(error);
        }
      );
    });
    
    this.loadingPromises.set(path, promise);
    return promise;
  }
  
  /**
   * Load complete PBR texture set
   */
  async loadTextureSet(config: TextureMapConfig): Promise<PBRTextureSet> {
    // Check cache
    if (this.textureSetCache.has(config.name)) {
      return this.textureSetCache.get(config.name)!;
    }
    
    const textureSet: PBRTextureSet = {
      name: config.name
    };
    
    const options = config.options || {};
    
    // Load albedo (sRGB color space)
    if (config.maps.albedo) {
      textureSet.albedo = await this.loadTexture(
        `${config.basePath}/${config.maps.albedo}`,
        { ...options, colorSpace: THREE.SRGBColorSpace }
      );
    }
    
    // Load normal map (linear color space)
    if (config.maps.normal) {
      textureSet.normal = await this.loadTexture(
        `${config.basePath}/${config.maps.normal}`,
        { ...options, colorSpace: THREE.LinearSRGBColorSpace }
      );
    }
    
    // Load roughness map (linear)
    if (config.maps.roughness) {
      textureSet.roughness = await this.loadTexture(
        `${config.basePath}/${config.maps.roughness}`,
        { ...options, colorSpace: THREE.LinearSRGBColorSpace }
      );
    }
    
    // Load metallic map (linear)
    if (config.maps.metallic) {
      textureSet.metallic = await this.loadTexture(
        `${config.basePath}/${config.maps.metallic}`,
        { ...options, colorSpace: THREE.LinearSRGBColorSpace }
      );
    }
    
    // Load AO map (linear)
    if (config.maps.ao) {
      textureSet.ao = await this.loadTexture(
        `${config.basePath}/${config.maps.ao}`,
        { ...options, colorSpace: THREE.LinearSRGBColorSpace }
      );
    }
    
    // Load emissive map (sRGB)
    if (config.maps.emissive) {
      textureSet.emissive = await this.loadTexture(
        `${config.basePath}/${config.maps.emissive}`,
        { ...options, colorSpace: THREE.SRGBColorSpace }
      );
    }
    
    // Load displacement map (linear)
    if (config.maps.displacement) {
      textureSet.displacement = await this.loadTexture(
        `${config.basePath}/${config.maps.displacement}`,
        { ...options, colorSpace: THREE.LinearSRGBColorSpace }
      );
    }
    
    // Load alpha map (linear)
    if (config.maps.alpha) {
      textureSet.alpha = await this.loadTexture(
        `${config.basePath}/${config.maps.alpha}`,
        { ...options, colorSpace: THREE.LinearSRGBColorSpace }
      );
    }
    
    // Cache texture set
    this.textureSetCache.set(config.name, textureSet);
    
    return textureSet;
  }
  
  /**
   * Load multiple texture sets in parallel
   */
  async loadTextureSets(configs: TextureMapConfig[]): Promise<Map<string, PBRTextureSet>> {
    const promises = configs.map(config => this.loadTextureSet(config));
    const sets = await Promise.all(promises);
    
    const result = new Map<string, PBRTextureSet>();
    sets.forEach(set => result.set(set.name, set));
    
    return result;
  }
  
  /**
   * Get cached texture
   */
  getTexture(path: string): THREE.Texture | undefined {
    return this.textureCache.get(path);
  }
  
  /**
   * Get cached texture set
   */
  getTextureSet(name: string): PBRTextureSet | undefined {
    return this.textureSetCache.get(name);
  }
  
  /**
   * Create material from texture set
   */
  createMaterialFromTextureSet(
    textureSet: PBRTextureSet,
    baseProperties?: {
      color?: THREE.Color | string;
      metalness?: number;
      roughness?: number;
      emissive?: THREE.Color | string;
      emissiveIntensity?: number;
      normalScale?: THREE.Vector2;
      aoMapIntensity?: number;
      displacementScale?: number;
      clearcoat?: number;
      clearcoatRoughness?: number;
    }
  ): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial();
    
    // Apply textures
    if (textureSet.albedo) material.map = textureSet.albedo;
    if (textureSet.normal) material.normalMap = textureSet.normal;
    if (textureSet.roughness) material.roughnessMap = textureSet.roughness;
    if (textureSet.metallic) material.metalnessMap = textureSet.metallic;
    if (textureSet.ao) material.aoMap = textureSet.ao;
    if (textureSet.emissive) material.emissiveMap = textureSet.emissive;
    if (textureSet.displacement) material.displacementMap = textureSet.displacement;
    if (textureSet.alpha) {
      material.alphaMap = textureSet.alpha;
      material.transparent = true;
    }
    
    // Apply base properties
    if (baseProperties) {
      if (baseProperties.color) {
        material.color = typeof baseProperties.color === 'string'
          ? new THREE.Color(baseProperties.color)
          : baseProperties.color;
      }
      if (baseProperties.metalness !== undefined) {
        material.metalness = baseProperties.metalness;
      }
      if (baseProperties.roughness !== undefined) {
        material.roughness = baseProperties.roughness;
      }
      if (baseProperties.emissive) {
        material.emissive = typeof baseProperties.emissive === 'string'
          ? new THREE.Color(baseProperties.emissive)
          : baseProperties.emissive;
      }
      if (baseProperties.emissiveIntensity !== undefined) {
        material.emissiveIntensity = baseProperties.emissiveIntensity;
      }
      if (baseProperties.normalScale) {
        material.normalScale = baseProperties.normalScale;
      }
      if (baseProperties.aoMapIntensity !== undefined) {
        material.aoMapIntensity = baseProperties.aoMapIntensity;
      }
      if (baseProperties.displacementScale !== undefined) {
        material.displacementScale = baseProperties.displacementScale;
      }
      if (baseProperties.clearcoat !== undefined) {
        material.clearcoat = baseProperties.clearcoat;
      }
      if (baseProperties.clearcoatRoughness !== undefined) {
        material.clearcoatRoughness = baseProperties.clearcoatRoughness;
      }
    }
    
    return material;
  }
  
  /**
   * Dispose single texture
   */
  disposeTexture(path: string): void {
    const texture = this.textureCache.get(path);
    if (texture) {
      texture.dispose();
      this.textureCache.delete(path);
    }
  }
  
  /**
   * Dispose texture set
   */
  disposeTextureSet(name: string): void {
    const set = this.textureSetCache.get(name);
    if (set) {
      if (set.albedo) set.albedo.dispose();
      if (set.normal) set.normal.dispose();
      if (set.roughness) set.roughness.dispose();
      if (set.metallic) set.metallic.dispose();
      if (set.ao) set.ao.dispose();
      if (set.emissive) set.emissive.dispose();
      if (set.displacement) set.displacement.dispose();
      if (set.alpha) set.alpha.dispose();
      
      this.textureSetCache.delete(name);
    }
  }
  
  /**
   * Dispose all textures
   */
  disposeAll(): void {
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
    
    this.textureSetCache.forEach(set => {
      if (set.albedo) set.albedo.dispose();
      if (set.normal) set.normal.dispose();
      if (set.roughness) set.roughness.dispose();
      if (set.metallic) set.metallic.dispose();
      if (set.ao) set.ao.dispose();
      if (set.emissive) set.emissive.dispose();
      if (set.displacement) set.displacement.dispose();
      if (set.alpha) set.alpha.dispose();
    });
    this.textureSetCache.clear();
    
    this.loadingPromises.clear();
  }
  
  /**
   * Get loading progress
   */
  getLoadingProgress(): { loaded: number; total: number; percentage: number } {
    const total = this.textureCache.size + this.loadingPromises.size;
    const loaded = this.textureCache.size;
    const percentage = total > 0 ? (loaded / total) * 100 : 100;
    
    return { loaded, total, percentage };
  }
}

// Singleton instance
export const textureMapLoader = new TextureMapLoader();
