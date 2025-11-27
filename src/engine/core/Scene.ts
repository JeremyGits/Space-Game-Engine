/**
 * Scene
 * 
 * Represents a game scene with a hierarchical scene graph.
 * Manages loading, unloading, and updating of scene nodes.
 */

import { SceneNode } from './SceneNode';
import {
  IScene,
  ISceneNode,
  SceneState,
  SceneConfig,
  SceneStats
} from '../../types/engine/SceneTypes';

export class Scene implements IScene {
  public name: string;
  public state: SceneState = SceneState.UNLOADED;
  public config: SceneConfig;
  
  private rootNode: SceneNode;
  private nodeMap: Map<string, ISceneNode> = new Map();
  private nodeNameMap: Map<string, ISceneNode> = new Map();

  constructor(config: SceneConfig) {
    this.name = config.name;
    this.config = config;
    this.rootNode = new SceneNode(`${this.name}_Root`);
    
    // Register root node
    this.registerNode(this.rootNode);
  }

  /**
   * Load the scene
   */
  async load(): Promise<void> {
    if (this.state !== SceneState.UNLOADED) {
      throw new Error(`Cannot load scene ${this.name} from state ${this.state}`);
    }

    this.state = SceneState.LOADING;
    console.log(`[Scene] Loading scene: ${this.name}`);

    try {
      // Override in derived classes to load assets
      await this.onLoad();
      
      this.state = SceneState.LOADED;
      console.log(`[Scene] Scene loaded: ${this.name}`);
    } catch (error) {
      this.state = SceneState.ERROR;
      console.error(`[Scene] Failed to load scene ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Unload the scene
   */
  async unload(): Promise<void> {
    if (this.state === SceneState.UNLOADED) {
      return;
    }

    // Check if we need to deactivate before changing state
    const wasActive = this.state === SceneState.ACTIVE || this.state === SceneState.PAUSED;
    
    this.state = SceneState.UNLOADING;
    console.log(`[Scene] Unloading scene: ${this.name}`);

    try {
      // Deactivate if it was active
      if (wasActive) {
        this.onDeactivate();
      }

      // Override in derived classes to unload assets
      await this.onUnload();
      
      // Clear all nodes except root
      this.rootNode.children.forEach(child => child.destroy());
      this.nodeMap.clear();
      this.nodeNameMap.clear();
      this.registerNode(this.rootNode);
      
      this.state = SceneState.UNLOADED;
      console.log(`[Scene] Scene unloaded: ${this.name}`);
    } catch (error) {
      this.state = SceneState.ERROR;
      console.error(`[Scene] Failed to unload scene ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Activate the scene
   */
  activate(): void {
    if (this.state !== SceneState.LOADED) {
      throw new Error(`Cannot activate scene ${this.name} from state ${this.state}`);
    }

    console.log(`[Scene] Activating scene: ${this.name}`);
    this.state = SceneState.ACTIVE;
    
    // Initialize all nodes
    this.rootNode.initialize();
    
    // Override in derived classes
    this.onActivate();
  }

  /**
   * Deactivate the scene
   */
  deactivate(): void {
    if (this.state !== SceneState.ACTIVE && this.state !== SceneState.PAUSED) {
      return;
    }

    console.log(`[Scene] Deactivating scene: ${this.name}`);
    this.state = SceneState.LOADED;
    
    // Override in derived classes
    this.onDeactivate();
  }

  /**
   * Pause the scene
   */
  pause(): void {
    if (this.state !== SceneState.ACTIVE) {
      return;
    }

    this.state = SceneState.PAUSED;
    console.log(`[Scene] Scene paused: ${this.name}`);
  }

  /**
   * Resume the scene
   */
  resume(): void {
    if (this.state !== SceneState.PAUSED) {
      return;
    }

    this.state = SceneState.ACTIVE;
    console.log(`[Scene] Scene resumed: ${this.name}`);
  }

  /**
   * Update the scene
   */
  update(deltaTime: number): void {
    if (this.state !== SceneState.ACTIVE) {
      return;
    }

    // Update root (which updates all children)
    this.rootNode.update(deltaTime);
    
    // Override in derived classes
    this.onUpdate(deltaTime);
  }

  /**
   * Get the root node
   */
  getRootNode(): ISceneNode {
    return this.rootNode;
  }

  /**
   * Add a node to the scene
   */
  addNode(node: ISceneNode, parent?: ISceneNode): void {
    const parentNode = parent || this.rootNode;
    parentNode.addChild(node);
    this.registerNode(node);
    
    console.log(`[Scene] Added node ${node.name} to scene ${this.name}`);
  }

  /**
   * Remove a node from the scene
   */
  removeNode(node: ISceneNode): void {
    if (node.parent) {
      node.parent.removeChild(node);
    }
    
    this.unregisterNode(node);
    console.log(`[Scene] Removed node ${node.name} from scene ${this.name}`);
  }

  /**
   * Find a node by name
   */
  findNode(name: string): ISceneNode | null {
    return this.nodeNameMap.get(name) || null;
  }

  /**
   * Find a node by ID
   */
  findNodeById(id: string): ISceneNode | null {
    return this.nodeMap.get(id) || null;
  }

  /**
   * Find all nodes with a tag
   */
  findNodesByTag(tag: string): ISceneNode[] {
    const nodes: ISceneNode[] = [];
    
    this.nodeMap.forEach(node => {
      if (node instanceof SceneNode && node.hasTag(tag)) {
        nodes.push(node);
      }
    });
    
    return nodes;
  }

  /**
   * Find all nodes on a layer
   */
  findNodesByLayer(layer: number): ISceneNode[] {
    const nodes: ISceneNode[] = [];
    
    this.nodeMap.forEach(node => {
      if (node instanceof SceneNode && node.layer === layer) {
        nodes.push(node);
      }
    });
    
    return nodes;
  }

  /**
   * Get total node count
   */
  getNodeCount(): number {
    return this.nodeMap.size;
  }

  /**
   * Get active node count
   */
  getActiveNodeCount(): number {
    let count = 0;
    
    this.nodeMap.forEach(node => {
      if (node.active) {
        count++;
      }
    });
    
    return count;
  }

  /**
   * Get scene statistics
   */
  getStats(): SceneStats {
    let activeCount = 0;
    let visibleCount = 0;
    
    this.nodeMap.forEach(node => {
      if (node.active) {
        activeCount++;
      }
      if (node.active && node.isActiveInHierarchy()) {
        visibleCount++;
      }
    });

    return {
      totalNodes: this.nodeMap.size,
      activeNodes: activeCount,
      visibleNodes: visibleCount,
      drawCalls: 0, // TODO: Track from renderer
      triangles: 0, // TODO: Track from renderer
      memoryUsage: 0 // TODO: Track memory
    };
  }

  /**
   * Clear all nodes (except root)
   */
  clear(): void {
    this.rootNode.children.forEach(child => child.destroy());
    this.nodeMap.clear();
    this.nodeNameMap.clear();
    this.registerNode(this.rootNode);
    
    console.log(`[Scene] Cleared scene: ${this.name}`);
  }

  /**
   * Register a node in the maps
   */
  private registerNode(node: ISceneNode): void {
    this.nodeMap.set(node.id, node);
    this.nodeNameMap.set(node.name, node);
    
    // Register children recursively
    node.children.forEach(child => this.registerNode(child));
  }

  /**
   * Unregister a node from the maps
   */
  private unregisterNode(node: ISceneNode): void {
    this.nodeMap.delete(node.id);
    this.nodeNameMap.delete(node.name);
    
    // Unregister children recursively
    node.children.forEach(child => this.unregisterNode(child));
  }

  /**
   * Override in derived classes
   */
  protected async onLoad(): Promise<void> {
    // Override to load scene-specific assets
  }

  /**
   * Override in derived classes
   */
  protected async onUnload(): Promise<void> {
    // Override to unload scene-specific assets
  }

  /**
   * Override in derived classes
   */
  protected onActivate(): void {
    // Override for scene activation logic
  }

  /**
   * Override in derived classes
   */
  protected onDeactivate(): void {
    // Override for scene deactivation logic
  }

  /**
   * Override in derived classes
   */
  protected onUpdate(_deltaTime: number): void {
    // Override for scene-specific update logic
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `Scene: ${this.name} | State: ${this.state} | Nodes: ${stats.totalNodes} (${stats.activeNodes} active, ${stats.visibleNodes} visible)`;
  }
}
