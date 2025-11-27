import * as THREE from 'three';

/**
 * Iridescence Configuration
 */
export interface IridescenceConfig {
  baseColor: THREE.Color | string;
  iridescence: number; // Strength (0-1)
  iridescenceIOR: number; // Index of refraction (1.3-2.0)
  iridescenceThicknessRange: [number, number]; // Min/max thickness
  roughness: number;
  metalness: number;
}

/**
 * Iridescence Material
 * Creates materials with color-shifting effects (thin-film interference)
 */
export class IridescenceMaterial extends THREE.ShaderMaterial {
  constructor(config: IridescenceConfig) {
    const baseColor = typeof config.baseColor === 'string' ? new THREE.Color(config.baseColor) : config.baseColor;
    
    super({
      uniforms: {
        baseColor: { value: baseColor },
        iridescence: { value: config.iridescence },
        iridescenceIOR: { value: config.iridescenceIOR },
        iridescenceThicknessRange: { value: config.iridescenceThicknessRange },
        roughness: { value: config.roughness },
        metalness: { value: config.metalness },
        time: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform float iridescence;
        uniform float iridescenceIOR;
        uniform vec2 iridescenceThicknessRange;
        uniform float roughness;
        uniform float metalness;
        uniform float time;
        
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        
        // Thin-film interference calculation
        vec3 calculateIridescence(float cosTheta, float thickness) {
          // Wavelengths for RGB (approximated)
          const vec3 wavelengths = vec3(650.0, 510.0, 475.0); // nm
          
          vec3 iridescentColor = vec3(0.0);
          
          for (int i = 0; i < 3; i++) {
            float wavelength = wavelengths[i] * 1e-9; // Convert to meters
            float phase = (4.0 * 3.14159 * iridescenceIOR * thickness * cosTheta) / wavelength;
            
            // Interference pattern
            float intensity = 0.5 + 0.5 * cos(phase);
            
            // Fresnel-like falloff
            intensity *= pow(1.0 - cosTheta, 2.0);
            
            iridescentColor[i] = intensity;
          }
          
          return iridescentColor;
        }
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          
          // View angle for iridescence
          float cosTheta = max(0.0, dot(viewDir, normal));
          
          // Dynamic thickness based on position (creates variation)
          float thickness = mix(
            iridescenceThicknessRange.x,
            iridescenceThicknessRange.y,
            sin(vWorldPosition.x * 0.1 + vWorldPosition.z * 0.1 + time * 0.5) * 0.5 + 0.5
          );
          
          // Calculate iridescent color
          vec3 iridescentColor = calculateIridescence(cosTheta, thickness);
          
          // Fresnel effect
          float fresnel = pow(1.0 - cosTheta, 5.0);
          
          // Combine base color with iridescence
          vec3 finalColor = mix(baseColor, iridescentColor, iridescence * fresnel);
          
          // Add metallic sheen
          if (metalness > 0.0) {
            vec3 reflectDir = reflect(-viewDir, normal);
            float specular = pow(max(0.0, dot(reflectDir, viewDir)), 1.0 / (roughness + 0.001));
            finalColor += vec3(specular) * metalness;
          }
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      lights: false
    });
  }
  
  /**
   * Update time for animation
   */
  setTime(time: number): void {
    this.uniforms.time.value = time;
  }
  
  /**
   * Update iridescence parameters
   */
  setIridescence(iridescence: number, ior: number, thicknessRange: [number, number]): void {
    this.uniforms.iridescence.value = iridescence;
    this.uniforms.iridescenceIOR.value = ior;
    this.uniforms.iridescenceThicknessRange.value = thicknessRange;
  }
}

/**
 * Iridescence System
 * Manages iridescent materials with color-shifting effects
 */
export class IridescenceSystem {
  private materials: Map<string, IridescenceMaterial>;
  private startTime: number;
  
  constructor() {
    this.materials = new Map();
    this.startTime = Date.now();
  }
  
  /**
   * Create iridescent material
   */
  createMaterial(name: string, config: IridescenceConfig): IridescenceMaterial {
    const material = new IridescenceMaterial(config);
    this.materials.set(name, material);
    return material;
  }
  
  /**
   * Get material
   */
  getMaterial(name: string): IridescenceMaterial | undefined {
    return this.materials.get(name);
  }
  
  /**
   * Create preset materials
   */
  createPresets(): void {
    // Holographic display
    this.createMaterial('holographic_display', {
      baseColor: '#0088ff',
      iridescence: 0.8,
      iridescenceIOR: 1.5,
      iridescenceThicknessRange: [300e-9, 600e-9], // 300-600nm
      roughness: 0.1,
      metalness: 0.0
    });
    
    // Energy shield
    this.createMaterial('energy_shield', {
      baseColor: '#00ff88',
      iridescence: 0.9,
      iridescenceIOR: 1.8,
      iridescenceThicknessRange: [200e-9, 800e-9], // 200-800nm
      roughness: 0.0,
      metalness: 0.1
    });
    
    // Exotic coating
    this.createMaterial('exotic_coating', {
      baseColor: '#ff6600',
      iridescence: 0.7,
      iridescenceIOR: 2.0,
      iridescenceThicknessRange: [400e-9, 700e-9], // 400-700nm
      roughness: 0.2,
      metalness: 0.3
    });
    
    // Oil slick
    this.createMaterial('oil_slick', {
      baseColor: '#000000',
      iridescence: 1.0,
      iridescenceIOR: 1.4,
      iridescenceThicknessRange: [100e-9, 1000e-9], // 100-1000nm
      roughness: 0.9,
      metalness: 0.0
    });
  }
  
  /**
   * Update all materials (for animation)
   */
  update(): void {
    const currentTime = (Date.now() - this.startTime) * 0.001; // Convert to seconds
    
    this.materials.forEach(material => {
      material.setTime(currentTime);
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
export const iridescenceSystem = new IridescenceSystem();
