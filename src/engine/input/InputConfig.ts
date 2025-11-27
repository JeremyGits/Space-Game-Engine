/**
 * Input Configuration
 */

import type { InputConfig } from '../../types/input/InputTypes';

export const DEFAULT_INPUT_CONFIG: InputConfig = {
  enableKeyboard: true,
  enableMouse: true,
  enableGamepad: true,
  enableTouch: true,
  mouseCapture: false,
  mouseSensitivity: 1.0,
  gamepadDeadzone: 0.15,
  doubleTapTime: 300,
  longPressTime: 500
};

export class InputConfigManager {
  private config: InputConfig;

  constructor(config: Partial<InputConfig> = {}) {
    this.config = { ...DEFAULT_INPUT_CONFIG, ...config };
  }

  /**
   * Get configuration value
   */
  public getValue<K extends keyof InputConfig>(key: K): InputConfig[K] {
    return this.config[key];
  }

  /**
   * Set configuration value
   */
  public setValue<K extends keyof InputConfig>(key: K, value: InputConfig[K]): void {
    this.config[key] = value;
  }

  /**
   * Update multiple configuration values
   */
  public update(config: Partial<InputConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset to default configuration
   */
  public reset(): void {
    this.config = { ...DEFAULT_INPUT_CONFIG };
  }

  /**
   * Get full configuration
   */
  public getAll(): Readonly<InputConfig> {
    return { ...this.config };
  }

  /**
   * Serialize configuration
   */
  public serialize(): string {
    return JSON.stringify(this.config);
  }

  /**
   * Deserialize configuration
   */
  public deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.config = { ...DEFAULT_INPUT_CONFIG, ...parsed };
    } catch (error) {
      console.error('Failed to deserialize input config:', error);
    }
  }
}
