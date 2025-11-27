/**
 * Engine Lifecycle Type Definitions
 * 
 * Types for managing the engine's lifecycle phases and state transitions.
 */

/**
 * Lifecycle phase enumeration
 */
export enum LifecyclePhase {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  STARTING = 'starting',
  RUNNING = 'running',
  PAUSING = 'pausing',
  PAUSED = 'paused',
  RESUMING = 'resuming',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  SHUTTING_DOWN = 'shutting_down',
  SHUTDOWN = 'shutdown',
  ERROR = 'error'
}

/**
 * Lifecycle phase configuration
 */
export interface LifecyclePhaseConfig {
  name: string;
  timeout?: number;
  retryCount?: number;
  onEnter?: () => Promise<void> | void;
  onExit?: () => Promise<void> | void;
  onError?: (error: Error) => void;
}

/**
 * Lifecycle transition
 */
export interface LifecycleTransition {
  from: LifecyclePhase;
  to: LifecyclePhase;
  timestamp: number;
  duration?: number;
  success: boolean;
  error?: Error;
}

/**
 * Lifecycle event types
 */
export enum LifecycleEventType {
  PHASE_ENTER = 'lifecycle:phase:enter',
  PHASE_EXIT = 'lifecycle:phase:exit',
  PHASE_ERROR = 'lifecycle:phase:error',
  TRANSITION_START = 'lifecycle:transition:start',
  TRANSITION_COMPLETE = 'lifecycle:transition:complete',
  TRANSITION_FAILED = 'lifecycle:transition:failed'
}

/**
 * Lifecycle event data
 */
export interface LifecycleEvent {
  phase: LifecyclePhase;
  previousPhase?: LifecyclePhase;
  timestamp: number;
  error?: Error;
}

/**
 * Initialization phase configuration
 */
export interface InitializationConfig {
  modules: string[];
  systems: string[];
  resources: string[];
  timeout?: number;
  parallel?: boolean;
}

/**
 * Initialization result
 */
export interface InitializationResult {
  success: boolean;
  duration: number;
  modulesInitialized: string[];
  systemsInitialized: string[];
  resourcesLoaded: string[];
  errors: Array<{ component: string; error: Error }>;
}

/**
 * Startup phase configuration
 */
export interface StartupConfig {
  autoStart?: boolean;
  warmupTime?: number;
  preloadAssets?: string[];
}

/**
 * Shutdown phase configuration
 */
export interface ShutdownConfig {
  gracefulTimeout?: number;
  saveState?: boolean;
  cleanupResources?: boolean;
}

/**
 * Pause/Resume configuration
 */
export interface PauseResumeConfig {
  pauseSystems?: string[];
  pauseAudio?: boolean;
  pausePhysics?: boolean;
  pauseRendering?: boolean;
}

/**
 * Lifecycle manager interface
 */
export interface ILifecycleManager {
  getCurrentPhase(): LifecyclePhase;
  transitionTo(phase: LifecyclePhase): Promise<void>;
  canTransitionTo(phase: LifecyclePhase): boolean;
  getTransitionHistory(): LifecycleTransition[];
  initialize(config: InitializationConfig): Promise<InitializationResult>;
  startup(config?: StartupConfig): Promise<void>;
  shutdown(config?: ShutdownConfig): Promise<void>;
  pause(config?: PauseResumeConfig): Promise<void>;
  resume(): Promise<void>;
}

/**
 * Lifecycle statistics
 */
export interface LifecycleStats {
  currentPhase: LifecyclePhase;
  uptime: number;
  totalTransitions: number;
  failedTransitions: number;
  lastTransitionDuration: number;
  phaseHistory: Array<{
    phase: LifecyclePhase;
    duration: number;
    timestamp: number;
  }>;
}
