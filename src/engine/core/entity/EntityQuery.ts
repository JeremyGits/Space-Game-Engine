/**
 * EntityQuery
 * 
 * Advanced query system for finding entities based on complex criteria.
 * Supports component queries, tag queries, and custom predicates.
 */

import { Entity } from '../Entity';
import { EntityManager } from './EntityManager';
import {
  EntityId,
  ComponentType,
  IComponent
} from '../../../types/engine/ECSTypes';

/**
 * Query operator
 */
export enum QueryOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not'
}

/**
 * Component query
 */
export interface ComponentQuery {
  type: ComponentType;
  predicate?: (component: IComponent) => boolean;
}

/**
 * Query builder for fluent API
 */
export class EntityQueryBuilder {
  private entityManager: EntityManager;
  private componentQueries: ComponentQuery[] = [];
  private tagQueries: string[] = [];
  private nameQuery?: string;
  private activeOnly: boolean = false;
  private customPredicates: Array<(entity: Entity) => boolean> = [];
  private operator: QueryOperator = QueryOperator.AND;
  private limit?: number;
  private sortFn?: (a: Entity, b: Entity) => number;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  /**
   * Query entities with component
   */
  withComponent(type: ComponentType, predicate?: (component: IComponent) => boolean): this {
    this.componentQueries.push({ type, predicate });
    return this;
  }

  /**
   * Query entities with all components
   */
  withComponents(...types: ComponentType[]): this {
    types.forEach(type => this.componentQueries.push({ type }));
    return this;
  }

  /**
   * Query entities with tag
   */
  withTag(tag: string): this {
    this.tagQueries.push(tag);
    return this;
  }

  /**
   * Query entities with all tags
   */
  withTags(...tags: string[]): this {
    this.tagQueries.push(...tags);
    return this;
  }

  /**
   * Query entities by name
   */
  withName(name: string): this {
    this.nameQuery = name;
    return this;
  }

  /**
   * Query only active entities
   */
  onlyActive(): this {
    this.activeOnly = true;
    return this;
  }

  /**
   * Add custom predicate
   */
  where(predicate: (entity: Entity) => boolean): this {
    this.customPredicates.push(predicate);
    return this;
  }

  /**
   * Set query operator
   */
  setOperator(operator: QueryOperator): this {
    this.operator = operator;
    return this;
  }

  /**
   * Limit results
   */
  take(count: number): this {
    this.limit = count;
    return this;
  }

  /**
   * Sort results
   */
  sortBy(fn: (a: Entity, b: Entity) => number): this {
    this.sortFn = fn;
    return this;
  }

  /**
   * Execute query
   */
  execute(): Entity[] {
    let results: Entity[] = [];

    // Start with component queries if any
    if (this.componentQueries.length > 0) {
      const componentTypes = this.componentQueries.map(q => q.type);
      results = this.entityManager.getEntitiesWithComponents(componentTypes);

      // Apply component predicates
      results = results.filter(entity => {
        return this.componentQueries.every(query => {
          if (!query.predicate) return true;
          const component = entity.getComponent(query.type);
          return component && query.predicate(component);
        });
      });
    } else {
      // Start with all entities
      results = this.entityManager.getAllEntities();
    }

    // Apply tag queries
    if (this.tagQueries.length > 0) {
      results = results.filter(entity => {
        if (this.operator === QueryOperator.AND) {
          return this.tagQueries.every(tag => entity.hasTag(tag));
        } else if (this.operator === QueryOperator.OR) {
          return this.tagQueries.some(tag => entity.hasTag(tag));
        }
        return true;
      });
    }

    // Apply name query
    if (this.nameQuery) {
      results = results.filter(entity => entity.name === this.nameQuery);
    }

    // Apply active filter
    if (this.activeOnly) {
      results = results.filter(entity => entity.active);
    }

    // Apply custom predicates
    if (this.customPredicates.length > 0) {
      results = results.filter(entity => {
        return this.customPredicates.every(predicate => predicate(entity));
      });
    }

    // Sort results
    if (this.sortFn) {
      results.sort(this.sortFn);
    }

    // Limit results
    if (this.limit !== undefined) {
      results = results.slice(0, this.limit);
    }

    return results;
  }

  /**
   * Execute and get first result
   */
  first(): Entity | null {
    const results = this.take(1).execute();
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute and get count
   */
  count(): number {
    return this.execute().length;
  }

  /**
   * Execute and check if any match
   */
  any(): boolean {
    return this.count() > 0;
  }
}

/**
 * Main query system
 */
export class EntityQuery {
  private entityManager: EntityManager;
  private cachedQueries: Map<string, Entity[]> = new Map();
  private cacheEnabled: boolean = false;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  /**
   * Enable query caching
   */
  enableCache(): void {
    this.cacheEnabled = true;
  }

  /**
   * Disable query caching
   */
  disableCache(): void {
    this.cacheEnabled = false;
    this.cachedQueries.clear();
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.cachedQueries.clear();
  }

  /**
   * Create a new query builder
   */
  createQuery(): EntityQueryBuilder {
    return new EntityQueryBuilder(this.entityManager);
  }

  /**
   * Find entities with component
   */
  findWithComponent(type: ComponentType): Entity[] {
    return this.entityManager.getEntitiesWithComponent(type);
  }

  /**
   * Find entities with all components
   */
  findWithComponents(...types: ComponentType[]): Entity[] {
    return this.entityManager.getEntitiesWithComponents(types);
  }

  /**
   * Find entities with tag
   */
  findWithTag(tag: string): Entity[] {
    return this.entityManager.getEntitiesByTag(tag);
  }

  /**
   * Find entities by name
   */
  findByName(name: string): Entity[] {
    return this.entityManager.getEntitiesByName(name);
  }

  /**
   * Find entity by ID
   */
  findById(id: EntityId): Entity | null {
    return this.entityManager.getEntity(id);
  }

  /**
   * Find first entity matching predicate
   */
  findFirst(predicate: (entity: Entity) => boolean): Entity | null {
    const entities = this.entityManager.getAllEntities();
    return entities.find(predicate) || null;
  }

  /**
   * Find all entities matching predicate
   */
  findAll(predicate: (entity: Entity) => boolean): Entity[] {
    return this.entityManager.getAllEntities().filter(predicate);
  }

  /**
   * Find nearest entity to a position (requires Transform component)
   */
  findNearest(position: { x: number; y: number; z: number }, componentType?: ComponentType): Entity | null {
    let entities = componentType 
      ? this.entityManager.getEntitiesWithComponent(componentType)
      : this.entityManager.getAllEntities();

    if (entities.length === 0) return null;

    let nearest: Entity | null = null;
    let minDistance = Infinity;

    entities.forEach(entity => {
      const transform = entity.getComponent('Transform');
      if (!transform) return;

      const pos = (transform as any).position;
      if (!pos) return;

      const dx = pos.x - position.x;
      const dy = pos.y - position.y;
      const dz = pos.z - position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = entity;
      }
    });

    return nearest;
  }

  /**
   * Find entities within radius (requires Transform component)
   */
  findInRadius(
    position: { x: number; y: number; z: number },
    radius: number,
    componentType?: ComponentType
  ): Entity[] {
    let entities = componentType 
      ? this.entityManager.getEntitiesWithComponent(componentType)
      : this.entityManager.getAllEntities();

    const radiusSquared = radius * radius;
    const results: Entity[] = [];

    entities.forEach(entity => {
      const transform = entity.getComponent('Transform');
      if (!transform) return;

      const pos = (transform as any).position;
      if (!pos) return;

      const dx = pos.x - position.x;
      const dy = pos.y - position.y;
      const dz = pos.z - position.z;
      const distanceSquared = dx * dx + dy * dy + dz * dz;

      if (distanceSquared <= radiusSquared) {
        results.push(entity);
      }
    });

    return results;
  }

  /**
   * Find entities in bounding box (requires Transform component)
   */
  findInBounds(
    min: { x: number; y: number; z: number },
    max: { x: number; y: number; z: number },
    componentType?: ComponentType
  ): Entity[] {
    let entities = componentType 
      ? this.entityManager.getEntitiesWithComponent(componentType)
      : this.entityManager.getAllEntities();

    return entities.filter(entity => {
      const transform = entity.getComponent('Transform');
      if (!transform) return false;

      const pos = (transform as any).position;
      if (!pos) return false;

      return pos.x >= min.x && pos.x <= max.x &&
             pos.y >= min.y && pos.y <= max.y &&
             pos.z >= min.z && pos.z <= max.z;
    });
  }

  /**
   * Group entities by component type
   */
  groupByComponent(componentType: ComponentType): Map<any, Entity[]> {
    const groups = new Map<any, Entity[]>();
    const entities = this.entityManager.getEntitiesWithComponent(componentType);

    entities.forEach(entity => {
      const component = entity.getComponent(componentType);
      if (!component) return;

      // Use component as key (this is simplified, in practice you'd want a better key)
      const key = JSON.stringify(component);
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entity);
    });

    return groups;
  }

  /**
   * Get query statistics
   */
  getStats(): {
    cachedQueries: number;
    cacheEnabled: boolean;
  } {
    return {
      cachedQueries: this.cachedQueries.size,
      cacheEnabled: this.cacheEnabled
    };
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `EntityQuery | Cache: ${stats.cacheEnabled ? 'ON' : 'OFF'}, Cached: ${stats.cachedQueries}`;
  }
}
