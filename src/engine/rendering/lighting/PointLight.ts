/**
 * Point Light
 * 
 * Emits light in all directions from a single point
 * Light intensity decreases with distance
 */

import { Light, LightType, LightParameters } from './Light';

/**
 * Point light parameters
 */
export interface PointLightParameters extends LightParameters {
  distance?: number;
  decay?: number;
}

/**
 * Point light class
 */
export class PointLight extends Light {
  public distance: number;
  public decay: number;
  
  /**
   * Create point light
   */
  constructor(parameters: PointLightParameters = {}) {
    super(LightType.POINT, parameters);
    
    this.distance = parameters.distance !== undefined ? parameters.distance : 0;
    this.decay = parameters.decay !== undefined ? parameters.decay : 2.0;
  }
  
  /**
   * Set distance
   */
  setDistance(distance: number): this {
    this.distance = Math.max(0, distance);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set decay
   */
  setDecay(decay: number): this {
    this.decay = Math.max(0, decay);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Calculate attenuation at distance
   */
  getAttenuation(distance: number): number {
    if (this.distance === 0) {
      return 1.0;
    }
    
    // Physical attenuation: 1 / (distance^decay)
    const attenuation = Math.pow(Math.max(distance / this.distance, 0), -this.decay);
    return Math.min(attenuation, 1.0);
  }
  
  /**
   * Clone point light
   */
  clone(): PointLight {
    const light = new PointLight();
    this.copyTo(light);
    light.distance = this.distance;
    light.decay = this.decay;
    return light;
  }
  
  /**
   * Convert to JSON
   */
  toJSON(): any {
    const json = super.toJSON();
    json.distance = this.distance;
    json.decay = this.decay;
    return json;
  }
}
