/**
 * Input System Type Definitions
 */

import type { Vector2 } from '../../utils/math/Vector2';

/**
 * Input device types
 */
export enum InputDeviceType {
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  GAMEPAD = 'gamepad',
  TOUCH = 'touch'
}

/**
 * Input event types
 */
export enum InputEventType {
  BUTTON_DOWN = 'buttonDown',
  BUTTON_UP = 'buttonUp',
  BUTTON_PRESSED = 'buttonPressed',
  AXIS_CHANGED = 'axisChanged',
  POINTER_MOVE = 'pointerMove',
  POINTER_DOWN = 'pointerDown',
  POINTER_UP = 'pointerUp',
  WHEEL = 'wheel'
}

/**
 * Input button state
 */
export interface InputButtonState {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
  pressTime: number;
  releaseTime: number;
}

/**
 * Input axis state
 */
export interface InputAxisState {
  value: number;
  delta: number;
  lastValue: number;
}

/**
 * Input device interface
 */
export interface IInputDevice {
  readonly type: InputDeviceType;
  readonly id: string;
  readonly connected: boolean;
  
  update(deltaTime: number): void;
  getButton(button: string): InputButtonState;
  getAxis(axis: string): InputAxisState;
  vibrate?(duration: number, intensity: number): void;
}

/**
 * Input action configuration
 */
export interface InputActionConfig {
  name: string;
  bindings: InputBindingConfig[];
  deadzone?: number;
  sensitivity?: number;
}

/**
 * Input binding configuration
 */
export interface InputBindingConfig {
  device: InputDeviceType;
  input: string;
  modifiers?: string[];
  scale?: number;
  invert?: boolean;
}

/**
 * Input axis configuration
 */
export interface InputAxisConfig {
  name: string;
  positive: InputBindingConfig;
  negative: InputBindingConfig;
  deadzone?: number;
  sensitivity?: number;
  gravity?: number;
  snap?: boolean;
}

/**
 * Input context
 */
export interface InputContext {
  name: string;
  priority: number;
  enabled: boolean;
  actions: Map<string, InputActionConfig>;
  axes: Map<string, InputAxisConfig>;
}

/**
 * Input event
 */
export interface InputEvent {
  type: InputEventType;
  device: InputDeviceType;
  deviceId: string;
  input: string;
  value: number;
  timestamp: number;
  consumed: boolean;
}

/**
 * Pointer state
 */
export interface PointerState {
  position: Vector2;
  delta: Vector2;
  buttons: Map<number, InputButtonState>;
  wheel: Vector2;
}

/**
 * Input configuration
 */
export interface InputConfig {
  enableKeyboard: boolean;
  enableMouse: boolean;
  enableGamepad: boolean;
  enableTouch: boolean;
  mouseCapture: boolean;
  mouseSensitivity: number;
  gamepadDeadzone: number;
  doubleTapTime: number;
  longPressTime: number;
}

/**
 * Input recording frame
 */
export interface InputRecordingFrame {
  timestamp: number;
  events: InputEvent[];
}

/**
 * Input recording
 */
export interface InputRecording {
  frames: InputRecordingFrame[];
  duration: number;
  startTime: number;
}

/**
 * Input manager events
 */
export interface InputManagerEvents {
  'input:action': (action: string, value: number) => void;
  'input:axis': (axis: string, value: number) => void;
  'input:button': (button: string, pressed: boolean) => void;
  'input:device:connected': (device: IInputDevice) => void;
  'input:device:disconnected': (device: IInputDevice) => void;
  'input:context:changed': (context: string) => void;
}
