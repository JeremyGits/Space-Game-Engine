/**
 * Performance Types
 * 
 * Type definitions for performance monitoring and profiling
 */

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Frames per second */
  fps: number;
  
  /** Frame time (milliseconds) */
  frameTime: number;
  
  /** Update time (milliseconds) */
  updateTime: number;
  
  /** Render time (milliseconds) */
  renderTime: number;
  
  /** Physics time (milliseconds) */
  physicsTime: number;
  
  /** Memory usage (bytes) */
  memoryUsage: number;
  
  /** Draw calls */
  drawCalls: number;
  
  /** Triangles rendered */
  triangles: number;
  
  /** Texture memory (bytes) */
  textureMemory: number;
  
  /** Geometry memory (bytes) */
  geometryMemory: number;
}

/**
 * Performance sample
 */
export interface PerformanceSample {
  /** Timestamp */
  timestamp: number;
  
  /** Metrics at this sample */
  metrics: PerformanceMetrics;
}

/**
 * Performance statistics
 */
export interface PerformanceStatistics {
  /** Average metrics */
  average: PerformanceMetrics;
  
  /** Minimum metrics */
  min: PerformanceMetrics;
  
  /** Maximum metrics */
  max: PerformanceMetrics;
  
  /** Standard deviation */
  stdDev: Partial<PerformanceMetrics>;
  
  /** Number of samples */
  sampleCount: number;
  
  /** Time period (milliseconds) */
  timePeriod: number;
}

/**
 * Profiler marker
 */
export interface ProfilerMarker {
  /** Marker name */
  name: string;
  
  /** Start time (milliseconds) */
  startTime: number;
  
  /** End time (milliseconds) */
  endTime: number;
  
  /** Duration (milliseconds) */
  duration: number;
  
  /** Parent marker */
  parent?: string;
  
  /** Child markers */
  children: string[];
  
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Profiler session
 */
export interface ProfilerSession {
  /** Session ID */
  id: string;
  
  /** Session name */
  name: string;
  
  /** Start time */
  startTime: number;
  
  /** End time */
  endTime?: number;
  
  /** Markers */
  markers: Map<string, ProfilerMarker>;
  
  /** Is active */
  active: boolean;
}

/**
 * Memory snapshot
 */
export interface MemorySnapshot {
  /** Timestamp */
  timestamp: number;
  
  /** Total memory (bytes) */
  totalMemory: number;
  
  /** Used memory (bytes) */
  usedMemory: number;
  
  /** Free memory (bytes) */
  freeMemory: number;
  
  /** Heap size (bytes) */
  heapSize: number;
  
  /** Heap used (bytes) */
  heapUsed: number;
  
  /** External memory (bytes) */
  externalMemory: number;
  
  /** Texture memory (bytes) */
  textureMemory: number;
  
  /** Geometry memory (bytes) */
  geometryMemory: number;
  
  /** Buffer memory (bytes) */
  bufferMemory: number;
}

/**
 * Performance warning
 */
export interface PerformanceWarning {
  /** Warning type */
  type: 'fps' | 'memory' | 'draw-calls' | 'frame-time' | 'custom';
  
  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Message */
  message: string;
  
  /** Timestamp */
  timestamp: number;
  
  /** Current value */
  currentValue: number;
  
  /** Threshold value */
  thresholdValue: number;
  
  /** Suggested action */
  suggestedAction?: string;
}

/**
 * Performance budget
 */
export interface PerformanceBudget {
  /** Target FPS */
  targetFPS: number;
  
  /** Maximum frame time (milliseconds) */
  maxFrameTime: number;
  
  /** Maximum memory (bytes) */
  maxMemory: number;
  
  /** Maximum draw calls */
  maxDrawCalls: number;
  
  /** Maximum triangles */
  maxTriangles: number;
  
  /** Budget warnings */
  warnings: PerformanceWarning[];
}

/**
 * Performance monitor configuration
 */
export interface PerformanceMonitorConfig {
  /** Enable monitoring */
  enabled?: boolean;
  
  /** Sample size for statistics */
  sampleSize?: number;
  
  /** Update interval (milliseconds) */
  updateInterval?: number;
  
  /** Enable profiling */
  profiling?: boolean;
  
  /** Enable memory tracking */
  memoryTracking?: boolean;
  
  /** Performance budget */
  budget?: Partial<PerformanceBudget>;
  
  /** Warning thresholds */
  warningThresholds?: {
    fps?: number;
    frameTime?: number;
    memory?: number;
    drawCalls?: number;
  };
}

/**
 * GPU performance info
 */
export interface GPUPerformanceInfo {
  /** GPU vendor */
  vendor: string;
  
  /** GPU renderer */
  renderer: string;
  
  /** WebGL version */
  webglVersion: string;
  
  /** Maximum texture size */
  maxTextureSize: number;
  
  /** Maximum vertex attributes */
  maxVertexAttributes: number;
  
  /** Maximum varying vectors */
  maxVaryingVectors: number;
  
  /** Maximum fragment uniform vectors */
  maxFragmentUniformVectors: number;
  
  /** Maximum vertex uniform vectors */
  maxVertexUniformVectors: number;
  
  /** Supported extensions */
  extensions: string[];
}

/**
 * System performance info
 */
export interface SystemPerformanceInfo {
  /** CPU cores */
  cpuCores: number;
  
  /** Device memory (GB) */
  deviceMemory?: number;
  
  /** Hardware concurrency */
  hardwareConcurrency: number;
  
  /** Platform */
  platform: string;
  
  /** User agent */
  userAgent: string;
  
  /** GPU info */
  gpu: GPUPerformanceInfo;
}

/**
 * Performance report
 */
export interface PerformanceReport {
  /** Report timestamp */
  timestamp: number;
  
  /** Report duration (milliseconds) */
  duration: number;
  
  /** Current metrics */
  current: PerformanceMetrics;
  
  /** Statistics */
  statistics: PerformanceStatistics;
  
  /** Memory snapshots */
  memorySnapshots: MemorySnapshot[];
  
  /** Warnings */
  warnings: PerformanceWarning[];
  
  /** System info */
  systemInfo: SystemPerformanceInfo;
  
  /** Profiler sessions */
  profilerSessions: ProfilerSession[];
}

/**
 * Default performance monitor configuration
 */
export const DEFAULT_PERFORMANCE_MONITOR_CONFIG: Required<PerformanceMonitorConfig> = {
  enabled: true,
  sampleSize: 60,
  updateInterval: 1000,
  profiling: false,
  memoryTracking: true,
  budget: {
    targetFPS: 60,
    maxFrameTime: 16.67,
    maxMemory: 512 * 1024 * 1024, // 512 MB
    maxDrawCalls: 1000,
    maxTriangles: 1000000,
    warnings: []
  },
  warningThresholds: {
    fps: 30,
    frameTime: 33.33,
    memory: 768 * 1024 * 1024, // 768 MB
    drawCalls: 1500
  }
};
