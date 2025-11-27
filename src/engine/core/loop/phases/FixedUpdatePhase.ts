/**
 * FixedUpdatePhase
 * 
 * Handles fixed timestep updates for physics simulation.
 * Uses accumulator pattern to ensure consistent physics updates
 * regardless of frame rate.
 */

import { EventEmitter } from '../../EventEmitter';
import { LoopPhase, FixedUpdateConfig } from '../../../../types/engine/LoopTypes';

export class FixedUpdatePhase {
  private eventEmitter: EventEmitter;
  private enabled: boolean = true;
  
  // Fixed timestep configuration
  private config: FixedUpdateConfig = {
    timestep: 1 / 60,        // 60 Hz physics
    maxSubsteps: 10,         // Maximum substeps per frame
    accumulator: 0           // Time accumulator
  };
  
  // Statistics
  private substepCount: number = 0;
  private totalSubsteps: number = 0;
  private frameCount: number = 0;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Execute fixed update with accumulator
   */
  execute(deltaTime: number, totalTime: number): void {
    if (!this.enabled) return;

    // Add frame time to accumulator
    this.config.accumulator += deltaTime;
    
    let substeps = 0;
    
    // Process fixed timesteps
    while (this.config.accumulator >= this.config.timestep && substeps < this.config.maxSubsteps) {
      // Execute fixed update
      this.executeFixedStep(this.config.timestep, totalTime);
      
      // Subtract timestep from accumulator
      this.config.accumulator -= this.config.timestep;
      substeps++;
    }
    
    // Update statistics
    this.substepCount = substeps;
    this.totalSubsteps += substeps;
    this.frameCount++;
    
    // Warn if max substeps reached
    if (substeps >= this.config.maxSubsteps) {
      console.warn(
        `[FixedUpdatePhase] Max substeps (${this.config.maxSubsteps}) reached. ` +
        `Consider increasing timestep or maxSubsteps.`
      );
      
      // Clamp accumulator to prevent spiral of death
      this.config.accumulator = 0;
    }
    
    this.eventEmitter.emit('phase:fixed_update:complete', {
      deltaTime,
      totalTime,
      substeps,
      accumulator: this.config.accumulator,
      timestamp: Date.now()
    });
  }

  /**
   * Execute a single fixed timestep
   */
  private executeFixedStep(fixedDeltaTime: number, totalTime: number): void {
    // Physics simulation happens here
    // - Update rigid bodies
    // - Resolve collisions
    // - Apply forces
    // - Update transforms
    
    this.eventEmitter.emit('phase:fixed_update:step', {
      deltaTime: fixedDeltaTime,
      totalTime,
      timestamp: Date.now()
    });
  }

  /**
   * Set fixed timestep
   */
  setTimestep(timestep: number): void {
    this.config.timestep = timestep;
    console.log(`[FixedUpdatePhase] Timestep set to ${timestep}s (${1/timestep} Hz)`);
  }

  /**
   * Get fixed timestep
   */
  getTimestep(): number {
    return this.config.timestep;
  }

  /**
   * Set max substeps
   */
  setMaxSubsteps(maxSubsteps: number): void {
    this.config.maxSubsteps = maxSubsteps;
  }

  /**
   * Get max substeps
   */
  getMaxSubsteps(): number {
    return this.config.maxSubsteps;
  }

  /**
   * Get accumulator value
   */
  getAccumulator(): number {
    return this.config.accumulator;
  }

  /**
   * Reset accumulator
   */
  resetAccumulator(): void {
    this.config.accumulator = 0;
  }

  /**
   * Get last substep count
   */
  getLastSubstepCount(): number {
    return this.substepCount;
  }

  /**
   * Get average substeps per frame
   */
  getAverageSubsteps(): number {
    return this.frameCount > 0 ? this.totalSubsteps / this.frameCount : 0;
  }

  /**
   * Get configuration
   */
  getConfig(): FixedUpdateConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<FixedUpdateConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Enable phase
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable phase
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get phase type
   */
  getPhase(): LoopPhase {
    return LoopPhase.FIXED_UPDATE;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.substepCount = 0;
    this.totalSubsteps = 0;
    this.frameCount = 0;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `FixedUpdatePhase | Timestep: ${(this.config.timestep * 1000).toFixed(2)}ms (${(1/this.config.timestep).toFixed(0)} Hz), ` +
           `Accumulator: ${(this.config.accumulator * 1000).toFixed(2)}ms, ` +
           `Last Substeps: ${this.substepCount}, ` +
           `Avg Substeps: ${this.getAverageSubsteps().toFixed(2)}`;
  }
}
