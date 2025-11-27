/**
 * EntityPool
 * 
 * Object pooling system for entities to reduce garbage collection overhead.
 * Reuses inactive entities instead of creating/destroying them repeatedly.
 */

import { Entity } from '../Entity';
import { EntityManager } from './EntityManager';
import { EntityFactory } from './EntityFactory';
import { EntityId } from '../../../types/engine/ECSTypes';

/**
 * Pool configuration
 */
export interface PoolConfig {
  initialSize: number;
  maxSize: number;
  growthFactor: number;
  autoGrow: boolean;
  autoShrink: boolean;
  shrinkThreshold: number;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  total: number;
  active: number;
  inactive: number;
  created: number;
  recycled: number;
  utilization: number;
}

export class EntityPool {
  private entityManager: EntityManager;
  private entityFactory: EntityFactory;
  private pools: Map<string, Entity[]> = new Map();
  private activeEntities: Map<string, Set<EntityId>> = new Map();
  private poolConfigs: Map<string, PoolConfig> = new Map();
  
  // Statistics
  private stats: Map<string, {
    created: number;
    recycled: number;
  }> = new Map();

  constructor(entityManager: EntityManager, entityFactory: EntityFactory) {
    this.entityManager = entityManager;
    this.entityFactory = entityFactory;
  }

  /**
   * Create a new pool for a template
   */
  createPool(templateId: string, config: Partial<PoolConfig> = {}): void {
    if (this.pools.has(templateId)) {
      console.warn(`[EntityPool] Pool already exists: ${templateId}`);
      return;
    }

    const poolConfig: PoolConfig = {
      initialSize: config.initialSize || 10,
      maxSize: config.maxSize || 100,
      growthFactor: config.growthFactor || 1.5,
      autoGrow: config.autoGrow !== false,
      autoShrink: config.autoShrink || false,
      shrinkThreshold: config.shrinkThreshold || 0.3
    };

    this.poolConfigs.set(templateId, poolConfig);
    this.pools.set(templateId, []);
    this.activeEntities.set(templateId, new Set());
    this.stats.set(templateId, { created: 0, recycled: 0 });

    // Pre-populate pool
    this.growPool(templateId, poolConfig.initialSize);

    console.log(`[EntityPool] Created pool for template: ${templateId} (initial size: ${poolConfig.initialSize})`);
  }

  /**
   * Get an entity from the pool
   */
  acquire(templateId: string, name?: string): Entity {
    if (!this.pools.has(templateId)) {
      throw new Error(`Pool not found: ${templateId}`);
    }

    const pool = this.pools.get(templateId)!;
    const config = this.poolConfigs.get(templateId)!;
    const stats = this.stats.get(templateId)!;

    let entity: Entity;

    // Try to get from pool
    if (pool.length > 0) {
      entity = pool.pop()!;
      entity.active = true;
      
      if (name) {
        entity.name = name;
      }

      stats.recycled++;
      console.log(`[EntityPool] Recycled entity from pool: ${templateId}`);
    } else {
      // Pool is empty
      if (config.autoGrow) {
        const growSize = Math.ceil(config.initialSize * config.growthFactor);
        this.growPool(templateId, growSize);
        entity = pool.pop()!;
        entity.active = true;
        
        if (name) {
          entity.name = name;
        }

        stats.recycled++;
      } else {
        // Create new entity without pooling
        entity = this.entityFactory.createFromTemplate(templateId, name);
        stats.created++;
      }
    }

    // Track active entity
    this.activeEntities.get(templateId)!.add(entity.id);

    return entity;
  }

  /**
   * Return an entity to the pool
   */
  release(templateId: string, entity: Entity): void {
    if (!this.pools.has(templateId)) {
      console.warn(`[EntityPool] Pool not found: ${templateId}`);
      return;
    }

    const pool = this.pools.get(templateId)!;
    const config = this.poolConfigs.get(templateId)!;
    const activeSet = this.activeEntities.get(templateId)!;

    // Remove from active tracking
    activeSet.delete(entity.id);

    // Reset entity state
    entity.active = false;
    
    // Reset components (call reset if available)
    entity.getComponents().forEach(component => {
      if ('reset' in component && typeof (component as any).reset === 'function') {
        (component as any).reset();
      }
    });

    // Add back to pool if not at max size
    if (pool.length < config.maxSize) {
      pool.push(entity);
    } else {
      // Pool is full, destroy entity
      this.entityManager.destroyEntity(entity.id);
    }

    // Auto-shrink if enabled
    if (config.autoShrink) {
      this.checkShrink(templateId);
    }
  }

  /**
   * Release all active entities of a template
   */
  releaseAll(templateId: string): void {
    if (!this.activeEntities.has(templateId)) {
      return;
    }

    const activeSet = this.activeEntities.get(templateId)!;
    const entityIds = Array.from(activeSet);

    entityIds.forEach(id => {
      const entity = this.entityManager.getEntity(id);
      if (entity) {
        this.release(templateId, entity);
      }
    });

    console.log(`[EntityPool] Released all entities for template: ${templateId}`);
  }

  /**
   * Grow the pool
   */
  private growPool(templateId: string, count: number): void {
    const pool = this.pools.get(templateId)!;
    const config = this.poolConfigs.get(templateId)!;

    const actualCount = Math.min(count, config.maxSize - pool.length);

    for (let i = 0; i < actualCount; i++) {
      const entity = this.entityFactory.createFromTemplate(templateId);
      entity.active = false;
      pool.push(entity);
    }

    console.log(`[EntityPool] Grew pool ${templateId} by ${actualCount} entities`);
  }

  /**
   * Check if pool should shrink
   */
  private checkShrink(templateId: string): void {
    const pool = this.pools.get(templateId)!;
    const config = this.poolConfigs.get(templateId)!;
    const activeSet = this.activeEntities.get(templateId)!;

    const utilization = activeSet.size / (pool.length + activeSet.size);

    if (utilization < config.shrinkThreshold && pool.length > config.initialSize) {
      const shrinkCount = Math.floor(pool.length * 0.25);
      this.shrinkPool(templateId, shrinkCount);
    }
  }

  /**
   * Shrink the pool
   */
  private shrinkPool(templateId: string, count: number): void {
    const pool = this.pools.get(templateId)!;
    const config = this.poolConfigs.get(templateId)!;

    const actualCount = Math.min(count, pool.length - config.initialSize);

    for (let i = 0; i < actualCount; i++) {
      const entity = pool.pop();
      if (entity) {
        this.entityManager.destroyEntity(entity.id);
      }
    }

    console.log(`[EntityPool] Shrunk pool ${templateId} by ${actualCount} entities`);
  }

  /**
   * Warm up a pool (pre-create entities)
   */
  warmUp(templateId: string, count: number): void {
    if (!this.pools.has(templateId)) {
      throw new Error(`Pool not found: ${templateId}`);
    }

    this.growPool(templateId, count);
    console.log(`[EntityPool] Warmed up pool ${templateId} with ${count} entities`);
  }

  /**
   * Clear a pool
   */
  clearPool(templateId: string): void {
    if (!this.pools.has(templateId)) {
      return;
    }

    // Release all active entities
    this.releaseAll(templateId);

    // Destroy all pooled entities
    const pool = this.pools.get(templateId)!;
    pool.forEach(entity => {
      this.entityManager.destroyEntity(entity.id);
    });

    pool.length = 0;
    console.log(`[EntityPool] Cleared pool: ${templateId}`);
  }

  /**
   * Destroy a pool
   */
  destroyPool(templateId: string): void {
    this.clearPool(templateId);
    this.pools.delete(templateId);
    this.activeEntities.delete(templateId);
    this.poolConfigs.delete(templateId);
    this.stats.delete(templateId);
    console.log(`[EntityPool] Destroyed pool: ${templateId}`);
  }

  /**
   * Get pool statistics
   */
  getPoolStats(templateId: string): PoolStats | null {
    if (!this.pools.has(templateId)) {
      return null;
    }

    const pool = this.pools.get(templateId)!;
    const activeSet = this.activeEntities.get(templateId)!;
    const stats = this.stats.get(templateId)!;

    const total = pool.length + activeSet.size;
    const utilization = total > 0 ? activeSet.size / total : 0;

    return {
      total,
      active: activeSet.size,
      inactive: pool.length,
      created: stats.created,
      recycled: stats.recycled,
      utilization
    };
  }

  /**
   * Get all pool statistics
   */
  getAllStats(): Map<string, PoolStats> {
    const allStats = new Map<string, PoolStats>();

    this.pools.forEach((_, templateId) => {
      const stats = this.getPoolStats(templateId);
      if (stats) {
        allStats.set(templateId, stats);
      }
    });

    return allStats;
  }

  /**
   * Get pool names
   */
  getPoolNames(): string[] {
    return Array.from(this.pools.keys());
  }

  /**
   * Check if pool exists
   */
  hasPool(templateId: string): boolean {
    return this.pools.has(templateId);
  }

  /**
   * Get pool configuration
   */
  getPoolConfig(templateId: string): PoolConfig | null {
    return this.poolConfigs.get(templateId) || null;
  }

  /**
   * Update pool configuration
   */
  updatePoolConfig(templateId: string, config: Partial<PoolConfig>): void {
    const currentConfig = this.poolConfigs.get(templateId);
    if (!currentConfig) {
      throw new Error(`Pool not found: ${templateId}`);
    }

    Object.assign(currentConfig, config);
    console.log(`[EntityPool] Updated config for pool: ${templateId}`);
  }

  /**
   * Clear all pools
   */
  clearAll(): void {
    const poolNames = Array.from(this.pools.keys());
    poolNames.forEach(name => this.clearPool(name));
    console.log('[EntityPool] Cleared all pools');
  }

  /**
   * Destroy all pools
   */
  destroyAll(): void {
    const poolNames = Array.from(this.pools.keys());
    poolNames.forEach(name => this.destroyPool(name));
    console.log('[EntityPool] Destroyed all pools');
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const poolCount = this.pools.size;
    let totalActive = 0;
    let totalInactive = 0;

    this.pools.forEach((pool, templateId) => {
      const activeSet = this.activeEntities.get(templateId)!;
      totalActive += activeSet.size;
      totalInactive += pool.length;
    });

    return `EntityPool | Pools: ${poolCount}, Active: ${totalActive}, Inactive: ${totalInactive}`;
  }
}
