/**
 * Material
 * 
 * Base material class for rendering
 */

import { EventEmitter } from '../../core/EventEmitter';
import { Vector3 } from '../../../utils/math/Vector3';

/**
 * Material side
 */
export enum MaterialSide {
  FRONT = 'front',
  BACK = 'back',
  DOUBLE = 'double'
}

/**
 * Blend mode
 */
export enum BlendMode {
  NONE = 'none',
  NORMAL = 'normal',
  ADDITIVE = 'additive',
  MULTIPLY = 'multiply',
  SCREEN = 'screen'
}

/**
 * Material parameters
 */
export interface MaterialParameters {
  // Basic properties
  name?: string;
  side?: MaterialSide;
  transparent?: boolean;
  opacity?: number;
  
  // Blending
  blending?: BlendMode;
  
  // Depth
  depthTest?: boolean;
  depthWrite?: boolean;
  
  // Colors
  color?: Vector3;
  emissive?: Vector3;
  
  // Textures
  map?: any;
  normalMap?: any;
  roughnessMap?: any;
  metalnessMap?: any;
  aoMap?: any;
  emissiveMap?: any;
  
  // Material properties
  roughness?: number;
  metalness?: number;
  
  // Rendering
  wireframe?: boolean;
  flatShading?: boolean;
  
  // Custom uniforms
  uniforms?: Record<string, any>;
}

/**
 * Base material class
 */
export class Material extends EventEmitter {
  public id: string;
  public name: string;
  public type: string;
  
  // Rendering properties
  public side: MaterialSide;
  public transparent: boolean;
  public opacity: number;
  public blending: BlendMode;
  
  // Depth
  public depthTest: boolean;
  public depthWrite: boolean;
  
  // Colors
  public color: Vector3;
  public emissive: Vector3;
  
  // Textures
  public map: any = null;
  public normalMap: any = null;
  public roughnessMap: any = null;
  public metalnessMap: any = null;
  public aoMap: any = null;
  public emissiveMap: any = null;
  
  // Material properties
  public roughness: number;
  public metalness: number;
  
  // Rendering
  public wireframe: boolean;
  public flatShading: boolean;
  
  // Custom uniforms
  public uniforms: Record<string, any>;
  
  // State
  public needsUpdate: boolean = true;
  public version: number = 0;
  
  /**
   * Create material
   */
  constructor(parameters: MaterialParameters = {}) {
    super();
    
    this.id = this.generateId();
    this.name = parameters.name || '';
    this.type = 'Material';
    
    // Rendering properties
    this.side = parameters.side || MaterialSide.FRONT;
    this.transparent = parameters.transparent || false;
    this.opacity = parameters.opacity !== undefined ? parameters.opacity : 1.0;
    this.blending = parameters.blending || BlendMode.NORMAL;
    
    // Depth
    this.depthTest = parameters.depthTest !== undefined ? parameters.depthTest : true;
    this.depthWrite = parameters.depthWrite !== undefined ? parameters.depthWrite : true;
    
    // Colors
    this.color = parameters.color || new Vector3(1, 1, 1);
    this.emissive = parameters.emissive || new Vector3(0, 0, 0);
    
    // Textures
    if (parameters.map) this.map = parameters.map;
    if (parameters.normalMap) this.normalMap = parameters.normalMap;
    if (parameters.roughnessMap) this.roughnessMap = parameters.roughnessMap;
    if (parameters.metalnessMap) this.metalnessMap = parameters.metalnessMap;
    if (parameters.aoMap) this.aoMap = parameters.aoMap;
    if (parameters.emissiveMap) this.emissiveMap = parameters.emissiveMap;
    
    // Material properties
    this.roughness = parameters.roughness !== undefined ? parameters.roughness : 0.5;
    this.metalness = parameters.metalness !== undefined ? parameters.metalness : 0.0;
    
    // Rendering
    this.wireframe = parameters.wireframe || false;
    this.flatShading = parameters.flatShading || false;
    
    // Custom uniforms
    this.uniforms = parameters.uniforms || {};
  }
  
  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `material_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
   * Set emissive color
   */
  setEmissive(r: number, g: number, b: number): this {
    this.emissive.set(r, g, b);
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set opacity
   */
  setOpacity(opacity: number): this {
    this.opacity = opacity;
    this.transparent = opacity < 1.0;
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set roughness
   */
  setRoughness(roughness: number): this {
    this.roughness = Math.max(0, Math.min(1, roughness));
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set metalness
   */
  setMetalness(metalness: number): this {
    this.metalness = Math.max(0, Math.min(1, metalness));
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set uniform value
   */
  setUniform(name: string, value: any): this {
    this.uniforms[name] = value;
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Get uniform value
   */
  getUniform(name: string): any {
    return this.uniforms[name];
  }
  
  /**
   * Update material
   */
  update(): void {
    if (this.needsUpdate) {
      this.version++;
      this.needsUpdate = false;
      this.emit('update', this);
    }
  }
  
  /**
   * Clone material
   */
  clone(): Material {
    const material = new Material();
    this.copyTo(material);
    return material;
  }
  
  /**
   * Copy properties to another material
   */
  protected copyTo(material: Material): void {
    material.name = this.name;
    material.side = this.side;
    material.transparent = this.transparent;
    material.opacity = this.opacity;
    material.blending = this.blending;
    material.depthTest = this.depthTest;
    material.depthWrite = this.depthWrite;
    material.color = this.color.clone();
    material.emissive = this.emissive.clone();
    material.roughness = this.roughness;
    material.metalness = this.metalness;
    material.wireframe = this.wireframe;
    material.flatShading = this.flatShading;
    
    // Copy textures (shallow copy)
    material.map = this.map;
    material.normalMap = this.normalMap;
    material.roughnessMap = this.roughnessMap;
    material.metalnessMap = this.metalnessMap;
    material.aoMap = this.aoMap;
    material.emissiveMap = this.emissiveMap;
    
    // Copy uniforms (shallow copy)
    material.uniforms = { ...this.uniforms };
    
    material.needsUpdate = true;
  }
  
  /**
   * Dispose material
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
      side: this.side,
      transparent: this.transparent,
      opacity: this.opacity,
      blending: this.blending,
      depthTest: this.depthTest,
      depthWrite: this.depthWrite,
      color: [this.color.x, this.color.y, this.color.z],
      emissive: [this.emissive.x, this.emissive.y, this.emissive.z],
      roughness: this.roughness,
      metalness: this.metalness,
      wireframe: this.wireframe,
      flatShading: this.flatShading
    };
  }
}
