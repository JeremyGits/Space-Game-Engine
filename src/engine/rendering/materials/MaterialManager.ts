/**
 * Material Manager
 * 
 * Manages material lifecycle and caching
 */

import { Material } from './Material';
import { EventEmitter } from '../../core/EventEmitter';

/**
 * Material manager
 */
export class MaterialManager extends EventEmitter {
  private materials: Map<string, Material> = new Map();
  private materialsByName: Map<string, Material> = new Map();
  
  /**
   * Register material
   */
  register(material: Material): void {
    if (this.materials.has(material.id)) {
      console.warn(`Material ${material.id} already registered`);
      return;
    }
    
    this.materials.set(material.id, material);
    
    if (material.name) {
      this.materialsByName.set(material.name, material);
    }
    
    // Listen for material updates
    material.on('update', (event) => this.handleMaterialUpdate(event.data));
    material.on('dispose', (event) => this.handleMaterialDispose(event.data));
    
    this.emit('register', material);
  }
  
  /**
   * Unregister material
   */
  unregister(material: Material): void {
    this.materials.delete(material.id);
    
    if (material.name) {
      this.materialsByName.delete(material.name);
    }
    
    material.removeAllListeners();
    
    this.emit('unregister', material);
  }
  
  /**
   * Get material by ID
   */
  get(id: string): Material | undefined {
    return this.materials.get(id);
  }
  
  /**
   * Get material by name
   */
  getByName(name: string): Material | undefined {
    return this.materialsByName.get(name);
  }
  
  /**
   * Check if material exists
   */
  has(id: string): boolean {
    return this.materials.has(id);
  }
  
  /**
   * Get all materials
   */
  getAll(): Material[] {
    return Array.from(this.materials.values());
  }
  
  /**
   * Get material count
   */
  getCount(): number {
    return this.materials.size;
  }
  
  /**
   * Handle material update
   */
  private handleMaterialUpdate(material: Material): void {
    this.emit('materialUpdate', material);
  }
  
  /**
   * Handle material dispose
   */
  private handleMaterialDispose(material: Material): void {
    this.unregister(material);
  }
  
  /**
   * Clear all materials
   */
  clear(): void {
    for (const material of this.materials.values()) {
      material.dispose();
    }
    
    this.materials.clear();
    this.materialsByName.clear();
    
    this.emit('clear');
  }
  
  /**
   * Dispose manager
   */
  dispose(): void {
    this.clear();
    this.removeAllListeners();
  }
}
