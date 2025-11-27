/**
 * Component Types
 * 
 * Type definitions for ECS components
 */

import { EntityId } from './EntityTypes';

/**
 * Component type ID
 */
export type ComponentTypeId = string;

/**
 * Component interface
 */
export interface IComponent {
  /** Component type ID */
  readonly typeId: ComponentTypeId;
  
  /** Owning entity */
  entityId: EntityId;
  
  /** Is enabled */
  enabled: boolean;
}

/**
 * Component metadata
 */
export interface ComponentMetadata {
  /** Component type ID */
  typeId: ComponentTypeId;
  
  /** Component name */
  name: string;
  
  /** Component constructor */
  constructor: new () => IComponent;
  
  /** Component size (bytes) */
  size: number;
  
  /** Is singleton */
  singleton: boolean;
  
  /** Dependencies */
  dependencies: ComponentTypeId[];
  
  /** Conflicts with */
  conflicts: ComponentTypeId[];
}

/**
 * Component lifecycle hooks
 */
export interface ComponentLifecycleHooks<T extends IComponent = IComponent> {
  /** Called when component is added */
  onAdd?: (component: T) => void;
  
  /** Called when component is enabled */
  onEnable?: (component: T) => void;
  
  /** Called when component is disabled */
  onDisable?: (component: T) => void;
  
  /** Called when component is removed */
  onRemove?: (component: T) => void;
}

/**
 * Component serialization
 */
export interface ComponentSerialization<T extends IComponent = IComponent> {
  /** Serialize component to JSON */
  serialize: (component: T) => any;
  
  /** Deserialize component from JSON */
  deserialize: (data: any) => T;
}

/**
 * Component pool configuration
 */
export interface ComponentPoolConfig {
  /** Initial pool size */
  initialSize?: number;
  
  /** Maximum pool size */
  maxSize?: number;
  
  /** Enable auto-expansion */
  autoExpand?: boolean;
  
  /** Expansion increment */
  expansionIncrement?: number;
}

/**
 * Component statistics
 */
export interface ComponentStatistics {
  /** Total components */
  total: number;
  
  /** Active components */
  active: number;
  
  /** Pooled components */
  pooled: number;
  
  /** Memory usage (bytes) */
  memoryUsage: number;
  
  /** Pool utilization */
  poolUtilization: number;
}

/**
 * Default component pool configuration
 */
export const DEFAULT_COMPONENT_POOL_CONFIG: Required<ComponentPoolConfig> = {
  initialSize: 100,
  maxSize: 1000,
  autoExpand: true,
  expansionIncrement: 50
};
