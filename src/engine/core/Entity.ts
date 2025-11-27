/**
 * Entity
 * 
 * Represents a game object as a collection of components.
 * Entities are lightweight containers that hold components.
 */

import {
  IEntity,
  IComponent,
  EntityId,
  ComponentType
} from '../../types/engine/ECSTypes';

export class Entity implements IEntity {
  public readonly id: EntityId;
  public name: string;
  public active: boolean = true;
  public tags: Set<string> = new Set();
  
  private components: Map<ComponentType, IComponent> = new Map();
  private destroyed: boolean = false;

  constructor(id: EntityId, name: string = 'Entity') {
    this.id = id;
    this.name = name;
  }

  /**
   * Add a component to this entity
   */
  addComponent(component: IComponent): void {
    if (this.destroyed) {
      throw new Error(`Cannot add component to destroyed entity: ${this.id}`);
    }

    if (this.components.has(component.type)) {
      console.warn(`[Entity] Component ${component.type} already exists on entity ${this.name}`);
      return;
    }

    this.components.set(component.type, component);
    
    // Call lifecycle hook
    if ('onAdd' in component && typeof component.onAdd === 'function') {
      component.onAdd();
    }

    console.log(`[Entity] Added component ${component.type} to entity ${this.name}`);
  }

  /**
   * Remove a component from this entity
   */
  removeComponent(type: ComponentType): void {
    if (this.destroyed) {
      return;
    }

    const component = this.components.get(type);
    if (!component) {
      return;
    }

    // Call lifecycle hook
    if ('onRemove' in component && typeof component.onRemove === 'function') {
      component.onRemove();
    }

    this.components.delete(type);
    console.log(`[Entity] Removed component ${type} from entity ${this.name}`);
  }

  /**
   * Get a component by type
   */
  getComponent<T extends IComponent>(type: ComponentType): T | null {
    return (this.components.get(type) as T) || null;
  }

  /**
   * Check if entity has a component
   */
  hasComponent(type: ComponentType): boolean {
    return this.components.has(type);
  }

  /**
   * Get all components
   */
  getComponents(): IComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * Get component types
   */
  getComponentTypes(): ComponentType[] {
    return Array.from(this.components.keys());
  }

  /**
   * Add a tag
   */
  addTag(tag: string): void {
    this.tags.add(tag);
  }

  /**
   * Remove a tag
   */
  removeTag(tag: string): void {
    this.tags.delete(tag);
  }

  /**
   * Check if has tag
   */
  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  /**
   * Enable a component
   */
  enableComponent(type: ComponentType): void {
    const component = this.components.get(type);
    if (component && !component.enabled) {
      component.enabled = true;
      
      if ('onEnable' in component && typeof component.onEnable === 'function') {
        component.onEnable();
      }
    }
  }

  /**
   * Disable a component
   */
  disableComponent(type: ComponentType): void {
    const component = this.components.get(type);
    if (component && component.enabled) {
      component.enabled = false;
      
      if ('onDisable' in component && typeof component.onDisable === 'function') {
        component.onDisable();
      }
    }
  }

  /**
   * Update all components
   */
  update(deltaTime: number): void {
    if (!this.active || this.destroyed) {
      return;
    }

    this.components.forEach(component => {
      if (component.enabled && 'update' in component && typeof component.update === 'function') {
        component.update(deltaTime);
      }
    });
  }

  /**
   * Destroy this entity
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }

    // Remove all components
    const componentTypes = Array.from(this.components.keys());
    componentTypes.forEach(type => this.removeComponent(type));

    this.components.clear();
    this.tags.clear();
    this.destroyed = true;

    console.log(`[Entity] Destroyed entity: ${this.name} (${this.id})`);
  }

  /**
   * Check if destroyed
   */
  isDestroyed(): boolean {
    return this.destroyed;
  }

  /**
   * Clone this entity (shallow copy of components)
   */
  clone(newName?: string): Entity {
    const cloned = new Entity(this.generateId(), newName || `${this.name}_Clone`);
    cloned.active = this.active;
    cloned.tags = new Set(this.tags);
    
    // Note: Components are not cloned, just referenced
    // For deep cloning, components would need a clone method
    this.components.forEach((component, type) => {
      cloned.components.set(type, component);
    });

    return cloned;
  }

  /**
   * Get entity signature (component types as string)
   */
  getSignature(): string {
    return Array.from(this.components.keys()).sort().join(',');
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const componentList = Array.from(this.components.keys()).join(', ');
    const tagList = Array.from(this.tags).join(', ');
    return `Entity: ${this.name} (${this.id}) | Active: ${this.active} | Components: [${componentList}] | Tags: [${tagList}]`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): EntityId {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
