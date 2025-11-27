/**
 * EventEmitter
 * 
 * A type-safe event emitter for the game engine.
 * Allows components to communicate without tight coupling.
 */

import { EngineEvent, EngineEventListener, EngineEventType } from '../../types/engine/EngineTypes';

export class EventEmitter {
  private listeners: Map<EngineEventType | string, Set<EngineEventListener>>;
  private onceListeners: Map<EngineEventType | string, Set<EngineEventListener>>;
  private maxListeners: number;

  constructor(maxListeners: number = 100) {
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.maxListeners = maxListeners;
  }

  /**
   * Register an event listener
   */
  on<T = any>(eventType: EngineEventType | string, listener: EngineEventListener<T>): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const listeners = this.listeners.get(eventType)!;
    
    if (listeners.size >= this.maxListeners) {
      console.warn(`EventEmitter: Max listeners (${this.maxListeners}) reached for event: ${eventType}`);
    }

    listeners.add(listener as EngineEventListener);
  }

  /**
   * Register a one-time event listener
   */
  once<T = any>(eventType: EngineEventType | string, listener: EngineEventListener<T>): void {
    if (!this.onceListeners.has(eventType)) {
      this.onceListeners.set(eventType, new Set());
    }

    const listeners = this.onceListeners.get(eventType)!;
    listeners.add(listener as EngineEventListener);
  }

  /**
   * Remove an event listener
   */
  off<T = any>(eventType: EngineEventType | string, listener: EngineEventListener<T>): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener as EngineEventListener);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }

    const onceListeners = this.onceListeners.get(eventType);
    if (onceListeners) {
      onceListeners.delete(listener as EngineEventListener);
      if (onceListeners.size === 0) {
        this.onceListeners.delete(eventType);
      }
    }
  }

  /**
   * Remove all listeners for an event type
   */
  removeAllListeners(eventType?: EngineEventType | string): void {
    if (eventType) {
      this.listeners.delete(eventType);
      this.onceListeners.delete(eventType);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  /**
   * Emit an event
   */
  emit<T = any>(eventType: EngineEventType | string, data?: T): void {
    const event: EngineEvent<T> = {
      type: eventType as EngineEventType,
      timestamp: performance.now(),
      data
    };

    // Call regular listeners
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`EventEmitter: Error in listener for ${eventType}:`, error);
        }
      });
    }

    // Call and remove once listeners
    const onceListeners = this.onceListeners.get(eventType);
    if (onceListeners) {
      onceListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`EventEmitter: Error in once listener for ${eventType}:`, error);
        }
      });
      this.onceListeners.delete(eventType);
    }
  }

  /**
   * Get the number of listeners for an event type
   */
  listenerCount(eventType: EngineEventType | string): number {
    const regularCount = this.listeners.get(eventType)?.size || 0;
    const onceCount = this.onceListeners.get(eventType)?.size || 0;
    return regularCount + onceCount;
  }

  /**
   * Get all event types that have listeners
   */
  eventTypes(): (EngineEventType | string)[] {
    const types = new Set<EngineEventType | string>();
    
    this.listeners.forEach((_, type) => types.add(type));
    this.onceListeners.forEach((_, type) => types.add(type));
    
    return Array.from(types);
  }

  /**
   * Check if there are any listeners for an event type
   */
  hasListeners(eventType: EngineEventType | string): boolean {
    return this.listenerCount(eventType) > 0;
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }
}
