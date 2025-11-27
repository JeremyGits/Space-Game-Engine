/**
 * Engine Core Exports
 * 
 * Central export point for all core engine components.
 */

export { GameEngine } from './GameEngine';
export { GameLoop } from './GameLoop';
export { EventEmitter } from './EventEmitter';
export { ModuleManager } from './ModuleManager';
export { SystemManager } from './SystemManager';
export { SceneManager } from './SceneManager';
export { Scene } from './Scene';
export { SceneNode } from './SceneNode';
export { ECSWorld } from './ECSWorld';
export { Entity } from './Entity';
export { PerformanceMonitor } from './PerformanceMonitor';
export { ResourceManager } from './ResourceManager';
export { LifecycleManager } from './lifecycle/LifecycleManager';
export { LoopPhaseManager } from './loop/LoopPhaseManager';
export { EarlyUpdatePhase, FixedUpdatePhase, RenderPhase } from './loop/phases';

// Performance module exports
export {
  FPSCounter,
  FrameTimeTracker,
  MemoryMonitor,
  ProfilerMarker,
  PerformanceStats
} from './performance';

export type { GameLoopConfig } from './GameLoop';
export type { PerformanceMetrics, PerformanceStats as PerfStats, PerformanceThresholds } from './PerformanceMonitor';
export type { FrameTimeStats, MemoryStats, ProfilerMeasurement, AggregatedStats } from './performance';
