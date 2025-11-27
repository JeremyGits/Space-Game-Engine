/**
 * Entity Component System (ECS) Type Definitions
 * 
 * Types for the ECS architecture which provides a flexible,
 * data-oriented approach to game object composition.
 */

/**
 * Entity ID type (unique identifier)
 */
export type EntityId = string;

/**
 * Component type identifier
 */
export type ComponentType = string;

/**
 * Component interface
 * All components must implement this interface
 */
export interface IComponent {
  type: ComponentType;
  enabled: boolean;
}

/**
 * Entity interface
 * Represents a game object as a collection of components
 */
export interface IEntity {
  id: EntityId;
  name: string;
  active: boolean;
  tags: Set<string>;
  
  // Component management
  addComponent(component: IComponent): void;
  removeComponent(type: ComponentType): void;
  getComponent<T extends IComponent>(type: ComponentType): T | null;
  hasComponent(type: ComponentType): boolean;
  getComponents(): IComponent[];
  getComponentTypes(): ComponentType[];
  
  // Tag management
  addTag(tag: string): void;
  removeTag(tag: string): void;
  hasTag(tag: string): boolean;
  
  // Lifecycle
  destroy(): void;
}

/**
 * Component constructor type
 */
export type ComponentConstructor<T extends IComponent> = new (...args: any[]) => T;

/**
 * Entity query for filtering entities
 */
export interface EntityQuery {
  all?: ComponentType[];      // Must have all these components
  any?: ComponentType[];      // Must have at least one of these
  none?: ComponentType[];     // Must not have any of these
  tags?: string[];            // Must have these tags
}

/**
 * Entity archetype (component signature)
 */
export type Archetype = Set<ComponentType>;

/**
 * ECS World configuration
 */
export interface ECSWorldConfig {
  maxEntities?: number;
  enableArchetypes?: boolean;
  enableComponentPools?: boolean;
}

/**
 * ECS World interface
 * Manages all entities and components
 */
export interface IECSWorld {
  // Entity management
  createEntity(name?: string): IEntity;
  destroyEntity(entityId: EntityId): void;
  getEntity(entityId: EntityId): IEntity | null;
  getAllEntities(): IEntity[];
  
  // Queries
  query(query: EntityQuery): IEntity[];
  queryComponents<T extends IComponent>(type: ComponentType): T[];
  
  // Lifecycle
  update(deltaTime: number): void;
  clear(): void;
  
  // Statistics
  getEntityCount(): number;
  getComponentCount(): number;
}

/**
 * Component pool for object reuse
 */
export interface IComponentPool<T extends IComponent> {
  acquire(): T;
  release(component: T): void;
  clear(): void;
  getSize(): number;
}

/**
 * ECS events
 */
export enum ECSEventType {
  ENTITY_CREATED = 'ecs:entity:created',
  ENTITY_DESTROYED = 'ecs:entity:destroyed',
  COMPONENT_ADDED = 'ecs:component:added',
  COMPONENT_REMOVED = 'ecs:component:removed',
  COMPONENT_ENABLED = 'ecs:component:enabled',
  COMPONENT_DISABLED = 'ecs:component:disabled'
}

/**
 * ECS event data
 */
export interface ECSEvent {
  entityId: EntityId;
  componentType?: ComponentType;
}

/**
 * Common component types
 */
export enum CommonComponentType {
  TRANSFORM = 'Transform',
  MESH = 'Mesh',
  MATERIAL = 'Material',
  RIGIDBODY = 'RigidBody',
  COLLIDER = 'Collider',
  CAMERA = 'Camera',
  LIGHT = 'Light',
  SCRIPT = 'Script',
  AUDIO_SOURCE = 'AudioSource',
  PARTICLE_SYSTEM = 'ParticleSystem'
}

/**
 * ECS statistics
 */
export interface ECSStats {
  entityCount: number;
  componentCount: number;
  archetypeCount: number;
  queryTime: number;
  updateTime: number;
}

/**
 * Base component class
 */
export abstract class BaseComponent implements IComponent {
  abstract readonly type: ComponentType;
  public enabled: boolean = true;
  
  /**
   * Called when component is added to entity
   */
  onAdd?(): void;
  
  /**
   * Called when component is removed from entity
   */
  onRemove?(): void;
  
  /**
   * Called when component is enabled
   */
  onEnable?(): void;
  
  /**
   * Called when component is disabled
   */
  onDisable?(): void;
  
  /**
   * Update component
   */
  update?(deltaTime: number): void;
}
