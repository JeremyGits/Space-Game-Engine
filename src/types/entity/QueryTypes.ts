/**
 * Query Types
 * 
 * Type definitions for entity query system
 */

import { EntityId } from './EntityTypes';
import { ComponentTypeId } from './ComponentTypes';

/**
 * Query operator
 */
export enum QueryOperator {
  /** All components must be present */
  ALL = 'all',
  
  /** Any of the components must be present */
  ANY = 'any',
  
  /** None of the components must be present */
  NONE = 'none'
}

/**
 * Query filter
 */
export interface QueryFilter {
  /** Component types */
  components: ComponentTypeId[];
  
  /** Operator */
  operator: QueryOperator;
}

/**
 * Query builder
 */
export interface IQueryBuilder {
  /** Add ALL filter */
  all(...components: ComponentTypeId[]): IQueryBuilder;
  
  /** Add ANY filter */
  any(...components: ComponentTypeId[]): IQueryBuilder;
  
  /** Add NONE filter */
  none(...components: ComponentTypeId[]): IQueryBuilder;
  
  /** Add tag filter */
  withTag(...tags: string[]): IQueryBuilder;
  
  /** Add layer filter */
  onLayer(layer: number): IQueryBuilder;
  
  /** Only active entities */
  activeOnly(): IQueryBuilder;
  
  /** Build and execute query */
  execute(): EntityId[];
  
  /** Build query without executing */
  build(): Query;
}

/**
 * Query definition
 */
export interface Query {
  /** Query ID */
  id: string;
  
  /** Query filters */
  filters: QueryFilter[];
  
  /** Required tags */
  tags: string[];
  
  /** Layer mask */
  layerMask?: number;
  
  /** Only active entities */
  activeOnly: boolean;
  
  /** Cache results */
  cached: boolean;
  
  /** Cache TTL (milliseconds) */
  cacheTTL: number;
}

/**
 * Query cache entry
 */
export interface QueryCacheEntry {
  /** Query */
  query: Query;
  
  /** Cached results */
  results: EntityId[];
  
  /** Cache timestamp */
  timestamp: number;
  
  /** Cache hits */
  hits: number;
  
  /** Is valid */
  valid: boolean;
}

/**
 * Query execution context
 */
export interface QueryExecutionContext {
  /** Query being executed */
  query: Query;
  
  /** Start time */
  startTime: number;
  
  /** Entities tested */
  entitiesTested: number;
  
  /** Entities matched */
  entitiesMatched: number;
  
  /** Cache hit */
  cacheHit: boolean;
}

/**
 * Query execution result
 */
export interface QueryExecutionResult {
  /** Matching entities */
  entities: EntityId[];
  
  /** Execution time (milliseconds) */
  executionTime: number;
  
  /** Entities tested */
  entitiesTested: number;
  
  /** Cache hit */
  cacheHit: boolean;
  
  /** Query ID */
  queryId: string;
}

/**
 * Query optimization hint
 */
export enum QueryOptimizationHint {
  /** No optimization */
  NONE = 'none',
  
  /** Optimize for speed */
  SPEED = 'speed',
  
  /** Optimize for memory */
  MEMORY = 'memory',
  
  /** Balance speed and memory */
  BALANCED = 'balanced'
}

/**
 * Query statistics
 */
export interface QueryStatistics {
  /** Total queries executed */
  totalExecuted: number;
  
  /** Cache hits */
  cacheHits: number;
  
  /** Cache misses */
  cacheMisses: number;
  
  /** Cache hit rate */
  cacheHitRate: number;
  
  /** Average execution time (milliseconds) */
  averageExecutionTime: number;
  
  /** Total execution time (milliseconds) */
  totalExecutionTime: number;
  
  /** Queries by type */
  queriesByType: Map<string, number>;
}

/**
 * Query configuration
 */
export interface QueryConfig {
  /** Enable query caching */
  enableCaching?: boolean;
  
  /** Default cache TTL (milliseconds) */
  defaultCacheTTL?: number;
  
  /** Maximum cache size */
  maxCacheSize?: number;
  
  /** Optimization hint */
  optimizationHint?: QueryOptimizationHint;
  
  /** Enable query statistics */
  enableStatistics?: boolean;
}

/**
 * Default query configuration
 */
export const DEFAULT_QUERY_CONFIG: Required<QueryConfig> = {
  enableCaching: true,
  defaultCacheTTL: 1000,
  maxCacheSize: 100,
  optimizationHint: QueryOptimizationHint.BALANCED,
  enableStatistics: true
};
