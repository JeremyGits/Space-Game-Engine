/**
 * Voxel Manager
 * 
 * Manages voxel objects, their lifecycle, and coordinates between
 * different voxel subsystems (octree, meshing, clustering, rendering).
 */

import * as THREE from 'three';
import type { VoxelConfig } from './VoxelConfig';
import { voxelProfiler } from './VoxelProfiler';
import { voxelDebugger } from './VoxelDebugger';

export interface VoxelObject {
  id: string;
  name: string;
  octree: any; // Will be SparseVoxelOctree when implemented
  mesh: THREE.Mesh | null;
  bounds: THREE.Box3;
  lodLevel: number;
  visible: boolean;
  needsUpdate: boolean;
  lastUpdateTime: number;
}

export class VoxelManager {
  private config: VoxelConfig;
  private voxelObjects: Map<string, VoxelObject> = new Map();
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  
  // Performance tracking
  private frameStartTime: number = 0;
  private voxelUpdateTime: number = 0;
  private voxelRenderTime: number = 0;
  
  // Statistics
  private stats = {
    totalVoxels: 0,
    visibleVoxels: 0,
    totalObjects: 0,
    visibleObjects: 0,
    totalTriangles: 0,
    totalVertices: 0
  };
  
  constructor(config: VoxelConfig) {
    this.config = config;
    console.log('[VoxelManager] Initialized with config:', config);
  }
  
  /**
   * Initialize manager with scene and camera
   */
  initialize(scene: THREE.Scene, camera: THREE.Camera): void {
    this.scene = scene;
    this.camera = camera;
    
    // Initialize debugger if debug is enabled
    if (this.config.debug.enableDebug) {
      voxelDebugger.initialize(scene);
      voxelDebugger.enable(this.config.debug);
    }
    
    console.log('[VoxelManager] Initialized with scene and camera');
  }
  
  /**
   * Create a new voxel object
   */
  createVoxelObject(id: string, name: string = 'VoxelObject'): VoxelObject {
    const voxelObject: VoxelObject = {
      id,
      name,
      octree: null, // Will be created when voxels are added
      mesh: null,
      bounds: new THREE.Box3(),
      lodLevel: 0,
      visible: true,
      needsUpdate: true,
      lastUpdateTime: 0
    };
    
    this.voxelObjects.set(id, voxelObject);
    this.stats.totalObjects++;
    
    console.log(`[VoxelManager] Created voxel object: ${name} (${id})`);
    return voxelObject;
  }
  
  /**
   * Get voxel object by ID
   */
  getVoxelObject(id: string): VoxelObject | undefined {
    return this.voxelObjects.get(id);
  }
  
  /**
   * Remove voxel object
   */
  removeVoxelObject(id: string): boolean {
    const voxelObject = this.voxelObjects.get(id);
    if (!voxelObject) return false;
    
    // Remove mesh from scene
    if (voxelObject.mesh && this.scene) {
      this.scene.remove(voxelObject.mesh);
      voxelObject.mesh.geometry.dispose();
      if (Array.isArray(voxelObject.mesh.material)) {
        voxelObject.mesh.material.forEach(m => m.dispose());
      } else {
        voxelObject.mesh.material.dispose();
      }
    }
    
    this.voxelObjects.delete(id);
    this.stats.totalObjects--;
    
    console.log(`[VoxelManager] Removed voxel object: ${id}`);
    return true;
  }
  
  /**
   * Mark voxel object as needing update
   */
  markForUpdate(id: string): void {
    const voxelObject = this.voxelObjects.get(id);
    if (voxelObject) {
      voxelObject.needsUpdate = true;
    }
  }
  
  /**
   * Update all voxel objects
   */
  update(deltaTime: number): void {
    if (!this.camera) return;
    
    this.frameStartTime = performance.now();
    const updateStartTime = performance.now();
    
    // Reset stats
    this.stats.visibleVoxels = 0;
    this.stats.visibleObjects = 0;
    this.stats.totalTriangles = 0;
    this.stats.totalVertices = 0;
    
    // Update each voxel object
    for (const [id, voxelObject] of this.voxelObjects) {
      // Check visibility (frustum culling)
      if (this.camera && voxelObject.bounds) {
        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(
          this.camera.projectionMatrix,
          this.camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(projScreenMatrix);
        
        voxelObject.visible = frustum.intersectsBox(voxelObject.bounds);
      }
      
      if (voxelObject.visible) {
        this.stats.visibleObjects++;
        
        // Calculate LOD level based on distance
        if (this.config.lod.enableLOD && this.camera) {
          const distance = voxelObject.bounds.getCenter(new THREE.Vector3())
            .distanceTo(this.camera.position);
          voxelObject.lodLevel = this.calculateLODLevel(distance);
        }
        
        // Update if needed
        if (voxelObject.needsUpdate) {
          this.updateVoxelObject(voxelObject);
          voxelObject.needsUpdate = false;
          voxelObject.lastUpdateTime = performance.now();
        }
        
        // Update stats
        if (voxelObject.mesh) {
          const geometry = voxelObject.mesh.geometry;
          this.stats.totalVertices += geometry.attributes.position.count;
          if (geometry.index) {
            this.stats.totalTriangles += geometry.index.count / 3;
          }
        }
      }
    }
    
    this.voxelUpdateTime = performance.now() - updateStartTime;
    
    // Record profiling data
    if (voxelProfiler.isEnabled()) {
      voxelProfiler.recordVoxelCounts(
        this.stats.totalVoxels,
        this.stats.visibleVoxels,
        this.stats.totalVoxels - this.stats.visibleVoxels
      );
    }
  }
  
  /**
   * Render all visible voxel objects
   */
  render(): void {
    const renderStartTime = performance.now();
    
    // Rendering is handled by Three.js scene graph
    // This method is for any custom rendering logic
    
    this.voxelRenderTime = performance.now() - renderStartTime;
    
    // Record frame timing
    if (voxelProfiler.isEnabled()) {
      const totalFrameTime = performance.now() - this.frameStartTime;
      const fps = 1000 / totalFrameTime;
      
      voxelProfiler.recordFrameTiming(
        totalFrameTime,
        this.voxelUpdateTime,
        this.voxelRenderTime,
        fps
      );
      
      voxelProfiler.endFrame();
    }
  }
  
  /**
   * Update a single voxel object
   */
  private updateVoxelObject(voxelObject: VoxelObject): void {
    // This will be implemented when we have the octree and meshing systems
    // For now, it's a placeholder
    
    console.log(`[VoxelManager] Updating voxel object: ${voxelObject.name}`);
    
    // Future implementation:
    // 1. Traverse octree to get visible voxels
    // 2. Cluster similar voxels
    // 3. Generate optimized mesh with greedy meshing
    // 4. Update Three.js mesh
    // 5. Update bounds
  }
  
  /**
   * Calculate LOD level based on distance
   */
  private calculateLODLevel(distance: number): number {
    if (!this.config.lod.enableLOD) return 0;
    
    const distances = this.config.lod.lodDistances;
    
    for (let i = 0; i < distances.length; i++) {
      if (distance < distances[i]) {
        return i;
      }
    }
    
    return distances.length; // Furthest LOD
  }
  
  /**
   * Get all voxel objects
   */
  getAllVoxelObjects(): VoxelObject[] {
    return Array.from(this.voxelObjects.values());
  }
  
  /**
   * Get visible voxel objects
   */
  getVisibleVoxelObjects(): VoxelObject[] {
    return Array.from(this.voxelObjects.values()).filter(obj => obj.visible);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<VoxelConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update debugger if debug settings changed
    if (config.debug) {
      if (config.debug.enableDebug) {
        voxelDebugger.enable(config.debug);
      } else {
        voxelDebugger.disable();
      }
    }
    
    console.log('[VoxelManager] Configuration updated');
  }
  
  /**
   * Get current configuration
   */
  getConfig(): VoxelConfig {
    return { ...this.config };
  }
  
  /**
   * Clear all voxel objects
   */
  clear(): void {
    for (const id of this.voxelObjects.keys()) {
      this.removeVoxelObject(id);
    }
    
    this.stats = {
      totalVoxels: 0,
      visibleVoxels: 0,
      totalObjects: 0,
      visibleObjects: 0,
      totalTriangles: 0,
      totalVertices: 0
    };
    
    console.log('[VoxelManager] Cleared all voxel objects');
  }
  
  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clear();
    voxelDebugger.dispose();
    console.log('[VoxelManager] Disposed');
  }
  
  /**
   * Get memory usage estimate (bytes)
   */
  getMemoryUsage(): number {
    let totalMemory = 0;
    
    for (const voxelObject of this.voxelObjects.values()) {
      // Estimate mesh memory
      if (voxelObject.mesh) {
        const geometry = voxelObject.mesh.geometry;
        
        // Position attribute
        if (geometry.attributes.position) {
          totalMemory += geometry.attributes.position.array.byteLength;
        }
        
        // Normal attribute
        if (geometry.attributes.normal) {
          totalMemory += geometry.attributes.normal.array.byteLength;
        }
        
        // Color attribute
        if (geometry.attributes.color) {
          totalMemory += geometry.attributes.color.array.byteLength;
        }
        
        // UV attribute
        if (geometry.attributes.uv) {
          totalMemory += geometry.attributes.uv.array.byteLength;
        }
        
        // Index
        if (geometry.index) {
          totalMemory += geometry.index.array.byteLength;
        }
      }
      
      // Octree memory (estimated)
      // Will be more accurate when octree is implemented
      totalMemory += 1024 * 1024; // Placeholder: 1MB per object
    }
    
    return totalMemory;
  }
  
  /**
   * Log current status
   */
  logStatus(): void {
    console.log(`
=== VOXEL MANAGER STATUS ===
Objects: ${this.stats.totalObjects} (${this.stats.visibleObjects} visible)
Voxels: ${this.stats.totalVoxels} (${this.stats.visibleVoxels} visible)
Geometry: ${this.stats.totalTriangles} triangles, ${this.stats.totalVertices} vertices
Memory: ${(this.getMemoryUsage() / 1024 / 1024).toFixed(2)}MB
Update Time: ${this.voxelUpdateTime.toFixed(2)}ms
Render Time: ${this.voxelRenderTime.toFixed(2)}ms
============================
    `.trim());
  }
}
