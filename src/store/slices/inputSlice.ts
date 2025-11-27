/**
 * Input Slice
 * 
 * Manages all input state including keyboard, mouse, and gamepad
 */

import { StateCreator } from 'zustand';
import { InputState, InputDevice } from '../../types/store/StoreTypes';

export interface InputSlice extends InputState {
  // Device management
  setActiveDevice: (device: InputDevice) => void;
  connectGamepad: (index: number) => void;
  disconnectGamepad: () => void;
  
  // Keyboard
  pressKey: (key: string) => void;
  releaseKey: (key: string) => void;
  isKeyPressed: (key: string) => boolean;
  clearKeys: () => void;
  
  // Mouse
  updateMousePosition: (x: number, y: number) => void;
  updateMouseDelta: (deltaX: number, deltaY: number) => void;
  pressMouseButton: (button: number) => void;
  releaseMouseButton: (button: number) => void;
  isMouseButtonPressed: (button: number) => boolean;
  clearMouseButtons: () => void;
  
  // Gamepad
  updateGamepadAxes: (axes: number[]) => void;
  updateGamepadButtons: (buttons: boolean[]) => void;
  getAxis: (axisIndex: number) => number;
  isButtonPressed: (buttonIndex: number) => boolean;
  
  // Action mapping
  mapAction: (action: string, keys: string[]) => void;
  unmapAction: (action: string) => void;
  isActionActive: (action: string) => boolean;
  getActionValue: (action: string) => number;
  
  // Sensitivity
  setMouseSensitivity: (sensitivity: number) => void;
  setGamepadSensitivity: (sensitivity: number) => void;
  setDeadzone: (deadzone: number) => void;
  
  // Vibration
  enableVibration: () => void;
  disableVibration: () => void;
  vibrate: (duration: number, weakMagnitude: number, strongMagnitude: number) => void;
  
  // Reset
  resetInput: () => void;
  clearAllInput: () => void;
}

const defaultActionMap = new Map<string, string[]>([
  // Movement
  ['forward', ['w', 'ArrowUp']],
  ['backward', ['s', 'ArrowDown']],
  ['left', ['a', 'ArrowLeft']],
  ['right', ['d', 'ArrowRight']],
  ['up', ['Space', 'e']],
  ['down', ['Shift', 'q']],
  
  // Rotation
  ['rollLeft', ['q']],
  ['rollRight', ['e']],
  
  // Actions
  ['boost', ['Shift']],
  ['brake', ['Control']],
  ['dock', ['f']],
  ['undock', ['g']],
  
  // Camera
  ['cameraToggle', ['c']],
  ['cameraZoomIn', ['=', '+']],
  ['cameraZoomOut', ['-', '_']],
  
  // UI
  ['pause', ['Escape', 'p']],
  ['menu', ['Tab']],
  ['map', ['m']],
  ['help', ['h']],
  
  // Debug
  ['debugToggle', ['F3']],
  ['debugStats', ['F4']]
]);

const initialInputState: InputState = {
  activeDevice: InputDevice.KEYBOARD,
  gamepadConnected: false,
  gamepadIndex: null,
  
  keysPressed: new Set(),
  
  mousePosition: { x: 0, y: 0 },
  mouseButtons: new Set(),
  mouseDelta: { x: 0, y: 0 },
  
  gamepadAxes: [0, 0, 0, 0],
  gamepadButtons: [],
  
  actionMap: defaultActionMap,
  sensitivity: {
    mouse: 1.0,
    gamepad: 1.0
  },
  
  deadzone: 0.15,
  vibrationEnabled: true
};

export const createInputSlice: StateCreator<InputSlice> = (set, get) => ({
  ...initialInputState,
  
  // Set active device
  setActiveDevice: (device: InputDevice) => {
    console.log(`[InputSlice] Active device: ${device}`);
    set({ activeDevice: device });
  },
  
  // Connect gamepad
  connectGamepad: (index: number) => {
    console.log(`[InputSlice] Gamepad connected: ${index}`);
    set({
      gamepadConnected: true,
      gamepadIndex: index,
      activeDevice: InputDevice.GAMEPAD
    });
  },
  
  // Disconnect gamepad
  disconnectGamepad: () => {
    console.log('[InputSlice] Gamepad disconnected');
    set({
      gamepadConnected: false,
      gamepadIndex: null,
      activeDevice: InputDevice.KEYBOARD
    });
  },
  
  // Press key
  pressKey: (key: string) => set((state) => {
    const newKeys = new Set(state.keysPressed);
    newKeys.add(key);
    return { keysPressed: newKeys, activeDevice: InputDevice.KEYBOARD };
  }),
  
  // Release key
  releaseKey: (key: string) => set((state) => {
    const newKeys = new Set(state.keysPressed);
    newKeys.delete(key);
    return { keysPressed: newKeys };
  }),
  
  // Is key pressed
  isKeyPressed: (key: string) => {
    return get().keysPressed.has(key);
  },
  
  // Clear keys
  clearKeys: () => set({ keysPressed: new Set() }),
  
  // Update mouse position
  updateMousePosition: (x: number, y: number) => set({
    mousePosition: { x, y },
    activeDevice: InputDevice.MOUSE
  }),
  
  // Update mouse delta
  updateMouseDelta: (deltaX: number, deltaY: number) => set({
    mouseDelta: { x: deltaX, y: deltaY }
  }),
  
  // Press mouse button
  pressMouseButton: (button: number) => set((state) => {
    const newButtons = new Set(state.mouseButtons);
    newButtons.add(button);
    return { mouseButtons: newButtons, activeDevice: InputDevice.MOUSE };
  }),
  
  // Release mouse button
  releaseMouseButton: (button: number) => set((state) => {
    const newButtons = new Set(state.mouseButtons);
    newButtons.delete(button);
    return { mouseButtons: newButtons };
  }),
  
  // Is mouse button pressed
  isMouseButtonPressed: (button: number) => {
    return get().mouseButtons.has(button);
  },
  
  // Clear mouse buttons
  clearMouseButtons: () => set({ mouseButtons: new Set() }),
  
  // Update gamepad axes
  updateGamepadAxes: (axes: number[]) => {
    const deadzone = get().deadzone;
    const processedAxes = axes.map(axis => 
      Math.abs(axis) < deadzone ? 0 : axis
    );
    
    set({
      gamepadAxes: processedAxes,
      activeDevice: InputDevice.GAMEPAD
    });
  },
  
  // Update gamepad buttons
  updateGamepadButtons: (buttons: boolean[]) => set({
    gamepadButtons: buttons,
    activeDevice: InputDevice.GAMEPAD
  }),
  
  // Get axis value
  getAxis: (axisIndex: number) => {
    const axes = get().gamepadAxes;
    return axes[axisIndex] || 0;
  },
  
  // Is button pressed
  isButtonPressed: (buttonIndex: number) => {
    const buttons = get().gamepadButtons;
    return buttons[buttonIndex] || false;
  },
  
  // Map action
  mapAction: (action: string, keys: string[]) => set((state) => {
    const newMap = new Map(state.actionMap);
    newMap.set(action, keys);
    console.log(`[InputSlice] Mapped action: ${action} -> [${keys.join(', ')}]`);
    return { actionMap: newMap };
  }),
  
  // Unmap action
  unmapAction: (action: string) => set((state) => {
    const newMap = new Map(state.actionMap);
    newMap.delete(action);
    console.log(`[InputSlice] Unmapped action: ${action}`);
    return { actionMap: newMap };
  }),
  
  // Is action active
  isActionActive: (action: string) => {
    const state = get();
    const keys = state.actionMap.get(action);
    
    if (!keys) return false;
    
    // Check if any mapped key is pressed
    return keys.some(key => state.keysPressed.has(key));
  },
  
  // Get action value (for analog inputs)
  getActionValue: (action: string) => {
    const state = get();
    
    // Check keyboard first
    if (get().isActionActive(action)) {
      return 1.0;
    }
    
    // Check gamepad axes for movement actions
    if (state.gamepadConnected) {
      switch (action) {
        case 'forward':
        case 'backward':
          return -state.gamepadAxes[1] || 0; // Left stick Y
        case 'left':
        case 'right':
          return state.gamepadAxes[0] || 0; // Left stick X
        case 'up':
        case 'down':
          return -state.gamepadAxes[3] || 0; // Right stick Y
        case 'rollLeft':
        case 'rollRight':
          return state.gamepadAxes[2] || 0; // Right stick X
      }
    }
    
    return 0;
  },
  
  // Set mouse sensitivity
  setMouseSensitivity: (sensitivity: number) => set((state) => ({
    sensitivity: { ...state.sensitivity, mouse: Math.max(0.1, Math.min(5.0, sensitivity)) }
  })),
  
  // Set gamepad sensitivity
  setGamepadSensitivity: (sensitivity: number) => set((state) => ({
    sensitivity: { ...state.sensitivity, gamepad: Math.max(0.1, Math.min(5.0, sensitivity)) }
  })),
  
  // Set deadzone
  setDeadzone: (deadzone: number) => set({
    deadzone: Math.max(0, Math.min(0.5, deadzone))
  }),
  
  // Enable vibration
  enableVibration: () => {
    console.log('[InputSlice] Vibration enabled');
    set({ vibrationEnabled: true });
  },
  
  // Disable vibration
  disableVibration: () => {
    console.log('[InputSlice] Vibration disabled');
    set({ vibrationEnabled: false });
  },
  
  // Vibrate
  vibrate: (duration: number, weakMagnitude: number, strongMagnitude: number) => {
    const state = get();
    
    if (!state.vibrationEnabled || !state.gamepadConnected || state.gamepadIndex === null) {
      return;
    }
    
    const gamepad = navigator.getGamepads()[state.gamepadIndex];
    
    if (gamepad && 'vibrationActuator' in gamepad && gamepad.vibrationActuator) {
      (gamepad.vibrationActuator as any).playEffect('dual-rumble', {
        duration,
        weakMagnitude,
        strongMagnitude
      }).catch((err: Error) => {
        console.warn('[InputSlice] Vibration failed:', err);
      });
    }
  },
  
  // Reset input
  resetInput: () => {
    console.log('[InputSlice] Resetting input state');
    set(initialInputState);
  },
  
  // Clear all input
  clearAllInput: () => set({
    keysPressed: new Set(),
    mouseButtons: new Set(),
    mouseDelta: { x: 0, y: 0 },
    gamepadAxes: [0, 0, 0, 0],
    gamepadButtons: []
  })
});
