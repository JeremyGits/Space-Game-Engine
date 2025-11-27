/**
 * EntityManager
 * 
 * Central manager for all entities in the game.
 * Handles entity creation, destruction, querying, and lifecycle management.
 */

import { Entity } from '../Entity';
import { EventEmitter } from '../EventEmitter';
import {
  EntityId,
  ComponentType,
  IComponent
} from '../../../types/engine/ECSTypes';

/**
 * Entity events
 */
export enum EntityEvent {
  ENTITY_CREATED = 'entity:created',
  ENTITY_DESTROYED = 'entity:destroyed',
  COMPONENT_ADDED = 'entity:component:added',
  COMPONENT_REMOVED = 'entity:component:removed',
  ENTITY_ACTIVATED = 'entity:activated',
  ENTITY_DEACTIVATED = 'entity:deactivated'
}

/**
 * Entity manager configuration
 */
export interface EntityManagerConfig {
  maxEntities?: number;
  enableEvents?: boolean;
  enablePooling?: boolean;
  poolSize?: number;
}

export class EntityManager {
  private entities: Map<EntityId, Entity> = new Map();
  private entitiesByName: Map<string, Entity[]> = new Map();
  private entitiesByTag: Map<string, Set<EntityId>> = new Map();
  private entitiesByComponent: Map<ComponentType, Set<EntityId>> = new Map();
  
  private eventEmitter: EventEmitter;
  private config: Required<EntityManagerConfig>;
  private nextEntityId: number = 0;
  
  // Statistics
  private stats = {
    created: 0,
    destroyed: 0,
    active: 0
  };

  constructor(eventEmitter: EventEmitter, config: EntityManagerConfig = {}) {
    this.eventEmitter = eventEmitter;
    this.config = {
      maxEntities: config.maxEntities || 10000,
      enableEvents: config.enableEvents !== false,
      enablePooling: config.enablePooling || false,
      poolSize: config.poolSize || 100
    };
  }

  /**
   * Create a new entity
   */
  createEntity(name?: string): Entity {
    if (this.entities.size >= this.config.maxEntities) {
      throw new Error(`Maximum entity limit reached: ${this.config.maxEntities}`);
    }

    const id = this.generateEntityId();
    const entity = new Entity(id, name || `Entity_${id}`);
    
    this.entities.set(id, entity);
    this.stats.created++;
    this.stats.active++;

    // Index by name
    if (!this.entitiesByName.has(entity.name)) {
      this.entitiesByName.set(entity.name, []);
    }
    this.entitiesByName.get(entity.name)!.push(entity);

    // Emit event
    if (this.config.enableEvents) {
      this.eventEmitter.emit(EntityEvent.ENTITY_CREATED, { entity });
    }

    console.log(`[EntityManager] Created entity: ${entity.name} (${id})`);
    return entity;
  }

  /**
   * Destroy an entity
   */
  destroyEntity(id: EntityId): void {
    const entity = this.entities.get(id);
    if (!entity) {
      console.warn(`[EntityManager] Entity not found: ${id}`);
      return;
    }

    // Remove from component indices
    entity.getComponentTypes().forEach(type => {
      this.removeFromComponentIndex(id, type);
    });

    // Remove from tag indices
    entity.tags.forEach(tag => {
      this.removeFromTagIndex(id, tag);
    });

    // Remove from name index
    const nameEntities = this.entitiesByName.get(entity.name);
    if (nameEntities) {
      const index = nameEntities.indexOf(entity);
      if (index !== -1) {
        nameEntities.splice(index, 1);
      }
      if (nameEntities.length === 0) {
        this.entitiesByName.delete(entity.name);
      }
    }

    // Destroy entity
    entity.destroy();
    this.entities.delete(id);
    this.stats.destroyed++;
    this.stats.active--;

    // Emit event
    if (this.config.enableEvents) {
      this.eventEmitter.emit(EntityEvent.ENTITY_DESTROYED, { entityId: id });
    }

    console.log(`[EntityManager] Destroyed entity: ${entity.name} (${id})`);
  }

  /**
   * Get entity by ID
   */
  getEntity(id: EntityId): Entity | null {
    return this.entities.get(id) || null;
  }

  /**
   * Get entities by name
   */
  getEntitiesByName(name: string): Entity[] {
    return this.entitiesByName.get(name) || [];
  }

  /**
   * Get entities by tag
   */
  getEntitiesByTag(tag: string): Entity[] {
    const ids = this.entitiesByTag.get(tag);
    if (!ids) return [];

    const entities: Entity[] = [];
    ids.forEach(id => {
      const entity = this.entities.get(id);
      if (entity) entities.push(entity);
    });

    return entities;
  }

  /**
   * Get entities with component
   */
  getEntitiesWithComponent(type: ComponentType): Entity[] {
    const ids = this.entitiesByComponent.get(type);
    if (!ids) return [];

    const entities: Entity[] = [];
    ids.forEach(id => {
      const entity = this.entities.get(id);
      if (entity) entities.push(entity);
    });

    return entities;
  }

  /**
   * Get entities with all components
   */
  getEntitiesWithComponents(types: ComponentType[]): Entity[] {
    if (types.length === 0) return [];

    // Start with entities that have the first component
    let result = new Set(this.entitiesByComponent.get(types[0]) || []);

    // Intersect with entities that have other components
    for (let i = 1; i < types.length; i++) {
      const componentEntities = this.entitiesByComponent.get(types[i]);
      if (!componentEntities) return [];

      result = new Set([...result].filter(id => componentEntities.has(id)));
      if (result.size === 0) return [];
    }

    // Convert IDs to entities
    const entities: Entity[] = [];
    result.forEach(id => {
      const entity = this.entities.get(id);
      if (entity) entities.push(entity);
    });

    return entities;
  }

  /**
   * Get all entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get active entities
   */
  getActiveEntities(): Entity[] {
    return Array.from(this.entities.values()).filter(e => e.active);
  }

  /**
   * Add component to entity and update indices
   */
  addComponentToEntity(entityId: EntityId, component: IComponent): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    entity.addComponent(component);
    this.addToComponentIndex(entityId, component.type);

    // Emit event
    if (this.config.enableEvents) {
      this.eventEmitter.emit(EntityEvent.COMPONENT_ADDED, {
        entityId,
        componentType: component.type
      });
    }
  }

  /**
   * Remove component from entity and update indices
   */
  removeComponentFromEntity(entityId: EntityId, type: ComponentType): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    entity.removeComponent(type);
    this.removeFromComponentIndex(entityId, type);

    // Emit event
    if (this.config.enableEvents) {
      this.eventEmitter.emit(EntityEvent.COMPONENT_REMOVED, {
        entityId,
        componentType: type
      });
    }
  }

  /**
   * Add tag to entity and update indices
   */
  addTagToEntity(entityId: EntityId, tag: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    entity.addTag(tag);
    this.addToTagIndex(entityId, tag);
  }

  /**
   * Remove tag from entity and update indices
   */
  removeTagFromEntity(entityId: EntityId, tag: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    entity.removeTag(tag);
    this.removeFromTagIndex(entityId, tag);
  }

  /**
   * Update all active entities
   */
  update(deltaTime: number): void {
    this.entities.forEach(entity => {
      if (entity.active && !entity.isDestroyed()) {
        entity.update(deltaTime);
      }
    });
  }

  /**
   * Clear all entities
   */
  clear(): void {
    const entityIds = Array.from(this.entities.keys());
    entityIds.forEach(id => this.destroyEntity(id));

    this.entities.clear();
    this.entitiesByName.clear();
    this.entitiesByTag.clear();
    this.entitiesByComponent.clear();

    console.log('[EntityManager] Cleared all entities');
  }

  /**
   * Get entity count
   */
  getEntityCount(): number {
    return this.entities.size;
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    active: number;
    created: number;
    destroyed: number;
    byComponent: Map<ComponentType, number>;
    byTag: Map<string, number>;
  } {
    const byComponent = new Map<ComponentType, number>();
    this.entitiesByComponent.forEach((ids, type) => {
      byComponent.set(type, ids.size);
    });

    const byTag = new Map<string, number>();
    this.entitiesByTag.forEach((ids, tag) => {
      byTag.set(tag, ids.size);
    });

    return {
      total: this.entities.size,
      active: this.stats.active,
      created: this.stats.created,
      destroyed: this.stats.destroyed,
      byComponent,
      byTag
    };
  }

  /**
   * Generate unique entity ID
   */
  private generateEntityId(): EntityId {
    return `entity_${this.nextEntityId++}`;
  }

  /**
   * Add entity to component index
   */
  private addToComponentIndex(entityId: EntityId, type: ComponentType): void {
    if (!this.entitiesByComponent.has(type)) {
      this.entitiesByComponent.set(type, new Set());
    }
    this.entitiesByComponent.get(type)!.add(entityId);
  }

  /**
   * Remove entity from component index
   */
  private removeFromComponentIndex(entityId: EntityId, type: ComponentType): void {
    const entities = this.entitiesByComponent.get(type);
    if (entities) {
      entities.delete(entityId);
      if (entities.size === 0) {
        this.entitiesByComponent.delete(type);
      }
    }
  }

  /**
   * Add entity to tag index
   */
  private addToTagIndex(entityId: EntityId, tag: string): void {
    if (!this.entitiesByTag.has(tag)) {
      this.entitiesByTag.set(tag, new Set());
    }
    this.entitiesByTag.get(tag)!.add(entityId);
  }

  /**
   * Remove entity from tag index
   */
  private removeFromTagIndex(entityId: EntityId, tag: string): void {
    const entities = this.entitiesByTag.get(tag);
    if (entities) {
      entities.delete(entityId);
      if (entities.size === 0) {
        this.entitiesByTag.delete(tag);
      }
    }
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `EntityManager | Total: ${stats.total}, Active: ${stats.active}, Created: ${stats.created}, Destroyed: ${stats.destroyed}`;
  }
}
