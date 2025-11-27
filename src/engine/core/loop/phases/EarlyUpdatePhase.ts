/**
 * EarlyUpdatePhase
 * 
 * Handles early update logic including input processing and
 * preparation for the main update phase.
 */

import { EventEmitter } from '../../EventEmitter';
import { LoopPhase } from '../../../../types/engine/LoopTypes';

export class EarlyUpdatePhase {
  private eventEmitter: EventEmitter;
  private enabled: boolean = true;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Execute early update
   */
  execute(deltaTime: number, totalTime: number): void {
    if (!this.enabled) return;

    // Input processing happens here
    // - Poll input devices
    // - Update input state
    // - Process input events
    
    // Early game logic
    // - State preparation
    // - Event queue processing
    
    this.eventEmitter.emit('phase:early_update', {
      deltaTime,
      totalTime,
      timestamp: Date.now()
    });
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
    return LoopPhase.EARLY_UPDATE;
  }
}
