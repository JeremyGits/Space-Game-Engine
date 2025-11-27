/**
 * Input System
 * Complete input management system for the game engine
 */

// Main Manager
export { InputManager } from './InputManager';

// Configuration & State
export { InputConfigManager, DEFAULT_INPUT_CONFIG } from './InputConfig';
export { InputState } from './InputState';

// Mapping & Recording
export { InputMapper } from './InputMapper';
export { InputRecorder } from './InputRecorder';

// Core Classes
export { InputDevice } from './core/InputDevice';
export { InputAction } from './core/InputAction';
export { InputAxis } from './core/InputAxis';
export { InputBinding } from './core/InputBinding';

// Types
export type {
  InputConfig,
  InputDeviceType,
  InputEventType,
  InputEvent,
  InputButtonState,
  InputAxisState,
  InputActionConfig,
  InputAxisConfig,
  InputBindingConfig,
  InputContext,
  IInputDevice,
  PointerState,
  InputRecording,
  InputRecordingFrame
} from '../../types/input/InputTypes';
