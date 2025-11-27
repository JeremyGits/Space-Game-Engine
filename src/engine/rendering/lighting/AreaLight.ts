/**
 * Area Light
 * 
 * Emits light from a rectangular area
 * Provides soft, realistic lighting
 */

import { Light, LightType, LightParameters } from './Light';

/**
 * Area light parameters
 */
export interface AreaLightParameters extends LightParameters {
  width?: number;
  height?: number;
}

/**
 * Area light class
 */
export class AreaLight extends Light {
  public width: number;
  public height: number;
  
  /**
   * Create area light
   */
  constructor(parameters: AreaLightParameters = {}) {
    super(LightType.AREA, parameters);
    
    this.width = parameters.width !== undefined ? parameters.width : 1.0;
    this.height = parameters.height !== undefined ? parameters.height : 1.0;
  }
  
  /**
   * Set width
   */
  setWidth(width: number): this {
    this.width = Math.max(0, width);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set height
   */
  setHeight(height: number): this {
    this.height = Math.max(0, height);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set size
   */
  setSize(width: number, height: number): this {
    this.width = Math.max(0, width);
    this.height = Math.max(0, height);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Get area
   */
  getArea(): number {
    return this.width * this.height;
  }
  
  /**
   * Clone area light
   */
  clone(): AreaLight {
    const light = new AreaLight();
    this.copyTo(light);
    light.width = this.width;
    light.height = this.height;
    return light;
  }
  
  /**
   * Convert to JSON
   */
  toJSON(): any {
    const json = super.toJSON();
    json.width = this.width;
    json.height = this.height;
    return json;
  }
}
