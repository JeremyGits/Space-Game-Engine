/**
 * ScriptSystem
 * 
 * Executes custom scripts attached to entities.
 * Provides lifecycle hooks and game logic execution.
 */

import { System, SystemPhase } from '../System';
import { SystemPriority } from '../SystemPriority';
import { EntityManager } from '../../entity/EntityManager';
import { ComponentManager } from '../../component/ComponentManager';

/**
 * Script interface
 */
export interface IScript {
  enabled: boolean;
  
  // Lifecycle hooks
  onStart?(): void;
  onUpdate?(deltaTime: number): void;
  onFixedUpdate?(fixedDeltaTime: number): void;
  onLateUpdate?(deltaTime: number): void;
  onDestroy?(): void;
  
  // Event handlers
  onCollisionEnter?(other: any): void;
  onCollisionExit?(other: any): void;
  onTriggerEnter?(other: any): void;
  onTriggerExit?(other: any): void;
}

/**
 * Temporary Script component interface
 */
interface ScriptComponent {
  type: 'Script';
  enabled: boolean;
  scripts: Map<string, IScript>;
  initialized: boolean;
}

export class ScriptSystem extends System {
  private initializedScripts: Set<string> = new Set();

  constructor(entityManager: EntityManager, componentManager: ComponentManager) {
    super('ScriptSystem', entityManager, componentManager, {
      priority: SystemPriority.SCRIPT,
      phase: SystemPhase.UPDATE,
      requiredComponents: ['Script']
    });
  }

  /**
   * Initialize system
   */
  initialize(): void {
    console.log('[ScriptSystem] Initialized');
  }

  /**
   * Update scripts
   */
  update(deltaTime: number): void {
    const startTime = performance.now();

    const entities = this.getMatchingEntities();

    entities.forEach(entity => {
      const scriptComponent = this.componentManager.getComponent<ScriptComponent>(
        entity.id,
        'Script'
      );

      if (scriptComponent) {
        // Initialize scripts if needed
        if (!scriptComponent.initialized) {
          this.initializeScripts(entity.id, scriptComponent);
          scriptComponent.initialized = true;
        }

        // Update all scripts
        this.updateScripts(entity.id, scriptComponent, deltaTime);
      }
    });

    this.trackUpdateTime(startTime);
  }

  /**
   * Fixed update for scripts
   */
  fixedUpdate(fixedDeltaTime: number): void {
    const entities = this.getMatchingEntities();

    entities.forEach(entity => {
      const scriptComponent = this.componentManager.getComponent<ScriptComponent>(
        entity.id,
        'Script'
      );

      if (scriptComponent) {
        this.fixedUpdateScripts(entity.id, scriptComponent, fixedDeltaTime);
      }
    });
  }

  /**
   * Late update for scripts
   */
  lateUpdate(deltaTime: number): void {
    const entities = this.getMatchingEntities();

    entities.forEach(entity => {
      const scriptComponent = this.componentManager.getComponent<ScriptComponent>(
        entity.id,
        'Script'
      );

      if (scriptComponent) {
        this.lateUpdateScripts(entity.id, scriptComponent, deltaTime);
      }
    });
  }

  /**
   * Initialize all scripts on an entity
   */
  private initializeScripts(entityId: string, scriptComponent: ScriptComponent): void {
    scriptComponent.scripts.forEach((script, scriptName) => {
      if (script.enabled && script.onStart) {
        try {
          script.onStart();
          this.initializedScripts.add(`${entityId}:${scriptName}`);
          console.log(`[ScriptSystem] Initialized script: ${scriptName} on entity ${entityId}`);
        } catch (error) {
          console.error(`[ScriptSystem] Error initializing script ${scriptName}:`, error);
        }
      }
    });
  }

  /**
   * Update all scripts on an entity
   */
  private updateScripts(
    _entityId: string,
    scriptComponent: ScriptComponent,
    deltaTime: number
  ): void {
    scriptComponent.scripts.forEach((script, scriptName) => {
      if (script.enabled && script.onUpdate) {
        try {
          script.onUpdate(deltaTime);
        } catch (error) {
          console.error(`[ScriptSystem] Error updating script ${scriptName}:`, error);
        }
      }
    });
  }

  /**
   * Fixed update all scripts on an entity
   */
  private fixedUpdateScripts(
    _entityId: string,
    scriptComponent: ScriptComponent,
    fixedDeltaTime: number
  ): void {
    scriptComponent.scripts.forEach((script, scriptName) => {
      if (script.enabled && script.onFixedUpdate) {
        try {
          script.onFixedUpdate(fixedDeltaTime);
        } catch (error) {
          console.error(`[ScriptSystem] Error in fixed update for script ${scriptName}:`, error);
        }
      }
    });
  }

  /**
   * Late update all scripts on an entity
   */
  private lateUpdateScripts(
    _entityId: string,
    scriptComponent: ScriptComponent,
    deltaTime: number
  ): void {
    scriptComponent.scripts.forEach((script, scriptName) => {
      if (script.enabled && script.onLateUpdate) {
        try {
          script.onLateUpdate(deltaTime);
        } catch (error) {
          console.error(`[ScriptSystem] Error in late update for script ${scriptName}:`, error);
        }
      }
    });
  }

  /**
   * Add script to entity
   */
  addScript(entityId: string, scriptName: string, script: IScript): void {
    const scriptComponent = this.componentManager.getComponent<ScriptComponent>(
      entityId,
      'Script'
    );

    if (!scriptComponent) {
      console.warn(`[ScriptSystem] No script component on entity ${entityId}`);
      return;
    }

    scriptComponent.scripts.set(scriptName, script);
    
    // Initialize immediately if component is already initialized
    if (scriptComponent.initialized && script.onStart) {
      try {
        script.onStart();
        this.initializedScripts.add(`${entityId}:${scriptName}`);
      } catch (error) {
        console.error(`[ScriptSystem] Error initializing script ${scriptName}:`, error);
      }
    }

    console.log(`[ScriptSystem] Added script: ${scriptName} to entity ${entityId}`);
  }

  /**
   * Remove script from entity
   */
  removeScript(entityId: string, scriptName: string): void {
    const scriptComponent = this.componentManager.getComponent<ScriptComponent>(
      entityId,
      'Script'
    );

    if (!scriptComponent) return;

    const script = scriptComponent.scripts.get(scriptName);
    if (script) {
      // Call destroy hook
      if (script.onDestroy) {
        try {
          script.onDestroy();
        } catch (error) {
          console.error(`[ScriptSystem] Error destroying script ${scriptName}:`, error);
        }
      }

      scriptComponent.scripts.delete(scriptName);
      this.initializedScripts.delete(`${entityId}:${scriptName}`);
      
      console.log(`[ScriptSystem] Removed script: ${scriptName} from entity ${entityId}`);
    }
  }

  /**
   * Get script from entity
   */
  getScript(entityId: string, scriptName: string): IScript | null {
    const scriptComponent = this.componentManager.getComponent<ScriptComponent>(
      entityId,
      'Script'
    );

    if (!scriptComponent) return null;

    return scriptComponent.scripts.get(scriptName) || null;
  }

  /**
   * Enable script
   */
  enableScript(entityId: string, scriptName: string): void {
    const script = this.getScript(entityId, scriptName);
    if (script) {
      script.enabled = true;
    }
  }

  /**
   * Disable script
   */
  disableScript(entityId: string, scriptName: string): void {
    const script = this.getScript(entityId, scriptName);
    if (script) {
      script.enabled = false;
    }
  }

  /**
   * Trigger collision enter event
   */
  triggerCollisionEnter(entityId: string, other: any): void {
    const scriptComponent = this.componentManager.getComponent<ScriptComponent>(
      entityId,
      'Script'
    );

    if (!scriptComponent) return;

    scriptComponent.scripts.forEach((script) => {
      if (script.enabled && script.onCollisionEnter) {
        try {
          script.onCollisionEnter(other);
        } catch (error) {
          console.error('[ScriptSystem] Error in collision enter handler:', error);
        }
      }
    });
  }

  /**
   * Trigger collision exit event
   */
  triggerCollisionExit(entityId: string, other: any): void {
    const scriptComponent = this.componentManager.getComponent<ScriptComponent>(
      entityId,
      'Script'
    );

    if (!scriptComponent) return;

    scriptComponent.scripts.forEach((script) => {
      if (script.enabled && script.onCollisionExit) {
        try {
          script.onCollisionExit(other);
        } catch (error) {
          console.error('[ScriptSystem] Error in collision exit handler:', error);
        }
      }
    });
  }

  /**
   * Cleanup system
   */
  cleanup(): void {
    // Destroy all scripts
    const entities = this.getMatchingEntities();

    entities.forEach(entity => {
      const scriptComponent = this.componentManager.getComponent<ScriptComponent>(
        entity.id,
        'Script'
      );

      if (scriptComponent) {
        scriptComponent.scripts.forEach((script, scriptName) => {
          if (script.onDestroy) {
            try {
              script.onDestroy();
            } catch (error) {
              console.error(`[ScriptSystem] Error destroying script ${scriptName}:`, error);
            }
          }
        });
      }
    });

    this.initializedScripts.clear();
    console.log('[ScriptSystem] Cleaned up');
  }
}
