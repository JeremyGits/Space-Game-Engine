/**
 * Indirect Drawing
 * 
 * GPU-driven indirect drawing for voxels.
 * Enables GPU to control draw calls.
 */

import * as THREE from 'three';

/**
 * Indirect draw command
 */
export interface IndirectDrawCommand {
  /** Vertex count */
  count: number;
  
  /** Instance count */
  instanceCount: number;
  
  /** First vertex */
  first: number;
  
  /** Base instance */
  baseInstance: number;
}

/**
 * Indirect drawing manager
 */
export class IndirectDrawing {
  private gl: WebGL2RenderingContext;
  private commandBuffer: WebGLBuffer | null = null;
  
  constructor(renderer: THREE.WebGLRenderer) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    
    if (!gl) {
      throw new Error('WebGL2 context required');
    }
    
    this.gl = gl;
  }
  
  /**
   * Create command buffer
   */
  createCommandBuffer(commands: IndirectDrawCommand[]): void {
    // Create buffer
    this.commandBuffer = this.gl.createBuffer();
    if (!this.commandBuffer) {
      throw new Error('Failed to create command buffer');
    }
    
    // Pack commands into array
    const data = new Uint32Array(commands.length * 4);
    
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      data[i * 4] = cmd.count;
      data[i * 4 + 1] = cmd.instanceCount;
      data[i * 4 + 2] = cmd.first;
      data[i * 4 + 3] = cmd.baseInstance;
    }
    
    // Upload to GPU
    this.gl.bindBuffer(this.gl.DRAW_INDIRECT_BUFFER, this.commandBuffer);
    this.gl.bufferData(this.gl.DRAW_INDIRECT_BUFFER, data, this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.DRAW_INDIRECT_BUFFER, null);
  }
  
  /**
   * Execute indirect draw
   */
  draw(commandCount: number): void {
    if (!this.commandBuffer) return;
    
    this.gl.bindBuffer(this.gl.DRAW_INDIRECT_BUFFER, this.commandBuffer);
    
    for (let i = 0; i < commandCount; i++) {
      const offset = i * 16; // 4 uint32s * 4 bytes
      this.gl.drawArraysIndirect(this.gl.TRIANGLES, offset);
    }
    
    this.gl.bindBuffer(this.gl.DRAW_INDIRECT_BUFFER, null);
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.commandBuffer) {
      this.gl.deleteBuffer(this.commandBuffer);
      this.commandBuffer = null;
    }
  }
  
  /**
   * Check if indirect drawing is supported
   */
  static isSupported(renderer: THREE.WebGLRenderer): boolean {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    return gl && 'drawArraysIndirect' in gl;
  }
}
