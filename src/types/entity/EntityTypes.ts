/**
 * Entity Types
 * 
 * Type definitions for entity management in ECS
 */

/**
 * Entity ID type
 */
export type EntityId = string;

/**
 * Entity metadata
 */
export interface EntityMetadata {
  /** Entity ID */
  id: EntityId;
  
  /** Entity name */
  name: string;
  
  /** Entity tags */
  tags: Set<string>;
  
  /** Entity layer */
  layer: number;
  
  /** Is active */
  active: boolean;
  
  /** Creation timestamp */
  createdAt: number;
  
  /** Last update timestamp */
  updatedAt: number;
  
  /** User data */
  userData: Record<string, any>;
}

/**
 * Entity state
 */
export enum EntityState {
  /** Entity is being created */
  CREATING = 'creating',
  
  /** Entity is active */
  ACTIVE = 'active',
  
  /** Entity is inactive */
  INACTIVE = 'inactive',
  
  /** Entity is being destroyed */
  DESTROYING = 'destroying',
  
  /** Entity is destroyed */
  DESTROYED = 'destroyed'
}

/**
 * Entity lifecycle hooks
 */
export interface EntityLifecycleHooks {
  /** Called when entity is created */
  onCreate?: (entity: EntityId) => void;
  
  /** Called when entity is activated */
  onActivate?: (entity: EntityId) => void;
  
  /** Called when entity is deactivated */
  onDeactivate?: (entity: EntityId) => void;
  
  /** Called when entity is destroyed */
  onDestroy?: (entity: EntityId) => void;
}

/**
 * Entity creation options
 */
export interface EntityCreationOptions {
  /** Entity name */
  name?: string;
  
  /** Initial tags */
  tags?: string[];
  
  /** Layer */
  layer?: number;
  
  /** Is active */
  active?: boolean;
  
  /** User data */
  userData?: Record<string, any>;
  
  /** Lifecycle hooks */
  hooks?: EntityLifecycleHooks;
}

/**
 * Entity archetype
 */
export interface EntityArchetype {
  /** Archetype ID */
  id: string;
  
  /** Component type IDs */
  componentTypes: Set<string>;
  
  /** Entities with this archetype */
  entities: Set<EntityId>;
  
  /** Component storage */
  componentStorage: Map<string, any[]>;
}

/**
 * Entity query descriptor
 */
export interface EntityQueryDescriptor {
  /** Required components (all must be present) */
  all?: string[];
  
  /** Any of these components (at least one must be present) */
  any?: string[];
  
  /** None of these components (must not be present) */
  none?: string[];
  
  /** Required tags */
  tags?: string[];
  
  /** Layer mask */
  layerMask?: number;
  
  /** Only active entities */
  activeOnly?: boolean;
}

/**
 * Entity query result
 */
export interface EntityQueryResult {
  /** Matching entities */
  entities: EntityId[];
  
  /** Query execution time (milliseconds) */
  executionTime: number;
  
  /** Number of entities tested */
  entitiesTested: number;
  
  /** Cache hit */
  cacheHit: boolean;
}

/**
 * Entity event types
 */
export enum EntityEventType {
  CREATED = 'created',
  DESTROYED = 'destroyed',
  ACTIVATED = 'activated',
  DEACTIVATED = 'deactivated',
  COMPONENT_ADDED = 'component-added',
  COMPONENT_REMOVED = 'component-removed',
  TAG_ADDED = 'tag-added',
  TAG_REMOVED = 'tag-removed'
}

/**
 * Entity event
 */
export interface EntityEvent {
  /** Event type */
  type: EntityEventType;
  
  /** Entity ID */
  entityId: EntityId;
  
  /** Event data */
  data?: any;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * Entity pool configuration
 */
export interface EntityPoolConfig {
  /** Initial pool size */
  initialSize?: number;
  
  /** Maximum pool size */
  maxSize?: number;
  
  /** Enable auto-expansion */
  autoExpand?: boolean;
  
  /** Expansion increment */
  expansionIncrement?: number;
  
  /** Enable recycling */
  enableRecycling?: boolean;
}

/**
 * Entity statistics
 */
export interface EntityStatistics {
  /** Total entities */
  total: number;
  
  /** Active entities */
  active: number;
  
  /** Inactive entities */
  inactive: number;
  
  /** Entities by archetype */
  byArchetype: Map<string, number>;
  
  /** Entities by tag */
  byTag: Map<string, number>;
  
  /** Entities by layer */
  byLayer: Map<number, number>;
  
  /** Pool utilization */
  poolUtilization: number;
  
  /** Memory usage (bytes) */
  memoryUsage: number;
}

/**
 * Default entity pool configuration
 */
export const DEFAULT_ENTITY_POOL_CONFIG: Required<EntityPoolConfig> = {
  initialSize: 1000,
  maxSize: 10000,
  autoExpand: true,
  expansionIncrement: 500,
  enableRecycling: true
};
