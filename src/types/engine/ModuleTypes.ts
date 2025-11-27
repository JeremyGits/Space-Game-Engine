/**
 * Module System Type Definitions
 * 
 * Types for the engine's module system which allows
 * pluggable functionality and dependency management.
 */

import { IEngineModule } from './EngineTypes';

/**
 * Module priority levels
 */
export enum ModulePriority {
  CRITICAL = 1000,  // Core systems (must initialize first)
  HIGH = 500,       // Important systems
  NORMAL = 0,       // Standard systems
  LOW = -500        // Optional systems
}

/**
 * Module state
 */
export enum ModuleState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  INITIALIZED = 'INITIALIZED',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR'
}

/**
 * Module metadata
 */
export interface ModuleMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  dependencies: string[];
  priority: number;
}

/**
 * Module registration
 */
export interface ModuleRegistration {
  module: IEngineModule;
  metadata: ModuleMetadata;
  state: ModuleState;
  error?: Error;
}

/**
 * Module configuration
 */
export interface ModuleConfig {
  enabled: boolean;
  config?: Record<string, any>;
}

/**
 * Module manager events
 */
export enum ModuleEventType {
  MODULE_REGISTERED = 'module:registered',
  MODULE_INITIALIZED = 'module:initialized',
  MODULE_STARTED = 'module:started',
  MODULE_STOPPED = 'module:stopped',
  MODULE_ERROR = 'module:error'
}

/**
 * Module event data
 */
export interface ModuleEvent {
  moduleName: string;
  state: ModuleState;
  error?: Error;
}
