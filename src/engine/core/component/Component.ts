/**
 * Component
 * 
 * Base class for all components in the ECS architecture.
 * Components are pure data containers attached to entities.
 */

import { IComponent, ComponentType } from '../../../types/engine/ECSTypes';

export abstract class Component implements IComponent {
  public readonly type: ComponentType;
  public enabled: boolean = true;

  constructor(type: ComponentType) {
    this.type = type;
  }

  /**
   * Called when component is added to an entity
   */
  onAdd?(): void;

  /**
   * Called when component is removed from an entity
   */
  onRemove?(): void;

  /**
   * Called when component is enabled
   */
  onEnable?(): void;

  /**
   * Called when component is disabled
   */
  onDisable?(): void;

  /**
   * Update component (if needed)
   */
  update?(deltaTime: number): void;

  /**
   * Reset component to default state (for pooling)
   */
  reset?(): void;

  /**
   * Clone component
   */
  clone?(): Component;

  /**
   * Serialize component to JSON
   */
  toJSON?(): Record<string, any>;

  /**
   * Deserialize component from JSON
   */
  fromJSON?(data: Record<string, any>): void;

  /**
   * Validate component data
   */
  validate?(): boolean;

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `${this.type} | Enabled: ${this.enabled}`;
  }
}

/**
 * Helper to create a simple component class
 */
export function createComponentClass<T extends Record<string, any>>(
  type: ComponentType,
  defaultValues: T
): new () => Component & T {
  return class extends Component {
    constructor() {
      super(type);
      Object.assign(this, defaultValues);
    }

    reset(): void {
      Object.assign(this, defaultValues);
    }

    clone(): Component & T {
      const cloned = new (this.constructor as any)();
      Object.assign(cloned, this);
      return cloned;
    }

    toJSON(): Record<string, any> {
      const data: Record<string, any> = {};
      Object.keys(this).forEach(key => {
        if (key !== 'type' && key !== 'enabled') {
          data[key] = (this as any)[key];
        }
      });
      return data;
    }

    fromJSON(data: Record<string, any>): void {
      Object.assign(this, data);
    }
  } as any;
}
