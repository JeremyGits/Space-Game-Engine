/**
 * Voxel Engine Configuration
 * 
 * Centralized configuration for the hybrid voxel-triangle rendering system.
 * Controls resolution, performance, quality, and optimization settings.
 */

export interface VoxelResolutionConfig {
  /** Maximum voxel resolution (1px = 1 voxel at this resolution) */
  maxResolution: number;
  
  /** Minimum voxel resolution for distant LODs */
  minResolution: number;
  
  /** Default resolution for new voxel objects */
  defaultResolution: number;
  
  /** Enable adaptive resolution based on distance */
  adaptiveResolution: boolean;
}

export interface VoxelPerformanceConfig {
  /** Maximum number of voxels to process per frame */
  maxVoxelsPerFrame: number;
  
  /** Maximum number of octree nodes to traverse per frame */
  maxOctreeTraversalPerFrame: number;
  
  /** Enable GPU acceleration for voxel processing */
  useGPUAcceleration: boolean;
  
  /** Enable async compute for non-blocking voxel operations */
  useAsyncCompute: boolean;
  
  /** Target frame time budget for voxel operations (ms) */
  frameTimeBudget: number;
}

export interface VoxelQualityConfig {
  /** Enable greedy meshing optimization */
  enableGreedyMeshing: boolean;
  
  /** Enable nearest neighbor clustering */
  enableClustering: boolean;
  
  /** Clustering distance threshold */
  clusteringThreshold: number;
  
  /** Enable smooth normal calculation */
  enableSmoothNormals: boolean;
  
  /** Enable ambient occlusion for voxels */
  enableAmbientOcclusion: boolean;
  
  /** AO sample count */
  aoSampleCount: number;
}

export interface VoxelMemoryConfig {
  /** Use sparse octree storage (recommended) */
  useSparseStorage: boolean;
  
  /** Enable voxel data compression */
  enableCompression: boolean;
  
  /** Maximum memory budget for voxel data (MB) */
  maxMemoryBudget: number;
  
  /** Enable voxel streaming for large datasets */
  enableStreaming: boolean;
  
  /** Cache size for frequently accessed voxel data (MB) */
  cacheSize: number;
}

export interface VoxelLODConfig {
  /** Enable automatic LOD system */
  enableLOD: boolean;
  
  /** Number of LOD levels */
  lodLevels: number;
  
  /** Distance thresholds for each LOD level */
  lodDistances: number[];
  
  /** LOD transition smoothness (0-1) */
  lodTransitionSmoothness: number;
  
  /** Use screen-space LOD calculation */
  useScreenSpaceLOD: boolean;
}

export interface VoxelDebugConfig {
  /** Enable debug visualization */
  enableDebug: boolean;
  
  /** Show octree structure */
  showOctree: boolean;
  
  /** Show voxel clusters */
  showClusters: boolean;
  
  /** Show LOD levels with colors */
  showLODLevels: boolean;
  
  /** Show performance metrics */
  showPerformanceMetrics: boolean;
  
  /** Enable wireframe mode */
  enableWireframe: boolean;
}

export interface VoxelConfig {
  resolution: VoxelResolutionConfig;
  performance: VoxelPerformanceConfig;
  quality: VoxelQualityConfig;
  memory: VoxelMemoryConfig;
  lod: VoxelLODConfig;
  debug: VoxelDebugConfig;
}

/**
 * Default voxel configuration - balanced for quality and performance
 */
export const DEFAULT_VOXEL_CONFIG: VoxelConfig = {
  resolution: {
    maxResolution: 1024,      // 1024x1024 = 1px precision
    minResolution: 64,        // 64x64 for distant objects
    defaultResolution: 256,   // 256x256 default
    adaptiveResolution: true
  },
  
  performance: {
    maxVoxelsPerFrame: 100000,           // 100K voxels per frame
    maxOctreeTraversalPerFrame: 50000,   // 50K nodes per frame
    useGPUAcceleration: true,            // Use GPU compute shaders
    useAsyncCompute: true,               // Non-blocking operations
    frameTimeBudget: 8                   // 8ms budget (60 FPS = 16ms total)
  },
  
  quality: {
    enableGreedyMeshing: true,      // Optimize triangle count
    enableClustering: true,         // Group similar voxels
    clusteringThreshold: 2.0,       // 2 voxel units
    enableSmoothNormals: true,      // Smooth shading
    enableAmbientOcclusion: true,   // AO for depth
    aoSampleCount: 16               // 16 AO samples
  },
  
  memory: {
    useSparseStorage: true,         // Sparse octree (90% memory savings)
    enableCompression: true,        // Compress voxel data
    maxMemoryBudget: 512,           // 512MB max
    enableStreaming: true,          // Stream large datasets
    cacheSize: 128                  // 128MB cache
  },
  
  lod: {
    enableLOD: true,
    lodLevels: 5,
    lodDistances: [10, 25, 50, 100, 200], // Distance thresholds
    lodTransitionSmoothness: 0.8,
    useScreenSpaceLOD: true
  },
  
  debug: {
    enableDebug: false,
    showOctree: false,
    showClusters: false,
    showLODLevels: false,
    showPerformanceMetrics: false,
    enableWireframe: false
  }
};

/**
 * High quality preset - maximum visual fidelity
 */
export const HIGH_QUALITY_VOXEL_CONFIG: VoxelConfig = {
  ...DEFAULT_VOXEL_CONFIG,
  resolution: {
    ...DEFAULT_VOXEL_CONFIG.resolution,
    maxResolution: 2048,
    defaultResolution: 512
  },
  quality: {
    ...DEFAULT_VOXEL_CONFIG.quality,
    clusteringThreshold: 1.0,
    aoSampleCount: 32
  },
  lod: {
    ...DEFAULT_VOXEL_CONFIG.lod,
    lodLevels: 7,
    lodDistances: [5, 15, 30, 60, 120, 240, 480]
  }
};

/**
 * Performance preset - optimized for speed
 */
export const PERFORMANCE_VOXEL_CONFIG: VoxelConfig = {
  ...DEFAULT_VOXEL_CONFIG,
  resolution: {
    ...DEFAULT_VOXEL_CONFIG.resolution,
    maxResolution: 512,
    defaultResolution: 128
  },
  performance: {
    ...DEFAULT_VOXEL_CONFIG.performance,
    maxVoxelsPerFrame: 50000,
    frameTimeBudget: 4
  },
  quality: {
    ...DEFAULT_VOXEL_CONFIG.quality,
    clusteringThreshold: 4.0,
    aoSampleCount: 8
  },
  lod: {
    ...DEFAULT_VOXEL_CONFIG.lod,
    lodLevels: 3,
    lodDistances: [20, 50, 100]
  }
};

/**
 * Mobile preset - optimized for mobile devices
 */
export const MOBILE_VOXEL_CONFIG: VoxelConfig = {
  ...DEFAULT_VOXEL_CONFIG,
  resolution: {
    ...DEFAULT_VOXEL_CONFIG.resolution,
    maxResolution: 256,
    defaultResolution: 64
  },
  performance: {
    ...DEFAULT_VOXEL_CONFIG.performance,
    maxVoxelsPerFrame: 25000,
    useAsyncCompute: false,
    frameTimeBudget: 12
  },
  quality: {
    ...DEFAULT_VOXEL_CONFIG.quality,
    enableAmbientOcclusion: false,
    clusteringThreshold: 8.0
  },
  memory: {
    ...DEFAULT_VOXEL_CONFIG.memory,
    maxMemoryBudget: 128,
    cacheSize: 32
  }
};

/**
 * Get configuration preset by name
 */
export function getVoxelConfigPreset(preset: 'default' | 'high' | 'performance' | 'mobile'): VoxelConfig {
  switch (preset) {
    case 'high':
      return HIGH_QUALITY_VOXEL_CONFIG;
    case 'performance':
      return PERFORMANCE_VOXEL_CONFIG;
    case 'mobile':
      return MOBILE_VOXEL_CONFIG;
    default:
      return DEFAULT_VOXEL_CONFIG;
  }
}

/**
 * Validate voxel configuration
 */
export function validateVoxelConfig(config: VoxelConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate resolution
  if (config.resolution.maxResolution < config.resolution.minResolution) {
    errors.push('maxResolution must be >= minResolution');
  }
  
  if (config.resolution.defaultResolution < config.resolution.minResolution ||
      config.resolution.defaultResolution > config.resolution.maxResolution) {
    errors.push('defaultResolution must be between minResolution and maxResolution');
  }
  
  // Validate performance
  if (config.performance.frameTimeBudget <= 0) {
    errors.push('frameTimeBudget must be > 0');
  }
  
  // Validate LOD
  if (config.lod.lodLevels !== config.lod.lodDistances.length) {
    errors.push('lodLevels must match lodDistances array length');
  }
  
  // Validate memory
  if (config.memory.maxMemoryBudget < config.memory.cacheSize) {
    errors.push('maxMemoryBudget must be >= cacheSize');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
