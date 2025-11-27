/**
 * Voxel Rendering System - Main Export
 * 
 * Hybrid Voxel-Triangle rendering system for photorealistic 3D reconstruction
 * from 2D images with 1px-level precision.
 * 
 * Features:
 * - Sparse Voxel Octree for efficient storage
 * - Greedy Meshing for triangle optimization
 * - Nearest Neighbor Clustering for intelligent grouping
 * - GPU Acceleration for performance
 * - Adaptive LOD for scalability
 * 
 * Usage:
 * ```typescript
 * import { createVoxelEngine } from './engine/rendering/voxel';
 * 
 * const voxelEngine = createVoxelEngine({
 *   enableProfiling: true,
 *   enableDebug: true
 * });
 * 
 * await voxelEngine.initialize(scene, camera, renderer);
 * voxelEngine.start();
 * 
 * // In your render loop:
 * voxelEngine.update();
 * voxelEngine.render();
 * ```
 */

// Main engine
export { VoxelEngine, createVoxelEngine } from './VoxelEngine';
export type { VoxelEngineOptions, VoxelEngineState } from './VoxelEngine';

// Configuration
export { 
  DEFAULT_VOXEL_CONFIG,
  HIGH_QUALITY_VOXEL_CONFIG,
  PERFORMANCE_VOXEL_CONFIG,
  MOBILE_VOXEL_CONFIG,
  getVoxelConfigPreset,
  validateVoxelConfig
} from './VoxelConfig';
export type {
  VoxelConfig,
  VoxelResolutionConfig,
  VoxelPerformanceConfig,
  VoxelQualityConfig,
  VoxelMemoryConfig,
  VoxelLODConfig,
  VoxelDebugConfig
} from './VoxelConfig';

// Manager
export { VoxelManager } from './VoxelManager';
export type { VoxelObject } from './VoxelManager';

// Profiler
export { voxelProfiler, VoxelProfiler } from './VoxelProfiler';
export type { VoxelPerformanceMetrics, VoxelProfilerSample } from './VoxelProfiler';

// Debugger
export { voxelDebugger, VoxelDebugger } from './VoxelDebugger';
export type { DebugVisualizationOptions } from './VoxelDebugger';

// Core Data Structures
export * from './core';

// Octree Operations
export * from './octree';

// Storage Backends
export * from './storage';

// Image-to-Voxel Conversion
export * from './conversion';
