/**
 * Light
 * 
 * Base light class for all light types
 */

import { Vector3 } from '../../../utils/math/Vector3';
import { EventEmitter } from '../../core/EventEmitter';

/**
 * Light type
 */
export enum LightType {
  AMBIENT = 'ambient',
  DIRECTIONAL = 'directional',
  POINT = 'point',
  SPOT = 'spot',
  AREA = 'area'
}

/**
 * Light parameters
 */
export interface LightParameters {
  name?: string;
  color?: Vector3;
  intensity?: number;
  castShadow?: boolean;
  shadowMapSize?: number;
  shadowBias?: number;
  shadowRadius?: number;
}

/**
 * Base light class
 */
export class Light extends EventEmitter {
  public id: string;
  public name: string;
  public type: LightType;
  
  // Light properties
  public color: Vector3;
  public intensity: number;
  
  // Shadow properties
  public castShadow: boolean;
  public shadowMapSize: number;
  public shadowBias: number;
  public shadowRadius: number;
  
  // Transform
  public position: Vector3;
  public direction: Vector3;
  
  // State
  public enabled: boolean = true;
  public needsUpdate: boolean = true;
  public version: number = 0;
  
  /**
   * Create light
   */
  constructor(type: LightType, parameters: LightParameters = {}) {
    super();
    
    this.id = this.generateId();
    this.name = parameters.name || '';
    this.type = type;
    
    // Light properties
    this.color = parameters.color || new Vector3(1, 1, 1);
    this.intensity = parameters.intensity !== undefined ? parameters.intensity : 1.0;
    
    // Shadow properties
    this.castShadow = parameters.castShadow || false;
    this.shadowMapSize = parameters.shadowMapSize || 1024;
    this.shadowBias = parameters.shadowBias !== undefined ? parameters.shadowBias : 0.0001;
    this.shadowRadius = parameters.shadowRadius !== undefined ? parameters.shadowRadius : 1.0;
    
    // Transform
    this.position = new Vector3(0, 0, 0);
    this.direction = new Vector3(0, -1, 0);
  }
  
  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `light_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Set color
   */
  setColor(r: number, g: number, b: number): this {
    this.color.set(r, g, b);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set intensity
   */
  setIntensity(intensity: number): this {
    this.intensity = Math.max(0, intensity);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set position
   */
  setPosition(x: number, y: number, z: number): this {
    this.position.set(x, y, z);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set direction
   */
  setDirection(x: number, y: number, z: number): this {
    this.direction.set(x, y, z).normalize();
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Enable light
   */
  enable(): this {
    this.enabled = true;
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Disable light
   */
  disable(): this {
    this.enabled = false;
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Update light
   */
  update(): void {
    if (this.needsUpdate) {
      this.version++;
      this.needsUpdate = false;
      this.emit('update', this);
    }
  }
  
  /**
   * Clone light
   */
  clone(): Light {
    const light = new Light(this.type);
    this.copyTo(light);
    return light;
  }
  
  /**
   * Copy properties to another light
   */
  protected copyTo(light: Light): void {
    light.name = this.name;
    light.color = this.color.clone();
    light.intensity = this.intensity;
    light.castShadow = this.castShadow;
    light.shadowMapSize = this.shadowMapSize;
    light.shadowBias = this.shadowBias;
    light.shadowRadius = this.shadowRadius;
    light.position = this.position.clone();
    light.direction = this.direction.clone();
    light.enabled = this.enabled;
    light.needsUpdate = true;
  }
  
  /**
   * Dispose light
   */
  dispose(): void {
    this.removeAllListeners();
    this.emit('dispose', this);
  }
  
  /**
   * Convert to JSON
   */
  toJSON(): any {
    return {
      type: this.type,
      name: this.name,
      color: [this.color.x, this.color.y, this.color.z],
      intensity: this.intensity,
      castShadow: this.castShadow,
      shadowMapSize: this.shadowMapSize,
      shadowBias: this.shadowBias,
      shadowRadius: this.shadowRadius,
      position: [this.position.x, this.position.y, this.position.z],
      direction: [this.direction.x, this.direction.y, this.direction.z],
      enabled: this.enabled
    };
  }
}
