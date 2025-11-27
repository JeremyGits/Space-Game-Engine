import * as THREE from 'three';

/**
 * Environment Probe Configuration
 */
export interface EnvironmentProbeConfig {
  name: string;
  position: THREE.Vector3;
  size: number; // Cube map resolution
  near: number;
  far: number;
  updateRate?: number; // Hz (0 = static)
}

/**
 * Environment Probe
 * Captures environment from a specific position
 */
export class EnvironmentProbe {
  public name: string;
  public position: THREE.Vector3;
  public cubeCamera: THREE.CubeCamera;
  public envMap: THREE.CubeTexture;
  public updateRate: number;
  private lastUpdate: number = 0;
  
  constructor(config: EnvironmentProbeConfig) {
    this.name = config.name;
    this.position = config.position.clone();
    this.updateRate = config.updateRate || 0;
    
    // Create cube render target
    const renderTarget = new THREE.WebGLCubeRenderTarget(config.size, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter
    });
    
    // Set color space on texture
    renderTarget.texture.colorSpace = THREE.SRGBColorSpace;
    
    // Create cube camera
    this.cubeCamera = new THREE.CubeCamera(config.near, config.far, renderTarget);
    this.cubeCamera.position.copy(this.position);
    
    this.envMap = renderTarget.texture as THREE.CubeTexture;
  }
  
  /**
   * Check if probe needs update
   */
  needsUpdate(currentTime: number): boolean {
    if (this.updateRate === 0) return false; // Static probe
    
    const interval = 1000 / this.updateRate;
    return (currentTime - this.lastUpdate) >= interval;
  }
  
  /**
   * Update environment map
   */
  update(renderer: THREE.WebGLRenderer, scene: THREE.Scene, currentTime: number): void {
    if (!this.needsUpdate(currentTime)) return;
    
    this.cubeCamera.update(renderer, scene);
    this.lastUpdate = currentTime;
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this.cubeCamera.renderTarget?.dispose();
  }
}

/**
 * Environment Map Generator
 * Manages environment probes and generates cube maps for reflections
 */
export class EnvironmentMapGenerator {
  private probes: Map<string, EnvironmentProbe>;
  private pmremGenerator: THREE.PMREMGenerator | null = null;
  
  constructor() {
    this.probes = new Map();
  }
  
  /**
   * Initialize PMREM generator (for prefiltered environment maps)
   */
  initializePMREM(renderer: THREE.WebGLRenderer): void {
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();
  }
  
  /**
   * Create environment probe
   */
  createProbe(config: EnvironmentProbeConfig): EnvironmentProbe {
    const probe = new EnvironmentProbe(config);
    this.probes.set(config.name, probe);
    return probe;
  }
  
  /**
   * Get probe
   */
  getProbe(name: string): EnvironmentProbe | undefined {
    return this.probes.get(name);
  }
  
  /**
   * Update all probes
   */
  updateProbes(renderer: THREE.WebGLRenderer, scene: THREE.Scene, currentTime: number): void {
    this.probes.forEach(probe => {
      probe.update(renderer, scene, currentTime);
    });
  }
  
  /**
   * Generate prefiltered environment map (for PBR)
   */
  generatePrefilteredEnvMap(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    position: THREE.Vector3,
    size: number = 256
  ): THREE.Texture | null {
    if (!this.pmremGenerator) {
      this.initializePMREM(renderer);
    }
    
    // Create temporary cube camera
    const renderTarget = new THREE.WebGLCubeRenderTarget(size);
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, renderTarget);
    cubeCamera.position.copy(position);
    
    // Capture environment
    cubeCamera.update(renderer, scene);
    
    // Generate prefiltered mipmap chain
    const pmremTarget = this.pmremGenerator!.fromCubemap(renderTarget.texture as THREE.CubeTexture);
    
    // Cleanup
    renderTarget.dispose();
    
    return pmremTarget.texture;
  }
  
  /**
   * Apply environment map to material
   */
  applyEnvMapToMaterial(
    material: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial,
    probeName: string,
    intensity: number = 1.0
  ): void {
    const probe = this.probes.get(probeName);
    if (!probe) return;
    
    material.envMap = probe.envMap;
    material.envMapIntensity = intensity;
    material.needsUpdate = true;
  }
  
  /**
   * Apply environment map to multiple materials
   */
  applyEnvMapToMaterials(
    materials: (THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial)[],
    probeName: string,
    intensity: number = 1.0
  ): void {
    materials.forEach(material => {
      this.applyEnvMapToMaterial(material, probeName, intensity);
    });
  }
  
  /**
   * Create static environment map from equirectangular image
   */
  async loadEquirectangularEnvMap(
    renderer: THREE.WebGLRenderer,
    path: string
  ): Promise<THREE.Texture> {
    if (!this.pmremGenerator) {
      this.initializePMREM(renderer);
    }
    
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        path,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          const pmremTarget = this.pmremGenerator!.fromEquirectangular(texture);
          texture.dispose();
          resolve(pmremTarget.texture);
        },
        undefined,
        reject
      );
    });
  }
  
  /**
   * Dispose probe
   */
  disposeProbe(name: string): void {
    const probe = this.probes.get(name);
    if (probe) {
      probe.dispose();
      this.probes.delete(name);
    }
  }
  
  /**
   * Dispose all probes
   */
  disposeAll(): void {
    this.probes.forEach(probe => probe.dispose());
    this.probes.clear();
    
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
      this.pmremGenerator = null;
    }
  }
}

// Singleton instance
export const environmentMapGenerator = new EnvironmentMapGenerator();
