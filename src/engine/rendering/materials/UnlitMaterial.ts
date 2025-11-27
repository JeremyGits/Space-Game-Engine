/**
 * Unlit Material
 * 
 * No lighting calculations
 * Just texture/color output
 */

import { Material, MaterialParameters } from './Material';

/**
 * Unlit material class
 */
export class UnlitMaterial extends Material {
  /**
   * Create unlit material
   */
  constructor(parameters: MaterialParameters = {}) {
    super(parameters);
    
    this.type = 'UnlitMaterial';
  }
  
  /**
   * Clone material
   */
  clone(): UnlitMaterial {
    const material = new UnlitMaterial();
    this.copyTo(material);
    return material;
  }
}
