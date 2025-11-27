/**
 * Voxel Engine
 * 
 * Main orchestrator for the hybrid voxel-triangle rendering system.
 * Coordinates between octree, meshing, clustering, and rendering subsystems.
 * 
 * This is the entry point for all voxel-related operations.
 */

import * as THREE from 'three';
import { VoxelConfig, DEFAULT_VOXEL_CONFIG, validateVoxelConfig } from './VoxelConfig';
import { VoxelManager } from './VoxelManager';
import { voxelProfiler, type VoxelPerformanceMetrics } from './VoxelProfiler';
import { voxelDebugger } from './VoxelDebugger';

export type VoxelEngineState = 'uninitialized' | 'initializing' | 'ready' | 'running' | 'paused' | 'disposed';

export interface VoxelEngineOptions {
  config?: Partial<VoxelConfig>;
  enableProfiling?: boolean;
  enableDebug?: boolean;
}

export class VoxelEngine {
  private config: VoxelConfig;
  private manager: VoxelManager;
  private state: VoxelEngineState = 'uninitialized';
  
  // Three.js integration
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  
  // Subsystems (to be implemented)
  private octreeSystem: any = null;      // SparseVoxelOctree system
  private meshingSystem: any = null;     // Greedy meshing system
  private clusteringSystem: any = null;  // Nearest neighbor clustering
  private gpuSystem: any = null;         // GPU acceleration
  private lodSystem: any = null;         // Adaptive LOD system
  
  // Performance
  private lastUpdateTime: number = 0;
  private deltaTime: number = 0;
  
  constructor(options: VoxelEngineOptions = {}) {
    // Merge config with defaults
    this.config = {
      ...DEFAULT_VOXEL_CONFIG,
      ...options.config
    };
    
    // Validate configuration
    const validation = validateVoxelConfig(this.config);
    if (!validation.valid) {
      console.error('[VoxelEngine] Invalid configuration:', validation.errors);
      throw new Error(`Invalid voxel configuration: ${validation.errors.join(', ')}`);
    }
    
    // Create manager
    this.manager = new VoxelManager(this.config);
    
    // Enable profiling if requested
    if (options.enableProfiling || this.config.debug.showPerformanceMetrics) {
      voxelProfiler.enable();
    }
    
    console.log('[VoxelEngine] Created with configuration');
    this.state = 'uninitialized';
  }
  
  /**
   * Initialize the voxel engine
   */
  async initialize(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ): Promise<void> {
    if (this.state !== 'uninitialized') {
      console.warn('[VoxelEngine] Already initialized');
      return;
    }
    
    this.state = 'initializing';
    console.log('[VoxelEngine] Initializing...');
    
    // Store references
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // Initialize manager
    this.manager.initialize(scene, camera);
    
    // Initialize subsystems (placeholders for now)
    await this.initializeSubsystems();
    
    this.state = 'ready';
    console.log('[VoxelEngine] Initialization complete');
  }
  
  /**
   * Initialize all subsystems
   */
  private async initializeSubsystems(): Promise<void> {
    console.log('[VoxelEngine] Initializing subsystems...');
    
    // TODO: Initialize octree system
    // this.octreeSystem = new OctreeSystem(this.config);
    
    // TODO: Initialize meshing system
    // this.meshingSystem = new MeshingSystem(this.config);
    
    // TODO: Initialize clustering system
    // this.clusteringSystem = new ClusteringSystem(this.config);
    
    // TODO: Initialize GPU system
    // if (this.config.performance.useGPUAcceleration) {
    //   this.gpuSystem = new GPUSystem(this.renderer, this.config);
    // }
    
    // TODO: Initialize LOD system
    // if (this.config.lod.enableLOD) {
    //   this.lodSystem = new LODSystem(this.config);
    // }
    
    console.log('[VoxelEngine] Subsystems initialized');
  }
  
  /**
   * Start the voxel engine
   */
  start(): void {
    if (this.state !== 'ready' && this.state !== 'paused') {
      console.warn('[VoxelEngine] Cannot start - not ready');
      return;
    }
    
    this.state = 'running';
    this.lastUpdateTime = performance.now();
    console.log('[VoxelEngine] Started');
  }
  
  /**
   * Pause the voxel engine
   */
  pause(): void {
    if (this.state !== 'running') {
      console.warn('[VoxelEngine] Cannot pause - not running');
      return;
    }
    
    this.state = 'paused';
    console.log('[VoxelEngine] Paused');
  }
  
  /**
   * Resume the voxel engine
   */
  resume(): void {
    if (this.state !== 'paused') {
      console.warn('[VoxelEngine] Cannot resume - not paused');
      return;
    }
    
    this.state = 'running';
    this.lastUpdateTime = performance.now();
    console.log('[VoxelEngine] Resumed');
  }
  
  /**
   * Update the voxel engine (call each frame)
   */
  update(): void {
    if (this.state !== 'running') return;
    
    // Calculate delta time
    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = currentTime;
    
    // Start profiling
    if (voxelProfiler.isEnabled()) {
      voxelProfiler.startTimer('total_update');
    }
    
    // Update manager
    this.manager.update(this.deltaTime);
    
    // Update subsystems
    this.updateSubsystems();
    
    // Update debugger
    if (this.config.debug.enableDebug) {
      voxelDebugger.update();
    }
    
    // End profiling
    if (voxelProfiler.isEnabled()) {
      voxelProfiler.endTimer('total_update');
    }
  }
  
  /**
   * Render voxel objects (call each frame after update)
   */
  render(): void {
    if (this.state !== 'running') return;
    
    // Start profiling
    if (voxelProfiler.isEnabled()) {
      voxelProfiler.startTimer('total_render');
    }
    
    // Render through manager
    this.manager.render();
    
    // End profiling
    if (voxelProfiler.isEnabled()) {
      voxelProfiler.endTimer('total_render');
    }
  }
  
  /**
   * Update all subsystems
   */
  private updateSubsystems(): void {
    // TODO: Update octree system
    // if (this.octreeSystem) {
    //   this.octreeSystem.update(this.deltaTime);
    // }
    
    // TODO: Update meshing system
    // if (this.meshingSystem) {
    //   this.meshingSystem.update(this.deltaTime);
    // }
    
    // TODO: Update clustering system
    // if (this.clusteringSystem) {
    //   this.clusteringSystem.update(this.deltaTime);
    // }
    
    // TODO: Update GPU system
    // if (this.gpuSystem) {
    //   this.gpuSystem.update(this.deltaTime);
    // }
    
    // TODO: Update LOD system
    // if (this.lodSystem) {
    //   this.lodSystem.update(this.camera, this.deltaTime);
    // }
  }
  
  /**
   * Create a voxel object from an image
   */
  async createFromImage(
    imageUrl: string,
    depthImageUrl?: string,
    options?: {
      resolution?: number;
      name?: string;
    }
  ): Promise<string> {
    console.log(`[VoxelEngine] Creating voxel object from image: ${imageUrl}`);
    
    const id = `voxel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const name = options?.name || 'VoxelObject';
    
    // Create voxel object
    const voxelObject = this.manager.createVoxelObject(id, name);
    
    // TODO: Implement image-to-voxel conversion
    // 1. Load images
    // 2. Extract depth map
    // 3. Convert to voxels
    // 4. Build octree
    // 5. Generate mesh
    
    console.log(`[VoxelEngine] Voxel object created: ${id}`);
    return id;
  }
  
  /**
   * Remove a voxel object
   */
  removeVoxelObject(id: string): boolean {
    return this.manager.removeVoxelObject(id);
  }
  
  /**
   * Get voxel object
   */
  getVoxelObject(id: string) {
    return this.manager.getVoxelObject(id);
  }
  
  /**
   * Get all voxel objects
   */
  getAllVoxelObjects() {
    return this.manager.getAllVoxelObjects();
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<VoxelConfig>): void {
    this.config = { ...this.config, ...config };
    this.manager.updateConfig(config);
    
    // Update profiler
    if (config.debug?.showPerformanceMetrics) {
      voxelProfiler.enable();
    }
    
    console.log('[VoxelEngine] Configuration updated');
  }
  
  /**
   * Get current configuration
   */
  getConfig(): VoxelConfig {
    return { ...this.config };
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): VoxelPerformanceMetrics {
    return voxelProfiler.getCurrentMetrics();
  }
  
  /**
   * Get average performance metrics
   */
  getAveragePerformanceMetrics(sampleCount: number = 60): VoxelPerformanceMetrics {
    return voxelProfiler.getAverageMetrics(sampleCount);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return this.manager.getStats();
  }
  
  /**
   * Get current state
   */
  getState(): VoxelEngineState {
    return this.state;
  }
  
  /**
   * Check if engine is running
   */
  isRunning(): boolean {
    return this.state === 'running';
  }
  
  /**
   * Enable profiling
   */
  enableProfiling(): void {
    voxelProfiler.enable();
    console.log('[VoxelEngine] Profiling enabled');
  }
  
  /**
   * Disable profiling
   */
  disableProfiling(): void {
    voxelProfiler.disable();
    console.log('[VoxelEngine] Profiling disabled');
  }
  
  /**
   * Get profiling report
   */
  getProfilingReport(): string {
    return voxelProfiler.getSummary();
  }
  
  /**
   * Log profiling report to console
   */
  logProfilingReport(): void {
    voxelProfiler.logReport();
  }
  
  /**
   * Enable debug visualization
   */
  enableDebug(options?: any): void {
    voxelDebugger.enable(options);
    console.log('[VoxelEngine] Debug visualization enabled');
  }
  
  /**
   * Disable debug visualization
   */
  disableDebug(): void {
    voxelDebugger.disable();
    console.log('[VoxelEngine] Debug visualization disabled');
  }
  
  /**
   * Log current status
   */
  logStatus(): void {
    console.log(`
=== VOXEL ENGINE STATUS ===
State: ${this.state}
Delta Time: ${(this.deltaTime * 1000).toFixed(2)}ms
    `.trim());
    
    this.manager.logStatus();
    
    if (voxelProfiler.isEnabled()) {
      console.log('\n' + voxelProfiler.getSummary());
    }
  }
  
  /**
   * Dispose of all resources
   */
  dispose(): void {
    console.log('[VoxelEngine] Disposing...');
    
    // Dispose manager
    this.manager.dispose();
    
    // Dispose subsystems
    // TODO: Dispose octree, meshing, clustering, GPU, LOD systems
    
    // Dispose debugger
    voxelDebugger.dispose();
    
    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    this.state = 'disposed';
    console.log('[VoxelEngine] Disposed');
  }
}

/**
 * Create a voxel engine instance
 */
export function createVoxelEngine(options: VoxelEngineOptions = {}): VoxelEngine {
  return new VoxelEngine(options);
}
