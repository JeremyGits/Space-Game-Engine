/**
 * EntitySerializer
 * 
 * Serialization and deserialization system for entities.
 * Supports JSON format for saving/loading game state.
 */

import { Entity } from '../Entity';
import { EntityManager } from './EntityManager';
import { EntityFactory } from './EntityFactory';
import {
  EntityId,
  ComponentType,
  IComponent
} from '../../../types/engine/ECSTypes';

/**
 * Serialized entity data
 */
export interface SerializedEntity {
  id: EntityId;
  name: string;
  active: boolean;
  tags: string[];
  components: SerializedComponent[];
}

/**
 * Serialized component data
 */
export interface SerializedComponent {
  type: ComponentType;
  enabled: boolean;
  data: Record<string, any>;
}

/**
 * Serialization options
 */
export interface SerializationOptions {
  includeInactive?: boolean;
  includeDisabledComponents?: boolean;
  prettyPrint?: boolean;
  componentFilter?: (component: IComponent) => boolean;
  entityFilter?: (entity: Entity) => boolean;
}

/**
 * Deserialization options
 */
export interface DeserializationOptions {
  preserveIds?: boolean;
  skipMissingComponents?: boolean;
  componentFactories?: Map<ComponentType, () => IComponent>;
}

export class EntitySerializer {
  private entityManager: EntityManager;
  private componentSerializers: Map<ComponentType, (component: IComponent) => Record<string, any>> = new Map();
  private componentDeserializers: Map<ComponentType, (data: Record<string, any>) => IComponent> = new Map();

  constructor(entityManager: EntityManager, _entityFactory: EntityFactory) {
    this.entityManager = entityManager;
    // entityFactory parameter kept for API compatibility but not currently used
  }

  /**
   * Register component serializer
   */
  registerComponentSerializer(
    type: ComponentType,
    serializer: (component: IComponent) => Record<string, any>
  ): void {
    this.componentSerializers.set(type, serializer);
    console.log(`[EntitySerializer] Registered serializer for: ${type}`);
  }

  /**
   * Register component deserializer
   */
  registerComponentDeserializer(
    type: ComponentType,
    deserializer: (data: Record<string, any>) => IComponent
  ): void {
    this.componentDeserializers.set(type, deserializer);
    console.log(`[EntitySerializer] Registered deserializer for: ${type}`);
  }

  /**
   * Serialize an entity
   */
  serializeEntity(entity: Entity, options: SerializationOptions = {}): SerializedEntity {
    const components: SerializedComponent[] = [];

    entity.getComponents().forEach(component => {
      // Apply component filter
      if (options.componentFilter && !options.componentFilter(component)) {
        return;
      }

      // Skip disabled components if requested
      if (!options.includeDisabledComponents && !component.enabled) {
        return;
      }

      const serializedComponent = this.serializeComponent(component);
      if (serializedComponent) {
        components.push(serializedComponent);
      }
    });

    return {
      id: entity.id,
      name: entity.name,
      active: entity.active,
      tags: Array.from(entity.tags),
      components
    };
  }

  /**
   * Serialize a component
   */
  private serializeComponent(component: IComponent): SerializedComponent | null {
    const serializer = this.componentSerializers.get(component.type);
    
    let data: Record<string, any>;
    
    if (serializer) {
      // Use custom serializer
      data = serializer(component);
    } else {
      // Default serialization (shallow copy of properties)
      data = this.defaultSerialize(component);
    }

    return {
      type: component.type,
      enabled: component.enabled,
      data
    };
  }

  /**
   * Default component serialization
   */
  private defaultSerialize(component: IComponent): Record<string, any> {
    const data: Record<string, any> = {};
    
    Object.keys(component).forEach(key => {
      if (key === 'type' || key === 'enabled') return;
      
      const value = (component as any)[key];
      
      // Skip functions
      if (typeof value === 'function') return;
      
      // Handle special types
      if (value && typeof value === 'object') {
        if ('toJSON' in value && typeof value.toJSON === 'function') {
          data[key] = value.toJSON();
        } else if (Array.isArray(value)) {
          data[key] = [...value];
        } else {
          data[key] = { ...value };
        }
      } else {
        data[key] = value;
      }
    });
    
    return data;
  }

  /**
   * Deserialize an entity
   */
  deserializeEntity(
    serialized: SerializedEntity,
    options: DeserializationOptions = {}
  ): Entity {
    // Create entity
    const entity = options.preserveIds
      ? this.createEntityWithId(serialized.id, serialized.name)
      : this.entityManager.createEntity(serialized.name);

    entity.active = serialized.active;

    // Add tags
    serialized.tags.forEach(tag => {
      this.entityManager.addTagToEntity(entity.id, tag);
    });

    // Deserialize components
    serialized.components.forEach(serializedComponent => {
      try {
        const component = this.deserializeComponent(serializedComponent, options);
        if (component) {
          this.entityManager.addComponentToEntity(entity.id, component);
        }
      } catch (error) {
        if (!options.skipMissingComponents) {
          throw error;
        }
        console.warn(`[EntitySerializer] Failed to deserialize component: ${serializedComponent.type}`, error);
      }
    });

    return entity;
  }

  /**
   * Deserialize a component
   */
  private deserializeComponent(
    serialized: SerializedComponent,
    options: DeserializationOptions
  ): IComponent | null {
    const deserializer = this.componentDeserializers.get(serialized.type);
    
    let component: IComponent;
    
    if (deserializer) {
      // Use custom deserializer
      component = deserializer(serialized.data);
    } else if (options.componentFactories?.has(serialized.type)) {
      // Use provided factory
      const factory = options.componentFactories.get(serialized.type)!;
      component = factory();
      Object.assign(component, serialized.data);
    } else {
      throw new Error(`No deserializer or factory for component: ${serialized.type}`);
    }

    component.enabled = serialized.enabled;
    return component;
  }

  /**
   * Serialize multiple entities
   */
  serializeEntities(entities: Entity[], options: SerializationOptions = {}): SerializedEntity[] {
    return entities
      .filter(entity => {
        // Apply entity filter
        if (options.entityFilter && !options.entityFilter(entity)) {
          return false;
        }
        // Skip inactive if requested
        if (!options.includeInactive && !entity.active) {
          return false;
        }
        return true;
      })
      .map(entity => this.serializeEntity(entity, options));
  }

  /**
   * Deserialize multiple entities
   */
  deserializeEntities(
    serialized: SerializedEntity[],
    options: DeserializationOptions = {}
  ): Entity[] {
    return serialized.map(data => this.deserializeEntity(data, options));
  }

  /**
   * Serialize to JSON string
   */
  toJSON(entities: Entity[], options: SerializationOptions = {}): string {
    const serialized = this.serializeEntities(entities, options);
    return JSON.stringify(serialized, null, options.prettyPrint ? 2 : 0);
  }

  /**
   * Deserialize from JSON string
   */
  fromJSON(json: string, options: DeserializationOptions = {}): Entity[] {
    const serialized = JSON.parse(json) as SerializedEntity[];
    return this.deserializeEntities(serialized, options);
  }

  /**
   * Save entities to localStorage
   */
  saveToLocalStorage(key: string, entities: Entity[], options: SerializationOptions = {}): void {
    const json = this.toJSON(entities, options);
    localStorage.setItem(key, json);
    console.log(`[EntitySerializer] Saved ${entities.length} entities to localStorage: ${key}`);
  }

  /**
   * Load entities from localStorage
   */
  loadFromLocalStorage(key: string, options: DeserializationOptions = {}): Entity[] {
    const json = localStorage.getItem(key);
    if (!json) {
      throw new Error(`No data found in localStorage: ${key}`);
    }
    
    const entities = this.fromJSON(json, options);
    console.log(`[EntitySerializer] Loaded ${entities.length} entities from localStorage: ${key}`);
    return entities;
  }

  /**
   * Save all entities
   */
  saveAll(key: string, options: SerializationOptions = {}): void {
    const entities = this.entityManager.getAllEntities();
    this.saveToLocalStorage(key, entities, options);
  }

  /**
   * Load and replace all entities
   */
  loadAll(key: string, options: DeserializationOptions = {}): Entity[] {
    // Clear existing entities
    this.entityManager.clear();
    
    // Load new entities
    return this.loadFromLocalStorage(key, options);
  }

  /**
   * Export entities to downloadable file
   */
  exportToFile(entities: Entity[], filename: string, options: SerializationOptions = {}): void {
    const json = this.toJSON(entities, { ...options, prettyPrint: true });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log(`[EntitySerializer] Exported ${entities.length} entities to file: ${filename}`);
  }

  /**
   * Import entities from file
   */
  async importFromFile(file: File, options: DeserializationOptions = {}): Promise<Entity[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          const entities = this.fromJSON(json, options);
          console.log(`[EntitySerializer] Imported ${entities.length} entities from file: ${file.name}`);
          resolve(entities);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /**
   * Create entity with specific ID (internal use)
   */
  private createEntityWithId(id: EntityId, name: string): Entity {
    // This is a workaround - in production you'd want EntityManager to support this
    const entity = new Entity(id, name);
    // Manually register with manager (this assumes access to internal state)
    console.warn('[EntitySerializer] Creating entity with preserved ID - may cause conflicts');
    return entity;
  }

  /**
   * Clone entity data (without creating actual entity)
   */
  cloneEntityData(entity: Entity): SerializedEntity {
    return this.serializeEntity(entity);
  }

  /**
   * Get statistics
   */
  getStats(): {
    registeredSerializers: number;
    registeredDeserializers: number;
  } {
    return {
      registeredSerializers: this.componentSerializers.size,
      registeredDeserializers: this.componentDeserializers.size
    };
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `EntitySerializer | Serializers: ${stats.registeredSerializers}, Deserializers: ${stats.registeredDeserializers}`;
  }
}
