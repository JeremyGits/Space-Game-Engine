/**
 * Spot Light
 * 
 * Emits light in a cone from a point
 * Like a flashlight or stage spotlight
 */

import { Light, LightType, LightParameters } from './Light';
import { Vector3 } from '../../../utils/math/Vector3';

/**
 * Spot light parameters
 */
export interface SpotLightParameters extends LightParameters {
  distance?: number;
  decay?: number;
  angle?: number;
  penumbra?: number;
  target?: Vector3;
}

/**
 * Spot light class
 */
export class SpotLight extends Light {
  public distance: number;
  public decay: number;
  public angle: number;
  public penumbra: number;
  public target: Vector3;
  
  /**
   * Create spot light
   */
  constructor(parameters: SpotLightParameters = {}) {
    super(LightType.SPOT, parameters);
    
    this.distance = parameters.distance !== undefined ? parameters.distance : 0;
    this.decay = parameters.decay !== undefined ? parameters.decay : 2.0;
    this.angle = parameters.angle !== undefined ? parameters.angle : Math.PI / 3;
    this.penumbra = parameters.penumbra !== undefined ? parameters.penumbra : 0.0;
    this.target = parameters.target || new Vector3(0, 0, 0);
    
    this.updateDirection();
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
   * Set cone angle (in radians)
   */
  setAngle(angle: number): this {
    this.angle = Math.max(0, Math.min(Math.PI / 2, angle));
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set penumbra (soft edge)
   */
  setPenumbra(penumbra: number): this {
    this.penumbra = Math.max(0, Math.min(1, penumbra));
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set target position
   */
  setTarget(x: number, y: number, z: number): this {
    this.target.set(x, y, z);
    this.updateDirection();
    return this;
  }
  
  /**
   * Update direction based on position and target
   */
  private updateDirection(): void {
    this.direction.copy(this.target).subtract(this.position).normalize();
    this.needsUpdate = true;
  }
  
  /**
   * Calculate attenuation at distance
   */
  getAttenuation(distance: number): number {
    if (this.distance === 0) {
      return 1.0;
    }
    
    const attenuation = Math.pow(Math.max(distance / this.distance, 0), -this.decay);
    return Math.min(attenuation, 1.0);
  }
  
  /**
   * Calculate spot effect (cone falloff)
   */
  getSpotEffect(lightToPoint: Vector3): number {
    const angleCos = lightToPoint.dot(this.direction);
    const spotCos = Math.cos(this.angle);
    const penumbraCos = Math.cos(this.angle * (1 - this.penumbra));
    
    if (angleCos > penumbraCos) {
      return 1.0;
    }
    
    if (angleCos < spotCos) {
      return 0.0;
    }
    
    // Smooth falloff in penumbra region
    return (angleCos - spotCos) / (penumbraCos - spotCos);
  }
  
  /**
   * Update light
   */
  update(): void {
    this.updateDirection();
    super.update();
  }
  
  /**
   * Clone spot light
   */
  clone(): SpotLight {
    const light = new SpotLight();
    this.copyTo(light);
    light.distance = this.distance;
    light.decay = this.decay;
    light.angle = this.angle;
    light.penumbra = this.penumbra;
    light.target = this.target.clone();
    return light;
  }
  
  /**
   * Convert to JSON
   */
  toJSON(): any {
    const json = super.toJSON();
    json.distance = this.distance;
    json.decay = this.decay;
    json.angle = this.angle;
    json.penumbra = this.penumbra;
    json.target = [this.target.x, this.target.y, this.target.z];
    return json;
  }
}
