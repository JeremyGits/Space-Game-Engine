/**
 * ModuleManager
 * 
 * Manages engine modules with dependency resolution and lifecycle management.
 * Ensures modules are initialized in the correct order based on dependencies.
 */

import { EventEmitter } from './EventEmitter';
import { IEngineModule } from '../../types/engine/EngineTypes';
import {
  ModuleMetadata,
  ModuleRegistration,
  ModuleState,
  ModuleEventType,
  ModulePriority
} from '../../types/engine/ModuleTypes';

export class ModuleManager {
  private eventEmitter: EventEmitter;
  private modules: Map<string, ModuleRegistration> = new Map();
  private initializationOrder: string[] = [];

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Register a module
   */
  register(
    module: IEngineModule,
    metadata: Partial<ModuleMetadata> = {}
  ): void {
    if (this.modules.has(module.name)) {
      throw new Error(`Module ${module.name} is already registered`);
    }

    const fullMetadata: ModuleMetadata = {
      name: module.name,
      version: '1.0.0',
      description: '',
      dependencies: [],
      priority: metadata.priority ?? ModulePriority.NORMAL,
      ...metadata
    };

    const registration: ModuleRegistration = {
      module,
      metadata: fullMetadata,
      state: ModuleState.UNINITIALIZED
    };

    this.modules.set(module.name, registration);
    
    this.eventEmitter.emit(ModuleEventType.MODULE_REGISTERED, {
      moduleName: module.name,
      state: ModuleState.UNINITIALIZED
    });

    console.log(`[ModuleManager] Registered module: ${module.name}`);
  }

  /**
   * Initialize all modules in dependency order
   */
  async initializeAll(): Promise<void> {
    // Calculate initialization order
    this.calculateInitializationOrder();

    // Initialize modules in order
    for (const moduleName of this.initializationOrder) {
      await this.initializeModule(moduleName);
    }

    console.log('[ModuleManager] All modules initialized');
  }

  /**
   * Initialize a specific module
   */
  private async initializeModule(moduleName: string): Promise<void> {
    const registration = this.modules.get(moduleName);
    if (!registration) {
      throw new Error(`Module not found: ${moduleName}`);
    }

    if (registration.state === ModuleState.INITIALIZED) {
      return; // Already initialized
    }

    if (registration.state === ModuleState.INITIALIZING) {
      throw new Error(`Circular dependency detected for module: ${moduleName}`);
    }

    // Check dependencies are initialized
    for (const depName of registration.metadata.dependencies) {
      const dep = this.modules.get(depName);
      if (!dep) {
        throw new Error(`Dependency ${depName} not found for module ${moduleName}`);
      }
      if (dep.state !== ModuleState.INITIALIZED) {
        await this.initializeModule(depName);
      }
    }

    // Initialize this module
    registration.state = ModuleState.INITIALIZING;
    
    try {
      await registration.module.initialize();
      registration.state = ModuleState.INITIALIZED;
      
      this.eventEmitter.emit(ModuleEventType.MODULE_INITIALIZED, {
        moduleName,
        state: ModuleState.INITIALIZED
      });
      
      console.log(`[ModuleManager] Initialized module: ${moduleName}`);
    } catch (error) {
      registration.state = ModuleState.ERROR;
      registration.error = error as Error;
      
      this.eventEmitter.emit(ModuleEventType.MODULE_ERROR, {
        moduleName,
        state: ModuleState.ERROR,
        error: error as Error
      });
      
      throw new Error(`Failed to initialize module ${moduleName}: ${error}`);
    }
  }

  /**
   * Start all modules
   */
  startAll(): void {
    for (const moduleName of this.initializationOrder) {
      this.startModule(moduleName);
    }
    console.log('[ModuleManager] All modules started');
  }

  /**
   * Start a specific module
   */
  private startModule(moduleName: string): void {
    const registration = this.modules.get(moduleName);
    if (!registration) {
      throw new Error(`Module not found: ${moduleName}`);
    }

    if (registration.state !== ModuleState.INITIALIZED && registration.state !== ModuleState.STOPPED) {
      console.warn(`[ModuleManager] Cannot start module ${moduleName} from state ${registration.state}`);
      return;
    }

    try {
      registration.state = ModuleState.STARTING;
      registration.module.start();
      registration.state = ModuleState.RUNNING;
      
      this.eventEmitter.emit(ModuleEventType.MODULE_STARTED, {
        moduleName,
        state: ModuleState.RUNNING
      });
      
      console.log(`[ModuleManager] Started module: ${moduleName}`);
    } catch (error) {
      registration.state = ModuleState.ERROR;
      registration.error = error as Error;
      
      this.eventEmitter.emit(ModuleEventType.MODULE_ERROR, {
        moduleName,
        state: ModuleState.ERROR,
        error: error as Error
      });
      
      throw new Error(`Failed to start module ${moduleName}: ${error}`);
    }
  }

  /**
   * Stop all modules
   */
  stopAll(): void {
    // Stop in reverse order
    for (let i = this.initializationOrder.length - 1; i >= 0; i--) {
      this.stopModule(this.initializationOrder[i]);
    }
    console.log('[ModuleManager] All modules stopped');
  }

  /**
   * Stop a specific module
   */
  private stopModule(moduleName: string): void {
    const registration = this.modules.get(moduleName);
    if (!registration) {
      return;
    }

    if (registration.state !== ModuleState.RUNNING) {
      return;
    }

    try {
      registration.state = ModuleState.STOPPING;
      registration.module.stop();
      registration.state = ModuleState.STOPPED;
      
      this.eventEmitter.emit(ModuleEventType.MODULE_STOPPED, {
        moduleName,
        state: ModuleState.STOPPED
      });
      
      console.log(`[ModuleManager] Stopped module: ${moduleName}`);
    } catch (error) {
      console.error(`[ModuleManager] Error stopping module ${moduleName}:`, error);
    }
  }

  /**
   * Update all modules
   */
  updateAll(deltaTime: number): void {
    for (const moduleName of this.initializationOrder) {
      const registration = this.modules.get(moduleName);
      if (registration && registration.state === ModuleState.RUNNING) {
        try {
          registration.module.update(deltaTime);
        } catch (error) {
          console.error(`[ModuleManager] Error updating module ${moduleName}:`, error);
        }
      }
    }
  }

  /**
   * Destroy all modules
   */
  destroyAll(): void {
    // Destroy in reverse order
    for (let i = this.initializationOrder.length - 1; i >= 0; i--) {
      const moduleName = this.initializationOrder[i];
      const registration = this.modules.get(moduleName);
      
      if (registration) {
        try {
          registration.module.destroy();
          console.log(`[ModuleManager] Destroyed module: ${moduleName}`);
        } catch (error) {
          console.error(`[ModuleManager] Error destroying module ${moduleName}:`, error);
        }
      }
    }

    this.modules.clear();
    this.initializationOrder = [];
  }

  /**
   * Get a module by name
   */
  getModule<T extends IEngineModule>(moduleName: string): T | null {
    const registration = this.modules.get(moduleName);
    return registration ? (registration.module as T) : null;
  }

  /**
   * Check if a module is registered
   */
  hasModule(moduleName: string): boolean {
    return this.modules.has(moduleName);
  }

  /**
   * Get module state
   */
  getModuleState(moduleName: string): ModuleState | null {
    const registration = this.modules.get(moduleName);
    return registration ? registration.state : null;
  }

  /**
   * Get all registered modules
   */
  getAllModules(): ModuleRegistration[] {
    return Array.from(this.modules.values());
  }

  /**
   * Calculate initialization order using topological sort
   */
  private calculateInitializationOrder(): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (moduleName: string): void => {
      if (visited.has(moduleName)) {
        return;
      }

      if (visiting.has(moduleName)) {
        throw new Error(`Circular dependency detected involving module: ${moduleName}`);
      }

      const registration = this.modules.get(moduleName);
      if (!registration) {
        throw new Error(`Module not found: ${moduleName}`);
      }

      visiting.add(moduleName);

      // Visit dependencies first
      for (const depName of registration.metadata.dependencies) {
        if (!this.modules.has(depName)) {
          throw new Error(`Dependency ${depName} not found for module ${moduleName}`);
        }
        visit(depName);
      }

      visiting.delete(moduleName);
      visited.add(moduleName);
      order.push(moduleName);
    };

    // Visit all modules
    for (const moduleName of this.modules.keys()) {
      visit(moduleName);
    }

    // Sort by priority (higher priority first within dependency constraints)
    this.initializationOrder = order.sort((a, b) => {
      const regA = this.modules.get(a)!;
      const regB = this.modules.get(b)!;
      return regB.metadata.priority - regA.metadata.priority;
    });

    console.log('[ModuleManager] Initialization order:', this.initializationOrder);
  }
}
