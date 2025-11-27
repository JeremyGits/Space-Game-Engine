import * as THREE from 'three';

/**
 * Subsurface Scattering Configuration
 */
export interface SSSConfig {
  color: THREE.Color | string;
  thickness: number; // 0-1
  power: number; // Light penetration power
  distortion: number; // Light distortion
  scale: number; // Effect scale
  ambient: THREE.Color | string;
}

/**
 * Subsurface Scattering Material
 * Creates materials with subsurface scattering effect
 */
export class SubsurfaceScatteringMaterial extends THREE.ShaderMaterial {
  constructor(config: SSSConfig) {
    const color = typeof config.color === 'string' ? new THREE.Color(config.color) : config.color;
    const ambient = typeof config.ambient === 'string' ? new THREE.Color(config.ambient) : config.ambient;
    
    super({
      uniforms: {
        diffuse: { value: color },
        ambient: { value: ambient },
        thickness: { value: config.thickness },
        power: { value: config.power },
        distortion: { value: config.distortion },
        scale: { value: config.scale },
        lightPosition: { value: new THREE.Vector3(0, 10, 10) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vLightDirection;
        
        uniform vec3 lightPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vLightDirection = normalize(lightPosition - worldPosition.xyz);
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 diffuse;
        uniform vec3 ambient;
        uniform float thickness;
        uniform float power;
        uniform float distortion;
        uniform float scale;
        
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vLightDirection;
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          vec3 lightDir = normalize(vLightDirection);
          
          // Front lighting
          float NdotL = max(0.0, dot(normal, lightDir));
          
          // Back lighting (subsurface)
          vec3 H = normalize(lightDir + normal * distortion);
          float VdotH = pow(clamp(dot(viewDir, -H), 0.0, 1.0), power) * scale;
          float backLight = VdotH * thickness;
          
          // Combine
          vec3 finalColor = diffuse * (NdotL + ambient + vec3(backLight));
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      lights: false
    });
  }
  
  /**
   * Update light position
   */
  setLightPosition(position: THREE.Vector3): void {
    this.uniforms.lightPosition.value.copy(position);
  }
  
  /**
   * Update thickness
   */
  setThickness(thickness: number): void {
    this.uniforms.thickness.value = thickness;
  }
}

/**
 * Subsurface Scattering System
 * Manages SSS materials and effects
 */
export class SubsurfaceScatteringSystem {
  private materials: Map<string, SubsurfaceScatteringMaterial>;
  
  constructor() {
    this.materials = new Map();
  }
  
  /**
   * Create SSS material
   */
  createMaterial(name: string, config: SSSConfig): SubsurfaceScatteringMaterial {
    const material = new SubsurfaceScatteringMaterial(config);
    this.materials.set(name, material);
    return material;
  }
  
  /**
   * Get material
   */
  getMaterial(name: string): SubsurfaceScatteringMaterial | undefined {
    return this.materials.get(name);
  }
  
  /**
   * Update all materials with light position
   */
  updateLightPosition(position: THREE.Vector3): void {
    this.materials.forEach(material => {
      material.setLightPosition(position);
    });
  }
  
  /**
   * Create preset materials
   */
  createPresets(): void {
    // Backlit screen
    this.createMaterial('screen_backlit', {
      color: '#00ff00',
      thickness: 0.5,
      power: 2.0,
      distortion: 0.1,
      scale: 1.0,
      ambient: '#001100'
    });
    
    // Translucent plastic
    this.createMaterial('plastic_translucent', {
      color: '#ffffff',
      thickness: 0.3,
      power: 1.5,
      distortion: 0.2,
      scale: 0.8,
      ambient: '#111111'
    });
  }
  
  /**
   * Dispose material
   */
  disposeMaterial(name: string): void {
    const material = this.materials.get(name);
    if (material) {
      material.dispose();
      this.materials.delete(name);
    }
  }
  
  /**
   * Dispose all
   */
  disposeAll(): void {
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
  }
}

// Singleton
export const sssSystem = new SubsurfaceScatteringSystem();
