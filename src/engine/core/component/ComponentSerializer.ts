/**
 * ComponentSerializer
 * 
 * Serialization and deserialization for components.
 * Handles component data persistence and transfer.
 */

import { IComponent, ComponentType } from '../../../types/engine/ECSTypes';

/**
 * Serialized component data
 */
export interface SerializedComponentData {
  type: ComponentType;
  enabled: boolean;
  data: Record<string, any>;
  version?: string;
}

/**
 * Serialization options
 */
export interface ComponentSerializationOptions {
  includeDisabled?: boolean;
  prettyPrint?: boolean;
  includeMetadata?: boolean;
}

/**
 * Deserialization options
 */
export interface ComponentDeserializationOptions {
  strict?: boolean;
  validateTypes?: boolean;
}

export class ComponentSerializer {
  private serializers: Map<ComponentType, (component: IComponent) => Record<string, any>> = new Map();
  private deserializers: Map<ComponentType, (data: Record<string, any>) => IComponent> = new Map();
  private factories: Map<ComponentType, () => IComponent> = new Map();

  /**
   * Register custom serializer for a component type
   */
  registerSerializer(
    type: ComponentType,
    serializer: (component: IComponent) => Record<string, any>
  ): void {
    this.serializers.set(type, serializer);
    console.log(`[ComponentSerializer] Registered serializer for: ${type}`);
  }

  /**
   * Register custom deserializer for a component type
   */
  registerDeserializer(
    type: ComponentType,
    deserializer: (data: Record<string, any>) => IComponent
  ): void {
    this.deserializers.set(type, deserializer);
    console.log(`[ComponentSerializer] Registered deserializer for: ${type}`);
  }

  /**
   * Register component factory
   */
  registerFactory(type: ComponentType, factory: () => IComponent): void {
    this.factories.set(type, factory);
  }

  /**
   * Serialize a component
   */
  serialize(component: IComponent, options: ComponentSerializationOptions = {}): SerializedComponentData {
    const serializer = this.serializers.get(component.type);
    
    let data: Record<string, any>;
    
    if (serializer) {
      // Use custom serializer
      data = serializer(component);
    } else if ('toJSON' in component && typeof component.toJSON === 'function') {
      // Use component's toJSON method
      data = component.toJSON();
    } else {
      // Default serialization
      data = this.defaultSerialize(component);
    }

    const serialized: SerializedComponentData = {
      type: component.type,
      enabled: component.enabled,
      data
    };

    if (options.includeMetadata) {
      serialized.version = '1.0.0';
    }

    return serialized;
  }

  /**
   * Default component serialization
   */
  private defaultSerialize(component: IComponent): Record<string, any> {
    const data: Record<string, any> = {};
    
    Object.keys(component).forEach(key => {
      if (key === 'type' || key === 'enabled') return;
      
      const value = (component as any)[key];
      
      // Skip functions
      if (typeof value === 'function') return;
      
      // Handle special types
      if (value && typeof value === 'object') {
        if ('toJSON' in value && typeof value.toJSON === 'function') {
          data[key] = value.toJSON();
        } else if (Array.isArray(value)) {
          data[key] = value.map(item => 
            item && typeof item === 'object' && 'toJSON' in item 
              ? item.toJSON() 
              : item
          );
        } else {
          // Shallow copy for simple objects
          data[key] = { ...value };
        }
      } else {
        data[key] = value;
      }
    });
    
    return data;
  }

  /**
   * Deserialize a component
   */
  deserialize(
    serialized: SerializedComponentData,
    options: ComponentDeserializationOptions = {}
  ): IComponent {
    const deserializer = this.deserializers.get(serialized.type);
    
    let component: IComponent;
    
    if (deserializer) {
      // Use custom deserializer
      component = deserializer(serialized.data);
    } else {
      // Use factory and apply data
      const factory = this.factories.get(serialized.type);
      
      if (!factory) {
        if (options.strict) {
          throw new Error(`No factory registered for component: ${serialized.type}`);
        }
        console.warn(`[ComponentSerializer] No factory for ${serialized.type}, skipping`);
        return null as any;
      }
      
      component = factory();
      
      // Apply data using fromJSON if available
      if ('fromJSON' in component && typeof component.fromJSON === 'function') {
        component.fromJSON(serialized.data);
      } else {
        // Default: assign properties
        Object.assign(component, serialized.data);
      }
    }

    component.enabled = serialized.enabled;
    
    return component;
  }

  /**
   * Serialize multiple components
   */
  serializeMultiple(
    components: IComponent[],
    options: ComponentSerializationOptions = {}
  ): SerializedComponentData[] {
    return components
      .filter(component => options.includeDisabled || component.enabled)
      .map(component => this.serialize(component, options));
  }

  /**
   * Deserialize multiple components
   */
  deserializeMultiple(
    serialized: SerializedComponentData[],
    options: ComponentDeserializationOptions = {}
  ): IComponent[] {
    return serialized
      .map(data => this.deserialize(data, options))
      .filter(component => component !== null);
  }

  /**
   * Serialize to JSON string
   */
  toJSON(components: IComponent[], options: ComponentSerializationOptions = {}): string {
    const serialized = this.serializeMultiple(components, options);
    return JSON.stringify(serialized, null, options.prettyPrint ? 2 : 0);
  }

  /**
   * Deserialize from JSON string
   */
  fromJSON(json: string, options: ComponentDeserializationOptions = {}): IComponent[] {
    const serialized = JSON.parse(json) as SerializedComponentData[];
    return this.deserializeMultiple(serialized, options);
  }

  /**
   * Clone a component
   */
  clone(component: IComponent): IComponent {
    // Use component's clone method if available
    if ('clone' in component && typeof component.clone === 'function') {
      return component.clone();
    }

    // Otherwise serialize and deserialize
    const serialized = this.serialize(component);
    return this.deserialize(serialized);
  }

  /**
   * Clone multiple components
   */
  cloneMultiple(components: IComponent[]): IComponent[] {
    return components.map(component => this.clone(component));
  }

  /**
   * Validate serialized data
   */
  validate(serialized: SerializedComponentData): boolean {
    if (!serialized.type || typeof serialized.type !== 'string') {
      return false;
    }

    if (typeof serialized.enabled !== 'boolean') {
      return false;
    }

    if (!serialized.data || typeof serialized.data !== 'object') {
      return false;
    }

    return true;
  }

  /**
   * Get registered types
   */
  getRegisteredTypes(): {
    serializers: ComponentType[];
    deserializers: ComponentType[];
    factories: ComponentType[];
  } {
    return {
      serializers: Array.from(this.serializers.keys()),
      deserializers: Array.from(this.deserializers.keys()),
      factories: Array.from(this.factories.keys())
    };
  }

  /**
   * Check if type has custom serializer
   */
  hasSerializer(type: ComponentType): boolean {
    return this.serializers.has(type);
  }

  /**
   * Check if type has custom deserializer
   */
  hasDeserializer(type: ComponentType): boolean {
    return this.deserializers.has(type);
  }

  /**
   * Check if type has factory
   */
  hasFactory(type: ComponentType): boolean {
    return this.factories.has(type);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.serializers.clear();
    this.deserializers.clear();
    this.factories.clear();
    console.log('[ComponentSerializer] Cleared all registrations');
  }

  /**
   * Get statistics
   */
  getStats(): {
    serializers: number;
    deserializers: number;
    factories: number;
  } {
    return {
      serializers: this.serializers.size,
      deserializers: this.deserializers.size,
      factories: this.factories.size
    };
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `ComponentSerializer | Serializers: ${stats.serializers}, Deserializers: ${stats.deserializers}, Factories: ${stats.factories}`;
  }
}
