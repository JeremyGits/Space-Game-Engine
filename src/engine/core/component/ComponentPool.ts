/**
 * ComponentPool
 * 
 * Object pooling for components to reduce garbage collection overhead.
 * Reuses component instances instead of creating/destroying them repeatedly.
 */

import { IComponent, ComponentType } from '../../../types/engine/ECSTypes';

/**
 * Pool configuration for components
 */
export interface ComponentPoolConfig {
  initialSize: number;
  maxSize: number;
  autoGrow: boolean;
  autoShrink: boolean;
  shrinkThreshold: number;
}

/**
 * Pool statistics
 */
export interface ComponentPoolStats {
  total: number;
  active: number;
  inactive: number;
  created: number;
  recycled: number;
  utilization: number;
}

export class ComponentPool {
  private pools: Map<ComponentType, IComponent[]> = new Map();
  private activeComponents: Map<ComponentType, Set<IComponent>> = new Map();
  private poolConfigs: Map<ComponentType, ComponentPoolConfig> = new Map();
  private factories: Map<ComponentType, () => IComponent> = new Map();
  
  // Statistics
  private stats: Map<ComponentType, {
    created: number;
    recycled: number;
  }> = new Map();

  /**
   * Register component factory for pooling
   */
  registerFactory(
    type: ComponentType,
    factory: () => IComponent,
    config: Partial<ComponentPoolConfig> = {}
  ): void {
    if (this.factories.has(type)) {
      console.warn(`[ComponentPool] Factory already registered: ${type}`);
      return;
    }

    const poolConfig: ComponentPoolConfig = {
      initialSize: config.initialSize || 10,
      maxSize: config.maxSize || 100,
      autoGrow: config.autoGrow !== false,
      autoShrink: config.autoShrink || false,
      shrinkThreshold: config.shrinkThreshold || 0.3
    };

    this.factories.set(type, factory);
    this.poolConfigs.set(type, poolConfig);
    this.pools.set(type, []);
    this.activeComponents.set(type, new Set());
    this.stats.set(type, { created: 0, recycled: 0 });

    // Pre-populate pool
    this.growPool(type, poolConfig.initialSize);

    console.log(`[ComponentPool] Registered factory for ${type} (initial size: ${poolConfig.initialSize})`);
  }

  /**
   * Acquire a component from the pool
   */
  acquire(type: ComponentType): IComponent {
    if (!this.pools.has(type)) {
      throw new Error(`Component pool not found: ${type}`);
    }

    const pool = this.pools.get(type)!;
    const config = this.poolConfigs.get(type)!;
    const stats = this.stats.get(type)!;

    let component: IComponent;

    // Try to get from pool
    if (pool.length > 0) {
      component = pool.pop()!;
      component.enabled = true;
      
      // Reset component if it has a reset method
      if ('reset' in component && typeof (component as any).reset === 'function') {
        (component as any).reset();
      }

      stats.recycled++;
    } else {
      // Pool is empty
      if (config.autoGrow) {
        const growSize = Math.ceil(config.initialSize * 0.5);
        this.growPool(type, growSize);
        component = pool.pop()!;
        component.enabled = true;
        stats.recycled++;
      } else {
        // Create new component without pooling
        const factory = this.factories.get(type)!;
        component = factory();
        stats.created++;
      }
    }

    // Track active component
    this.activeComponents.get(type)!.add(component);

    return component;
  }

  /**
   * Release a component back to the pool
   */
  release(component: IComponent): void {
    const type = component.type;

    if (!this.pools.has(type)) {
      console.warn(`[ComponentPool] Pool not found for type: ${type}`);
      return;
    }

    const pool = this.pools.get(type)!;
    const config = this.poolConfigs.get(type)!;
    const activeSet = this.activeComponents.get(type)!;

    // Remove from active tracking
    activeSet.delete(component);

    // Reset component state
    component.enabled = false;
    
    // Call reset if available
    if ('reset' in component && typeof (component as any).reset === 'function') {
      (component as any).reset();
    }

    // Add back to pool if not at max size
    if (pool.length < config.maxSize) {
      pool.push(component);
    }
    // If pool is full, component will be garbage collected

    // Auto-shrink if enabled
    if (config.autoShrink) {
      this.checkShrink(type);
    }
  }

  /**
   * Release multiple components
   */
  releaseMultiple(components: IComponent[]): void {
    components.forEach(component => this.release(component));
  }

  /**
   * Grow the pool
   */
  private growPool(type: ComponentType, count: number): void {
    const pool = this.pools.get(type)!;
    const config = this.poolConfigs.get(type)!;
    const factory = this.factories.get(type)!;

    const actualCount = Math.min(count, config.maxSize - pool.length);

    for (let i = 0; i < actualCount; i++) {
      const component = factory();
      component.enabled = false;
      pool.push(component);
    }

    console.log(`[ComponentPool] Grew pool ${type} by ${actualCount} components`);
  }

  /**
   * Check if pool should shrink
   */
  private checkShrink(type: ComponentType): void {
    const pool = this.pools.get(type)!;
    const config = this.poolConfigs.get(type)!;
    const activeSet = this.activeComponents.get(type)!;

    const utilization = activeSet.size / (pool.length + activeSet.size);

    if (utilization < config.shrinkThreshold && pool.length > config.initialSize) {
      const shrinkCount = Math.floor(pool.length * 0.25);
      this.shrinkPool(type, shrinkCount);
    }
  }

  /**
   * Shrink the pool
   */
  private shrinkPool(type: ComponentType, count: number): void {
    const pool = this.pools.get(type)!;
    const config = this.poolConfigs.get(type)!;

    const actualCount = Math.min(count, pool.length - config.initialSize);

    for (let i = 0; i < actualCount; i++) {
      pool.pop();
    }

    console.log(`[ComponentPool] Shrunk pool ${type} by ${actualCount} components`);
  }

  /**
   * Warm up a pool (pre-create components)
   */
  warmUp(type: ComponentType, count: number): void {
    if (!this.pools.has(type)) {
      throw new Error(`Pool not found: ${type}`);
    }

    this.growPool(type, count);
    console.log(`[ComponentPool] Warmed up pool ${type} with ${count} components`);
  }

  /**
   * Clear a pool
   */
  clearPool(type: ComponentType): void {
    if (!this.pools.has(type)) {
      return;
    }

    const pool = this.pools.get(type)!;
    pool.length = 0;

    const activeSet = this.activeComponents.get(type)!;
    activeSet.clear();

    console.log(`[ComponentPool] Cleared pool: ${type}`);
  }

  /**
   * Get pool statistics
   */
  getPoolStats(type: ComponentType): ComponentPoolStats | null {
    if (!this.pools.has(type)) {
      return null;
    }

    const pool = this.pools.get(type)!;
    const activeSet = this.activeComponents.get(type)!;
    const stats = this.stats.get(type)!;

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
  getAllStats(): Map<ComponentType, ComponentPoolStats> {
    const allStats = new Map<ComponentType, ComponentPoolStats>();

    this.pools.forEach((_, type) => {
      const stats = this.getPoolStats(type);
      if (stats) {
        allStats.set(type, stats);
      }
    });

    return allStats;
  }

  /**
   * Get registered pool types
   */
  getPoolTypes(): ComponentType[] {
    return Array.from(this.pools.keys());
  }

  /**
   * Check if pool exists
   */
  hasPool(type: ComponentType): boolean {
    return this.pools.has(type);
  }

  /**
   * Get pool configuration
   */
  getPoolConfig(type: ComponentType): ComponentPoolConfig | null {
    return this.poolConfigs.get(type) || null;
  }

  /**
   * Update pool configuration
   */
  updatePoolConfig(type: ComponentType, config: Partial<ComponentPoolConfig>): void {
    const currentConfig = this.poolConfigs.get(type);
    if (!currentConfig) {
      throw new Error(`Pool not found: ${type}`);
    }

    Object.assign(currentConfig, config);
    console.log(`[ComponentPool] Updated config for pool: ${type}`);
  }

  /**
   * Clear all pools
   */
  clearAll(): void {
    const poolTypes = Array.from(this.pools.keys());
    poolTypes.forEach(type => this.clearPool(type));
    console.log('[ComponentPool] Cleared all pools');
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const poolCount = this.pools.size;
    let totalActive = 0;
    let totalInactive = 0;

    this.pools.forEach((pool, type) => {
      const activeSet = this.activeComponents.get(type)!;
      totalActive += activeSet.size;
      totalInactive += pool.length;
    });

    return `ComponentPool | Pools: ${poolCount}, Active: ${totalActive}, Inactive: ${totalInactive}`;
  }
}
