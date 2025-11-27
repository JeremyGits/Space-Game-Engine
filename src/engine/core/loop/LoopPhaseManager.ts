/**
 * LoopPhaseManager
 * 
 * Manages different phases of the game loop with priority-based execution.
 * Supports early update, update, late update, fixed update, and render phases.
 */

import { EventEmitter } from '../EventEmitter';
import {
  ILoopPhaseManager,
  LoopPhase,
  PhaseHandler,
  PhaseCallback,
  PhaseConfig,
  PhaseStats,
  PhaseExecutionResult,
  LoopEventType,
  PHASE_ORDER
} from '../../../types/engine/LoopTypes';

export class LoopPhaseManager implements ILoopPhaseManager {
  private eventEmitter: EventEmitter;
  
  // Phase handlers storage
  private handlers: Map<LoopPhase, PhaseHandler[]> = new Map();
  private handlerIdCounter: number = 0;
  private handlerMap: Map<string, PhaseHandler> = new Map();
  
  // Phase configurations
  private phaseConfigs: Map<LoopPhase, PhaseConfig> = new Map();
  
  // Phase statistics
  private phaseStats: Map<LoopPhase, PhaseStats> = new Map();
  
  // Timing
  private frameStartTime: number = 0;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    this.initializePhases();
  }

  /**
   * Initialize all phases
   */
  private initializePhases(): void {
    PHASE_ORDER.forEach(phase => {
      this.handlers.set(phase, []);
      
      // Default configuration
      this.phaseConfigs.set(phase, {
        enabled: true,
        maxExecutionTime: 16.67, // ~60 FPS
        skipOnSlow: false
      });
      
      // Initialize statistics
      this.phaseStats.set(phase, {
        phase,
        executionTime: 0,
        handlerCount: 0,
        callCount: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity,
        skippedCount: 0
      });
    });
  }

  /**
   * Register a phase handler
   */
  registerHandler(
    phase: LoopPhase,
    callback: PhaseCallback,
    priority: number = 0
  ): string {
    const id = `handler_${++this.handlerIdCounter}`;
    
    const handler: PhaseHandler = {
      id,
      phase,
      callback,
      priority,
      enabled: true
    };
    
    // Add to phase handlers
    const phaseHandlers = this.handlers.get(phase)!;
    phaseHandlers.push(handler);
    
    // Sort by priority (lower number = higher priority)
    phaseHandlers.sort((a, b) => a.priority - b.priority);
    
    // Store in map for quick lookup
    this.handlerMap.set(id, handler);
    
    console.log(`[LoopPhaseManager] Registered handler ${id} for phase ${phase} (priority: ${priority})`);
    
    return id;
  }

  /**
   * Unregister a handler
   */
  unregisterHandler(id: string): void {
    const handler = this.handlerMap.get(id);
    if (!handler) return;
    
    const phaseHandlers = this.handlers.get(handler.phase)!;
    const index = phaseHandlers.findIndex(h => h.id === id);
    
    if (index !== -1) {
      phaseHandlers.splice(index, 1);
    }
    
    this.handlerMap.delete(id);
    console.log(`[LoopPhaseManager] Unregistered handler ${id}`);
  }

  /**
   * Enable a handler
   */
  enableHandler(id: string): void {
    const handler = this.handlerMap.get(id);
    if (handler) {
      handler.enabled = true;
    }
  }

  /**
   * Disable a handler
   */
  disableHandler(id: string): void {
    const handler = this.handlerMap.get(id);
    if (handler) {
      handler.enabled = false;
    }
  }

  /**
   * Execute a specific phase
   */
  executePhase(phase: LoopPhase, deltaTime: number, totalTime: number): PhaseExecutionResult {
    const config = this.phaseConfigs.get(phase)!;
    const stats = this.phaseStats.get(phase)!;
    const result: PhaseExecutionResult = {
      phase,
      executed: false,
      skipped: false,
      executionTime: 0,
      handlerCount: 0,
      errors: []
    };
    
    // Check if phase is enabled
    if (!config.enabled) {
      result.skipped = true;
      stats.skippedCount++;
      return result;
    }
    
    // Check if should skip due to slow frame
    if (config.skipOnSlow) {
      const elapsed = performance.now() - this.frameStartTime;
      if (elapsed > config.maxExecutionTime!) {
        result.skipped = true;
        stats.skippedCount++;
        
        this.eventEmitter.emit(LoopEventType.PHASE_SKIP, {
          phase,
          deltaTime,
          totalTime,
          timestamp: Date.now()
        });
        
        return result;
      }
    }
    
    // Emit phase start
    this.eventEmitter.emit(LoopEventType.PHASE_START, {
      phase,
      deltaTime,
      totalTime,
      timestamp: Date.now()
    });
    
    const startTime = performance.now();
    const handlers = this.handlers.get(phase)!;
    let executedCount = 0;
    
    // Execute all enabled handlers
    for (const handler of handlers) {
      if (!handler.enabled) continue;
      
      try {
        handler.callback(deltaTime, totalTime);
        executedCount++;
        
        // Remove if once
        if (handler.once) {
          this.unregisterHandler(handler.id);
        }
      } catch (error) {
        console.error(`[LoopPhaseManager] Error in handler ${handler.id}:`, error);
        result.errors.push(error as Error);
      }
    }
    
    const executionTime = performance.now() - startTime;
    
    // Update result
    result.executed = true;
    result.executionTime = executionTime;
    result.handlerCount = executedCount;
    
    // Update statistics
    stats.executionTime = executionTime;
    stats.handlerCount = executedCount;
    stats.callCount++;
    stats.averageTime = (stats.averageTime * (stats.callCount - 1) + executionTime) / stats.callCount;
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.minTime = Math.min(stats.minTime, executionTime);
    
    // Check if phase was slow
    if (executionTime > config.maxExecutionTime!) {
      this.eventEmitter.emit(LoopEventType.PHASE_SLOW, {
        phase,
        deltaTime,
        totalTime,
        executionTime,
        timestamp: Date.now()
      });
    }
    
    // Emit phase end
    this.eventEmitter.emit(LoopEventType.PHASE_END, {
      phase,
      deltaTime,
      totalTime,
      executionTime,
      timestamp: Date.now()
    });
    
    return result;
  }

  /**
   * Execute all phases in order
   */
  executeAllPhases(deltaTime: number, totalTime: number): void {
    this.frameStartTime = performance.now();
    
    // Emit frame start
    this.eventEmitter.emit(LoopEventType.FRAME_START, {
      deltaTime,
      totalTime,
      timestamp: Date.now()
    });
    
    // Execute each phase in order
    for (const phase of PHASE_ORDER) {
      this.executePhase(phase, deltaTime, totalTime);
    }
    
    // Emit frame end
    const frameTime = performance.now() - this.frameStartTime;
    this.eventEmitter.emit(LoopEventType.FRAME_END, {
      deltaTime,
      totalTime,
      executionTime: frameTime,
      timestamp: Date.now()
    });
  }

  /**
   * Set phase configuration
   */
  setPhaseConfig(phase: LoopPhase, config: Partial<PhaseConfig>): void {
    const currentConfig = this.phaseConfigs.get(phase)!;
    this.phaseConfigs.set(phase, { ...currentConfig, ...config });
  }

  /**
   * Get phase configuration
   */
  getPhaseConfig(phase: LoopPhase): PhaseConfig {
    return { ...this.phaseConfigs.get(phase)! };
  }

  /**
   * Get phase statistics
   */
  getPhaseStats(phase: LoopPhase): PhaseStats {
    return { ...this.phaseStats.get(phase)! };
  }

  /**
   * Get all statistics
   */
  getAllStats(): Map<LoopPhase, PhaseStats> {
    const stats = new Map<LoopPhase, PhaseStats>();
    this.phaseStats.forEach((value, key) => {
      stats.set(key, { ...value });
    });
    return stats;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.phaseStats.forEach(stats => {
      stats.executionTime = 0;
      stats.callCount = 0;
      stats.averageTime = 0;
      stats.maxTime = 0;
      stats.minTime = Infinity;
      stats.skippedCount = 0;
    });
  }

  /**
   * Enable a phase
   */
  enablePhase(phase: LoopPhase): void {
    const config = this.phaseConfigs.get(phase)!;
    config.enabled = true;
  }

  /**
   * Disable a phase
   */
  disablePhase(phase: LoopPhase): void {
    const config = this.phaseConfigs.get(phase)!;
    config.enabled = false;
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.forEach(handlers => handlers.length = 0);
    this.handlerMap.clear();
    this.handlerIdCounter = 0;
    this.resetStats();
    console.log('[LoopPhaseManager] Cleared all handlers');
  }

  /**
   * Get handler count for a phase
   */
  getHandlerCount(phase: LoopPhase): number {
    return this.handlers.get(phase)?.length || 0;
  }

  /**
   * Get total handler count
   */
  getTotalHandlerCount(): number {
    let total = 0;
    this.handlers.forEach(handlers => total += handlers.length);
    return total;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const totalHandlers = this.getTotalHandlerCount();
    const enabledPhases = Array.from(this.phaseConfigs.entries())
      .filter(([_, config]) => config.enabled)
      .length;
    
    return `LoopPhaseManager | Handlers: ${totalHandlers}, Enabled Phases: ${enabledPhases}/${PHASE_ORDER.length}`;
  }

  /**
   * Get phase summary
   */
  getPhaseSummary(): string {
    const lines: string[] = ['Phase Summary:'];
    
    PHASE_ORDER.forEach(phase => {
      const stats = this.phaseStats.get(phase)!;
      const config = this.phaseConfigs.get(phase)!;
      const handlerCount = this.getHandlerCount(phase);
      
      lines.push(
        `  ${phase}: ${config.enabled ? '✓' : '✗'} | ` +
        `Handlers: ${handlerCount} | ` +
        `Avg: ${stats.averageTime.toFixed(2)}ms | ` +
        `Max: ${stats.maxTime.toFixed(2)}ms | ` +
        `Calls: ${stats.callCount}`
      );
    });
    
    return lines.join('\n');
  }
}
