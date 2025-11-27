/**
 * PBR Material
 * 
 * Physically Based Rendering material
 * Metallic-Roughness workflow
 */

import { Material, MaterialParameters } from './Material';

/**
 * PBR material parameters
 */
export interface PBRMaterialParameters extends MaterialParameters {
  // Already has roughness and metalness from base Material
  clearcoat?: number;
  clearcoatRoughness?: number;
  sheen?: number;
  sheenRoughness?: number;
  transmission?: number;
  ior?: number;
  thickness?: number;
  attenuationDistance?: number;
  clearcoatMap?: any;
  sheenColorMap?: any;
  transmissionMap?: any;
  thicknessMap?: any;
}

/**
 * PBR material class
 */
export class PBRMaterial extends Material {
  // Clearcoat (car paint, varnish)
  public clearcoat: number;
  public clearcoatRoughness: number;
  public clearcoatMap: any = null;
  
  // Sheen (fabric, velvet)
  public sheen: number;
  public sheenRoughness: number;
  public sheenColorMap: any = null;
  
  // Transmission (glass, water)
  public transmission: number;
  public ior: number; // Index of refraction
  public thickness: number;
  public attenuationDistance: number;
  public transmissionMap: any = null;
  public thicknessMap: any = null;
  
  /**
   * Create PBR material
   */
  constructor(parameters: PBRMaterialParameters = {}) {
    super(parameters);
    
    this.type = 'PBRMaterial';
    
    // Clearcoat
    this.clearcoat = parameters.clearcoat !== undefined ? parameters.clearcoat : 0.0;
    this.clearcoatRoughness = parameters.clearcoatRoughness !== undefined ? parameters.clearcoatRoughness : 0.0;
    if (parameters.clearcoatMap) this.clearcoatMap = parameters.clearcoatMap;
    
    // Sheen
    this.sheen = parameters.sheen !== undefined ? parameters.sheen : 0.0;
    this.sheenRoughness = parameters.sheenRoughness !== undefined ? parameters.sheenRoughness : 1.0;
    if (parameters.sheenColorMap) this.sheenColorMap = parameters.sheenColorMap;
    
    // Transmission
    this.transmission = parameters.transmission !== undefined ? parameters.transmission : 0.0;
    this.ior = parameters.ior !== undefined ? parameters.ior : 1.5;
    this.thickness = parameters.thickness !== undefined ? parameters.thickness : 0.0;
    this.attenuationDistance = parameters.attenuationDistance !== undefined ? parameters.attenuationDistance : Infinity;
    if (parameters.transmissionMap) this.transmissionMap = parameters.transmissionMap;
    if (parameters.thicknessMap) this.thicknessMap = parameters.thicknessMap;
  }
  
  /**
   * Set clearcoat
   */
  setClearcoat(clearcoat: number): this {
    this.clearcoat = Math.max(0, Math.min(1, clearcoat));
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set clearcoat roughness
   */
  setClearcoatRoughness(roughness: number): this {
    this.clearcoatRoughness = Math.max(0, Math.min(1, roughness));
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set sheen
   */
  setSheen(sheen: number): this {
    this.sheen = Math.max(0, Math.min(1, sheen));
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set transmission
   */
  setTransmission(transmission: number): this {
    this.transmission = Math.max(0, Math.min(1, transmission));
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set index of refraction
   */
  setIOR(ior: number): this {
    this.ior = Math.max(1, ior);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Clone material
   */
  clone(): PBRMaterial {
    const material = new PBRMaterial();
    this.copyTo(material);
    material.clearcoat = this.clearcoat;
    material.clearcoatRoughness = this.clearcoatRoughness;
    material.clearcoatMap = this.clearcoatMap;
    material.sheen = this.sheen;
    material.sheenRoughness = this.sheenRoughness;
    material.sheenColorMap = this.sheenColorMap;
    material.transmission = this.transmission;
    material.ior = this.ior;
    material.thickness = this.thickness;
    material.attenuationDistance = this.attenuationDistance;
    material.transmissionMap = this.transmissionMap;
    material.thicknessMap = this.thicknessMap;
    return material;
  }
  
  /**
   * Convert to JSON
   */
  toJSON(): any {
    const json = super.toJSON();
    json.clearcoat = this.clearcoat;
    json.clearcoatRoughness = this.clearcoatRoughness;
    json.sheen = this.sheen;
    json.sheenRoughness = this.sheenRoughness;
    json.transmission = this.transmission;
    json.ior = this.ior;
    json.thickness = this.thickness;
    json.attenuationDistance = this.attenuationDistance;
    return json;
  }
}
