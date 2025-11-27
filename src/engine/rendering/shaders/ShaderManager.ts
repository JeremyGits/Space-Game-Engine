/**
 * Shader Manager
 * 
 * Manages shader compilation, caching, and lifecycle
 */

import { RenderContext } from '../core/RenderContext';
import { Shader, ShaderConfig } from './Shader';
import { EventEmitter } from '../../core/EventEmitter';

/**
 * Shader manager class
 */
export class ShaderManager extends EventEmitter {
  private context: RenderContext;
  private shaders: Map<string, Shader> = new Map();
  private shadersByName: Map<string, Shader> = new Map();
  
  /**
   * Create shader manager
   */
  constructor(context: RenderContext) {
    super();
    this.context = context;
  }
  
  /**
   * Create and compile shader
   */
  create(name: string, config: ShaderConfig): Shader | null {
    // Check if shader already exists
    if (this.shadersByName.has(name)) {
      console.warn(`Shader "${name}" already exists`);
      return this.shadersByName.get(name)!;
    }
    
    // Create shader
    const shader = new Shader(this.context, config);
    
    // Compile shader
    if (!shader.compile()) {
      console.error(`Failed to compile shader "${name}"`);
      shader.dispose();
      return null;
    }
    
    // Register shader
    this.shaders.set(shader.id, shader);
    this.shadersByName.set(name, shader);
    
    this.emit('shaderCreated', { name, shader });
    
    return shader;
  }
  
  /**
   * Get shader by name
   */
  get(name: string): Shader | undefined {
    return this.shadersByName.get(name);
  }
  
  /**
   * Get shader by ID
   */
  getById(id: string): Shader | undefined {
    return this.shaders.get(id);
  }
  
  /**
   * Check if shader exists
   */
  has(name: string): boolean {
    return this.shadersByName.has(name);
  }
  
  /**
   * Get all shaders
   */
  getAll(): Shader[] {
    return Array.from(this.shaders.values());
  }
  
  /**
   * Get shader count
   */
  getCount(): number {
    return this.shaders.size;
  }
  
  /**
   * Remove shader
   */
  remove(name: string): boolean {
    const shader = this.shadersByName.get(name);
    if (!shader) {
      return false;
    }
    
    this.shaders.delete(shader.id);
    this.shadersByName.delete(name);
    
    shader.dispose();
    
    this.emit('shaderRemoved', { name, shader });
    
    return true;
  }
  
  /**
   * Reload shader
   */
  reload(name: string, config: ShaderConfig): Shader | null {
    // Remove existing shader
    this.remove(name);
    
    // Create new shader
    return this.create(name, config);
  }
  
  /**
   * Clear all shaders
   */
  clear(): void {
    for (const shader of this.shaders.values()) {
      shader.dispose();
    }
    
    this.shaders.clear();
    this.shadersByName.clear();
    
    this.emit('clear');
  }
  
  /**
   * Dispose shader manager
   */
  dispose(): void {
    this.clear();
    this.removeAllListeners();
  }
}
