/**
 * SystemScheduler
 * 
 * Schedules and executes systems in the correct order based on priority and phase.
 * Handles parallel execution where possible and manages system dependencies.
 */

import { System, SystemPhase } from './System';
import { EventEmitter } from '../EventEmitter';

/**
 * Scheduler configuration
 */
export interface SystemSchedulerConfig {
  enableParallelExecution?: boolean;
  maxParallelSystems?: number;
  enableProfiling?: boolean;
}

/**
 * System execution statistics
 */
export interface SystemExecutionStats {
  systemName: string;
  phase: SystemPhase;
  executionTime: number;
  callCount: number;
}

export class SystemScheduler {
  private config: Required<SystemSchedulerConfig>;
  
  // System groups organized by phase
  private systemGroups: Map<SystemPhase, System[]> = new Map();
  
  // Execution order cache
  private executionOrderCache: Map<SystemPhase, System[]> = new Map();
  private cacheValid: boolean = false;
  
  // Statistics
  private executionStats: Map<string, SystemExecutionStats> = new Map();
  private frameStats = {
    totalSystems: 0,
    enabledSystems: 0,
    totalExecutionTime: 0,
    longestSystem: { name: '', time: 0 }
  };

  constructor(_eventEmitter: EventEmitter, config: SystemSchedulerConfig = {}) {
    this.config = {
      enableParallelExecution: config.enableParallelExecution || false,
      maxParallelSystems: config.maxParallelSystems || 4,
      enableProfiling: config.enableProfiling !== false
    };

    // Initialize system groups for each phase
    Object.values(SystemPhase).forEach(phase => {
      this.systemGroups.set(phase, []);
    });
  }

  /**
   * Add system to scheduler
   */
  addSystem(system: System): void {
    const phase = system.phase;
    const systems = this.systemGroups.get(phase);
    
    if (!systems) {
      console.error(`[SystemScheduler] Invalid phase: ${phase}`);
      return;
    }

    // Check if system already exists
    if (systems.some(s => s.name === system.name)) {
      console.warn(`[SystemScheduler] System already added: ${system.name}`);
      return;
    }

    systems.push(system);
    this.invalidateCache();
    
    console.log(`[SystemScheduler] Added system: ${system.name} (Phase: ${phase}, Priority: ${system.priority})`);
  }

  /**
   * Remove system from scheduler
   */
  removeSystem(systemName: string): boolean {
    let removed = false;

    this.systemGroups.forEach(systems => {
      const index = systems.findIndex(s => s.name === systemName);
      if (index !== -1) {
        systems.splice(index, 1);
        removed = true;
      }
    });

    if (removed) {
      this.invalidateCache();
      this.executionStats.delete(systemName);
      console.log(`[SystemScheduler] Removed system: ${systemName}`);
    }

    return removed;
  }

  /**
   * Get system by name
   */
  getSystem(systemName: string): System | null {
    for (const systems of this.systemGroups.values()) {
      const system = systems.find(s => s.name === systemName);
      if (system) return system;
    }
    return null;
  }

  /**
   * Get all systems in a phase
   */
  getSystemsInPhase(phase: SystemPhase): System[] {
    return this.systemGroups.get(phase) || [];
  }

  /**
   * Execute systems in a specific phase
   */
  executePhase(phase: SystemPhase, deltaTime: number): void {
    const systems = this.getExecutionOrder(phase);
    
    if (systems.length === 0) return;

    const startTime = performance.now();

    // Execute systems in order
    for (const system of systems) {
      if (!system.enabled) continue;

      this.executeSystem(system, phase, deltaTime);
    }

    // Update frame stats
    const totalTime = performance.now() - startTime;
    this.frameStats.totalExecutionTime += totalTime;
  }

  /**
   * Execute a single system
   */
  private executeSystem(system: System, phase: SystemPhase, deltaTime: number): void {
    const startTime = performance.now();

    try {
      // Execute based on phase
      switch (phase) {
        case SystemPhase.EARLY_UPDATE:
          if ('earlyUpdate' in system && typeof (system as any).earlyUpdate === 'function') {
            (system as any).earlyUpdate(deltaTime);
          } else {
            system.update(deltaTime);
          }
          break;

        case SystemPhase.UPDATE:
          system.update(deltaTime);
          break;

        case SystemPhase.LATE_UPDATE:
          if (system.lateUpdate) {
            system.lateUpdate(deltaTime);
          } else {
            system.update(deltaTime);
          }
          break;

        case SystemPhase.FIXED_UPDATE:
          if (system.fixedUpdate) {
            system.fixedUpdate(deltaTime);
          }
          break;

        case SystemPhase.RENDER:
          if (system.render) {
            system.render();
          }
          break;
      }

      // Track execution time
      if (this.config.enableProfiling) {
        const executionTime = performance.now() - startTime;
        this.updateExecutionStats(system, phase, executionTime);
      }
    } catch (error) {
      console.error(`[SystemScheduler] Error executing system ${system.name}:`, error);
    }
  }

  /**
   * Update execution statistics
   */
  private updateExecutionStats(system: System, phase: SystemPhase, executionTime: number): void {
    let stats = this.executionStats.get(system.name);
    
    if (!stats) {
      stats = {
        systemName: system.name,
        phase,
        executionTime: 0,
        callCount: 0
      };
      this.executionStats.set(system.name, stats);
    }

    stats.executionTime = executionTime;
    stats.callCount++;

    // Update longest system
    if (executionTime > this.frameStats.longestSystem.time) {
      this.frameStats.longestSystem = {
        name: system.name,
        time: executionTime
      };
    }
  }

  /**
   * Get execution order for a phase (cached)
   */
  private getExecutionOrder(phase: SystemPhase): System[] {
    if (!this.cacheValid) {
      this.rebuildExecutionOrder();
    }

    return this.executionOrderCache.get(phase) || [];
  }

  /**
   * Rebuild execution order cache
   */
  private rebuildExecutionOrder(): void {
    this.executionOrderCache.clear();

    this.systemGroups.forEach((systems, phase) => {
      // Sort by priority (lower numbers first)
      const sorted = [...systems].sort((a, b) => a.priority - b.priority);
      this.executionOrderCache.set(phase, sorted);
    });

    this.cacheValid = true;
    console.log('[SystemScheduler] Rebuilt execution order cache');
  }

  /**
   * Invalidate execution order cache
   */
  private invalidateCache(): void {
    this.cacheValid = false;
  }

  /**
   * Begin frame (reset frame statistics)
   */
  beginFrame(): void {
    this.frameStats.totalSystems = this.getTotalSystemCount();
    this.frameStats.enabledSystems = this.getEnabledSystemCount();
    this.frameStats.totalExecutionTime = 0;
    this.frameStats.longestSystem = { name: '', time: 0 };
  }

  /**
   * End frame
   */
  endFrame(): void {
    // Frame statistics are now complete
  }

  /**
   * Get total system count
   */
  getTotalSystemCount(): number {
    let count = 0;
    this.systemGroups.forEach(systems => {
      count += systems.length;
    });
    return count;
  }

  /**
   * Get enabled system count
   */
  getEnabledSystemCount(): number {
    let count = 0;
    this.systemGroups.forEach(systems => {
      count += systems.filter(s => s.enabled).length;
    });
    return count;
  }

  /**
   * Get all systems
   */
  getAllSystems(): System[] {
    const allSystems: System[] = [];
    this.systemGroups.forEach(systems => {
      allSystems.push(...systems);
    });
    return allSystems;
  }

  /**
   * Enable all systems
   */
  enableAllSystems(): void {
    this.getAllSystems().forEach(system => system.enable());
  }

  /**
   * Disable all systems
   */
  disableAllSystems(): void {
    this.getAllSystems().forEach(system => system.disable());
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): Map<string, SystemExecutionStats> {
    return new Map(this.executionStats);
  }

  /**
   * Get frame statistics
   */
  getFrameStats(): typeof this.frameStats {
    return { ...this.frameStats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.executionStats.clear();
    this.frameStats = {
      totalSystems: 0,
      enabledSystems: 0,
      totalExecutionTime: 0,
      longestSystem: { name: '', time: 0 }
    };
  }

  /**
   * Get systems sorted by execution time
   */
  getSystemsByExecutionTime(): SystemExecutionStats[] {
    return Array.from(this.executionStats.values())
      .sort((a, b) => b.executionTime - a.executionTime);
  }

  /**
   * Clear all systems
   */
  clear(): void {
    this.systemGroups.forEach(systems => systems.length = 0);
    this.executionOrderCache.clear();
    this.executionStats.clear();
    this.cacheValid = false;
    console.log('[SystemScheduler] Cleared all systems');
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getFrameStats();
    return `SystemScheduler | Total: ${stats.totalSystems}, Enabled: ${stats.enabledSystems}, Frame Time: ${stats.totalExecutionTime.toFixed(2)}ms, Longest: ${stats.longestSystem.name} (${stats.longestSystem.time.toFixed(2)}ms)`;
  }

  /**
   * Print execution order
   */
  printExecutionOrder(): void {
    console.log('=== System Execution Order ===');
    
    Object.values(SystemPhase).forEach(phase => {
      const systems = this.getExecutionOrder(phase);
      if (systems.length > 0) {
        console.log(`\n${phase.toUpperCase()}:`);
        systems.forEach((system, index) => {
          console.log(`  ${index + 1}. ${system.name} (Priority: ${system.priority}, Enabled: ${system.enabled})`);
        });
      }
    });
  }
}
