/**
 * Entity Management System
 * 
 * Complete entity management system with advanced features:
 * - EntityManager: Central entity lifecycle management
 * - EntityFactory: Template-based entity creation
 * - EntityPool: Object pooling for performance
 * - EntityQuery: Advanced entity querying
 * - EntitySerializer: Save/load entity state
 */

export { EntityManager, EntityEvent } from './EntityManager';
export type { EntityManagerConfig } from './EntityManager';

export { EntityFactory } from './EntityFactory';
export type {
  EntityTemplate,
  EntityBlueprint,
  BatchCreateOptions
} from './EntityFactory';

export { EntityPool } from './EntityPool';
export type {
  PoolConfig,
  PoolStats
} from './EntityPool';

export { EntityQuery, EntityQueryBuilder, QueryOperator } from './EntityQuery';
export type { ComponentQuery } from './EntityQuery';

export { EntitySerializer } from './EntitySerializer';
export type {
  SerializedEntity,
  SerializedComponent,
  SerializationOptions,
  DeserializationOptions
} from './EntitySerializer';
