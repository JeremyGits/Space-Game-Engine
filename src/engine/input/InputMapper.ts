/**
 * Input Mapper
 * Maps raw input events to actions and axes
 */

import { InputAction } from './core/InputAction';
import { InputAxis } from './core/InputAxis';
import { InputBinding } from './core/InputBinding';
import type { 
  InputContext, 
  InputActionConfig, 
  InputAxisConfig,
  InputDeviceType 
} from '../../types/input/InputTypes';

export class InputMapper {
  private contexts: Map<string, InputContext> = new Map();
  private activeContext: string | null = null;
  private actions: Map<string, InputAction> = new Map();
  private axes: Map<string, InputAxis> = new Map();
  private pressedModifiers: Set<string> = new Set();

  /**
   * Create input context
   */
  public createContext(name: string, priority: number = 0): void {
    if (this.contexts.has(name)) {
      console.warn(`Context '${name}' already exists`);
      return;
    }

    this.contexts.set(name, {
      name,
      priority,
      enabled: true,
      actions: new Map(),
      axes: new Map()
    });
  }

  /**
   * Remove context
   */
  public removeContext(name: string): void {
    this.contexts.delete(name);
    if (this.activeContext === name) {
      this.activeContext = null;
    }
  }

  /**
   * Set active context
   */
  public setActiveContext(name: string): void {
    if (!this.contexts.has(name)) {
      console.warn(`Context '${name}' does not exist`);
      return;
    }
    this.activeContext = name;
  }

  /**
   * Get active context
   */
  public getActiveContext(): string | null {
    return this.activeContext;
  }

  /**
   * Enable/disable context
   */
  public setContextEnabled(name: string, enabled: boolean): void {
    const context = this.contexts.get(name);
    if (context) {
      context.enabled = enabled;
    }
  }

  /**
   * Add action to context
   */
  public addAction(contextName: string, config: InputActionConfig): void {
    const context = this.contexts.get(contextName);
    if (!context) {
      console.warn(`Context '${contextName}' does not exist`);
      return;
    }

    context.actions.set(config.name, config);
    
    // Create action instance if not exists
    if (!this.actions.has(config.name)) {
      this.actions.set(config.name, new InputAction(config));
    }
  }

  /**
   * Add axis to context
   */
  public addAxis(contextName: string, config: InputAxisConfig): void {
    const context = this.contexts.get(contextName);
    if (!context) {
      console.warn(`Context '${contextName}' does not exist`);
      return;
    }

    context.axes.set(config.name, config);
    
    // Create axis instance if not exists
    if (!this.axes.has(config.name)) {
      this.axes.set(config.name, new InputAxis(config));
    }
  }

  /**
   * Process input event
   */
  public processInput(
    device: InputDeviceType,
    input: string,
    value: number
  ): void {
    // Update modifiers
    if (this.isModifierKey(input)) {
      if (value > 0) {
        this.pressedModifiers.add(input);
      } else {
        this.pressedModifiers.delete(input);
      }
    }

    // Get active contexts sorted by priority
    const activeContexts = this.getActiveContexts();

    // Process actions
    for (const context of activeContexts) {
      for (const [actionName, actionConfig] of context.actions) {
        const action = this.actions.get(actionName);
        if (!action) continue;

        // Check if any binding matches
        for (const bindingConfig of actionConfig.bindings) {
          const binding = new InputBinding(bindingConfig);
          
          if (binding.matches(device, input) && 
              binding.checkModifiers(this.pressedModifiers)) {
            const processedValue = binding.processValue(value);
            action.update(processedValue);
            break; // First matching binding wins
          }
        }
      }

      // Process axes
      for (const [axisName, axisConfig] of context.axes) {
        const axis = this.axes.get(axisName);
        if (!axis) continue;

        let positiveValue = 0;
        let negativeValue = 0;

        // Check positive binding
        const positiveBinding = new InputBinding(axisConfig.positive);
        if (positiveBinding.matches(device, input) &&
            positiveBinding.checkModifiers(this.pressedModifiers)) {
          positiveValue = positiveBinding.processValue(value);
        }

        // Check negative binding
        const negativeBinding = new InputBinding(axisConfig.negative);
        if (negativeBinding.matches(device, input) &&
            negativeBinding.checkModifiers(this.pressedModifiers)) {
          negativeValue = negativeBinding.processValue(value);
        }

        if (positiveValue > 0 || negativeValue > 0) {
          axis.update(positiveValue, negativeValue, 0.016); // Will be updated with real deltaTime
        }
      }
    }
  }

  /**
   * Update axes with delta time
   */
  public update(deltaTime: number): void {
    for (const axis of this.axes.values()) {
      // Axes are updated in processInput, but we need to apply time-based smoothing
      const currentValue = axis.getValue();
      axis.update(currentValue > 0 ? currentValue : 0, currentValue < 0 ? -currentValue : 0, deltaTime);
    }
  }

  /**
   * Get action value
   */
  public getAction(name: string): number {
    const action = this.actions.get(name);
    return action ? action.getValue() : 0;
  }

  /**
   * Check if action is triggered
   */
  public isActionTriggered(name: string): boolean {
    const action = this.actions.get(name);
    return action ? action.isTriggered() : false;
  }

  /**
   * Get axis value
   */
  public getAxis(name: string): number {
    const axis = this.axes.get(name);
    return axis ? axis.getValue() : 0;
  }

  /**
   * Reset all actions and axes
   */
  public reset(): void {
    for (const action of this.actions.values()) {
      action.reset();
    }
    for (const axis of this.axes.values()) {
      axis.reset();
    }
    this.pressedModifiers.clear();
  }

  /**
   * Get active contexts sorted by priority
   */
  private getActiveContexts(): InputContext[] {
    return Array.from(this.contexts.values())
      .filter(ctx => ctx.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if input is a modifier key
   */
  private isModifierKey(input: string): boolean {
    return ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 
            'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(input);
  }
}
