/**
 * Component Management System
 * 
 * Complete component system for the ECS architecture:
 * - Component: Base component class
 * - ComponentManager: Component lifecycle management
 * - ComponentRegistry: Component metadata and registration
 * - ComponentPool: Object pooling for components
 * - ComponentSerializer: Component serialization/deserialization
 */

export { Component, createComponentClass } from './Component';

export { ComponentManager, ComponentEvent } from './ComponentManager';
export type { ComponentManagerConfig } from './ComponentManager';

export { ComponentRegistry } from './ComponentRegistry';
export type {
  ComponentMetadata,
  ValidationResult
} from './ComponentRegistry';

export { ComponentPool } from './ComponentPool';
export type {
  ComponentPoolConfig,
  ComponentPoolStats
} from './ComponentPool';

export { ComponentSerializer } from './ComponentSerializer';
export type {
  SerializedComponentData,
  ComponentSerializationOptions,
  ComponentDeserializationOptions
} from './ComponentSerializer';
