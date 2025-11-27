/**
 * RenderPhase
 * 
 * Handles rendering logic including scene rendering,
 * post-processing, and visual effects.
 */

import { EventEmitter } from '../../EventEmitter';
import { LoopPhase } from '../../../../types/engine/LoopTypes';

export class RenderPhase {
  private eventEmitter: EventEmitter;
  private enabled: boolean = true;
  
  // Render statistics
  private drawCalls: number = 0;
  private triangles: number = 0;
  private renderTime: number = 0;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Execute render phase
   */
  execute(deltaTime: number, totalTime: number): void {
    if (!this.enabled) return;

    const startTime = performance.now();

    // Rendering happens here
    // - Clear buffers
    // - Render scene
    // - Apply post-processing
    // - Render UI
    // - Present frame
    
    this.renderTime = performance.now() - startTime;
    
    this.eventEmitter.emit('phase:render', {
      deltaTime,
      totalTime,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
      renderTime: this.renderTime,
      timestamp: Date.now()
    });
  }

  /**
   * Update render statistics
   */
  updateStats(drawCalls: number, triangles: number): void {
    this.drawCalls = drawCalls;
    this.triangles = triangles;
  }

  /**
   * Get draw calls
   */
  getDrawCalls(): number {
    return this.drawCalls;
  }

  /**
   * Get triangle count
   */
  getTriangles(): number {
    return this.triangles;
  }

  /**
   * Get last render time
   */
  getRenderTime(): number {
    return this.renderTime;
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
    return LoopPhase.RENDER;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `RenderPhase | Draw Calls: ${this.drawCalls}, Triangles: ${this.triangles}, Time: ${this.renderTime.toFixed(2)}ms`;
  }
}
