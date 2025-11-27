/**
 * Shader
 * 
 * WebGL shader program wrapper
 */

import { RenderContext } from '../core/RenderContext';
import { Matrix4 } from '../../../utils/math/Matrix4';
import { Matrix3 } from '../../../utils/math/Matrix3';
import { Vector2 } from '../../../utils/math/Vector2';
import { Vector3 } from '../../../utils/math/Vector3';
import { Vector4 } from '../../../utils/math/Vector4';

/**
 * Shader uniform value types
 */
export type ShaderUniformValue = 
  | number 
  | number[] 
  | Vector2 
  | Vector3 
  | Vector4 
  | Matrix3 
  | Matrix4 
  | WebGLTexture 
  | null;

/**
 * Shader configuration
 */
export interface ShaderConfig {
  vertexShader: string;
  fragmentShader: string;
  defines?: Record<string, any>;
  uniforms?: Record<string, ShaderUniformValue>;
  attributes?: string[];
}

/**
 * Shader class
 */
export class Shader {
  private context: RenderContext;
  private config: ShaderConfig;
  private program: WebGLProgram | null = null;
  private vertexShader: WebGLShader | null = null;
  private fragmentShader: WebGLShader | null = null;
  
  // Uniform locations cache
  private uniformLocations: Map<string, WebGLUniformLocation | null> = new Map();
  
  // Attribute locations cache
  private attributeLocations: Map<string, number> = new Map();
  
  // Current uniform values
  private uniforms: Map<string, ShaderUniformValue> = new Map();
  
  // State
  public compiled: boolean = false;
  public id: string;
  
  /**
   * Create shader
   */
  constructor(context: RenderContext, config: ShaderConfig) {
    this.context = context;
    this.config = config;
    this.id = this.generateId();
    
    // Set initial uniforms
    if (config.uniforms) {
      for (const [name, value] of Object.entries(config.uniforms)) {
        this.uniforms.set(name, value);
      }
    }
  }
  
  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `shader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Compile shader
   */
  compile(): boolean {
    const gl = this.context.getContext();
    if (!gl) {
      console.error('WebGL context not available');
      return false;
    }
    
    try {
      // Process defines
      const vertexSource = this.processDefines(this.config.vertexShader);
      const fragmentSource = this.processDefines(this.config.fragmentShader);
      
      // Compile vertex shader
      this.vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexSource);
      if (!this.vertexShader) {
        return false;
      }
      
      // Compile fragment shader
      this.fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
      if (!this.fragmentShader) {
        return false;
      }
      
      // Link program
      this.program = this.linkProgram(gl, this.vertexShader, this.fragmentShader);
      if (!this.program) {
        return false;
      }
      
      // Cache attribute locations
      if (this.config.attributes) {
        for (const attribute of this.config.attributes) {
          const location = gl.getAttribLocation(this.program, attribute);
          this.attributeLocations.set(attribute, location);
        }
      }
      
      this.compiled = true;
      return true;
    } catch (error) {
      console.error('Shader compilation failed:', error);
      return false;
    }
  }
  
  /**
   * Process shader defines
   */
  private processDefines(source: string): string {
    if (!this.config.defines) {
      return source;
    }
    
    let defines = '';
    for (const [name, value] of Object.entries(this.config.defines)) {
      if (value === true) {
        defines += `#define ${name}\n`;
      } else if (value !== false && value !== undefined) {
        defines += `#define ${name} ${value}\n`;
      }
    }
    
    // Insert defines after #version directive if present
    const versionMatch = source.match(/^#version\s+\d+.*$/m);
    if (versionMatch) {
      const versionLine = versionMatch[0];
      return source.replace(versionLine, `${versionLine}\n${defines}`);
    }
    
    return defines + source;
  }
  
  /**
   * Compile individual shader
   */
  private compileShader(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    type: number,
    source: string
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) {
      console.error('Failed to create shader');
      return null;
    }
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      console.error(`Shader compilation error:\n${info}\n\nSource:\n${source}`);
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  /**
   * Link shader program
   */
  private linkProgram(
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ): WebGLProgram | null {
    const program = gl.createProgram();
    if (!program) {
      console.error('Failed to create program');
      return null;
    }
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      console.error(`Program linking error:\n${info}`);
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }
  
  /**
   * Use shader program
   */
  use(): void {
    if (!this.compiled || !this.program) {
      console.warn('Shader not compiled');
      return;
    }
    
    const gl = this.context.getContext();
    if (!gl) return;
    
    gl.useProgram(this.program);
    
    // Set uniforms
    for (const [name, value] of this.uniforms.entries()) {
      this.setUniform(name, value);
    }
  }
  
  /**
   * Set uniform value
   */
  setUniform(name: string, value: ShaderUniformValue): void {
    if (!this.program) return;
    
    const gl = this.context.getContext();
    if (!gl) return;
    
    // Get or cache uniform location
    let location = this.uniformLocations.get(name);
    if (location === undefined) {
      location = gl.getUniformLocation(this.program, name);
      this.uniformLocations.set(name, location);
    }
    
    if (!location) return;
    
    // Store value
    this.uniforms.set(name, value);
    
    // Set uniform based on type
    if (value === null) {
      return;
    } else if (typeof value === 'number') {
      gl.uniform1f(location, value);
    } else if (Array.isArray(value)) {
      switch (value.length) {
        case 2:
          gl.uniform2fv(location, value);
          break;
        case 3:
          gl.uniform3fv(location, value);
          break;
        case 4:
          gl.uniform4fv(location, value);
          break;
        case 9:
          gl.uniformMatrix3fv(location, false, value);
          break;
        case 16:
          gl.uniformMatrix4fv(location, false, value);
          break;
      }
    } else if (value instanceof Vector2) {
      gl.uniform2f(location, value.x, value.y);
    } else if (value instanceof Vector3) {
      gl.uniform3f(location, value.x, value.y, value.z);
    } else if (value instanceof Vector4) {
      gl.uniform4f(location, value.x, value.y, value.z, value.w);
    } else if (value instanceof Matrix3) {
      gl.uniformMatrix3fv(location, false, value.elements);
    } else if (value instanceof Matrix4) {
      gl.uniformMatrix4fv(location, false, value.elements);
    }
  }
  
  /**
   * Get attribute location
   */
  getAttributeLocation(name: string): number {
    return this.attributeLocations.get(name) ?? -1;
  }
  
  /**
   * Get program
   */
  getProgram(): WebGLProgram | null {
    return this.program;
  }
  
  /**
   * Dispose shader
   */
  dispose(): void {
    const gl = this.context.getContext();
    if (!gl) return;
    
    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = null;
    }
    
    if (this.vertexShader) {
      gl.deleteShader(this.vertexShader);
      this.vertexShader = null;
    }
    
    if (this.fragmentShader) {
      gl.deleteShader(this.fragmentShader);
      this.fragmentShader = null;
    }
    
    this.uniformLocations.clear();
    this.attributeLocations.clear();
    this.uniforms.clear();
    this.compiled = false;
  }
}
