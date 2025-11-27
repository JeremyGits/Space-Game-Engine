/**
 * GPU Buffer Manager
 * 
 * Manages WebGL buffers for voxel data.
 * Handles buffer creation, updates, and memory management.
 */

import * as THREE from 'three';

/**
 * Buffer type
 */
export enum BufferType {
  VERTEX = 'vertex',
  INDEX = 'index',
  UNIFORM = 'uniform',
  STORAGE = 'storage'
}

/**
 * Buffer usage
 */
export enum BufferUsage {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
  STREAM = 'stream'
}

/**
 * GPU buffer
 */
export interface GPUBuffer {
  /** Buffer ID */
  id: string;
  
  /** WebGL buffer */
  buffer: WebGLBuffer;
  
  /** Buffer type */
  type: BufferType;
  
  /** Buffer usage */
  usage: BufferUsage;
  
  /** Size in bytes */
  size: number;
  
  /** Last update time */
  lastUpdate: number;
}

/**
 * GPU buffer manager
 */
export class GPUBufferManager {
  private gl: WebGL2RenderingContext;
  private buffers: Map<string, GPUBuffer> = new Map();
  private totalMemory: number = 0;
  
  constructor(renderer: THREE.WebGLRenderer) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    
    if (!gl) {
      throw new Error('WebGL2 context required');
    }
    
    this.gl = gl;
  }
  
  /**
   * Create buffer
   */
  createBuffer(
    id: string,
    data: ArrayBuffer | ArrayBufferView,
    type: BufferType = BufferType.VERTEX,
    usage: BufferUsage = BufferUsage.DYNAMIC
  ): GPUBuffer {
    // Check if exists
    if (this.buffers.has(id)) {
      return this.buffers.get(id)!;
    }
    
    // Create WebGL buffer
    const buffer = this.gl.createBuffer();
    if (!buffer) {
      throw new Error('Failed to create buffer');
    }
    
    // Bind and upload data
    const target = this.getBufferTarget(type);
    const usageHint = this.getUsageHint(usage);
    
    this.gl.bindBuffer(target, buffer);
    this.gl.bufferData(target, data, usageHint);
    this.gl.bindBuffer(target, null);
    
    // Calculate size
    const size = data.byteLength;
    this.totalMemory += size;
    
    const gpuBuffer: GPUBuffer = {
      id,
      buffer,
      type,
      usage,
      size,
      lastUpdate: performance.now()
    };
    
    this.buffers.set(id, gpuBuffer);
    return gpuBuffer;
  }
  
  /**
   * Update buffer data
   */
  updateBuffer(id: string, data: ArrayBuffer | ArrayBufferView, offset: number = 0): void {
    const gpuBuffer = this.buffers.get(id);
    if (!gpuBuffer) {
      throw new Error(`Buffer not found: ${id}`);
    }
    
    const target = this.getBufferTarget(gpuBuffer.type);
    
    this.gl.bindBuffer(target, gpuBuffer.buffer);
    this.gl.bufferSubData(target, offset, data);
    this.gl.bindBuffer(target, null);
    
    gpuBuffer.lastUpdate = performance.now();
  }
  
  /**
   * Get buffer target
   */
  private getBufferTarget(type: BufferType): number {
    switch (type) {
      case BufferType.VERTEX:
        return this.gl.ARRAY_BUFFER;
      case BufferType.INDEX:
        return this.gl.ELEMENT_ARRAY_BUFFER;
      case BufferType.UNIFORM:
        return this.gl.UNIFORM_BUFFER;
      case BufferType.STORAGE:
        return this.gl.TRANSFORM_FEEDBACK_BUFFER;
      default:
        return this.gl.ARRAY_BUFFER;
    }
  }
  
  /**
   * Get usage hint
   */
  private getUsageHint(usage: BufferUsage): number {
    switch (usage) {
      case BufferUsage.STATIC:
        return this.gl.STATIC_DRAW;
      case BufferUsage.DYNAMIC:
        return this.gl.DYNAMIC_DRAW;
      case BufferUsage.STREAM:
        return this.gl.STREAM_DRAW;
      default:
        return this.gl.DYNAMIC_DRAW;
    }
  }
  
  /**
   * Delete buffer
   */
  deleteBuffer(id: string): void {
    const gpuBuffer = this.buffers.get(id);
    if (gpuBuffer) {
      this.gl.deleteBuffer(gpuBuffer.buffer);
      this.totalMemory -= gpuBuffer.size;
      this.buffers.delete(id);
    }
  }
  
  /**
   * Get buffer
   */
  getBuffer(id: string): GPUBuffer | undefined {
    return this.buffers.get(id);
  }
  
  /**
   * Get total memory usage (MB)
   */
  getMemoryUsage(): number {
    return this.totalMemory / (1024 * 1024);
  }
  
  /**
   * Dispose all buffers
   */
  dispose(): void {
    for (const [id, gpuBuffer] of this.buffers) {
      this.gl.deleteBuffer(gpuBuffer.buffer);
    }
    this.buffers.clear();
    this.totalMemory = 0;
  }
}
