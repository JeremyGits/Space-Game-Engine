/**
 * Base Input Device
 */

import type { InputDeviceType, InputButtonState, InputAxisState, IInputDevice } from '../../../types/input/InputTypes';

export abstract class InputDevice implements IInputDevice {
  public readonly type: InputDeviceType;
  public readonly id: string;
  public connected: boolean = true;

  protected buttons: Map<string, InputButtonState> = new Map();
  protected axes: Map<string, InputAxisState> = new Map();

  constructor(type: InputDeviceType, id: string) {
    this.type = type;
    this.id = id;
  }

  /**
   * Update device state
   */
  public abstract update(deltaTime: number): void;

  /**
   * Get button state
   */
  public getButton(button: string): InputButtonState {
    return this.buttons.get(button) || this.createDefaultButtonState();
  }

  /**
   * Get axis state
   */
  public getAxis(axis: string): InputAxisState {
    return this.axes.get(axis) || this.createDefaultAxisState();
  }

  /**
   * Set button state
   */
  protected setButton(button: string, pressed: boolean, timestamp: number): void {
    let state = this.buttons.get(button);
    
    if (!state) {
      state = this.createDefaultButtonState();
      this.buttons.set(button, state);
    }

    const wasPressed = state.pressed;
    state.pressed = pressed;
    state.justPressed = pressed && !wasPressed;
    state.justReleased = !pressed && wasPressed;

    if (pressed && !wasPressed) {
      state.pressTime = timestamp;
    } else if (!pressed && wasPressed) {
      state.releaseTime = timestamp;
    }
  }

  /**
   * Set axis value
   */
  protected setAxis(axis: string, value: number): void {
    let state = this.axes.get(axis);
    
    if (!state) {
      state = this.createDefaultAxisState();
      this.axes.set(axis, state);
    }

    state.lastValue = state.value;
    state.value = value;
    state.delta = value - state.lastValue;
  }

  /**
   * Clear just pressed/released flags
   */
  protected clearTransientStates(): void {
    for (const state of this.buttons.values()) {
      state.justPressed = false;
      state.justReleased = false;
    }

    for (const state of this.axes.values()) {
      state.delta = 0;
    }
  }

  /**
   * Create default button state
   */
  private createDefaultButtonState(): InputButtonState {
    return {
      pressed: false,
      justPressed: false,
      justReleased: false,
      pressTime: 0,
      releaseTime: 0
    };
  }

  /**
   * Create default axis state
   */
  private createDefaultAxisState(): InputAxisState {
    return {
      value: 0,
      delta: 0,
      lastValue: 0
    };
  }

  /**
   * Disconnect device
   */
  public disconnect(): void {
    this.connected = false;
    this.buttons.clear();
    this.axes.clear();
  }

  /**
   * Vibrate device (optional, for gamepads)
   */
  public vibrate?(duration: number, intensity: number): void;
}
