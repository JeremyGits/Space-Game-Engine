/**
 * Timing Types
 * 
 * Type definitions for game loop timing and frame management
 */

/**
 * Frame timing information
 */
export interface FrameTiming {
  /** Current frame number */
  frameNumber: number;
  
  /** Time elapsed since last frame (seconds) */
  deltaTime: number;
  
  /** Total time elapsed since start (seconds) */
  elapsedTime: number;
  
  /** Current timestamp (milliseconds) */
  timestamp: number;
  
  /** Previous frame timestamp (milliseconds) */
  previousTimestamp: number;
  
  /** Target frame duration (seconds) */
  targetFrameDuration: number;
  
  /** Actual frame duration (seconds) */
  actualFrameDuration: number;
  
  /** Frame time alpha (for interpolation) */
  alpha: number;
}

/**
 * Fixed timestep accumulator
 */
export interface FixedTimestepAccumulator {
  /** Accumulated time (seconds) */
  accumulator: number;
  
  /** Fixed timestep duration (seconds) */
  fixedDeltaTime: number;
  
  /** Number of fixed updates this frame */
  fixedUpdateCount: number;
  
  /** Maximum fixed updates per frame */
  maxFixedUpdates: number;
}

/**
 * Frame rate statistics
 */
export interface FrameRateStats {
  /** Current FPS */
  fps: number;
  
  /** Average FPS over sample period */
  averageFPS: number;
  
  /** Minimum FPS in sample period */
  minFPS: number;
  
  /** Maximum FPS in sample period */
  maxFPS: number;
  
  /** Frame time (milliseconds) */
  frameTime: number;
  
  /** Average frame time (milliseconds) */
  averageFrameTime: number;
  
  /** Frame time variance */
  frameTimeVariance: number;
  
  /** Number of frames in sample */
  sampleSize: number;
}

/**
 * Time scale configuration
 */
export interface TimeScale {
  /** Global time scale multiplier */
  scale: number;
  
  /** Minimum time scale */
  minScale: number;
  
  /** Maximum time scale */
  maxScale: number;
  
  /** Is time paused */
  paused: boolean;
}

/**
 * Delta time smoothing
 */
export interface DeltaTimeSmoothing {
  /** Enable smoothing */
  enabled: boolean;
  
  /** Smoothing factor (0-1) */
  factor: number;
  
  /** Maximum delta time (seconds) */
  maxDelta: number;
  
  /** Minimum delta time (seconds) */
  minDelta: number;
}

/**
 * Frame budget tracking
 */
export interface FrameBudget {
  /** Total frame budget (milliseconds) */
  totalBudget: number;
  
  /** Time spent in update (milliseconds) */
  updateTime: number;
  
  /** Time spent in render (milliseconds) */
  renderTime: number;
  
  /** Time spent in physics (milliseconds) */
  physicsTime: number;
  
  /** Remaining budget (milliseconds) */
  remainingBudget: number;
  
  /** Is over budget */
  overBudget: boolean;
}

/**
 * Timing configuration
 */
export interface TimingConfig {
  /** Target FPS */
  targetFPS?: number;
  
  /** Fixed timestep (seconds) */
  fixedTimestep?: number;
  
  /** Maximum delta time (seconds) */
  maxDeltaTime?: number;
  
  /** Enable delta time smoothing */
  smoothDeltaTime?: boolean;
  
  /** Delta time smoothing factor */
  smoothingFactor?: number;
  
  /** Enable time scaling */
  enableTimeScale?: boolean;
  
  /** Initial time scale */
  initialTimeScale?: number;
}

/**
 * Default timing configuration
 */
export const DEFAULT_TIMING_CONFIG: Required<TimingConfig> = {
  targetFPS: 60,
  fixedTimestep: 1 / 60,
  maxDeltaTime: 0.1,
  smoothDeltaTime: true,
  smoothingFactor: 0.1,
  enableTimeScale: true,
  initialTimeScale: 1.0
};
