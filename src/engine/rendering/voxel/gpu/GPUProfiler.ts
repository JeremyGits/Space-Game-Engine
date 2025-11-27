/**
 * GPU Profiler
 * 
 * Profiles GPU performance for voxel rendering.
 * Tracks timing, memory, and draw calls.
 */

import * as THREE from 'three';

/**
 * GPU timing result
 */
export interface GPUTimingResult {
  /** Operation name */
  name: string;
  
  /** GPU time (ms) */
  gpuTime: number;
  
  /** CPU time (ms) */
  cpuTime: number;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * GPU profile data
 */
export interface GPUProfileData {
  /** Frame time (ms) */
  frameTime: number;
  
  /** Draw calls */
  drawCalls: number;
  
  /** Triangles rendered */
  triangles: number;
  
  /** Vertices rendered */
  vertices: number;
  
  /** Texture binds */
  textureBinds: number;
  
  /** Shader switches */
  shaderSwitches: number;
  
  /** Memory usage (MB) */
  memoryUsage: number;
}

/**
 * GPU profiler
 */
export class GPUProfiler {
  private renderer: THREE.WebGLRenderer;
  private timings: GPUTimingResult[] = [];
  private maxTimings: number = 100;
  private enabled: boolean = true;
  
  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
  }
  
  /**
   * Start timing
   */
  startTiming(name: string): number {
    if (!this.enabled) return 0;
    return performance.now();
  }
  
  /**
   * End timing
   */
  endTiming(name: string, startTime: number): void {
    if (!this.enabled) return;
    
    const cpuTime = performance.now() - startTime;
    
    const result: GPUTimingResult = {
      name,
      gpuTime: cpuTime, // Approximate (would need WebGL timer queries for true GPU time)
      cpuTime,
      timestamp: performance.now()
    };
    
    this.timings.push(result);
    
    // Limit stored timings
    if (this.timings.length > this.maxTimings) {
      this.timings.shift();
    }
  }
  
  /**
   * Get profile data
   */
  getProfileData(): GPUProfileData {
    const info = this.renderer.info;
    
    return {
      frameTime: this.getAverageFrameTime(),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      vertices: info.render.points,
      textureBinds: 0, // Not directly available in Three.js info
      shaderSwitches: info.programs?.length || 0,
      memoryUsage: this.getMemoryUsage()
    };
  }
  
  /**
   * Get average frame time
   */
  private getAverageFrameTime(): number {
    if (this.timings.length === 0) return 0;
    
    const sum = this.timings.reduce((acc, t) => acc + t.cpuTime, 0);
    return sum / this.timings.length;
  }
  
  /**
   * Get memory usage (approximate)
   */
  private getMemoryUsage(): number {
    const info = this.renderer.info;
    
    // Approximate based on geometries and textures
    const geometryMemory = info.memory.geometries * 0.1; // ~100KB per geometry
    const textureMemory = info.memory.textures * 1.0; // ~1MB per texture
    
    return geometryMemory + textureMemory;
  }
  
  /**
   * Get timings for operation
   */
  getTimings(name: string): GPUTimingResult[] {
    return this.timings.filter(t => t.name === name);
  }
  
  /**
   * Get all timings
   */
  getAllTimings(): GPUTimingResult[] {
    return [...this.timings];
  }
  
  /**
   * Clear timings
   */
  clearTimings(): void {
    this.timings = [];
  }
  
  /**
   * Reset renderer info
   */
  resetInfo(): void {
    this.renderer.info.reset();
  }
  
  /**
   * Enable/disable profiling
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
