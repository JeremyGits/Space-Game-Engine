/**
 * SceneManager
 * 
 * Manages multiple scenes, scene transitions, and the active scene.
 * Handles loading, unloading, and switching between scenes.
 */

import { EventEmitter } from './EventEmitter';
import { Scene } from './Scene';
import {
  IScene,
  SceneState,
  SceneEventType,
  SceneTransitionConfig,
  SceneTransitionType
} from '../../types/engine/SceneTypes';

export class SceneManager {
  private eventEmitter: EventEmitter;
  private scenes: Map<string, IScene> = new Map();
  private activeScene: IScene | null = null;
  private isTransitioning: boolean = false;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Register a scene
   */
  registerScene(scene: IScene): void {
    if (this.scenes.has(scene.name)) {
      throw new Error(`Scene ${scene.name} is already registered`);
    }

    this.scenes.set(scene.name, scene);
    
    this.eventEmitter.emit(SceneEventType.SCENE_REGISTERED, {
      sceneName: scene.name,
      state: scene.state
    });

    console.log(`[SceneManager] Registered scene: ${scene.name}`);
  }

  /**
   * Unregister a scene
   */
  async unregisterScene(sceneName: string): Promise<void> {
    const scene = this.scenes.get(sceneName);
    if (!scene) {
      return;
    }

    // Unload if loaded
    if (scene.state !== SceneState.UNLOADED) {
      await scene.unload();
    }

    this.scenes.delete(sceneName);
    console.log(`[SceneManager] Unregistered scene: ${sceneName}`);
  }

  /**
   * Load a scene
   */
  async loadScene(sceneName: string): Promise<void> {
    const scene = this.scenes.get(sceneName);
    if (!scene) {
      throw new Error(`Scene not found: ${sceneName}`);
    }

    if (scene.state !== SceneState.UNLOADED) {
      console.warn(`[SceneManager] Scene ${sceneName} is already loaded`);
      return;
    }

    this.eventEmitter.emit(SceneEventType.SCENE_LOADING, {
      sceneName,
      state: SceneState.LOADING
    });

    try {
      await scene.load();
      
      this.eventEmitter.emit(SceneEventType.SCENE_LOADED, {
        sceneName,
        state: SceneState.LOADED
      });
    } catch (error) {
      this.eventEmitter.emit(SceneEventType.SCENE_ERROR, {
        sceneName,
        state: SceneState.ERROR,
        error: error as Error
      });
      throw error;
    }
  }

  /**
   * Unload a scene
   */
  async unloadScene(sceneName: string): Promise<void> {
    const scene = this.scenes.get(sceneName);
    if (!scene) {
      throw new Error(`Scene not found: ${sceneName}`);
    }

    if (scene === this.activeScene) {
      throw new Error(`Cannot unload active scene: ${sceneName}`);
    }

    if (scene.state === SceneState.UNLOADED) {
      return;
    }

    this.eventEmitter.emit(SceneEventType.SCENE_UNLOADING, {
      sceneName,
      state: SceneState.UNLOADING
    });

    try {
      await scene.unload();
      
      this.eventEmitter.emit(SceneEventType.SCENE_UNLOADED, {
        sceneName,
        state: SceneState.UNLOADED
      });
    } catch (error) {
      this.eventEmitter.emit(SceneEventType.SCENE_ERROR, {
        sceneName,
        state: SceneState.ERROR,
        error: error as Error
      });
      throw error;
    }
  }

  /**
   * Set the active scene
   */
  async setActiveScene(sceneName: string, transition?: SceneTransitionConfig): Promise<void> {
    if (this.isTransitioning) {
      throw new Error('Scene transition already in progress');
    }

    const scene = this.scenes.get(sceneName);
    if (!scene) {
      throw new Error(`Scene not found: ${sceneName}`);
    }

    // Load scene if not loaded
    if (scene.state === SceneState.UNLOADED) {
      await this.loadScene(sceneName);
    }

    if (scene.state !== SceneState.LOADED) {
      throw new Error(`Scene ${sceneName} is not in LOADED state`);
    }

    this.isTransitioning = true;

    try {
      // Emit transition start
      if (transition && transition.type !== SceneTransitionType.NONE) {
        this.eventEmitter.emit(SceneEventType.TRANSITION_START, {
          sceneName,
          state: scene.state
        });
      }

      // Deactivate current scene
      if (this.activeScene) {
        this.activeScene.deactivate();
        
        this.eventEmitter.emit(SceneEventType.SCENE_DEACTIVATED, {
          sceneName: this.activeScene.name,
          state: this.activeScene.state
        });
      }

      // Perform transition
      if (transition) {
        await this.performTransition(transition);
      }

      // Activate new scene
      scene.activate();
      this.activeScene = scene;

      this.eventEmitter.emit(SceneEventType.SCENE_ACTIVATED, {
        sceneName,
        state: SceneState.ACTIVE
      });

      // Emit transition end
      if (transition && transition.type !== SceneTransitionType.NONE) {
        this.eventEmitter.emit(SceneEventType.TRANSITION_END, {
          sceneName,
          state: scene.state
        });
      }

      console.log(`[SceneManager] Active scene set to: ${sceneName}`);
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Get the active scene
   */
  getActiveScene(): IScene | null {
    return this.activeScene;
  }

  /**
   * Get a scene by name
   */
  getScene(sceneName: string): IScene | null {
    return this.scenes.get(sceneName) || null;
  }

  /**
   * Check if a scene is registered
   */
  hasScene(sceneName: string): boolean {
    return this.scenes.has(sceneName);
  }

  /**
   * Get all registered scenes
   */
  getAllScenes(): IScene[] {
    return Array.from(this.scenes.values());
  }

  /**
   * Update the active scene
   */
  update(deltaTime: number): void {
    if (this.activeScene && this.activeScene.state === SceneState.ACTIVE) {
      this.activeScene.update(deltaTime);
    }
  }

  /**
   * Pause the active scene
   */
  pauseActiveScene(): void {
    if (this.activeScene && this.activeScene instanceof Scene) {
      this.activeScene.pause();
    }
  }

  /**
   * Resume the active scene
   */
  resumeActiveScene(): void {
    if (this.activeScene && this.activeScene instanceof Scene) {
      this.activeScene.resume();
    }
  }

  /**
   * Unload all scenes
   */
  async unloadAll(): Promise<void> {
    const unloadPromises: Promise<void>[] = [];

    this.scenes.forEach((scene) => {
      if (scene.state !== SceneState.UNLOADED) {
        unloadPromises.push(scene.unload());
      }
    });

    await Promise.all(unloadPromises);
    this.activeScene = null;
    
    console.log('[SceneManager] All scenes unloaded');
  }

  /**
   * Destroy all scenes
   */
  async destroyAll(): Promise<void> {
    await this.unloadAll();
    this.scenes.clear();
    console.log('[SceneManager] All scenes destroyed');
  }

  /**
   * Perform scene transition
   */
  private async performTransition(config: SceneTransitionConfig): Promise<void> {
    if (config.type === SceneTransitionType.NONE) {
      return;
    }

    // Simple delay-based transition
    // In a real implementation, this would handle visual transitions
    return new Promise((resolve) => {
      setTimeout(resolve, config.duration * 1000);
    });
  }

  /**
   * Get scene manager statistics
   */
  getStats(): {
    totalScenes: number;
    loadedScenes: number;
    activeScene: string | null;
    isTransitioning: boolean;
  } {
    let loadedCount = 0;
    
    this.scenes.forEach(scene => {
      if (scene.state !== SceneState.UNLOADED) {
        loadedCount++;
      }
    });

    return {
      totalScenes: this.scenes.size,
      loadedScenes: loadedCount,
      activeScene: this.activeScene?.name || null,
      isTransitioning: this.isTransitioning
    };
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `SceneManager | Total: ${stats.totalScenes}, Loaded: ${stats.loadedScenes}, Active: ${stats.activeScene || 'None'}, Transitioning: ${stats.isTransitioning}`;
  }
}
