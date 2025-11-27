import * as THREE from 'three';

/**
 * Decal Configuration
 */
export interface DecalConfig {
  texture: THREE.Texture;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  opacity?: number;
  lifetime?: number; // milliseconds (0 = permanent)
  fadeTime?: number; // milliseconds
  normalOriented?: boolean;
}

/**
 * Decal Instance
 * Represents a single decal in the scene
 */
export class Decal {
  public mesh: THREE.Mesh;
  public lifetime: number;
  public fadeTime: number;
  public creationTime: number;
  public opacity: number;
  private material: THREE.MeshBasicMaterial;
  
  constructor(config: DecalConfig) {
    this.lifetime = config.lifetime || 0;
    this.fadeTime = config.fadeTime || 1000;
    this.creationTime = Date.now();
    this.opacity = config.opacity || 1.0;
    
    // Create decal geometry
    const geometry = new THREE.PlaneGeometry(1, 1);
    
    // Create decal material
    this.material = new THREE.MeshBasicMaterial({
      map: config.texture,
      transparent: true,
      opacity: this.opacity,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      side: THREE.DoubleSide
    });
    
    // Create mesh
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.copy(config.position);
    this.mesh.rotation.copy(config.rotation);
    this.mesh.scale.copy(config.scale);
  }
  
  /**
   * Update decal (handle fading)
   */
  update(currentTime: number): boolean {
    if (this.lifetime === 0) return true; // Permanent decal
    
    const age = currentTime - this.creationTime;
    
    // Check if expired
    if (age > this.lifetime) {
      return false;
    }
    
    // Fade out near end of lifetime
    const timeRemaining = this.lifetime - age;
    if (timeRemaining < this.fadeTime) {
      const fadeProgress = timeRemaining / this.fadeTime;
      this.material.opacity = this.opacity * fadeProgress;
    }
    
    return true;
  }
  
  /**
   * Dispose decal
   */
  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

/**
 * Decal Pool
 * Object pooling for decals to improve performance
 */
class DecalPool {
  private pool: Decal[] = [];
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  /**
   * Get decal from pool or create new
   */
  acquire(config: DecalConfig): Decal {
    let decal = this.pool.pop();
    
    if (!decal) {
      decal = new Decal(config);
    } else {
      // Reuse existing decal
      decal.mesh.position.copy(config.position);
      decal.mesh.rotation.copy(config.rotation);
      decal.mesh.scale.copy(config.scale);
      decal.lifetime = config.lifetime || 0;
      decal.fadeTime = config.fadeTime || 1000;
      decal.creationTime = Date.now();
      decal.opacity = config.opacity || 1.0;
      (decal.mesh.material as THREE.MeshBasicMaterial).map = config.texture;
      (decal.mesh.material as THREE.MeshBasicMaterial).opacity = decal.opacity;
    }
    
    return decal;
  }
  
  /**
   * Return decal to pool
   */
  release(decal: Decal): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(decal);
    } else {
      decal.dispose();
    }
  }
  
  /**
   * Clear pool
   */
  clear(): void {
    this.pool.forEach(decal => decal.dispose());
    this.pool = [];
  }
}

/**
 * Decal Manager
 * Manages decals in the scene with pooling and automatic cleanup
 */
export class DecalManager {
  private decals: Decal[] = [];
  private pool: DecalPool;
  private scene: THREE.Scene | null = null;
  private textureCache: Map<string, THREE.Texture>;
  
  constructor(poolSize: number = 100) {
    this.pool = new DecalPool(poolSize);
    this.textureCache = new Map();
  }
  
  /**
   * Set scene for decal management
   */
  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }
  
  /**
   * Load decal texture with caching
   */
  async loadTexture(path: string): Promise<THREE.Texture> {
    if (this.textureCache.has(path)) {
      return this.textureCache.get(path)!;
    }
    
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
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
   * Create decal
   */
  createDecal(config: DecalConfig): Decal {
    const decal = this.pool.acquire(config);
    this.decals.push(decal);
    
    if (this.scene) {
      this.scene.add(decal.mesh);
    }
    
    return decal;
  }
  
  /**
   * Create decal from texture path
   */
  async createDecalFromPath(
    texturePath: string,
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3,
    options?: {
      opacity?: number;
      lifetime?: number;
      fadeTime?: number;
    }
  ): Promise<Decal> {
    const texture = await this.loadTexture(texturePath);
    
    return this.createDecal({
      texture,
      position,
      rotation,
      scale,
      ...options
    });
  }
  
  /**
   * Create damage decal at impact point
   */
  async createDamageDecal(
    position: THREE.Vector3,
    normal: THREE.Vector3,
    size: number = 0.5,
    damageType: 'bullet' | 'scratch' | 'burn' | 'dent' = 'bullet'
  ): Promise<Decal> {
    // Damage texture paths
    const texturePaths = {
      bullet: '/textures/decals/bullet_hole.png',
      scratch: '/textures/decals/scratch.png',
      burn: '/textures/decals/burn_mark.png',
      dent: '/textures/decals/dent.png'
    };
    
    // Calculate rotation from normal
    const rotation = new THREE.Euler();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    rotation.setFromQuaternion(quaternion);
    
    return this.createDecalFromPath(
      texturePaths[damageType],
      position,
      rotation,
      new THREE.Vector3(size, size, size),
      {
        opacity: 0.8,
        lifetime: 0 // Permanent damage
      }
    );
  }
  
  /**
   * Create detail decal (labels, warnings, etc.)
   */
  async createDetailDecal(
    texturePath: string,
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3
  ): Promise<Decal> {
    return this.createDecalFromPath(
      texturePath,
      position,
      rotation,
      scale,
      {
        opacity: 1.0,
        lifetime: 0 // Permanent
      }
    );
  }
  
  /**
   * Create temporary decal (effects, markers)
   */
  async createTemporaryDecal(
    texturePath: string,
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3,
    lifetime: number = 5000,
    fadeTime: number = 1000
  ): Promise<Decal> {
    return this.createDecalFromPath(
      texturePath,
      position,
      rotation,
      scale,
      {
        opacity: 1.0,
        lifetime,
        fadeTime
      }
    );
  }
  
  /**
   * Update all decals
   */
  update(): void {
    const currentTime = Date.now();
    
    // Update and remove expired decals
    this.decals = this.decals.filter(decal => {
      const alive = decal.update(currentTime);
      
      if (!alive) {
        if (this.scene) {
          this.scene.remove(decal.mesh);
        }
        this.pool.release(decal);
      }
      
      return alive;
    });
  }
  
  /**
   * Remove all decals
   */
  clearAll(): void {
    this.decals.forEach(decal => {
      if (this.scene) {
        this.scene.remove(decal.mesh);
      }
      this.pool.release(decal);
    });
    
    this.decals = [];
  }
  
  /**
   * Get decal count
   */
  getDecalCount(): number {
    return this.decals.length;
  }
  
  /**
   * Dispose all resources
   */
  dispose(): void {
    this.clearAll();
    this.pool.clear();
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
  }
}

// Singleton instance
export const decalManager = new DecalManager();
