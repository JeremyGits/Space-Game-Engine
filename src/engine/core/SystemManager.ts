/**
 * SystemManager
 * 
 * Manages all game systems and their execution order.
 * Systems process entities and components each frame.
 */

import { EventEmitter } from './EventEmitter';
import { IEngineSystem } from '../../types/engine/EngineTypes';
import {
  SystemMetadata,
  SystemRegistration,
  SystemState,
  SystemEventType,
  SystemPhase,
  SystemPriority
} from '../../types/engine/SystemTypes';

export class SystemManager {
  private eventEmitter: EventEmitter;
  private systems: Map<string, SystemRegistration> = new Map();
  private systemsByPhase: Map<SystemPhase, SystemRegistration[]> = new Map();

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    
    // Initialize phase maps
    Object.values(SystemPhase).forEach(phase => {
      this.systemsByPhase.set(phase, []);
    });
  }

  /**
   * Register a system
   */
  register(
    system: IEngineSystem,
    metadata: Partial<SystemMetadata> = {}
  ): void {
    if (this.systems.has(system.name)) {
      throw new Error(`System ${system.name} is already registered`);
    }

    const fullMetadata: SystemMetadata = {
      name: system.name,
      description: '',
      priority: metadata.priority ?? SystemPriority.NORMAL,
      phase: metadata.phase ?? SystemPhase.UPDATE,
      dependencies: metadata.dependencies ?? [],
      ...metadata
    };

    const registration: SystemRegistration = {
      system,
      metadata: fullMetadata,
      state: SystemState.UNINITIALIZED,
      enabled: true
    };

    this.systems.set(system.name, registration);
    
    // Add to phase list
    const phaseList = this.systemsByPhase.get(fullMetadata.phase)!;
    phaseList.push(registration);
    
    // Sort by priority (higher priority first)
    phaseList.sort((a, b) => b.metadata.priority - a.metadata.priority);
    
    this.eventEmitter.emit(SystemEventType.SYSTEM_REGISTERED, {
      systemName: system.name,
      state: SystemState.UNINITIALIZED
    });

    console.log(`[SystemManager] Registered system: ${system.name} (phase: ${fullMetadata.phase}, priority: ${fullMetadata.priority})`);
  }

  /**
   * Initialize all systems
   */
  initializeAll(): void {
    this.systems.forEach((registration) => {
      this.initializeSystem(registration);
    });

    console.log('[SystemManager] All systems initialized');
  }

  /**
   * Initialize a specific system
   */
  private initializeSystem(registration: SystemRegistration): void {
    if (registration.state === SystemState.INITIALIZED) {
      return;
    }

    try {
      registration.system.initialize();
      registration.state = SystemState.INITIALIZED;
      
      this.eventEmitter.emit(SystemEventType.SYSTEM_INITIALIZED, {
        systemName: registration.metadata.name,
        state: SystemState.INITIALIZED
      });
      
      console.log(`[SystemManager] Initialized system: ${registration.metadata.name}`);
    } catch (error) {
      registration.state = SystemState.ERROR;
      
      this.eventEmitter.emit(SystemEventType.SYSTEM_ERROR, {
        systemName: registration.metadata.name,
        state: SystemState.ERROR,
        error: error as Error
      });
      
      throw new Error(`Failed to initialize system ${registration.metadata.name}: ${error}`);
    }
  }

  /**
   * Update systems in a specific phase
   */
  updatePhase(phase: SystemPhase, deltaTime: number): void {
    const systems = this.systemsByPhase.get(phase);
    if (!systems) {
      return;
    }

    for (const registration of systems) {
      if (!registration.enabled || registration.state !== SystemState.INITIALIZED) {
        continue;
      }

      try {
        switch (phase) {
          case SystemPhase.FIXED_UPDATE:
            registration.system.fixedUpdate(deltaTime);
            break;
          case SystemPhase.UPDATE:
            registration.system.update(deltaTime);
            break;
          case SystemPhase.LATE_UPDATE:
            registration.system.lateUpdate(deltaTime);
            break;
        }
      } catch (error) {
        console.error(`[SystemManager] Error in system ${registration.metadata.name}:`, error);
      }
    }
  }

  /**
   * Enable a system
   */
  enableSystem(systemName: string): void {
    const registration = this.systems.get(systemName);
    if (!registration) {
      throw new Error(`System not found: ${systemName}`);
    }

    registration.enabled = true;
    
    this.eventEmitter.emit(SystemEventType.SYSTEM_ENABLED, {
      systemName,
      state: registration.state
    });
  }

  /**
   * Disable a system
   */
  disableSystem(systemName: string): void {
    const registration = this.systems.get(systemName);
    if (!registration) {
      throw new Error(`System not found: ${systemName}`);
    }

    registration.enabled = false;
    
    this.eventEmitter.emit(SystemEventType.SYSTEM_DISABLED, {
      systemName,
      state: registration.state
    });
  }

  /**
   * Get a system by name
   */
  getSystem<T extends IEngineSystem>(systemName: string): T | null {
    const registration = this.systems.get(systemName);
    return registration ? (registration.system as T) : null;
  }

  /**
   * Check if a system is registered
   */
  hasSystem(systemName: string): boolean {
    return this.systems.has(systemName);
  }

  /**
   * Get system state
   */
  getSystemState(systemName: string): SystemState | null {
    const registration = this.systems.get(systemName);
    return registration ? registration.state : null;
  }

  /**
   * Get all systems
   */
  getAllSystems(): SystemRegistration[] {
    return Array.from(this.systems.values());
  }

  /**
   * Get systems by phase
   */
  getSystemsByPhase(phase: SystemPhase): SystemRegistration[] {
    return this.systemsByPhase.get(phase) || [];
  }

  /**
   * Destroy all systems
   */
  destroyAll(): void {
    this.systems.forEach((registration) => {
      try {
        registration.system.destroy();
        console.log(`[SystemManager] Destroyed system: ${registration.metadata.name}`);
      } catch (error) {
        console.error(`[SystemManager] Error destroying system ${registration.metadata.name}:`, error);
      }
    });

    this.systems.clear();
    this.systemsByPhase.forEach(list => list.length = 0);
  }
}
