/**
 * System
 * 
 * Base class for all systems in the ECS architecture.
 * Systems contain the logic that operates on entities with specific components.
 */

import { EntityManager } from '../entity/EntityManager';
import { ComponentManager } from '../component/ComponentManager';
import { ComponentType } from '../../../types/engine/ECSTypes';

/**
 * System execution phase
 */
export enum SystemPhase {
  EARLY_UPDATE = 'early_update',
  UPDATE = 'update',
  LATE_UPDATE = 'late_update',
  FIXED_UPDATE = 'fixed_update',
  RENDER = 'render'
}

/**
 * System configuration
 */
export interface SystemConfig {
  priority?: number;
  phase?: SystemPhase;
  enabled?: boolean;
  requiredComponents?: ComponentType[];
}

export abstract class System {
  public readonly name: string;
  public enabled: boolean = true;
  public priority: number = 0;
  public phase: SystemPhase = SystemPhase.UPDATE;
  public requiredComponents: ComponentType[] = [];

  protected entityManager: EntityManager;
  protected componentManager: ComponentManager;

  // Statistics
  protected stats = {
    updateCount: 0,
    totalTime: 0,
    averageTime: 0,
    lastUpdateTime: 0
  };

  constructor(
    name: string,
    entityManager: EntityManager,
    componentManager: ComponentManager,
    config: SystemConfig = {}
  ) {
    this.name = name;
    this.entityManager = entityManager;
    this.componentManager = componentManager;
    
    if (config.priority !== undefined) this.priority = config.priority;
    if (config.phase !== undefined) this.phase = config.phase;
    if (config.enabled !== undefined) this.enabled = config.enabled;
    if (config.requiredComponents) this.requiredComponents = config.requiredComponents;
  }

  /**
   * Initialize system (called once when system is added)
   */
  initialize?(): void;

  /**
   * Update system (called every frame)
   */
  abstract update(deltaTime: number): void;

  /**
   * Fixed update (called at fixed intervals for physics)
   */
  fixedUpdate?(fixedDeltaTime: number): void;

  /**
   * Late update (called after all updates)
   */
  lateUpdate?(deltaTime: number): void;

  /**
   * Render (called during render phase)
   */
  render?(): void;

  /**
   * Cleanup system (called when system is removed)
   */
  cleanup?(): void;

  /**
   * Enable system
   */
  enable(): void {
    if (!this.enabled) {
      this.enabled = true;
      if ('onEnable' in this && typeof (this as any).onEnable === 'function') {
        (this as any).onEnable();
      }
      console.log(`[System] Enabled: ${this.name}`);
    }
  }

  /**
   * Disable system
   */
  disable(): void {
    if (this.enabled) {
      this.enabled = false;
      if ('onDisable' in this && typeof (this as any).onDisable === 'function') {
        (this as any).onDisable();
      }
      console.log(`[System] Disabled: ${this.name}`);
    }
  }

  /**
   * Get entities that match required components
   */
  protected getMatchingEntities() {
    if (this.requiredComponents.length === 0) {
      return this.entityManager.getAllEntities();
    }
    return this.entityManager.getEntitiesWithComponents(this.requiredComponents);
  }

  /**
   * Track update time
   */
  protected trackUpdateTime(startTime: number): void {
    const endTime = performance.now();
    const updateTime = endTime - startTime;
    
    this.stats.updateCount++;
    this.stats.totalTime += updateTime;
    this.stats.lastUpdateTime = updateTime;
    this.stats.averageTime = this.stats.totalTime / this.stats.updateCount;
  }

  /**
   * Get statistics
   */
  getStats(): {
    updateCount: number;
    totalTime: number;
    averageTime: number;
    lastUpdateTime: number;
  } {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.updateCount = 0;
    this.stats.totalTime = 0;
    this.stats.averageTime = 0;
    this.stats.lastUpdateTime = 0;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `${this.name} | Phase: ${this.phase} | Priority: ${this.priority} | Enabled: ${this.enabled} | Avg Time: ${this.stats.averageTime.toFixed(2)}ms`;
  }

  /**
   * Validate system configuration
   */
  validate(): boolean {
    // Check if required components are registered
    for (const componentType of this.requiredComponents) {
      if (!this.componentManager.isTypeRegistered(componentType)) {
        console.error(`[System] Required component not registered: ${componentType}`);
        return false;
      }
    }
    return true;
  }
}
