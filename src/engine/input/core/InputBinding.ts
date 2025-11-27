/**
 * Input Binding
 * Maps a physical input to an action or axis
 */

import type { InputBindingConfig, InputDeviceType } from '../../../types/input/InputTypes';

export class InputBinding {
  public readonly device: InputDeviceType;
  public readonly input: string;
  public readonly modifiers: string[];
  public readonly scale: number;
  public readonly invert: boolean;

  constructor(config: InputBindingConfig) {
    this.device = config.device;
    this.input = config.input;
    this.modifiers = config.modifiers ?? [];
    this.scale = config.scale ?? 1.0;
    this.invert = config.invert ?? false;
  }

  /**
   * Process raw input value
   */
  public processValue(rawValue: number): number {
    let value = rawValue * this.scale;
    
    if (this.invert) {
      value = -value;
    }
    
    return value;
  }

  /**
   * Check if modifiers are satisfied
   */
  public checkModifiers(pressedModifiers: Set<string>): boolean {
    if (this.modifiers.length === 0) {
      return true;
    }
    
    return this.modifiers.every(mod => pressedModifiers.has(mod));
  }

  /**
   * Check if binding matches device and input
   */
  public matches(device: InputDeviceType, input: string): boolean {
    return this.device === device && this.input === input;
  }
}
