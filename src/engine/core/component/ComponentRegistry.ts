/**
 * ComponentRegistry
 * 
 * Central registry for component metadata, dependencies, and validation.
 * Provides component discovery and introspection capabilities.
 */

import { ComponentType, IComponent } from '../../../types/engine/ECSTypes';

/**
 * Component metadata
 */
export interface ComponentMetadata {
  type: ComponentType;
  displayName: string;
  description?: string;
  category?: string;
  icon?: string;
  dependencies?: ComponentType[];
  conflicts?: ComponentType[];
  singleton?: boolean;
  allowMultiple?: boolean;
  version?: string;
}

/**
 * Component validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ComponentRegistry {
  private metadata: Map<ComponentType, ComponentMetadata> = new Map();
  private categories: Map<string, Set<ComponentType>> = new Map();
  private factories: Map<ComponentType, () => IComponent> = new Map();

  /**
   * Register component with metadata
   */
  register(
    type: ComponentType,
    factory: () => IComponent,
    metadata: Partial<ComponentMetadata> = {}
  ): void {
    if (this.metadata.has(type)) {
      console.warn(`[ComponentRegistry] Component already registered: ${type}`);
      return;
    }

    const fullMetadata: ComponentMetadata = {
      type,
      displayName: metadata.displayName || type,
      description: metadata.description,
      category: metadata.category || 'General',
      icon: metadata.icon,
      dependencies: metadata.dependencies || [],
      conflicts: metadata.conflicts || [],
      singleton: metadata.singleton || false,
      allowMultiple: metadata.allowMultiple !== false,
      version: metadata.version || '1.0.0'
    };

    this.metadata.set(type, fullMetadata);
    this.factories.set(type, factory);

    // Add to category
    const category = fullMetadata.category!;
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category)!.add(type);

    console.log(`[ComponentRegistry] Registered component: ${type} (${category})`);
  }

  /**
   * Unregister component
   */
  unregister(type: ComponentType): void {
    const metadata = this.metadata.get(type);
    if (!metadata) return;

    // Remove from category
    if (metadata.category) {
      const categorySet = this.categories.get(metadata.category);
      if (categorySet) {
        categorySet.delete(type);
        if (categorySet.size === 0) {
          this.categories.delete(metadata.category);
        }
      }
    }

    this.metadata.delete(type);
    this.factories.delete(type);

    console.log(`[ComponentRegistry] Unregistered component: ${type}`);
  }

  /**
   * Get component metadata
   */
  getMetadata(type: ComponentType): ComponentMetadata | null {
    return this.metadata.get(type) || null;
  }

  /**
   * Get component factory
   */
  getFactory(type: ComponentType): (() => IComponent) | null {
    return this.factories.get(type) || null;
  }

  /**
   * Check if component is registered
   */
  isRegistered(type: ComponentType): boolean {
    return this.metadata.has(type);
  }

  /**
   * Get all registered component types
   */
  getAllTypes(): ComponentType[] {
    return Array.from(this.metadata.keys());
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: string): ComponentType[] {
    const categorySet = this.categories.get(category);
    return categorySet ? Array.from(categorySet) : [];
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Validate component dependencies
   */
  validateDependencies(
    type: ComponentType,
    existingComponents: ComponentType[]
  ): ValidationResult {
    const metadata = this.metadata.get(type);
    if (!metadata) {
      return {
        valid: false,
        errors: [`Component not registered: ${type}`],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check dependencies
    if (metadata.dependencies) {
      metadata.dependencies.forEach(dep => {
        if (!existingComponents.includes(dep)) {
          errors.push(`Missing required dependency: ${dep}`);
        }
      });
    }

    // Check conflicts
    if (metadata.conflicts) {
      metadata.conflicts.forEach(conflict => {
        if (existingComponents.includes(conflict)) {
          errors.push(`Conflicts with existing component: ${conflict}`);
        }
      });
    }

    // Check singleton
    if (metadata.singleton && existingComponents.includes(type)) {
      errors.push(`Component ${type} is a singleton and already exists`);
    }

    // Check multiple instances
    if (!metadata.allowMultiple && existingComponents.includes(type)) {
      errors.push(`Component ${type} does not allow multiple instances`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get component dependencies (recursive)
   */
  getDependencyChain(type: ComponentType): ComponentType[] {
    const chain: ComponentType[] = [];
    const visited = new Set<ComponentType>();

    const traverse = (currentType: ComponentType) => {
      if (visited.has(currentType)) return;
      visited.add(currentType);

      const metadata = this.metadata.get(currentType);
      if (!metadata || !metadata.dependencies) return;

      metadata.dependencies.forEach(dep => {
        traverse(dep);
        if (!chain.includes(dep)) {
          chain.push(dep);
        }
      });
    };

    traverse(type);
    return chain;
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependency(type: ComponentType): boolean {
    const visited = new Set<ComponentType>();
    const recursionStack = new Set<ComponentType>();

    const detectCycle = (currentType: ComponentType): boolean => {
      visited.add(currentType);
      recursionStack.add(currentType);

      const metadata = this.metadata.get(currentType);
      if (metadata && metadata.dependencies) {
        for (const dep of metadata.dependencies) {
          if (!visited.has(dep)) {
            if (detectCycle(dep)) return true;
          } else if (recursionStack.has(dep)) {
            return true;
          }
        }
      }

      recursionStack.delete(currentType);
      return false;
    };

    return detectCycle(type);
  }

  /**
   * Get components that depend on a type
   */
  getDependents(type: ComponentType): ComponentType[] {
    const dependents: ComponentType[] = [];

    this.metadata.forEach((metadata, componentType) => {
      if (metadata.dependencies && metadata.dependencies.includes(type)) {
        dependents.push(componentType);
      }
    });

    return dependents;
  }

  /**
   * Get components that conflict with a type
   */
  getConflicts(type: ComponentType): ComponentType[] {
    const metadata = this.metadata.get(type);
    return metadata?.conflicts || [];
  }

  /**
   * Search components by name or description
   */
  search(query: string): ComponentType[] {
    const lowerQuery = query.toLowerCase();
    const results: ComponentType[] = [];

    this.metadata.forEach((metadata, type) => {
      const nameMatch = metadata.displayName.toLowerCase().includes(lowerQuery);
      const descMatch = metadata.description?.toLowerCase().includes(lowerQuery);
      
      if (nameMatch || descMatch) {
        results.push(type);
      }
    });

    return results;
  }

  /**
   * Get component count
   */
  getComponentCount(): number {
    return this.metadata.size;
  }

  /**
   * Get category count
   */
  getCategoryCount(): number {
    return this.categories.size;
  }

  /**
   * Export registry as JSON
   */
  exportToJSON(): string {
    const data: Record<string, any> = {};

    this.metadata.forEach((metadata, type) => {
      data[type] = {
        displayName: metadata.displayName,
        description: metadata.description,
        category: metadata.category,
        dependencies: metadata.dependencies,
        conflicts: metadata.conflicts,
        singleton: metadata.singleton,
        allowMultiple: metadata.allowMultiple,
        version: metadata.version
      };
    });

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear registry
   */
  clear(): void {
    this.metadata.clear();
    this.categories.clear();
    this.factories.clear();
    console.log('[ComponentRegistry] Cleared registry');
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalComponents: number;
    categories: number;
    singletons: number;
    withDependencies: number;
    withConflicts: number;
  } {
    let singletons = 0;
    let withDependencies = 0;
    let withConflicts = 0;

    this.metadata.forEach(metadata => {
      if (metadata.singleton) singletons++;
      if (metadata.dependencies && metadata.dependencies.length > 0) withDependencies++;
      if (metadata.conflicts && metadata.conflicts.length > 0) withConflicts++;
    });

    return {
      totalComponents: this.metadata.size,
      categories: this.categories.size,
      singletons,
      withDependencies,
      withConflicts
    };
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `ComponentRegistry | Components: ${stats.totalComponents}, Categories: ${stats.categories}, Singletons: ${stats.singletons}`;
  }
}
