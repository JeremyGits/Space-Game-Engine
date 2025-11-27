/**
 * Compute Shader Manager
 * 
 * Manages WebGL compute shaders for GPU-accelerated voxel operations.
 * Enables parallel processing on GPU.
 * 
 * Features:
 * - Compute shader compilation
 * - Shader program management
 * - Uniform binding
 * - Buffer binding
 * - Dispatch management
 */

import * as THREE from 'three';

/**
 * Compute shader configuration
 */
export interface ComputeShaderConfig {
  /** Shader source code */
  source: string;
  
  /** Work group size */
  workGroupSize?: [number, number, number];
  
  /** Uniforms */
  uniforms?: Record<string, any>;
}

/**
 * Compute shader program
 */
export interface ComputeShaderProgram {
  /** Program ID */
  id: string;
  
  /** WebGL program */
  program: WebGLProgram;
  
  /** Uniform locations */
  uniforms: Map<string, WebGLUniformLocation>;
  
  /** Work group size */
  workGroupSize: [number, number, number];
}

/**
 * Compute shader manager
 */
export class ComputeShaderManager {
  private gl: WebGL2RenderingContext;
  private programs: Map<string, ComputeShaderProgram> = new Map();
  private activeProgram: ComputeShaderProgram | null = null;
  
  constructor(renderer: THREE.WebGLRenderer) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    
    if (!gl) {
      throw new Error('WebGL2 context required for compute shaders');
    }
    
    this.gl = gl;
  }
  
  /**
   * Create compute shader program
   */
  createProgram(id: string, config: ComputeShaderConfig): ComputeShaderProgram {
    // Check if already exists
    if (this.programs.has(id)) {
      return this.programs.get(id)!;
    }
    
    // Compile shader
    const shader = this.compileShader(config.source);
    
    // Create program
    const program = this.gl.createProgram();
    if (!program) {
      throw new Error('Failed to create shader program');
    }
    
    this.gl.attachShader(program, shader);
    this.gl.linkProgram(program);
    
    // Check link status
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      throw new Error(`Shader program link failed: ${info}`);
    }
    
    // Get uniform locations
    const uniforms = this.getUniformLocations(program, config.uniforms || {});
    
    const shaderProgram: ComputeShaderProgram = {
      id,
      program,
      uniforms,
      workGroupSize: config.workGroupSize || [8, 8, 1]
    };
    
    this.programs.set(id, shaderProgram);
    return shaderProgram;
  }
  
  /**
   * Compile compute shader (using vertex shader for WebGL2 compatibility)
   */
  private compileShader(source: string): WebGLShader {
    // Note: WebGL2 doesn't have compute shaders, using vertex shader
    // For true compute shaders, would need WebGPU
    const shader = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (!shader) {
      throw new Error('Failed to create shader');
    }
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    // Check compilation status
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${info}`);
    }
    
    return shader;
  }
  
  /**
   * Get uniform locations
   */
  private getUniformLocations(
    program: WebGLProgram,
    uniforms: Record<string, any>
  ): Map<string, WebGLUniformLocation> {
    const locations = new Map<string, WebGLUniformLocation>();
    
    for (const name in uniforms) {
      const location = this.gl.getUniformLocation(program, name);
      if (location) {
        locations.set(name, location);
      }
    }
    
    return locations;
  }
  
  /**
   * Use shader program
   */
  useProgram(id: string): void {
    const program = this.programs.get(id);
    if (!program) {
      throw new Error(`Shader program not found: ${id}`);
    }
    
    this.gl.useProgram(program.program);
    this.activeProgram = program;
  }
  
  /**
   * Set uniform value
   */
  setUniform(name: string, value: any): void {
    if (!this.activeProgram) {
      throw new Error('No active shader program');
    }
    
    const location = this.activeProgram.uniforms.get(name);
    if (!location) {
      console.warn(`Uniform not found: ${name}`);
      return;
    }
    
    // Set uniform based on type
    if (typeof value === 'number') {
      this.gl.uniform1f(location, value);
    } else if (Array.isArray(value)) {
      switch (value.length) {
        case 2:
          this.gl.uniform2fv(location, value);
          break;
        case 3:
          this.gl.uniform3fv(location, value);
          break;
        case 4:
          this.gl.uniform4fv(location, value);
          break;
      }
    } else if (value instanceof THREE.Vector2) {
      this.gl.uniform2f(location, value.x, value.y);
    } else if (value instanceof THREE.Vector3) {
      this.gl.uniform3f(location, value.x, value.y, value.z);
    } else if (value instanceof THREE.Vector4) {
      this.gl.uniform4f(location, value.x, value.y, value.z, value.w);
    }
  }
  
  /**
   * Bind buffer to shader (using transform feedback for WebGL2)
   */
  bindBuffer(binding: number, buffer: WebGLBuffer): void {
    this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, binding, buffer);
  }
  
  /**
   * Dispatch compute-like operation (using transform feedback)
   */
  dispatch(numGroupsX: number, numGroupsY: number = 1, numGroupsZ: number = 1): void {
    if (!this.activeProgram) {
      throw new Error('No active shader program');
    }
    
    // Note: WebGL2 uses transform feedback instead of compute dispatch
    // For true compute shaders, would need WebGPU
    const totalWork = numGroupsX * numGroupsY * numGroupsZ;
    
    // Begin transform feedback
    this.gl.beginTransformFeedback(this.gl.POINTS);
    this.gl.drawArrays(this.gl.POINTS, 0, totalWork);
    this.gl.endTransformFeedback();
  }
  
  /**
   * Delete shader program
   */
  deleteProgram(id: string): void {
    const program = this.programs.get(id);
    if (program) {
      this.gl.deleteProgram(program.program);
      this.programs.delete(id);
    }
  }
  
  /**
   * Dispose all resources
   */
  dispose(): void {
    for (const [id, program] of this.programs) {
      this.gl.deleteProgram(program.program);
    }
    this.programs.clear();
    this.activeProgram = null;
  }
  
  /**
   * Get program
   */
  getProgram(id: string): ComputeShaderProgram | undefined {
    return this.programs.get(id);
  }
  
  /**
   * Check if compute shaders are supported
   */
  static isSupported(renderer: THREE.WebGLRenderer): boolean {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    return gl && 'dispatchCompute' in gl;
  }
}
