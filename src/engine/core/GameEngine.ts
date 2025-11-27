/**
 * GameEngine
 * 
 * The main game engine class that orchestrates all systems and modules.
 * This is the central hub that manages the game loop, systems, and lifecycle.
 */

import { EventEmitter } from './EventEmitter';
import { GameLoop } from './GameLoop';
import { ModuleManager } from './ModuleManager';
import { SystemManager } from './SystemManager';
import {
  EngineState,
  EngineConfig,
  EngineEventType,
  IEngineModule,
  IEngineSystem,
  EngineStats,
  PerformanceMetrics,
  DEFAULT_ENGINE_CONFIG
} from '../../types/engine/EngineTypes';
import { ModuleMetadata } from '../../types/engine/ModuleTypes';
import { SystemMetadata, SystemPhase } from '../../types/engine/SystemTypes';

export class GameEngine {
  // Core components
  private eventEmitter: EventEmitter;
  private gameLoop: GameLoop;
  private moduleManager: ModuleManager;
  private systemManager: SystemManager;
  private config: EngineConfig;
  
  // State
  private state: EngineState = EngineState.UNINITIALIZED;
  private startTime: number = 0;
  private totalFrames: number = 0;
  
  // Performance tracking
  private performanceMetrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    updateTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0
  };

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this.eventEmitter = new EventEmitter();
    this.moduleManager = new ModuleManager(this.eventEmitter);
    this.systemManager = new SystemManager(this.eventEmitter);
    this.gameLoop = new GameLoop(this.eventEmitter, {
      targetFPS: this.config.targetFPS,
      fixedTimestep: this.config.fixedTimestep,
      maxFrameSkip: this.config.maxFrameSkip,
      maxDeltaTime: this.config.maxDeltaTime
    });

    this.setupGameLoopCallbacks();
    this.log('GameEngine created', 'info');
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    if (this.state !== EngineState.UNINITIALIZED) {
      throw new Error(`Cannot initialize engine from state: ${this.state}`);
    }

    this.setState(EngineState.INITIALIZING);
    this.log('Initializing engine...', 'info');

    try {
      // Initialize modules
      await this.moduleManager.initializeAll();
      
      // Initialize systems
      this.systemManager.initializeAll();
      
      this.setState(EngineState.READY);
      this.eventEmitter.emit(EngineEventType.INITIALIZED);
      this.log('Engine initialized successfully', 'info');
    } catch (error) {
      this.setState(EngineState.ERROR);
      this.log(`Engine initialization failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Start the engine
   */
  start(): void {
    if (this.state !== EngineState.READY && this.state !== EngineState.STOPPED) {
      throw new Error(`Cannot start engine from state: ${this.state}`);
    }

    this.log('Starting engine...', 'info');
    this.setState(EngineState.RUNNING);
    this.startTime = performance.now();
    this.totalFrames = 0;

    // Start all modules
    this.moduleManager.startAll();

    // Start game loop
    this.gameLoop.start();
    this.log('Engine started', 'info');
  }

  /**
   * Pause the engine
   */
  pause(): void {
    if (this.state !== EngineState.RUNNING) {
      throw new Error(`Cannot pause engine from state: ${this.state}`);
    }

    this.log('Pausing engine...', 'info');
    this.setState(EngineState.PAUSED);
    this.gameLoop.pause();
    this.log('Engine paused', 'info');
  }

  /**
   * Resume the engine
   */
  resume(): void {
    if (this.state !== EngineState.PAUSED) {
      throw new Error(`Cannot resume engine from state: ${this.state}`);
    }

    this.log('Resuming engine...', 'info');
    this.setState(EngineState.RUNNING);
    this.gameLoop.resume();
    this.log('Engine resumed', 'info');
  }

  /**
   * Stop the engine
   */
  stop(): void {
    if (this.state !== EngineState.RUNNING && this.state !== EngineState.PAUSED) {
      throw new Error(`Cannot stop engine from state: ${this.state}`);
    }

    this.log('Stopping engine...', 'info');
    this.setState(EngineState.STOPPING);

    // Stop game loop
    this.gameLoop.stop();

    // Stop all modules
    this.moduleManager.stopAll();

    this.setState(EngineState.STOPPED);
    this.log('Engine stopped', 'info');
  }

  /**
   * Destroy the engine and clean up resources
   */
  destroy(): void {
    this.log('Destroying engine...', 'info');

    if (this.state === EngineState.RUNNING || this.state === EngineState.PAUSED) {
      this.stop();
    }

    // Destroy all systems
    this.systemManager.destroyAll();

    // Destroy all modules
    this.moduleManager.destroyAll();

    // Clear event emitter
    this.eventEmitter.clear();

    this.log('Engine destroyed', 'info');
  }

  /**
   * Register a module
   */
  registerModule(module: IEngineModule, metadata?: Partial<ModuleMetadata>): void {
    this.moduleManager.register(module, metadata);
    this.log(`Module registered: ${module.name}`, 'debug');
  }

  /**
   * Get a module
   */
  getModule<T extends IEngineModule>(moduleName: string): T | null {
    return this.moduleManager.getModule<T>(moduleName);
  }

  /**
   * Register a system
   */
  registerSystem(system: IEngineSystem, metadata?: Partial<SystemMetadata>): void {
    this.systemManager.register(system, metadata);
    this.log(`System registered: ${system.name}`, 'debug');
  }

  /**
   * Get a system
   */
  getSystem<T extends IEngineSystem>(systemName: string): T | null {
    return this.systemManager.getSystem<T>(systemName);
  }

  /**
   * Enable a system
   */
  enableSystem(systemName: string): void {
    this.systemManager.enableSystem(systemName);
  }

  /**
   * Disable a system
   */
  disableSystem(systemName: string): void {
    this.systemManager.disableSystem(systemName);
  }

  /**
   * Get the event emitter
   */
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  /**
   * Get current engine state
   */
  getState(): EngineState {
    return this.state;
  }

  /**
   * Get engine configuration
   */
  getConfig(): Readonly<EngineConfig> {
    return { ...this.config };
  }

  /**
   * Update engine configuration
   */
  updateConfig(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update game loop config if relevant properties changed
    this.gameLoop.updateConfig({
      targetFPS: this.config.targetFPS,
      fixedTimestep: this.config.fixedTimestep,
      maxFrameSkip: this.config.maxFrameSkip,
      maxDeltaTime: this.config.maxDeltaTime
    });

    this.log('Engine configuration updated', 'debug');
  }

  /**
   * Get engine statistics
   */
  getStats(): EngineStats {
    const uptime = this.state === EngineState.RUNNING 
      ? (performance.now() - this.startTime) / 1000 
      : 0;

    return {
      uptime,
      totalFrames: this.totalFrames,
      averageFPS: uptime > 0 ? this.totalFrames / uptime : 0,
      minFPS: 0, // TODO: Track min/max FPS
      maxFPS: 0,
      performance: this.performanceMetrics
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Setup game loop callbacks
   */
  private setupGameLoopCallbacks(): void {
    // Fixed update (physics, game logic)
    this.gameLoop.setFixedUpdateCallback((deltaTime: number) => {
      this.systemManager.updatePhase(SystemPhase.FIXED_UPDATE, deltaTime);
      this.moduleManager.updateAll(deltaTime);
    });

    // Variable update (input, camera, etc.)
    this.gameLoop.setUpdateCallback((deltaTime: number) => {
      const updateStart = performance.now();

      // Pre-update phase
      this.systemManager.updatePhase(SystemPhase.PRE_UPDATE, deltaTime);
      
      // Update phase
      this.systemManager.updatePhase(SystemPhase.UPDATE, deltaTime);
      
      // Late update phase
      this.systemManager.updatePhase(SystemPhase.LATE_UPDATE, deltaTime);

      this.performanceMetrics.updateTime = performance.now() - updateStart;
    });

    // Render
    this.gameLoop.setRenderCallback((alpha: number) => {
      const renderStart = performance.now();
      
      // Pre-render phase
      this.systemManager.updatePhase(SystemPhase.PRE_RENDER, alpha);
      
      // Render phase
      this.systemManager.updatePhase(SystemPhase.RENDER, alpha);
      
      // Emit render event for rendering systems
      this.eventEmitter.emit(EngineEventType.RENDER, { alpha });
      
      // Post-render phase
      this.systemManager.updatePhase(SystemPhase.POST_RENDER, alpha);
      
      this.performanceMetrics.renderTime = performance.now() - renderStart;
      this.performanceMetrics.fps = this.gameLoop.getFPS();
      this.performanceMetrics.frameTime = this.gameLoop.getFrameTime();
      
      this.totalFrames++;
    });
  }

  /**
   * Set engine state
   */
  private setState(newState: EngineState): void {
    const oldState = this.state;
    this.state = newState;
    this.log(`State changed: ${oldState} -> ${newState}`, 'debug');
  }

  /**
   * Log a message
   */
  private log(message: string, level: 'error' | 'warn' | 'info' | 'debug' = 'info'): void {
    if (!this.config.debug && level === 'debug') {
      return;
    }

    const prefix = '[GameEngine]';
    switch (level) {
      case 'error':
        console.error(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      case 'info':
        console.info(prefix, message);
        break;
      case 'debug':
        console.debug(prefix, message);
        break;
    }
  }
}
