/**
 * GameLoop
 * 
 * Implements a fixed timestep game loop for consistent physics simulation.
 * Uses the accumulator pattern to decouple rendering from physics updates.
 * 
 * Reference: "Fix Your Timestep!" by Glenn Fiedler
 * https://gafferongames.com/post/fix_your_timestep/
 */

import { EventEmitter } from './EventEmitter';
import { EngineEventType } from '../../types/engine/EngineTypes';

export interface GameLoopConfig {
  targetFPS: number;
  fixedTimestep: number;
  maxFrameSkip: number;
  maxDeltaTime: number;
}

export class GameLoop {
  private eventEmitter: EventEmitter;
  private config: GameLoopConfig;
  
  // Timing
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private frameId: number | null = null;
  
  // Performance tracking
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsUpdateTime: number = 0;
  private frameTime: number = 0;
  
  // Callbacks
  private onFixedUpdate?: (fixedDeltaTime: number) => void;
  private onUpdate?: (deltaTime: number) => void;
  private onRender?: (alpha: number) => void;

  constructor(eventEmitter: EventEmitter, config: GameLoopConfig) {
    this.eventEmitter = eventEmitter;
    this.config = config;
  }

  /**
   * Set the fixed update callback (physics, game logic)
   */
  setFixedUpdateCallback(callback: (fixedDeltaTime: number) => void): void {
    this.onFixedUpdate = callback;
  }

  /**
   * Set the variable update callback (input, camera, etc.)
   */
  setUpdateCallback(callback: (deltaTime: number) => void): void {
    this.onUpdate = callback;
  }

  /**
   * Set the render callback
   */
  setRenderCallback(callback: (alpha: number) => void): void {
    this.onRender = callback;
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) {
      console.warn('GameLoop: Already running');
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = this.lastTime;
    
    this.eventEmitter.emit(EngineEventType.STARTED);
    this.loop(this.lastTime);
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    
    this.eventEmitter.emit(EngineEventType.STOPPED);
  }

  /**
   * Pause the game loop
   */
  pause(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    
    this.eventEmitter.emit(EngineEventType.PAUSED);
  }

  /**
   * Resume the game loop
   */
  resume(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    
    this.eventEmitter.emit(EngineEventType.RESUMED);
    this.loop(this.lastTime);
  }

  /**
   * Main game loop
   */
  private loop = (currentTime: number): void => {
    if (!this.isRunning) {
      return;
    }

    // Request next frame
    this.frameId = requestAnimationFrame(this.loop);

    // Calculate delta time (in seconds)
    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Clamp delta time to prevent spiral of death
    if (deltaTime > this.config.maxDeltaTime) {
      deltaTime = this.config.maxDeltaTime;
    }

    // Add to accumulator
    this.accumulator += deltaTime;

    // Fixed timestep updates (physics)
    let updateCount = 0;
    while (this.accumulator >= this.config.fixedTimestep && updateCount < this.config.maxFrameSkip) {
      // Emit pre-update event
      this.eventEmitter.emit(EngineEventType.PRE_UPDATE, {
        deltaTime: this.config.fixedTimestep
      });

      // Fixed update (physics, game logic)
      if (this.onFixedUpdate) {
        this.onFixedUpdate(this.config.fixedTimestep);
      }

      // Emit fixed update event
      this.eventEmitter.emit(EngineEventType.FIXED_UPDATE, {
        deltaTime: this.config.fixedTimestep
      });

      this.accumulator -= this.config.fixedTimestep;
      updateCount++;
    }

    // Variable timestep update (input, camera, etc.)
    if (this.onUpdate) {
      this.onUpdate(deltaTime);
    }

    // Emit update event
    this.eventEmitter.emit(EngineEventType.UPDATE, {
      deltaTime
    });

    // Calculate interpolation alpha for smooth rendering
    const alpha = this.accumulator / this.config.fixedTimestep;

    // Emit pre-render event
    this.eventEmitter.emit(EngineEventType.PRE_RENDER, {
      alpha
    });

    // Render
    if (this.onRender) {
      this.onRender(alpha);
    }

    // Emit render event
    this.eventEmitter.emit(EngineEventType.RENDER, {
      alpha
    });

    // Emit post-render event
    this.eventEmitter.emit(EngineEventType.POST_RENDER);

    // Update FPS counter
    this.updateFPS(currentTime);

    // Store frame time for performance monitoring
    this.frameTime = performance.now() - currentTime;
  };

  /**
   * Update FPS counter
   */
  private updateFPS(currentTime: number): void {
    this.frameCount++;

    // Update FPS every second
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get last frame time in milliseconds
   */
  getFrameTime(): number {
    return this.frameTime;
  }

  /**
   * Get current accumulator value
   */
  getAccumulator(): number {
    return this.accumulator;
  }

  /**
   * Check if the loop is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GameLoopConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<GameLoopConfig> {
    return { ...this.config };
  }
}
