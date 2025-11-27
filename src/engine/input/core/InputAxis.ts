/**
 * Input Axis
 * Represents a 1D axis with positive and negative bindings
 */

import type { InputAxisConfig, InputBindingConfig } from '../../../types/input/InputTypes';

export class InputAxis {
  public readonly name: string;
  public readonly positive: InputBindingConfig;
  public readonly negative: InputBindingConfig;
  public readonly deadzone: number;
  public readonly sensitivity: number;
  public readonly gravity: number;
  public readonly snap: boolean;

  private value: number = 0;
  private targetValue: number = 0;

  constructor(config: InputAxisConfig) {
    this.name = config.name;
    this.positive = config.positive;
    this.negative = config.negative;
    this.deadzone = config.deadzone ?? 0.1;
    this.sensitivity = config.sensitivity ?? 1.0;
    this.gravity = config.gravity ?? 3.0;
    this.snap = config.snap ?? false;
  }

  /**
   * Update axis with raw input values
   */
  public update(positiveValue: number, negativeValue: number, deltaTime: number): void {
    // Calculate target value
    this.targetValue = positiveValue - negativeValue;
    
    // Apply deadzone
    if (Math.abs(this.targetValue) < this.deadzone) {
      this.targetValue = 0;
    }
    
    // Snap to target if enabled and direction changed
    if (this.snap && Math.sign(this.targetValue) !== Math.sign(this.value)) {
      this.value = 0;
    }
    
    // Smoothly interpolate to target
    if (this.targetValue !== 0) {
      // Moving towards target
      const delta = this.sensitivity * deltaTime;
      this.value = this.moveTowards(this.value, this.targetValue, delta);
    } else {
      // Returning to zero
      const delta = this.gravity * deltaTime;
      this.value = this.moveTowards(this.value, 0, delta);
    }
    
    // Clamp to [-1, 1]
    this.value = Math.max(-1, Math.min(1, this.value));
  }

  /**
   * Get current value
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * Reset axis
   */
  public reset(): void {
    this.value = 0;
    this.targetValue = 0;
  }

  /**
   * Move value towards target
   */
  private moveTowards(current: number, target: number, maxDelta: number): number {
    if (Math.abs(target - current) <= maxDelta) {
      return target;
    }
    return current + Math.sign(target - current) * maxDelta;
  }
}
