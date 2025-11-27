/**
 * LifecycleManager
 * 
 * Manages the engine's lifecycle phases and state transitions.
 * Ensures proper initialization, startup, shutdown, and pause/resume sequences.
 */

import { EventEmitter } from '../EventEmitter';
import {
  ILifecycleManager,
  LifecyclePhase,
  LifecycleTransition,
  LifecycleEventType,
  InitializationConfig,
  InitializationResult,
  StartupConfig,
  ShutdownConfig,
  PauseResumeConfig,
  LifecycleStats
} from '../../../types/engine/LifecycleTypes';

export class LifecycleManager implements ILifecycleManager {
  private eventEmitter: EventEmitter;
  private currentPhase: LifecyclePhase = LifecyclePhase.UNINITIALIZED;
  private transitionHistory: LifecycleTransition[] = [];
  private startTime: number = 0;
  
  // Valid transitions map
  private validTransitions: Map<LifecyclePhase, LifecyclePhase[]> = new Map([
    [LifecyclePhase.UNINITIALIZED, [LifecyclePhase.INITIALIZING]],
    [LifecyclePhase.INITIALIZING, [LifecyclePhase.INITIALIZED, LifecyclePhase.ERROR]],
    [LifecyclePhase.INITIALIZED, [LifecyclePhase.STARTING, LifecyclePhase.SHUTTING_DOWN]],
    [LifecyclePhase.STARTING, [LifecyclePhase.RUNNING, LifecyclePhase.ERROR]],
    [LifecyclePhase.RUNNING, [LifecyclePhase.PAUSING, LifecyclePhase.STOPPING]],
    [LifecyclePhase.PAUSING, [LifecyclePhase.PAUSED, LifecyclePhase.ERROR]],
    [LifecyclePhase.PAUSED, [LifecyclePhase.RESUMING, LifecyclePhase.STOPPING]],
    [LifecyclePhase.RESUMING, [LifecyclePhase.RUNNING, LifecyclePhase.ERROR]],
    [LifecyclePhase.STOPPING, [LifecyclePhase.STOPPED, LifecyclePhase.ERROR]],
    [LifecyclePhase.STOPPED, [LifecyclePhase.STARTING, LifecyclePhase.SHUTTING_DOWN]],
    [LifecyclePhase.SHUTTING_DOWN, [LifecyclePhase.SHUTDOWN]],
    [LifecyclePhase.ERROR, [LifecyclePhase.SHUTTING_DOWN, LifecyclePhase.INITIALIZING]]
  ]);

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    this.startTime = Date.now();
  }

  /**
   * Get current lifecycle phase
   */
  getCurrentPhase(): LifecyclePhase {
    return this.currentPhase;
  }

  /**
   * Check if can transition to a phase
   */
  canTransitionTo(phase: LifecyclePhase): boolean {
    const validNextPhases = this.validTransitions.get(this.currentPhase);
    return validNextPhases ? validNextPhases.includes(phase) : false;
  }

  /**
   * Transition to a new phase
   */
  async transitionTo(phase: LifecyclePhase): Promise<void> {
    if (!this.canTransitionTo(phase)) {
      throw new Error(
        `Invalid transition from ${this.currentPhase} to ${phase}`
      );
    }

    const previousPhase = this.currentPhase;
    const transitionStart = Date.now();

    try {
      // Emit transition start
      this.eventEmitter.emit(LifecycleEventType.TRANSITION_START, {
        phase,
        previousPhase,
        timestamp: transitionStart
      });

      // Exit current phase
      await this.exitPhase(previousPhase);

      // Update phase
      this.currentPhase = phase;

      // Enter new phase
      await this.enterPhase(phase);

      // Record transition
      const transition: LifecycleTransition = {
        from: previousPhase,
        to: phase,
        timestamp: transitionStart,
        duration: Date.now() - transitionStart,
        success: true
      };
      this.transitionHistory.push(transition);

      // Emit transition complete
      this.eventEmitter.emit(LifecycleEventType.TRANSITION_COMPLETE, {
        phase,
        previousPhase,
        timestamp: Date.now()
      });

      console.log(
        `[LifecycleManager] Transitioned from ${previousPhase} to ${phase} (${transition.duration}ms)`
      );
    } catch (error) {
      // Record failed transition
      const transition: LifecycleTransition = {
        from: previousPhase,
        to: phase,
        timestamp: transitionStart,
        duration: Date.now() - transitionStart,
        success: false,
        error: error as Error
      };
      this.transitionHistory.push(transition);

      // Emit transition failed
      this.eventEmitter.emit(LifecycleEventType.TRANSITION_FAILED, {
        phase,
        previousPhase,
        timestamp: Date.now(),
        error: error as Error
      });

      console.error(
        `[LifecycleManager] Failed to transition from ${previousPhase} to ${phase}:`,
        error
      );

      // Transition to error state
      this.currentPhase = LifecyclePhase.ERROR;
      throw error;
    }
  }

  /**
   * Initialize the engine
   */
  async initialize(config: InitializationConfig): Promise<InitializationResult> {
    await this.transitionTo(LifecyclePhase.INITIALIZING);

    const startTime = Date.now();
    const result: InitializationResult = {
      success: true,
      duration: 0,
      modulesInitialized: [],
      systemsInitialized: [],
      resourcesLoaded: [],
      errors: []
    };

    try {
      // Initialize modules
      console.log('[LifecycleManager] Initializing modules...');
      for (const module of config.modules) {
        try {
          // Module initialization would happen here
          result.modulesInitialized.push(module);
          console.log(`[LifecycleManager] Initialized module: ${module}`);
        } catch (error) {
          result.errors.push({ component: module, error: error as Error });
          console.error(`[LifecycleManager] Failed to initialize module ${module}:`, error);
        }
      }

      // Initialize systems
      console.log('[LifecycleManager] Initializing systems...');
      for (const system of config.systems) {
        try {
          // System initialization would happen here
          result.systemsInitialized.push(system);
          console.log(`[LifecycleManager] Initialized system: ${system}`);
        } catch (error) {
          result.errors.push({ component: system, error: error as Error });
          console.error(`[LifecycleManager] Failed to initialize system ${system}:`, error);
        }
      }

      // Load resources
      console.log('[LifecycleManager] Loading resources...');
      for (const resource of config.resources) {
        try {
          // Resource loading would happen here
          result.resourcesLoaded.push(resource);
          console.log(`[LifecycleManager] Loaded resource: ${resource}`);
        } catch (error) {
          result.errors.push({ component: resource, error: error as Error });
          console.error(`[LifecycleManager] Failed to load resource ${resource}:`, error);
        }
      }

      result.duration = Date.now() - startTime;
      result.success = result.errors.length === 0;

      if (result.success) {
        await this.transitionTo(LifecyclePhase.INITIALIZED);
        console.log(`[LifecycleManager] Initialization complete (${result.duration}ms)`);
      } else {
        console.warn(
          `[LifecycleManager] Initialization completed with ${result.errors.length} errors`
        );
      }

      return result;
    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      result.errors.push({ component: 'initialization', error: error as Error });
      throw error;
    }
  }

  /**
   * Start the engine
   */
  async startup(config: StartupConfig = {}): Promise<void> {
    await this.transitionTo(LifecyclePhase.STARTING);

    try {
      // Warmup period
      if (config.warmupTime && config.warmupTime > 0) {
        console.log(`[LifecycleManager] Warming up for ${config.warmupTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, config.warmupTime));
      }

      // Preload assets
      if (config.preloadAssets && config.preloadAssets.length > 0) {
        console.log('[LifecycleManager] Preloading assets...');
        // Asset preloading would happen here
      }

      await this.transitionTo(LifecyclePhase.RUNNING);
      console.log('[LifecycleManager] Engine started successfully');
    } catch (error) {
      console.error('[LifecycleManager] Startup failed:', error);
      throw error;
    }
  }

  /**
   * Shutdown the engine
   */
  async shutdown(config: ShutdownConfig = {}): Promise<void> {
    await this.transitionTo(LifecyclePhase.SHUTTING_DOWN);

    try {
      // Save state
      if (config.saveState) {
        console.log('[LifecycleManager] Saving state...');
        // State saving would happen here
      }

      // Cleanup resources
      if (config.cleanupResources) {
        console.log('[LifecycleManager] Cleaning up resources...');
        // Resource cleanup would happen here
      }

      await this.transitionTo(LifecyclePhase.SHUTDOWN);
      console.log('[LifecycleManager] Engine shutdown complete');
    } catch (error) {
      console.error('[LifecycleManager] Shutdown failed:', error);
      throw error;
    }
  }

  /**
   * Pause the engine
   */
  async pause(config: PauseResumeConfig = {}): Promise<void> {
    await this.transitionTo(LifecyclePhase.PAUSING);

    try {
      // Pause systems
      if (config.pauseSystems) {
        console.log('[LifecycleManager] Pausing systems...');
        // System pausing would happen here
      }

      await this.transitionTo(LifecyclePhase.PAUSED);
      console.log('[LifecycleManager] Engine paused');
    } catch (error) {
      console.error('[LifecycleManager] Pause failed:', error);
      throw error;
    }
  }

  /**
   * Resume the engine
   */
  async resume(): Promise<void> {
    await this.transitionTo(LifecyclePhase.RESUMING);

    try {
      // Resume systems
      console.log('[LifecycleManager] Resuming systems...');
      // System resuming would happen here

      await this.transitionTo(LifecyclePhase.RUNNING);
      console.log('[LifecycleManager] Engine resumed');
    } catch (error) {
      console.error('[LifecycleManager] Resume failed:', error);
      throw error;
    }
  }

  /**
   * Get transition history
   */
  getTransitionHistory(): LifecycleTransition[] {
    return [...this.transitionHistory];
  }

  /**
   * Get lifecycle statistics
   */
  getStats(): LifecycleStats {
    const uptime = Date.now() - this.startTime;
    const phaseHistory = this.transitionHistory.map(t => ({
      phase: t.to,
      duration: t.duration || 0,
      timestamp: t.timestamp
    }));

    return {
      currentPhase: this.currentPhase,
      uptime,
      totalTransitions: this.transitionHistory.length,
      failedTransitions: this.transitionHistory.filter(t => !t.success).length,
      lastTransitionDuration: this.transitionHistory.length > 0
        ? this.transitionHistory[this.transitionHistory.length - 1].duration || 0
        : 0,
      phaseHistory
    };
  }

  /**
   * Enter a phase
   */
  private async enterPhase(phase: LifecyclePhase): Promise<void> {
    this.eventEmitter.emit(LifecycleEventType.PHASE_ENTER, {
      phase,
      timestamp: Date.now()
    });
  }

  /**
   * Exit a phase
   */
  private async exitPhase(phase: LifecyclePhase): Promise<void> {
    this.eventEmitter.emit(LifecycleEventType.PHASE_EXIT, {
      phase,
      timestamp: Date.now()
    });
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `LifecycleManager | Phase: ${this.currentPhase}, Uptime: ${(stats.uptime / 1000).toFixed(2)}s, Transitions: ${stats.totalTransitions}, Failed: ${stats.failedTransitions}`;
  }
}
