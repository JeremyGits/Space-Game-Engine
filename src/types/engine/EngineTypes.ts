/**
 * Core Engine Type Definitions
 * 
 * This file contains all the fundamental type definitions for the game engine.
 * These types are used throughout the engine to ensure type safety and consistency.
 */

/**
 * Engine lifecycle states
 */
export enum EngineState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR'
}

/**
 * Engine configuration options
 */
export interface EngineConfig {
  // Core settings
  targetFPS: number;
  fixedTimestep: number;
  maxFrameSkip: number;
  
  // Debug settings
  debug: boolean;
  showStats: boolean;
  logLevel: LogLevel;
  
  // Performance settings
  enableProfiling: boolean;
  maxDeltaTime: number;
  
  // Module settings
  enablePhysics: boolean;
  enableRendering: boolean;
  enableAudio: boolean;
  enableInput: boolean;
}

/**
 * Log levels for engine logging
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5
}

/**
 * Engine module interface
 */
export interface IEngineModule {
  readonly name: string;
  readonly priority: number;
  
  initialize(): Promise<void>;
  start(): void;
  stop(): void;
  update(deltaTime: number): void;
  destroy(): void;
}

/**
 * Engine system interface
 */
export interface IEngineSystem {
  readonly name: string;
  readonly enabled: boolean;
  
  initialize(): void;
  update(deltaTime: number): void;
  fixedUpdate(fixedDeltaTime: number): void;
  lateUpdate(deltaTime: number): void;
  destroy(): void;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  updateTime: number;
  renderTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
}

/**
 * Engine event types
 */
export enum EngineEventType {
  // Lifecycle events
  INITIALIZED = 'engine:initialized',
  STARTED = 'engine:started',
  PAUSED = 'engine:paused',
  RESUMED = 'engine:resumed',
  STOPPED = 'engine:stopped',
  
  // Update events
  PRE_UPDATE = 'engine:pre_update',
  UPDATE = 'engine:update',
  FIXED_UPDATE = 'engine:fixed_update',
  LATE_UPDATE = 'engine:late_update',
  POST_UPDATE = 'engine:post_update',
  
  // Render events
  PRE_RENDER = 'engine:pre_render',
  RENDER = 'engine:render',
  POST_RENDER = 'engine:post_render',
  
  // Error events
  ERROR = 'engine:error',
  WARNING = 'engine:warning'
}

/**
 * Engine event data
 */
export interface EngineEvent<T = any> {
  type: EngineEventType;
  timestamp: number;
  data?: T;
}

/**
 * Engine event listener
 */
export type EngineEventListener<T = any> = (event: EngineEvent<T>) => void;

/**
 * Module registration info
 */
export interface ModuleRegistration {
  module: IEngineModule;
  dependencies: string[];
  initialized: boolean;
}

/**
 * System registration info
 */
export interface SystemRegistration {
  system: IEngineSystem;
  priority: number;
  enabled: boolean;
}

/**
 * Engine statistics
 */
export interface EngineStats {
  uptime: number;
  totalFrames: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  performance: PerformanceMetrics;
}

/**
 * Default engine configuration
 */
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  targetFPS: 60,
  fixedTimestep: 1 / 60, // 60 Hz physics
  maxFrameSkip: 5,
  debug: false,
  showStats: false,
  logLevel: LogLevel.INFO,
  enableProfiling: false,
  maxDeltaTime: 0.1, // 100ms max to prevent spiral of death
  enablePhysics: true,
  enableRendering: true,
  enableAudio: true,
  enableInput: true
};
