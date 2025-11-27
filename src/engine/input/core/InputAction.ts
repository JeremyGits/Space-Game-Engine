/**
 * Input Action
 * Represents a named action that can be triggered by multiple input bindings
 */

import type { InputActionConfig, InputBindingConfig } from '../../../types/input/InputTypes';

export class InputAction {
  public readonly name: string;
  public readonly bindings: InputBindingConfig[];
  public readonly deadzone: number;
  public readonly sensitivity: number;

  private value: number = 0;
  private triggered: boolean = false;

  constructor(config: InputActionConfig) {
    this.name = config.name;
    this.bindings = config.bindings;
    this.deadzone = config.deadzone ?? 0.1;
    this.sensitivity = config.sensitivity ?? 1.0;
  }

  /**
   * Update action value
   */
  public update(rawValue: number): void {
    // Apply deadzone
    let processedValue = Math.abs(rawValue) < this.deadzone ? 0 : rawValue;
    
    // Apply sensitivity
    processedValue *= this.sensitivity;
    
    // Clamp to [-1, 1]
    processedValue = Math.max(-1, Math.min(1, processedValue));
    
    this.value = processedValue;
    this.triggered = Math.abs(processedValue) > 0;
  }

  /**
   * Get current value
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * Check if action is triggered
   */
  public isTriggered(): boolean {
    return this.triggered;
  }

  /**
   * Reset action
   */
  public reset(): void {
    this.value = 0;
    this.triggered = false;
  }
}
