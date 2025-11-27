/**
 * Cockpit Generator
 * 
 * Main class for generating 3D cockpits from images
 */

import * as THREE from 'three';
import {
  CockpitConfig,
  GeneratedCockpit,
  GenerationOptions,
  CockpitPreset,
  ScreenConfig,
  InteractiveElement
} from './types/CockpitTypes';
import { GeometryGenerator } from './generators/GeometryGenerator';

export class CockpitGenerator {
  private textureLoader: THREE.TextureLoader;
  private config: CockpitConfig;
  private options: GenerationOptions;
  
  constructor(config: CockpitConfig, options: Partial<GenerationOptions> = {}) {
    this.config = config;
    this.textureLoader = new THREE.TextureLoader();
    
    this.options = {
      preset: options.preset,
      generateNormalMaps: options.generateNormalMaps ?? true,
      generateEmissiveMaps: options.generateEmissiveMaps ?? true,
      optimize: options.optimize ?? true,
      addCollision: options.addCollision ?? false,
      debug: options.debug ?? false
    };
  }
  
  /**
   * Generate the cockpit
   */
  async generate(): Promise<GeneratedCockpit> {
    // Load texture
    const texture = await this.loadTexture(this.config.imageUrl);
    
    // Create main group
    const cockpitGroup = new THREE.Group();
    cockpitGroup.name = 'Cockpit';
    
    // Generate materials
    const materials = this.createMaterials(texture);
    
    // Generate panels
    const panels = this.generatePanels(materials.base);
    
    // Add panels to group
    if (panels.left) cockpitGroup.add(panels.left);
    if (panels.right) cockpitGroup.add(panels.right);
    if (panels.top) cockpitGroup.add(panels.top);
    if (panels.center) cockpitGroup.add(panels.center);
    
    // Generate screens
    const screens = this.generateScreens(materials.screen);
    screens.forEach(screen => cockpitGroup.add(screen));
    
    // Generate interactive elements
    const interactive = this.generateInteractiveElements(materials.emissive);
    interactive.forEach(element => cockpitGroup.add(element));
    
    // Calculate camera positions
    const cameraPosition = new THREE.Vector3(
      this.config.geometry.seatPosition.x,
      this.config.geometry.seatPosition.y,
      this.config.geometry.seatPosition.z
    );
    
    const cameraTarget = new THREE.Vector3(0, 0, -this.config.geometry.depth / 2);
    
    return {
      mesh: cockpitGroup,
      panels,
      screens,
      interactive,
      materials,
      cameraPosition,
      cameraTarget
    };
  }
  
  /**
   * Load texture from URL
   */
  private loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }
  
  /**
   * Create materials
   */
  private createMaterials(texture: THREE.Texture): {
    base: THREE.Material;
    screen: THREE.Material;
    emissive: THREE.Material;
  } {
    // Base material for panels
    const baseMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: this.config.materials.metalness,
      roughness: this.config.materials.roughness,
      side: THREE.DoubleSide
    });
    
    // Screen material (emissive)
    const screenMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: new THREE.Color(0x00ff00),
      emissiveIntensity: this.config.materials.emissiveIntensity,
      metalness: 0.1,
      roughness: 0.2
    });
    
    // Emissive material for buttons/indicators
    const emissiveMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: this.config.materials.emissiveIntensity,
      metalness: 0.5,
      roughness: 0.3
    });
    
    return {
      base: baseMaterial,
      screen: screenMaterial,
      emissive: emissiveMaterial
    };
  }
  
  /**
   * Generate panel meshes
   */
  private generatePanels(material: THREE.Material): {
    left?: THREE.Mesh;
    right?: THREE.Mesh;
    top?: THREE.Mesh;
    center?: THREE.Mesh;
  } {
    const panels: {
      left?: THREE.Mesh;
      right?: THREE.Mesh;
      top?: THREE.Mesh;
      center?: THREE.Mesh;
    } = {};
    
    // Left panel
    if (this.config.panels.left.enabled) {
      const geometry = GeometryGenerator.generateCurvedPanel(
        this.config.panels.left,
        this.config.geometry.width / 2,
        this.config.geometry.height
      );
      
      panels.left = new THREE.Mesh(geometry, material);
      panels.left.name = 'LeftPanel';
      panels.left.position.set(
        -this.config.geometry.width / 4,
        0,
        -this.config.panels.left.depth
      );
    }
    
    // Right panel
    if (this.config.panels.right.enabled) {
      const geometry = GeometryGenerator.generateCurvedPanel(
        this.config.panels.right,
        this.config.geometry.width / 2,
        this.config.geometry.height
      );
      
      panels.right = new THREE.Mesh(geometry, material);
      panels.right.name = 'RightPanel';
      panels.right.position.set(
        this.config.geometry.width / 4,
        0,
        -this.config.panels.right.depth
      );
    }
    
    // Top panel
    if (this.config.panels.top.enabled) {
      const geometry = GeometryGenerator.generateCurvedPanel(
        this.config.panels.top,
        this.config.geometry.width,
        this.config.geometry.depth / 2
      );
      
      panels.top = new THREE.Mesh(geometry, material);
      panels.top.name = 'TopPanel';
      panels.top.position.set(
        0,
        this.config.geometry.height / 2,
        -this.config.panels.top.depth
      );
      panels.top.rotation.x = -Math.PI / 2;
    }
    
    // Center console
    if (this.config.panels.center.enabled) {
      const geometry = GeometryGenerator.generateCurvedPanel(
        this.config.panels.center,
        this.config.geometry.width / 2,
        this.config.geometry.height / 2
      );
      
      panels.center = new THREE.Mesh(geometry, material);
      panels.center.name = 'CenterConsole';
      panels.center.position.set(
        0,
        -this.config.geometry.height / 4,
        -this.config.panels.center.depth
      );
    }
    
    return panels;
  }
  
  /**
   * Generate screen meshes
   */
  private generateScreens(material: THREE.Material): THREE.Mesh[] {
    if (!this.config.screens) return [];
    
    return this.config.screens.map((screenConfig: ScreenConfig) => {
      const geometry = GeometryGenerator.generateScreen(
        screenConfig.size.x,
        screenConfig.size.y
      );
      
      // Create screen-specific material
      const screenMaterial = material.clone() as THREE.MeshStandardMaterial;
      
      if (screenConfig.emissive) {
        screenMaterial.emissive = screenConfig.emissiveColor || new THREE.Color(0x00ff00);
        screenMaterial.emissiveIntensity = screenConfig.emissiveIntensity || 0.5;
      }
      
      const mesh = new THREE.Mesh(geometry, screenMaterial);
      mesh.name = `Screen_${screenConfig.id}`;
      mesh.position.copy(screenConfig.position);
      mesh.rotation.copy(screenConfig.rotation);
      
      return mesh;
    });
  }
  
  /**
   * Generate interactive element meshes
   */
  private generateInteractiveElements(material: THREE.Material): THREE.Mesh[] {
    if (!this.config.interactive) return [];
    
    return this.config.interactive.map((element: InteractiveElement) => {
      let geometry: THREE.BufferGeometry;
      
      switch (element.type) {
        case 'button':
          geometry = GeometryGenerator.generateButton(
            element.size.x / 2,
            element.size.y
          );
          break;
        case 'switch':
          geometry = GeometryGenerator.generateSwitch(
            element.size.x,
            element.size.y,
            element.size.z
          );
          break;
        case 'lever':
          geometry = GeometryGenerator.generateLever(
            element.size.y,
            element.size.x / 2
          );
          break;
        default:
          geometry = new THREE.BoxGeometry(
            element.size.x,
            element.size.y,
            element.size.z
          );
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `Interactive_${element.id}`;
      mesh.position.copy(element.position);
      mesh.rotation.copy(element.rotation);
      mesh.userData = { interactive: true, element };
      
      return mesh;
    });
  }
  
  /**
   * Create a preset configuration
   */
  static createPreset(preset: CockpitPreset, imageUrl: string): CockpitConfig {
    const presets: Record<CockpitPreset, Partial<CockpitConfig>> = {
      [CockpitPreset.FIGHTER]: {
        geometry: {
          curvature: 120,
          width: 2,
          height: 1.5,
          depth: 1.5,
          seatPosition: new THREE.Vector3(0, -0.2, 0)
        },
        panels: {
          left: {
            enabled: true,
            curve: 0.3,
            depth: 0.5,
            angle: -30,
            uvRegion: { x: 0, y: 0, width: 0.3, height: 1 },
            segments: 16
          },
          right: {
            enabled: true,
            curve: 0.3,
            depth: 0.5,
            angle: 30,
            uvRegion: { x: 0.7, y: 0, width: 0.3, height: 1 },
            segments: 16
          },
          top: {
            enabled: true,
            curve: 0.2,
            depth: 0.3,
            angle: 0,
            uvRegion: { x: 0.3, y: 0, width: 0.4, height: 0.3 },
            segments: 16
          },
          center: {
            enabled: true,
            curve: 0.1,
            depth: 0.7,
            angle: 0,
            uvRegion: { x: 0.3, y: 0.5, width: 0.4, height: 0.5 },
            segments: 16
          }
        },
        materials: {
          metalness: 0.7,
          roughness: 0.3,
          emissiveIntensity: 0.5,
          normalScale: 1.0
        }
      },
      [CockpitPreset.TRANSPORT]: {
        geometry: {
          curvature: 90,
          width: 2.5,
          height: 1.8,
          depth: 2,
          seatPosition: new THREE.Vector3(0, -0.3, 0)
        },
        panels: {
          left: {
            enabled: true,
            curve: 0.2,
            depth: 0.6,
            angle: -20,
            uvRegion: { x: 0, y: 0, width: 0.3, height: 1 },
            segments: 12
          },
          right: {
            enabled: true,
            curve: 0.2,
            depth: 0.6,
            angle: 20,
            uvRegion: { x: 0.7, y: 0, width: 0.3, height: 1 },
            segments: 12
          },
          top: {
            enabled: true,
            curve: 0.15,
            depth: 0.4,
            angle: 0,
            uvRegion: { x: 0.3, y: 0, width: 0.4, height: 0.3 },
            segments: 12
          },
          center: {
            enabled: true,
            curve: 0.05,
            depth: 0.8,
            angle: 0,
            uvRegion: { x: 0.3, y: 0.5, width: 0.4, height: 0.5 },
            segments: 12
          }
        },
        materials: {
          metalness: 0.5,
          roughness: 0.5,
          emissiveIntensity: 0.3,
          normalScale: 0.8
        }
      },
      [CockpitPreset.SHUTTLE]: {
        geometry: {
          curvature: 100,
          width: 2.2,
          height: 1.6,
          depth: 1.8,
          seatPosition: new THREE.Vector3(0, -0.25, 0)
        },
        panels: {
          left: {
            enabled: true,
            curve: 0.25,
            depth: 0.55,
            angle: -25,
            uvRegion: { x: 0, y: 0, width: 0.3, height: 1 },
            segments: 14
          },
          right: {
            enabled: true,
            curve: 0.25,
            depth: 0.55,
            angle: 25,
            uvRegion: { x: 0.7, y: 0, width: 0.3, height: 1 },
            segments: 14
          },
          top: {
            enabled: true,
            curve: 0.18,
            depth: 0.35,
            angle: 0,
            uvRegion: { x: 0.3, y: 0, width: 0.4, height: 0.3 },
            segments: 14
          },
          center: {
            enabled: true,
            curve: 0.08,
            depth: 0.75,
            angle: 0,
            uvRegion: { x: 0.3, y: 0.5, width: 0.4, height: 0.5 },
            segments: 14
          }
        },
        materials: {
          metalness: 0.6,
          roughness: 0.4,
          emissiveIntensity: 0.4,
          normalScale: 0.9
        }
      },
      [CockpitPreset.RACING]: {
        geometry: {
          curvature: 140,
          width: 1.8,
          height: 1.2,
          depth: 1.2,
          seatPosition: new THREE.Vector3(0, -0.15, 0)
        },
        panels: {
          left: {
            enabled: true,
            curve: 0.4,
            depth: 0.4,
            angle: -35,
            uvRegion: { x: 0, y: 0, width: 0.3, height: 1 },
            segments: 20
          },
          right: {
            enabled: true,
            curve: 0.4,
            depth: 0.4,
            angle: 35,
            uvRegion: { x: 0.7, y: 0, width: 0.3, height: 1 },
            segments: 20
          },
          top: {
            enabled: true,
            curve: 0.25,
            depth: 0.25,
            angle: 0,
            uvRegion: { x: 0.3, y: 0, width: 0.4, height: 0.3 },
            segments: 20
          },
          center: {
            enabled: true,
            curve: 0.15,
            depth: 0.6,
            angle: 0,
            uvRegion: { x: 0.3, y: 0.5, width: 0.4, height: 0.5 },
            segments: 20
          }
        },
        materials: {
          metalness: 0.8,
          roughness: 0.2,
          emissiveIntensity: 0.6,
          normalScale: 1.2
        }
      },
      [CockpitPreset.CUSTOM]: {}
    };
    
    const presetConfig = presets[preset];
    
    return {
      imageUrl,
      ...presetConfig
    } as CockpitConfig;
  }
}
