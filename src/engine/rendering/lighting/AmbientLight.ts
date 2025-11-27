/**
 * Ambient Light
 * 
 * Provides uniform ambient lighting to all objects
 */

import { Light, LightType, LightParameters } from './Light';

/**
 * Ambient light class
 */
export class AmbientLight extends Light {
  /**
   * Create ambient light
   */
  constructor(parameters: LightParameters = {}) {
    super(LightType.AMBIENT, parameters);
  }
  
  /**
   * Clone ambient light
   */
  clone(): AmbientLight {
    const light = new AmbientLight();
    this.copyTo(light);
    return light;
  }
}
