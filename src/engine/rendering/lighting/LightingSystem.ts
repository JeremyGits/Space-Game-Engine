/**
 * Lighting System
 * 
 * Manages all lights in the scene
 */

import { EventEmitter } from '../../core/EventEmitter';
import { Light, LightType } from './Light';
import { AmbientLight } from './AmbientLight';
import { DirectionalLight } from './DirectionalLight';
import { PointLight } from './PointLight';
import { SpotLight } from './SpotLight';
import { AreaLight } from './AreaLight';

/**
 * Lighting system configuration
 */
export interface LightingSystemConfig {
  maxLights?: number;
  maxDirectionalLights?: number;
  maxPointLights?: number;
  maxSpotLights?: number;
  maxAreaLights?: number;
}

/**
 * Lighting system class
 */
export class LightingSystem extends EventEmitter {
  private lights: Map<string, Light> = new Map();
  private lightsByType: Map<LightType, Light[]> = new Map();
  
  // Configuration
  private maxLights: number;
  private maxDirectionalLights: number;
  private maxPointLights: number;
  private maxSpotLights: number;
  private maxAreaLights: number;
  
  // Ambient light (only one)
  private ambientLight: AmbientLight | null = null;
  
  /**
   * Create lighting system
   */
  constructor(config: LightingSystemConfig = {}) {
    super();
    
    this.maxLights = config.maxLights || 32;
    this.maxDirectionalLights = config.maxDirectionalLights || 4;
    this.maxPointLights = config.maxPointLights || 16;
    this.maxSpotLights = config.maxSpotLights || 8;
    this.maxAreaLights = config.maxAreaLights || 4;
    
    // Initialize type maps
    this.lightsByType.set(LightType.DIRECTIONAL, []);
    this.lightsByType.set(LightType.POINT, []);
    this.lightsByType.set(LightType.SPOT, []);
    this.lightsByType.set(LightType.AREA, []);
  }
  
  /**
   * Add light
   */
  add(light: Light): boolean {
    // Check if already added
    if (this.lights.has(light.id)) {
      console.warn(`Light ${light.id} already added`);
      return false;
    }
    
    // Check total light limit
    if (this.lights.size >= this.maxLights) {
      console.warn(`Maximum number of lights (${this.maxLights}) reached`);
      return false;
    }
    
    // Handle ambient light separately
    if (light.type === LightType.AMBIENT) {
      if (this.ambientLight) {
        console.warn('Only one ambient light allowed, replacing existing');
        this.remove(this.ambientLight);
      }
      this.ambientLight = light as AmbientLight;
      this.lights.set(light.id, light);
      this.emit('lightAdded', light);
      return true;
    }
    
    // Check type-specific limits
    const typeArray = this.lightsByType.get(light.type);
    if (!typeArray) {
      console.warn(`Unknown light type: ${light.type}`);
      return false;
    }
    
    const maxForType = this.getMaxForType(light.type);
    if (typeArray.length >= maxForType) {
      console.warn(`Maximum number of ${light.type} lights (${maxForType}) reached`);
      return false;
    }
    
    // Add light
    this.lights.set(light.id, light);
    typeArray.push(light);
    
    // Listen for light updates
    light.on('update', (event) => this.handleLightUpdate(event.data));
    light.on('dispose', (event) => this.handleLightDispose(event.data));
    
    this.emit('lightAdded', light);
    return true;
  }
  
  /**
   * Remove light
   */
  remove(light: Light): boolean {
    if (!this.lights.has(light.id)) {
      return false;
    }
    
    this.lights.delete(light.id);
    
    if (light.type === LightType.AMBIENT) {
      this.ambientLight = null;
    } else {
      const typeArray = this.lightsByType.get(light.type);
      if (typeArray) {
        const index = typeArray.indexOf(light);
        if (index !== -1) {
          typeArray.splice(index, 1);
        }
      }
    }
    
    light.removeAllListeners();
    this.emit('lightRemoved', light);
    return true;
  }
  
  /**
   * Get light by ID
   */
  get(id: string): Light | undefined {
    return this.lights.get(id);
  }
  
  /**
   * Get all lights
   */
  getAll(): Light[] {
    return Array.from(this.lights.values());
  }
  
  /**
   * Get lights by type
   */
  getByType(type: LightType): Light[] {
    if (type === LightType.AMBIENT) {
      return this.ambientLight ? [this.ambientLight] : [];
    }
    return this.lightsByType.get(type) || [];
  }
  
  /**
   * Get ambient light
   */
  getAmbientLight(): AmbientLight | null {
    return this.ambientLight;
  }
  
  /**
   * Get directional lights
   */
  getDirectionalLights(): DirectionalLight[] {
    return this.getByType(LightType.DIRECTIONAL) as DirectionalLight[];
  }
  
  /**
   * Get point lights
   */
  getPointLights(): PointLight[] {
    return this.getByType(LightType.POINT) as PointLight[];
  }
  
  /**
   * Get spot lights
   */
  getSpotLights(): SpotLight[] {
    return this.getByType(LightType.SPOT) as SpotLight[];
  }
  
  /**
   * Get area lights
   */
  getAreaLights(): AreaLight[] {
    return this.getByType(LightType.AREA) as AreaLight[];
  }
  
  /**
   * Get enabled lights
   */
  getEnabledLights(): Light[] {
    return this.getAll().filter(light => light.enabled);
  }
  
  /**
   * Get shadow casting lights
   */
  getShadowCastingLights(): Light[] {
    return this.getAll().filter(light => light.castShadow && light.enabled);
  }
  
  /**
   * Get light count
   */
  getCount(): number {
    return this.lights.size;
  }
  
  /**
   * Get max lights for type
   */
  private getMaxForType(type: LightType): number {
    switch (type) {
      case LightType.DIRECTIONAL:
        return this.maxDirectionalLights;
      case LightType.POINT:
        return this.maxPointLights;
      case LightType.SPOT:
        return this.maxSpotLights;
      case LightType.AREA:
        return this.maxAreaLights;
      default:
        return 0;
    }
  }
  
  /**
   * Handle light update
   */
  private handleLightUpdate(light: Light): void {
    this.emit('lightUpdate', light);
  }
  
  /**
   * Handle light dispose
   */
  private handleLightDispose(light: Light): void {
    this.remove(light);
  }
  
  /**
   * Update all lights
   */
  update(): void {
    for (const light of this.lights.values()) {
      if (light.enabled) {
        light.update();
      }
    }
  }
  
  /**
   * Clear all lights
   */
  clear(): void {
    for (const light of this.lights.values()) {
      light.dispose();
    }
    
    this.lights.clear();
    this.ambientLight = null;
    
    for (const typeArray of this.lightsByType.values()) {
      typeArray.length = 0;
    }
    
    this.emit('clear');
  }
  
  /**
   * Dispose lighting system
   */
  dispose(): void {
    this.clear();
    this.removeAllListeners();
  }
}
