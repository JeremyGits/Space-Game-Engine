/**
 * Input State
 * Tracks the current state of all input devices
 */

import { Vector2 } from '../../utils/math/Vector2';
import type { InputButtonState, InputAxisState, PointerState } from '../../types/input/InputTypes';

export class InputState {
  // Keyboard state
  private keys: Map<string, InputButtonState> = new Map();
  
  // Mouse state
  private mouseButtons: Map<number, InputButtonState> = new Map();
  private mousePosition: Vector2 = new Vector2(0, 0);
  private mouseDelta: Vector2 = new Vector2(0, 0);
  private mouseWheel: Vector2 = new Vector2(0, 0);
  
  // Gamepad state
  private gamepadButtons: Map<string, Map<number, InputButtonState>> = new Map();
  private gamepadAxes: Map<string, Map<number, InputAxisState>> = new Map();
  
  // Touch state
  private touches: Map<number, PointerState> = new Map();

  /**
   * Get key state
   */
  public getKey(key: string): InputButtonState {
    return this.keys.get(key) || this.createDefaultButtonState();
  }

  /**
   * Set key state
   */
  public setKey(key: string, state: InputButtonState): void {
    this.keys.set(key, state);
  }

  /**
   * Get mouse button state
   */
  public getMouseButton(button: number): InputButtonState {
    return this.mouseButtons.get(button) || this.createDefaultButtonState();
  }

  /**
   * Set mouse button state
   */
  public setMouseButton(button: number, state: InputButtonState): void {
    this.mouseButtons.set(button, state);
  }

  /**
   * Get mouse position
   */
  public getMousePosition(): Vector2 {
    return this.mousePosition.clone();
  }

  /**
   * Set mouse position
   */
  public setMousePosition(position: Vector2): void {
    this.mouseDelta.set(
      position.x - this.mousePosition.x,
      position.y - this.mousePosition.y
    );
    this.mousePosition.copy(position);
  }

  /**
   * Get mouse delta
   */
  public getMouseDelta(): Vector2 {
    return this.mouseDelta.clone();
  }

  /**
   * Get mouse wheel
   */
  public getMouseWheel(): Vector2 {
    return this.mouseWheel.clone();
  }

  /**
   * Set mouse wheel
   */
  public setMouseWheel(wheel: Vector2): void {
    this.mouseWheel.copy(wheel);
  }

  /**
   * Get gamepad button state
   */
  public getGamepadButton(gamepadId: string, button: number): InputButtonState {
    const gamepad = this.gamepadButtons.get(gamepadId);
    return gamepad?.get(button) || this.createDefaultButtonState();
  }

  /**
   * Set gamepad button state
   */
  public setGamepadButton(gamepadId: string, button: number, state: InputButtonState): void {
    if (!this.gamepadButtons.has(gamepadId)) {
      this.gamepadButtons.set(gamepadId, new Map());
    }
    this.gamepadButtons.get(gamepadId)!.set(button, state);
  }

  /**
   * Get gamepad axis state
   */
  public getGamepadAxis(gamepadId: string, axis: number): InputAxisState {
    const gamepad = this.gamepadAxes.get(gamepadId);
    return gamepad?.get(axis) || this.createDefaultAxisState();
  }

  /**
   * Set gamepad axis state
   */
  public setGamepadAxis(gamepadId: string, axis: number, state: InputAxisState): void {
    if (!this.gamepadAxes.has(gamepadId)) {
      this.gamepadAxes.set(gamepadId, new Map());
    }
    this.gamepadAxes.get(gamepadId)!.set(axis, state);
  }

  /**
   * Get touch state
   */
  public getTouch(touchId: number): PointerState | undefined {
    return this.touches.get(touchId);
  }

  /**
   * Set touch state
   */
  public setTouch(touchId: number, state: PointerState): void {
    this.touches.set(touchId, state);
  }

  /**
   * Remove touch
   */
  public removeTouch(touchId: number): void {
    this.touches.delete(touchId);
  }

  /**
   * Get all active touches
   */
  public getTouches(): PointerState[] {
    return Array.from(this.touches.values());
  }

  /**
   * Clear transient states (just pressed/released, deltas)
   */
  public clearTransientStates(): void {
    // Clear key transients
    for (const state of this.keys.values()) {
      state.justPressed = false;
      state.justReleased = false;
    }

    // Clear mouse button transients
    for (const state of this.mouseButtons.values()) {
      state.justPressed = false;
      state.justReleased = false;
    }

    // Clear mouse delta and wheel
    this.mouseDelta.set(0, 0);
    this.mouseWheel.set(0, 0);

    // Clear gamepad button transients
    for (const gamepad of this.gamepadButtons.values()) {
      for (const state of gamepad.values()) {
        state.justPressed = false;
        state.justReleased = false;
      }
    }

    // Clear gamepad axis deltas
    for (const gamepad of this.gamepadAxes.values()) {
      for (const state of gamepad.values()) {
        state.delta = 0;
      }
    }
  }

  /**
   * Reset all state
   */
  public reset(): void {
    this.keys.clear();
    this.mouseButtons.clear();
    this.mousePosition.set(0, 0);
    this.mouseDelta.set(0, 0);
    this.mouseWheel.set(0, 0);
    this.gamepadButtons.clear();
    this.gamepadAxes.clear();
    this.touches.clear();
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
}
