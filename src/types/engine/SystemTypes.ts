/**
 * System Architecture Type Definitions
 * 
 * Types for the engine's system architecture which processes
 * entities and components each frame.
 */

import { IEngineSystem } from './EngineTypes';

/**
 * System priority levels
 */
export enum SystemPriority {
  CRITICAL = 1000,   // Must run first (e.g., input)
  HIGH = 500,        // Important systems (e.g., physics)
  NORMAL = 0,        // Standard systems (e.g., game logic)
  LOW = -500,        // Can run later (e.g., effects)
  RENDER = -1000     // Rendering (runs last)
}

/**
 * System execution phase
 */
export enum SystemPhase {
  PRE_UPDATE = 'PRE_UPDATE',
  FIXED_UPDATE = 'FIXED_UPDATE',
  UPDATE = 'UPDATE',
  LATE_UPDATE = 'LATE_UPDATE',
  PRE_RENDER = 'PRE_RENDER',
  RENDER = 'RENDER',
  POST_RENDER = 'POST_RENDER'
}

/**
 * System state
 */
export enum SystemState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZED = 'INITIALIZED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR'
}

/**
 * System metadata
 */
export interface SystemMetadata {
  name: string;
  description: string;
  priority: number;
  phase: SystemPhase;
  dependencies: string[];
}

/**
 * System registration
 */
export interface SystemRegistration {
  system: IEngineSystem;
  metadata: SystemMetadata;
  state: SystemState;
  enabled: boolean;
}

/**
 * System configuration
 */
export interface SystemConfig {
  enabled: boolean;
  priority?: number;
  config?: Record<string, any>;
}

/**
 * System events
 */
export enum SystemEventType {
  SYSTEM_REGISTERED = 'system:registered',
  SYSTEM_INITIALIZED = 'system:initialized',
  SYSTEM_ENABLED = 'system:enabled',
  SYSTEM_DISABLED = 'system:disabled',
  SYSTEM_ERROR = 'system:error'
}

/**
 * System event data
 */
export interface SystemEvent {
  systemName: string;
  state: SystemState;
  error?: Error;
}

/**
 * Base system class that all systems should extend
 */
export abstract class BaseSystem implements IEngineSystem {
  abstract readonly name: string;
  public enabled: boolean = true;
  protected state: SystemState = SystemState.UNINITIALIZED;

  /**
   * Initialize the system
   */
  initialize(): void {
    if (this.state !== SystemState.UNINITIALIZED) {
      throw new Error(`System ${this.name} is already initialized`);
    }
    
    this.onInitialize();
    this.state = SystemState.INITIALIZED;
  }

  /**
   * Update the system (variable timestep)
   */
  update(deltaTime: number): void {
    if (!this.enabled || this.state !== SystemState.INITIALIZED) {
      return;
    }
    
    this.onUpdate(deltaTime);
  }

  /**
   * Fixed update (physics timestep)
   */
  fixedUpdate(fixedDeltaTime: number): void {
    if (!this.enabled || this.state !== SystemState.INITIALIZED) {
      return;
    }
    
    this.onFixedUpdate(fixedDeltaTime);
  }

  /**
   * Late update (after all updates)
   */
  lateUpdate(deltaTime: number): void {
    if (!this.enabled || this.state !== SystemState.INITIALIZED) {
      return;
    }
    
    this.onLateUpdate(deltaTime);
  }

  /**
   * Destroy the system
   */
  destroy(): void {
    this.onDestroy();
    this.state = SystemState.UNINITIALIZED;
  }

  /**
   * Override these methods in derived classes
   */
  protected abstract onInitialize(): void;
  protected abstract onUpdate(deltaTime: number): void;
  protected abstract onFixedUpdate(fixedDeltaTime: number): void;
  protected abstract onLateUpdate(deltaTime: number): void;
  protected abstract onDestroy(): void;
}
