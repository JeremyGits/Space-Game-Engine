/**
 * ComponentManager
 * 
 * Manages all component instances and their lifecycle.
 * Provides efficient component lookup and batch operations.
 */

import { EventEmitter } from '../EventEmitter';
import { ComponentType, IComponent, EntityId } from '../../../types/engine/ECSTypes';

/**
 * Component events
 */
export enum ComponentEvent {
  COMPONENT_REGISTERED = 'component:registered',
  COMPONENT_CREATED = 'component:created',
  COMPONENT_DESTROYED = 'component:destroyed',
  COMPONENT_ENABLED = 'component:enabled',
  COMPONENT_DISABLED = 'component:disabled'
}

/**
 * Component manager configuration
 */
export interface ComponentManagerConfig {
  enableEvents?: boolean;
  enablePooling?: boolean;
  maxComponentsPerType?: number;
}

export class ComponentManager {
  private eventEmitter: EventEmitter;
  private config: Required<ComponentManagerConfig>;
  
  // Component storage
  private componentsByType: Map<ComponentType, Map<EntityId, IComponent>> = new Map();
  private componentsByEntity: Map<EntityId, Set<ComponentType>> = new Map();
  
  // Component factories
  private componentFactories: Map<ComponentType, () => IComponent> = new Map();
  
  // Statistics
  private stats = {
    totalComponents: 0,
    componentsByType: new Map<ComponentType, number>()
  };

  constructor(eventEmitter: EventEmitter, config: ComponentManagerConfig = {}) {
    this.eventEmitter = eventEmitter;
    this.config = {
      enableEvents: config.enableEvents !== false,
      enablePooling: config.enablePooling || false,
      maxComponentsPerType: config.maxComponentsPerType || 10000
    };
  }

  /**
   * Register a component factory
   */
  registerComponentFactory(type: ComponentType, factory: () => IComponent): void {
    if (this.componentFactories.has(type)) {
      console.warn(`[ComponentManager] Component factory already registered: ${type}`);
      return;
    }

    this.componentFactories.set(type, factory);
    this.componentsByType.set(type, new Map());
    this.stats.componentsByType.set(type, 0);

    if (this.config.enableEvents) {
      this.eventEmitter.emit(ComponentEvent.COMPONENT_REGISTERED, { type });
    }

    console.log(`[ComponentManager] Registered component factory: ${type}`);
  }

  /**
   * Create a component instance
   */
  createComponent(type: ComponentType): IComponent {
    const factory = this.componentFactories.get(type);
    if (!factory) {
      throw new Error(`Component factory not registered: ${type}`);
    }

    const component = factory();
    this.stats.totalComponents++;
    
    const typeCount = this.stats.componentsByType.get(type) || 0;
    this.stats.componentsByType.set(type, typeCount + 1);

    if (this.config.enableEvents) {
      this.eventEmitter.emit(ComponentEvent.COMPONENT_CREATED, { type });
    }

    return component;
  }

  /**
   * Add component to entity
   */
  addComponent(entityId: EntityId, component: IComponent): void {
    const type = component.type;

    // Get or create type map
    if (!this.componentsByType.has(type)) {
      this.componentsByType.set(type, new Map());
    }

    const typeMap = this.componentsByType.get(type)!;
    
    // Check max limit
    if (typeMap.size >= this.config.maxComponentsPerType) {
      throw new Error(`Maximum components reached for type: ${type}`);
    }

    // Add to type map
    typeMap.set(entityId, component);

    // Track entity's components
    if (!this.componentsByEntity.has(entityId)) {
      this.componentsByEntity.set(entityId, new Set());
    }
    this.componentsByEntity.get(entityId)!.add(type);

    console.log(`[ComponentManager] Added component ${type} to entity ${entityId}`);
  }

  /**
   * Remove component from entity
   */
  removeComponent(entityId: EntityId, type: ComponentType): void {
    const typeMap = this.componentsByType.get(type);
    if (!typeMap) return;

    const component = typeMap.get(entityId);
    if (!component) return;

    // Remove from type map
    typeMap.delete(entityId);

    // Remove from entity tracking
    const entityComponents = this.componentsByEntity.get(entityId);
    if (entityComponents) {
      entityComponents.delete(type);
      if (entityComponents.size === 0) {
        this.componentsByEntity.delete(entityId);
      }
    }

    // Update stats
    this.stats.totalComponents--;
    const typeCount = this.stats.componentsByType.get(type) || 0;
    this.stats.componentsByType.set(type, Math.max(0, typeCount - 1));

    if (this.config.enableEvents) {
      this.eventEmitter.emit(ComponentEvent.COMPONENT_DESTROYED, { entityId, type });
    }

    console.log(`[ComponentManager] Removed component ${type} from entity ${entityId}`);
  }

  /**
   * Get component from entity
   */
  getComponent<T extends IComponent>(entityId: EntityId, type: ComponentType): T | null {
    const typeMap = this.componentsByType.get(type);
    if (!typeMap) return null;
    return (typeMap.get(entityId) as T) || null;
  }

  /**
   * Check if entity has component
   */
  hasComponent(entityId: EntityId, type: ComponentType): boolean {
    const entityComponents = this.componentsByEntity.get(entityId);
    return entityComponents ? entityComponents.has(type) : false;
  }

  /**
   * Get all components of an entity
   */
  getEntityComponents(entityId: EntityId): IComponent[] {
    const componentTypes = this.componentsByEntity.get(entityId);
    if (!componentTypes) return [];

    const components: IComponent[] = [];
    componentTypes.forEach(type => {
      const component = this.getComponent(entityId, type);
      if (component) components.push(component);
    });

    return components;
  }

  /**
   * Get all component types of an entity
   */
  getEntityComponentTypes(entityId: EntityId): ComponentType[] {
    const componentTypes = this.componentsByEntity.get(entityId);
    return componentTypes ? Array.from(componentTypes) : [];
  }

  /**
   * Get all components of a type
   */
  getComponentsOfType<T extends IComponent>(type: ComponentType): T[] {
    const typeMap = this.componentsByType.get(type);
    if (!typeMap) return [];
    return Array.from(typeMap.values()) as T[];
  }

  /**
   * Get all entities with a component type
   */
  getEntitiesWithComponent(type: ComponentType): EntityId[] {
    const typeMap = this.componentsByType.get(type);
    if (!typeMap) return [];
    return Array.from(typeMap.keys());
  }

  /**
   * Remove all components from entity
   */
  removeAllComponents(entityId: EntityId): void {
    const componentTypes = this.componentsByEntity.get(entityId);
    if (!componentTypes) return;

    const types = Array.from(componentTypes);
    types.forEach(type => this.removeComponent(entityId, type));
  }

  /**
   * Enable component
   */
  enableComponent(entityId: EntityId, type: ComponentType): void {
    const component = this.getComponent(entityId, type);
    if (!component || component.enabled) return;

    component.enabled = true;

    if ('onEnable' in component && typeof component.onEnable === 'function') {
      component.onEnable();
    }

    if (this.config.enableEvents) {
      this.eventEmitter.emit(ComponentEvent.COMPONENT_ENABLED, { entityId, type });
    }
  }

  /**
   * Disable component
   */
  disableComponent(entityId: EntityId, type: ComponentType): void {
    const component = this.getComponent(entityId, type);
    if (!component || !component.enabled) return;

    component.enabled = false;

    if ('onDisable' in component && typeof component.onDisable === 'function') {
      component.onDisable();
    }

    if (this.config.enableEvents) {
      this.eventEmitter.emit(ComponentEvent.COMPONENT_DISABLED, { entityId, type });
    }
  }

  /**
   * Update all components of a type
   */
  updateComponentsOfType(type: ComponentType, deltaTime: number): void {
    const components = this.getComponentsOfType(type);
    
    components.forEach(component => {
      if (component.enabled && 'update' in component && typeof component.update === 'function') {
        component.update(deltaTime);
      }
    });
  }

  /**
   * Update all components
   */
  updateAll(deltaTime: number): void {
    this.componentsByType.forEach((_, type) => {
      this.updateComponentsOfType(type, deltaTime);
    });
  }

  /**
   * Get registered component types
   */
  getRegisteredTypes(): ComponentType[] {
    return Array.from(this.componentFactories.keys());
  }

  /**
   * Check if component type is registered
   */
  isTypeRegistered(type: ComponentType): boolean {
    return this.componentFactories.has(type);
  }

  /**
   * Get component count for type
   */
  getComponentCount(type: ComponentType): number {
    const typeMap = this.componentsByType.get(type);
    return typeMap ? typeMap.size : 0;
  }

  /**
   * Get total component count
   */
  getTotalComponentCount(): number {
    return this.stats.totalComponents;
  }

  /**
   * Clear all components
   */
  clear(): void {
    this.componentsByType.forEach(typeMap => typeMap.clear());
    this.componentsByEntity.clear();
    this.stats.totalComponents = 0;
    this.stats.componentsByType.forEach((_, type) => {
      this.stats.componentsByType.set(type, 0);
    });

    console.log('[ComponentManager] Cleared all components');
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalComponents: number;
    registeredTypes: number;
    componentsByType: Map<ComponentType, number>;
    entitiesWithComponents: number;
  } {
    return {
      totalComponents: this.stats.totalComponents,
      registeredTypes: this.componentFactories.size,
      componentsByType: new Map(this.stats.componentsByType),
      entitiesWithComponents: this.componentsByEntity.size
    };
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `ComponentManager | Total: ${stats.totalComponents}, Types: ${stats.registeredTypes}, Entities: ${stats.entitiesWithComponents}`;
  }
}
