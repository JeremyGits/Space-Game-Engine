/**
 * Directional Light
 * 
 * Simulates distant light source (like the sun)
 * Light rays are parallel
 */

import { Light, LightType, LightParameters } from './Light';
import { Matrix4 } from '../../../utils/math/Matrix4';
import { Vector3 } from '../../../utils/math/Vector3';

/**
 * Directional light parameters
 */
export interface DirectionalLightParameters extends LightParameters {
  target?: Vector3;
}

/**
 * Directional light class
 */
export class DirectionalLight extends Light {
  public target: Vector3;
  
  // Shadow camera properties
  public shadowCameraLeft: number = -10;
  public shadowCameraRight: number = 10;
  public shadowCameraTop: number = 10;
  public shadowCameraBottom: number = -10;
  public shadowCameraNear: number = 0.1;
  public shadowCameraFar: number = 100;
  
  // Shadow matrix
  public shadowMatrix: Matrix4;
  
  /**
   * Create directional light
   */
  constructor(parameters: DirectionalLightParameters = {}) {
    super(LightType.DIRECTIONAL, parameters);
    
    this.target = parameters.target || new Vector3(0, 0, 0);
    this.shadowMatrix = new Matrix4();
    
    this.updateDirection();
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
   * Set shadow camera bounds
   */
  setShadowCamera(
    left: number,
    right: number,
    top: number,
    bottom: number,
    near: number,
    far: number
  ): this {
    this.shadowCameraLeft = left;
    this.shadowCameraRight = right;
    this.shadowCameraTop = top;
    this.shadowCameraBottom = bottom;
    this.shadowCameraNear = near;
    this.shadowCameraFar = far;
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Update shadow matrix
   */
  updateShadowMatrix(): void {
    // Create orthographic projection for shadow camera
    this.shadowMatrix.makeOrthographic(
      this.shadowCameraLeft,
      this.shadowCameraRight,
      this.shadowCameraTop,
      this.shadowCameraBottom,
      this.shadowCameraNear,
      this.shadowCameraFar
    );
    
    // Apply view transform
    const viewMatrix = new Matrix4();
    const up = new Vector3(0, 1, 0);
    
    // If direction is parallel to up vector, use different up
    if (Math.abs(this.direction.dot(up)) > 0.99) {
      up.set(0, 0, 1);
    }
    
    viewMatrix.lookAt(
      this.position,
      this.target,
      up
    );
    
    this.shadowMatrix.multiply(viewMatrix);
  }
  
  /**
   * Update light
   */
  update(): void {
    if (this.needsUpdate) {
      this.updateDirection();
      if (this.castShadow) {
        this.updateShadowMatrix();
      }
    }
    super.update();
  }
  
  /**
   * Clone directional light
   */
  clone(): DirectionalLight {
    const light = new DirectionalLight();
    this.copyTo(light);
    light.target = this.target.clone();
    light.shadowCameraLeft = this.shadowCameraLeft;
    light.shadowCameraRight = this.shadowCameraRight;
    light.shadowCameraTop = this.shadowCameraTop;
    light.shadowCameraBottom = this.shadowCameraBottom;
    light.shadowCameraNear = this.shadowCameraNear;
    light.shadowCameraFar = this.shadowCameraFar;
    return light;
  }
  
  /**
   * Convert to JSON
   */
  toJSON(): any {
    const json = super.toJSON();
    json.target = [this.target.x, this.target.y, this.target.z];
    json.shadowCamera = {
      left: this.shadowCameraLeft,
      right: this.shadowCameraRight,
      top: this.shadowCameraTop,
      bottom: this.shadowCameraBottom,
      near: this.shadowCameraNear,
      far: this.shadowCameraFar
    };
    return json;
  }
}
