/**
 * Blueprint Loader - Loads and manages cockpit blueprints
 */

import { CockpitBlueprint, CockpitComponent } from './BlueprintTypes';

export class BlueprintLoader {
  private static blueprints: Map<string, CockpitBlueprint> = new Map();
  
  /**
   * Load a blueprint from JSON
   */
  static async loadBlueprint(path: string): Promise<CockpitBlueprint> {
    try {
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Failed to load blueprint: ${response.statusText}`);
      }
      
      const blueprint: CockpitBlueprint = await response.json();
      
      // Validate blueprint
      this.validateBlueprint(blueprint);
      
      // Cache it
      this.blueprints.set(blueprint.name, blueprint);
      
      console.log(`✓ Loaded blueprint: ${blueprint.name}`);
      
      return blueprint;
    } catch (error) {
      console.error(`Error loading blueprint from ${path}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a cached blueprint
   */
  static getBlueprint(name: string): CockpitBlueprint | undefined {
    return this.blueprints.get(name);
  }
  
  /**
   * Get all loaded blueprints
   */
  static getAllBlueprints(): CockpitBlueprint[] {
    return Array.from(this.blueprints.values());
  }
  
  /**
   * Validate blueprint structure
   */
  private static validateBlueprint(blueprint: CockpitBlueprint): void {
    if (!blueprint.name) {
      throw new Error('Blueprint must have a name');
    }
    
    if (!blueprint.sourceImage) {
      throw new Error('Blueprint must specify a source image');
    }
    
    if (!blueprint.components || blueprint.components.length === 0) {
      throw new Error('Blueprint must have at least one component');
    }
    
    if (!blueprint.layers || blueprint.layers.length === 0) {
      throw new Error('Blueprint must have at least one layer');
    }
    
    // Validate each component
    blueprint.components.forEach((component, index) => {
      if (!component.id) {
        throw new Error(`Component at index ${index} must have an ID`);
      }
      
      if (!component.uvRegion) {
        throw new Error(`Component ${component.id} must have a UV region`);
      }
      
      if (!component.transform) {
        throw new Error(`Component ${component.id} must have a transform`);
      }
      
      if (!component.material) {
        throw new Error(`Component ${component.id} must have a material`);
      }
    });
  }
  
  /**
   * Get components by layer
   */
  static getComponentsByLayer(
    blueprint: CockpitBlueprint,
    layerIndex: number
  ): CockpitComponent[] {
    const layer = blueprint.layers.find(l => l.index === layerIndex);
    
    if (!layer) {
      return [];
    }
    
    return blueprint.components.filter(c => layer.componentIds.includes(c.id));
  }
  
  /**
   * Get component by ID
   */
  static getComponent(
    blueprint: CockpitBlueprint,
    componentId: string
  ): CockpitComponent | undefined {
    return blueprint.components.find(c => c.id === componentId);
  }
  
  /**
   * Export blueprint to JSON string
   */
  static exportBlueprint(blueprint: CockpitBlueprint): string {
    return JSON.stringify(blueprint, null, 2);
  }
  
  /**
   * Save blueprint to file (browser download)
   */
  static downloadBlueprint(blueprint: CockpitBlueprint, filename?: string): void {
    const json = this.exportBlueprint(blueprint);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${blueprint.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`✓ Downloaded blueprint: ${a.download}`);
  }
}
