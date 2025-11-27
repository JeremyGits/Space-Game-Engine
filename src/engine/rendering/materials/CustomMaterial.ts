/**
 * Custom Material
 * 
 * User-defined shader material
 * Allows custom vertex and fragment shaders
 */

import { Material, MaterialParameters } from './Material';

/**
 * Custom material parameters
 */
export interface CustomMaterialParameters extends MaterialParameters {
  vertexShader?: string;
  fragmentShader?: string;
  defines?: Record<string, any>;
  extensions?: {
    derivatives?: boolean;
    fragDepth?: boolean;
    drawBuffers?: boolean;
    shaderTextureLOD?: boolean;
  };
}

/**
 * Custom material class
 */
export class CustomMaterial extends Material {
  public vertexShader: string;
  public fragmentShader: string;
  public defines: Record<string, any>;
  public extensions: {
    derivatives: boolean;
    fragDepth: boolean;
    drawBuffers: boolean;
    shaderTextureLOD: boolean;
  };
  
  /**
   * Create custom material
   */
  constructor(parameters: CustomMaterialParameters = {}) {
    super(parameters);
    
    this.type = 'CustomMaterial';
    
    this.vertexShader = parameters.vertexShader || this.getDefaultVertexShader();
    this.fragmentShader = parameters.fragmentShader || this.getDefaultFragmentShader();
    this.defines = parameters.defines || {};
    this.extensions = {
      derivatives: parameters.extensions?.derivatives || false,
      fragDepth: parameters.extensions?.fragDepth || false,
      drawBuffers: parameters.extensions?.drawBuffers || false,
      shaderTextureLOD: parameters.extensions?.shaderTextureLOD || false
    };
  }
  
  /**
   * Get default vertex shader
   */
  private getDefaultVertexShader(): string {
    return `
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;
      
      uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vNormal = normalMatrix * normal;
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `;
  }
  
  /**
   * Get default fragment shader
   */
  private getDefaultFragmentShader(): string {
    return `
      precision mediump float;
      
      uniform vec3 color;
      uniform float opacity;
      
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        gl_FragColor = vec4(color, opacity);
      }
    `;
  }
  
  /**
   * Set vertex shader
   */
  setVertexShader(shader: string): this {
    this.vertexShader = shader;
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set fragment shader
   */
  setFragmentShader(shader: string): this {
    this.fragmentShader = shader;
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Set define
   */
  setDefine(name: string, value: any): this {
    this.defines[name] = value;
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Remove define
   */
  removeDefine(name: string): this {
    delete this.defines[name];
    this.needsUpdate = true;
    return this;
  }
  
  /**
   * Clone material
   */
  clone(): CustomMaterial {
    const material = new CustomMaterial();
    this.copyTo(material);
    material.vertexShader = this.vertexShader;
    material.fragmentShader = this.fragmentShader;
    material.defines = { ...this.defines };
    material.extensions = { ...this.extensions };
    return material;
  }
  
  /**
   * Convert to JSON
   */
  toJSON(): any {
    const json = super.toJSON();
    json.vertexShader = this.vertexShader;
    json.fragmentShader = this.fragmentShader;
    json.defines = this.defines;
    json.extensions = this.extensions;
    return json;
  }
}
