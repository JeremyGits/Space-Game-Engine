/**
 * Game Loop Phase Type Definitions
 * 
 * Types for managing different phases of the game loop including
 * early update, update, late update, fixed update, and render phases.
 */

/**
 * Loop phase enumeration
 */
export enum LoopPhase {
  PRE_UPDATE = 'pre_update',           // Before main update
  EARLY_UPDATE = 'early_update',       // Input processing, early logic
  UPDATE = 'update',                   // Main game logic
  LATE_UPDATE = 'late_update',         // Camera, animations
  FIXED_UPDATE = 'fixed_update',       // Physics (fixed timestep)
  PRE_RENDER = 'pre_render',           // Prepare for rendering
  RENDER = 'render',                   // Rendering
  POST_RENDER = 'post_render',         // After rendering
  POST_UPDATE = 'post_update'          // Cleanup, stats
}

/**
 * Phase execution order
 */
export const PHASE_ORDER: LoopPhase[] = [
  LoopPhase.PRE_UPDATE,
  LoopPhase.EARLY_UPDATE,
  LoopPhase.UPDATE,
  LoopPhase.LATE_UPDATE,
  LoopPhase.FIXED_UPDATE,
  LoopPhase.PRE_RENDER,
  LoopPhase.RENDER,
  LoopPhase.POST_RENDER,
  LoopPhase.POST_UPDATE
];

/**
 * Phase callback function
 */
export type PhaseCallback = (deltaTime: number, totalTime: number) => void;

/**
 * Phase handler
 */
export interface PhaseHandler {
  id: string;
  phase: LoopPhase;
  callback: PhaseCallback;
  priority: number;
  enabled: boolean;
  once?: boolean;
}

/**
 * Phase configuration
 */
export interface PhaseConfig {
  enabled: boolean;
  maxExecutionTime?: number;  // Max time in ms
  skipOnSlow?: boolean;        // Skip if previous phases took too long
}

/**
 * Phase statistics
 */
export interface PhaseStats {
  phase: LoopPhase;
  executionTime: number;
  handlerCount: number;
  callCount: number;
  averageTime: number;
  maxTime: number;
  minTime: number;
  skippedCount: number;
}

/**
 * Loop phase manager interface
 */
export interface ILoopPhaseManager {
  // Handler management
  registerHandler(phase: LoopPhase, callback: PhaseCallback, priority?: number): string;
  unregisterHandler(id: string): void;
  enableHandler(id: string): void;
  disableHandler(id: string): void;
  
  // Phase execution
  executePhase(phase: LoopPhase, deltaTime: number, totalTime: number): void;
  executeAllPhases(deltaTime: number, totalTime: number): void;
  
  // Configuration
  setPhaseConfig(phase: LoopPhase, config: Partial<PhaseConfig>): void;
  getPhaseConfig(phase: LoopPhase): PhaseConfig;
  
  // Statistics
  getPhaseStats(phase: LoopPhase): PhaseStats;
  getAllStats(): Map<LoopPhase, PhaseStats>;
  resetStats(): void;
  
  // Control
  enablePhase(phase: LoopPhase): void;
  disablePhase(phase: LoopPhase): void;
  clear(): void;
}

/**
 * Fixed update configuration
 */
export interface FixedUpdateConfig {
  timestep: number;           // Fixed timestep in seconds (e.g., 1/60)
  maxSubsteps: number;        // Maximum substeps per frame
  accumulator: number;        // Time accumulator
}

/**
 * Loop timing information
 */
export interface LoopTiming {
  deltaTime: number;          // Frame delta time
  totalTime: number;          // Total elapsed time
  frameCount: number;         // Total frames
  fps: number;                // Current FPS
  targetFPS: number;          // Target FPS
  fixedDeltaTime: number;     // Fixed timestep
}

/**
 * Loop events
 */
export enum LoopEventType {
  PHASE_START = 'loop:phase:start',
  PHASE_END = 'loop:phase:end',
  PHASE_SKIP = 'loop:phase:skip',
  PHASE_SLOW = 'loop:phase:slow',
  FRAME_START = 'loop:frame:start',
  FRAME_END = 'loop:frame:end'
}

/**
 * Loop event data
 */
export interface LoopEvent {
  phase?: LoopPhase;
  deltaTime: number;
  totalTime: number;
  executionTime?: number;
  timestamp: number;
}

/**
 * Phase execution result
 */
export interface PhaseExecutionResult {
  phase: LoopPhase;
  executed: boolean;
  skipped: boolean;
  executionTime: number;
  handlerCount: number;
  errors: Error[];
}
