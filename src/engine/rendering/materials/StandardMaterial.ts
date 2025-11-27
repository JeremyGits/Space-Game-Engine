/**
 * Standard Material
 * 
 * Phong/Blinn-Phong lighting model
 * Standard material for most objects
 */

import { Material, MaterialParameters } from './Material';
import { Vector3 } from '../../../utils/math/Vector3';

/**
 * Standard material parameters
 */
export interface StandardMaterialParameters extends MaterialParameters {
  specular?: Vector3;
  shininess?: number;
  envMap?: any;
  envMapIntensity?: number;
  lightMap?: any;
  lightMapIntensity?: number;
}

/**
 * Standard material class (Phong/Blinn-Phong)
 */
export class StandardMaterial extends Material {
  // Specular properties
  public specular: Vector3;
  public shininess: number;
  
  // Environment mapping
  public envMap: any = null;
  public envMapIntensity: number;
  
  // Light mapping
  public lightMap: any = null;
  public lightMapIntensity: number;
  
  /**
   * Create standard material
   */
  constructor(parameters: StandardMaterialParameters = {}) {
    super(parameters);
    
    this.type = 'StandardMaterial';
    
    // Specular
    this.specular = parameters.specular || new Vector3(0.5, 0.5, 0.5);
    this.shininess = parameters.shininess !== undefined ? parameters.shininess : 30;
    
    // Environment
    if (parameters.envMap) this.envMap = parameters.envMap;
    this.envMapIntensity = parameters.envMapIntensity !== undefined ? parameters.envMapIntensity : 1.0;
    
    // Light map
    if (parameters.lightMap) this.lightMap = parameters.lightMap;
    this.lightMapIntensity = parameters.lightMapIntensity !== undefined ? parameters.lightMapIntensity : 1.0;
  }
  
  /**
   * Set specular color
   */
  setSpecular(r: number, g: number, b: number): this {
    this.specular.set(r, g, b);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set shininess
   */
  setShininess(shininess: number): this {
    this.shininess = Math.max(0, shininess);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set environment map intensity
   */
  setEnvMapIntensity(intensity: number): this {
    this.envMapIntensity = Math.max(0, intensity);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Clone material
   */
  clone(): StandardMaterial {
    const material = new StandardMaterial();
    this.copyTo(material);
    material.specular = this.specular.clone();
    material.shininess = this.shininess;
    material.envMap = this.envMap;
    material.envMapIntensity = this.envMapIntensity;
    material.lightMap = this.lightMap;
    material.lightMapIntensity = this.lightMapIntensity;
    return material;
  }
  
  /**
   * Convert to JSON
   */
  toJSON(): any {
    const json = super.toJSON();
    json.specular = [this.specular.x, this.specular.y, this.specular.z];
    json.shininess = this.shininess;
    json.envMapIntensity = this.envMapIntensity;
    json.lightMapIntensity = this.lightMapIntensity;
    return json;
  }
}
