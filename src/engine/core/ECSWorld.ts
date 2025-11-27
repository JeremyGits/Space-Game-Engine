/**
 * ECSWorld
 * 
 * The main ECS (Entity Component System) world that manages all entities,
 * components, and provides efficient querying capabilities.
 */

import { EventEmitter } from './EventEmitter';
import { Entity } from './Entity';
import {
  IECSWorld,
  IEntity,
  IComponent,
  EntityId,
  ComponentType,
  EntityQuery,
  ECSWorldConfig,
  ECSEventType,
  ECSStats
} from '../../types/engine/ECSTypes';

export class ECSWorld implements IECSWorld {
  private eventEmitter: EventEmitter;
  private config: ECSWorldConfig;
  
  // Entity storage
  private entities: Map<EntityId, IEntity> = new Map();
  private entityIdCounter: number = 0;
  
  // Archetype storage (for efficient queries)
  private archetypes: Map<string, Set<EntityId>> = new Map();
  
  // Component index (type -> entity IDs)
  private componentIndex: Map<ComponentType, Set<EntityId>> = new Map();
  
  // Tag index
  private tagIndex: Map<string, Set<EntityId>> = new Map();
  
  // Performance tracking
  private stats: ECSStats = {
    entityCount: 0,
    componentCount: 0,
    archetypeCount: 0,
    queryTime: 0,
    updateTime: 0
  };

  constructor(eventEmitter: EventEmitter, config: ECSWorldConfig = {}) {
    this.eventEmitter = eventEmitter;
    this.config = {
      maxEntities: 10000,
      enableArchetypes: true,
      enableComponentPools: false,
      ...config
    };
  }

  /**
   * Create a new entity
   */
  createEntity(name?: string): IEntity {
    if (this.entities.size >= this.config.maxEntities!) {
      throw new Error(`Maximum entity count reached: ${this.config.maxEntities}`);
    }

    const id = this.generateEntityId();
    const entity = new Entity(id, name || `Entity_${id}`);
    
    this.entities.set(id, entity);
    this.stats.entityCount++;
    
    // Emit event
    this.eventEmitter.emit(ECSEventType.ENTITY_CREATED, {
      entityId: id
    });

    console.log(`[ECSWorld] Created entity: ${entity.name} (${id})`);
    return entity;
  }

  /**
   * Destroy an entity
   */
  destroyEntity(entityId: EntityId): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return;
    }

    // Remove from component index
    entity.getComponentTypes().forEach(type => {
      const entitySet = this.componentIndex.get(type);
      if (entitySet) {
        entitySet.delete(entityId);
        if (entitySet.size === 0) {
          this.componentIndex.delete(type);
        }
      }
      this.stats.componentCount--;
    });

    // Remove from tag index
    entity.tags.forEach(tag => {
      const entitySet = this.tagIndex.get(tag);
      if (entitySet) {
        entitySet.delete(entityId);
        if (entitySet.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });

    // Remove from archetype
    if (this.config.enableArchetypes) {
      const signature = (entity as Entity).getSignature();
      const archetype = this.archetypes.get(signature);
      if (archetype) {
        archetype.delete(entityId);
        if (archetype.size === 0) {
          this.archetypes.delete(signature);
          this.stats.archetypeCount--;
        }
      }
    }

    // Destroy entity
    entity.destroy();
    this.entities.delete(entityId);
    this.stats.entityCount--;

    // Emit event
    this.eventEmitter.emit(ECSEventType.ENTITY_DESTROYED, {
      entityId
    });

    console.log(`[ECSWorld] Destroyed entity: ${entityId}`);
  }

  /**
   * Get an entity by ID
   */
  getEntity(entityId: EntityId): IEntity | null {
    return this.entities.get(entityId) || null;
  }

  /**
   * Get all entities
   */
  getAllEntities(): IEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Query entities based on component requirements
   */
  query(query: EntityQuery): IEntity[] {
    const startTime = performance.now();
    let results: Set<EntityId> = new Set(this.entities.keys());

    // Filter by required components (ALL)
    if (query.all && query.all.length > 0) {
      query.all.forEach(type => {
        const entitySet = this.componentIndex.get(type);
        if (entitySet) {
          results = new Set([...results].filter(id => entitySet.has(id)));
        } else {
          results.clear();
        }
      });
    }

    // Filter by any components (ANY)
    if (query.any && query.any.length > 0) {
      const anySet = new Set<EntityId>();
      query.any.forEach(type => {
        const entitySet = this.componentIndex.get(type);
        if (entitySet) {
          entitySet.forEach(id => anySet.add(id));
        }
      });
      results = new Set([...results].filter(id => anySet.has(id)));
    }

    // Filter by excluded components (NONE)
    if (query.none && query.none.length > 0) {
      query.none.forEach(type => {
        const entitySet = this.componentIndex.get(type);
        if (entitySet) {
          results = new Set([...results].filter(id => !entitySet.has(id)));
        }
      });
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      query.tags.forEach(tag => {
        const entitySet = this.tagIndex.get(tag);
        if (entitySet) {
          results = new Set([...results].filter(id => entitySet.has(id)));
        } else {
          results.clear();
        }
      });
    }

    // Convert to entities
    const entities = Array.from(results)
      .map(id => this.entities.get(id))
      .filter(entity => entity !== undefined) as IEntity[];

    this.stats.queryTime = performance.now() - startTime;
    return entities;
  }

  /**
   * Query all components of a specific type
   */
  queryComponents<T extends IComponent>(type: ComponentType): T[] {
    const entitySet = this.componentIndex.get(type);
    if (!entitySet) {
      return [];
    }

    const components: T[] = [];
    entitySet.forEach(entityId => {
      const entity = this.entities.get(entityId);
      if (entity) {
        const component = entity.getComponent<T>(type);
        if (component) {
          components.push(component);
        }
      }
    });

    return components;
  }

  /**
   * Add component to entity (with indexing)
   */
  addComponentToEntity(entityId: EntityId, component: IComponent): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    // Remove from old archetype
    if (this.config.enableArchetypes) {
      const oldSignature = (entity as Entity).getSignature();
      const oldArchetype = this.archetypes.get(oldSignature);
      if (oldArchetype) {
        oldArchetype.delete(entityId);
        if (oldArchetype.size === 0) {
          this.archetypes.delete(oldSignature);
          this.stats.archetypeCount--;
        }
      }
    }

    // Add component
    entity.addComponent(component);
    this.stats.componentCount++;

    // Update component index
    if (!this.componentIndex.has(component.type)) {
      this.componentIndex.set(component.type, new Set());
    }
    this.componentIndex.get(component.type)!.add(entityId);

    // Add to new archetype
    if (this.config.enableArchetypes) {
      const newSignature = (entity as Entity).getSignature();
      if (!this.archetypes.has(newSignature)) {
        this.archetypes.set(newSignature, new Set());
        this.stats.archetypeCount++;
      }
      this.archetypes.get(newSignature)!.add(entityId);
    }

    // Emit event
    this.eventEmitter.emit(ECSEventType.COMPONENT_ADDED, {
      entityId,
      componentType: component.type
    });
  }

  /**
   * Remove component from entity (with indexing)
   */
  removeComponentFromEntity(entityId: EntityId, type: ComponentType): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return;
    }

    if (!entity.hasComponent(type)) {
      return;
    }

    // Remove from old archetype
    if (this.config.enableArchetypes) {
      const oldSignature = (entity as Entity).getSignature();
      const oldArchetype = this.archetypes.get(oldSignature);
      if (oldArchetype) {
        oldArchetype.delete(entityId);
        if (oldArchetype.size === 0) {
          this.archetypes.delete(oldSignature);
          this.stats.archetypeCount--;
        }
      }
    }

    // Remove component
    entity.removeComponent(type);
    this.stats.componentCount--;

    // Update component index
    const entitySet = this.componentIndex.get(type);
    if (entitySet) {
      entitySet.delete(entityId);
      if (entitySet.size === 0) {
        this.componentIndex.delete(type);
      }
    }

    // Add to new archetype
    if (this.config.enableArchetypes) {
      const newSignature = (entity as Entity).getSignature();
      if (newSignature) {
        if (!this.archetypes.has(newSignature)) {
          this.archetypes.set(newSignature, new Set());
          this.stats.archetypeCount++;
        }
        this.archetypes.get(newSignature)!.add(entityId);
      }
    }

    // Emit event
    this.eventEmitter.emit(ECSEventType.COMPONENT_REMOVED, {
      entityId,
      componentType: type
    });
  }

  /**
   * Add tag to entity (with indexing)
   */
  addTagToEntity(entityId: EntityId, tag: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return;
    }

    entity.addTag(tag);

    // Update tag index
    if (!this.tagIndex.has(tag)) {
      this.tagIndex.set(tag, new Set());
    }
    this.tagIndex.get(tag)!.add(entityId);
  }

  /**
   * Remove tag from entity (with indexing)
   */
  removeTagFromEntity(entityId: EntityId, tag: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return;
    }

    entity.removeTag(tag);

    // Update tag index
    const entitySet = this.tagIndex.get(tag);
    if (entitySet) {
      entitySet.delete(entityId);
      if (entitySet.size === 0) {
        this.tagIndex.delete(tag);
      }
    }
  }

  /**
   * Update all entities
   */
  update(deltaTime: number): void {
    const startTime = performance.now();

    this.entities.forEach(entity => {
      if (entity.active) {
        (entity as Entity).update(deltaTime);
      }
    });

    this.stats.updateTime = performance.now() - startTime;
  }

  /**
   * Clear all entities
   */
  clear(): void {
    // Destroy all entities
    const entityIds = Array.from(this.entities.keys());
    entityIds.forEach(id => this.destroyEntity(id));

    // Clear all indexes
    this.entities.clear();
    this.componentIndex.clear();
    this.tagIndex.clear();
    this.archetypes.clear();

    // Reset stats
    this.stats = {
      entityCount: 0,
      componentCount: 0,
      archetypeCount: 0,
      queryTime: 0,
      updateTime: 0
    };

    console.log('[ECSWorld] Cleared all entities');
  }

  /**
   * Get entity count
   */
  getEntityCount(): number {
    return this.entities.size;
  }

  /**
   * Get component count
   */
  getComponentCount(): number {
    return this.stats.componentCount;
  }

  /**
   * Get statistics
   */
  getStats(): ECSStats {
    return { ...this.stats };
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `ECSWorld | Entities: ${this.stats.entityCount}, Components: ${this.stats.componentCount}, Archetypes: ${this.stats.archetypeCount}, Query Time: ${this.stats.queryTime.toFixed(2)}ms, Update Time: ${this.stats.updateTime.toFixed(2)}ms`;
  }

  /**
   * Generate unique entity ID
   */
  private generateEntityId(): EntityId {
    return `entity_${++this.entityIdCounter}`;
  }
}
