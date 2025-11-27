/**
 * EntityFactory
 * 
 * Factory for creating entities from templates and blueprints.
 * Supports prefabs, cloning, and batch entity creation.
 */

import { Entity } from '../Entity';
import { EntityManager } from './EntityManager';
import {
  IComponent,
  ComponentType
} from '../../../types/engine/ECSTypes';

/**
 * Entity template definition
 */
export interface EntityTemplate {
  name: string;
  tags?: string[];
  components: IComponent[];
  children?: EntityTemplate[];
}

/**
 * Entity blueprint (serializable template)
 */
export interface EntityBlueprint {
  name: string;
  tags?: string[];
  componentTypes: ComponentType[];
  componentData: Record<string, any>[];
  children?: EntityBlueprint[];
}

/**
 * Batch creation options
 */
export interface BatchCreateOptions {
  count: number;
  namePrefix?: string;
  spacing?: { x: number; y: number; z: number };
  randomizePosition?: boolean;
  randomizeRotation?: boolean;
}

export class EntityFactory {
  private entityManager: EntityManager;
  private templates: Map<string, EntityTemplate> = new Map();
  private blueprints: Map<string, EntityBlueprint> = new Map();
  private componentFactories: Map<ComponentType, () => IComponent> = new Map();

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  /**
   * Register a component factory
   */
  registerComponentFactory(type: ComponentType, factory: () => IComponent): void {
    this.componentFactories.set(type, factory);
    console.log(`[EntityFactory] Registered component factory: ${type}`);
  }

  /**
   * Register an entity template
   */
  registerTemplate(id: string, template: EntityTemplate): void {
    this.templates.set(id, template);
    console.log(`[EntityFactory] Registered template: ${id}`);
  }

  /**
   * Register an entity blueprint
   */
  registerBlueprint(id: string, blueprint: EntityBlueprint): void {
    this.blueprints.set(id, blueprint);
    console.log(`[EntityFactory] Registered blueprint: ${id}`);
  }

  /**
   * Create entity from template
   */
  createFromTemplate(templateId: string, name?: string): Entity {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const entity = this.entityManager.createEntity(name || template.name);

    // Add tags
    if (template.tags) {
      template.tags.forEach(tag => {
        this.entityManager.addTagToEntity(entity.id, tag);
      });
    }

    // Add components
    template.components.forEach(component => {
      this.entityManager.addComponentToEntity(entity.id, component);
    });

    // Create children (if any)
    if (template.children) {
      template.children.forEach(childTemplate => {
        const childEntity = this.createFromTemplateObject(childTemplate);
        // Note: Parent-child relationship would be handled by a hierarchy component
        console.log(`[EntityFactory] Created child entity: ${childEntity.name}`);
      });
    }

    console.log(`[EntityFactory] Created entity from template: ${templateId}`);
    return entity;
  }

  /**
   * Create entity from template object
   */
  private createFromTemplateObject(template: EntityTemplate): Entity {
    const entity = this.entityManager.createEntity(template.name);

    if (template.tags) {
      template.tags.forEach(tag => {
        this.entityManager.addTagToEntity(entity.id, tag);
      });
    }

    template.components.forEach(component => {
      this.entityManager.addComponentToEntity(entity.id, component);
    });

    return entity;
  }

  /**
   * Create entity from blueprint
   */
  createFromBlueprint(blueprintId: string, name?: string): Entity {
    const blueprint = this.blueprints.get(blueprintId);
    if (!blueprint) {
      throw new Error(`Blueprint not found: ${blueprintId}`);
    }

    const entity = this.entityManager.createEntity(name || blueprint.name);

    // Add tags
    if (blueprint.tags) {
      blueprint.tags.forEach(tag => {
        this.entityManager.addTagToEntity(entity.id, tag);
      });
    }

    // Create and add components
    blueprint.componentTypes.forEach((type, index) => {
      const factory = this.componentFactories.get(type);
      if (!factory) {
        console.warn(`[EntityFactory] No factory registered for component: ${type}`);
        return;
      }

      const component = factory();
      
      // Apply component data if available
      if (blueprint.componentData[index]) {
        Object.assign(component, blueprint.componentData[index]);
      }

      this.entityManager.addComponentToEntity(entity.id, component);
    });

    console.log(`[EntityFactory] Created entity from blueprint: ${blueprintId}`);
    return entity;
  }

  /**
   * Clone an entity
   */
  clone(entity: Entity, name?: string): Entity {
    const cloned = this.entityManager.createEntity(name || `${entity.name}_Clone`);

    // Copy tags
    entity.tags.forEach(tag => {
      this.entityManager.addTagToEntity(cloned.id, tag);
    });

    // Clone components
    entity.getComponents().forEach(component => {
      // Create new component instance
      const factory = this.componentFactories.get(component.type);
      if (factory) {
        const clonedComponent = factory();
        
        // Copy component data (shallow copy)
        Object.assign(clonedComponent, component);
        
        this.entityManager.addComponentToEntity(cloned.id, clonedComponent);
      } else {
        console.warn(`[EntityFactory] Cannot clone component without factory: ${component.type}`);
      }
    });

    console.log(`[EntityFactory] Cloned entity: ${entity.name} -> ${cloned.name}`);
    return cloned;
  }

  /**
   * Create multiple entities from template
   */
  createBatch(templateId: string, options: BatchCreateOptions): Entity[] {
    const entities: Entity[] = [];
    const template = this.templates.get(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    for (let i = 0; i < options.count; i++) {
      const name = options.namePrefix 
        ? `${options.namePrefix}_${i}` 
        : `${template.name}_${i}`;
      
      const entity = this.createFromTemplate(templateId, name);

      // Apply spacing if specified
      if (options.spacing) {
        // This would require a Transform component
        // For now, just log the intent
        console.log(`[EntityFactory] Would apply spacing: ${JSON.stringify(options.spacing)}`);
      }

      entities.push(entity);
    }

    console.log(`[EntityFactory] Created batch of ${options.count} entities from template: ${templateId}`);
    return entities;
  }

  /**
   * Create entity with components
   */
  createWithComponents(name: string, componentTypes: ComponentType[]): Entity {
    const entity = this.entityManager.createEntity(name);

    componentTypes.forEach(type => {
      const factory = this.componentFactories.get(type);
      if (factory) {
        const component = factory();
        this.entityManager.addComponentToEntity(entity.id, component);
      } else {
        console.warn(`[EntityFactory] No factory registered for component: ${type}`);
      }
    });

    return entity;
  }

  /**
   * Create empty entity
   */
  createEmpty(name?: string): Entity {
    return this.entityManager.createEntity(name);
  }

  /**
   * Convert entity to template
   */
  entityToTemplate(entity: Entity): EntityTemplate {
    return {
      name: entity.name,
      tags: Array.from(entity.tags),
      components: entity.getComponents()
    };
  }

  /**
   * Convert entity to blueprint
   */
  entityToBlueprint(entity: Entity): EntityBlueprint {
    const components = entity.getComponents();
    
    return {
      name: entity.name,
      tags: Array.from(entity.tags),
      componentTypes: components.map(c => c.type),
      componentData: components.map(c => {
        // Extract serializable data from component
        const data: Record<string, any> = {};
        Object.keys(c).forEach(key => {
          if (key !== 'type' && key !== 'enabled') {
            data[key] = (c as any)[key];
          }
        });
        return data;
      })
    };
  }

  /**
   * Save template to storage
   */
  saveTemplate(id: string, template: EntityTemplate): void {
    this.templates.set(id, template);
    
    // In a real implementation, this would save to localStorage or a file
    console.log(`[EntityFactory] Saved template: ${id}`);
  }

  /**
   * Load template from storage
   */
  loadTemplate(id: string): EntityTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Get all template IDs
   */
  getTemplateIds(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Get all blueprint IDs
   */
  getBlueprintIds(): string[] {
    return Array.from(this.blueprints.keys());
  }

  /**
   * Remove template
   */
  removeTemplate(id: string): void {
    this.templates.delete(id);
    console.log(`[EntityFactory] Removed template: ${id}`);
  }

  /**
   * Remove blueprint
   */
  removeBlueprint(id: string): void {
    this.blueprints.delete(id);
    console.log(`[EntityFactory] Removed blueprint: ${id}`);
  }

  /**
   * Clear all templates
   */
  clearTemplates(): void {
    this.templates.clear();
    console.log('[EntityFactory] Cleared all templates');
  }

  /**
   * Clear all blueprints
   */
  clearBlueprints(): void {
    this.blueprints.clear();
    console.log('[EntityFactory] Cleared all blueprints');
  }

  /**
   * Get statistics
   */
  getStats(): {
    templateCount: number;
    blueprintCount: number;
    componentFactoryCount: number;
  } {
    return {
      templateCount: this.templates.size,
      blueprintCount: this.blueprints.size,
      componentFactoryCount: this.componentFactories.size
    };
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `EntityFactory | Templates: ${stats.templateCount}, Blueprints: ${stats.blueprintCount}, Factories: ${stats.componentFactoryCount}`;
  }
}
