/**
 * Input Manager
 * Main orchestrator for the input system
 */

import { EventEmitter } from '../core/EventEmitter';
import { InputConfigManager } from './InputConfig';
import { InputState } from './InputState';
import { InputMapper } from './InputMapper';
import { InputRecorder } from './InputRecorder';
import { Vector2 } from '../../utils/math/Vector2';
import type {
  InputConfig,
  InputDeviceType,
  InputEvent,
  InputEventType,
  InputActionConfig,
  InputAxisConfig,
  IInputDevice,
  InputRecording
} from '../../types/input/InputTypes';

export class InputManager extends EventEmitter {
  private config: InputConfigManager;
  private state: InputState;
  private mapper: InputMapper;
  private recorder: InputRecorder;
  private devices: Map<string, IInputDevice> = new Map();
  private eventQueue: InputEvent[] = [];
  private canvas: HTMLCanvasElement | null = null;

  constructor(config: Partial<InputConfig> = {}) {
    super();
    
    this.config = new InputConfigManager(config);
    this.state = new InputState();
    this.mapper = new InputMapper();
    this.recorder = new InputRecorder();

    // Create default context
    this.mapper.createContext('default', 0);
    this.mapper.setActiveContext('default');
  }

  /**
   * Initialize input manager
   */
  public initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    if (this.config.getValue('enableKeyboard')) {
      this.setupKeyboardListeners();
    }

    if (this.config.getValue('enableMouse')) {
      this.setupMouseListeners();
    }

    if (this.config.getValue('enableGamepad')) {
      this.setupGamepadListeners();
    }

    if (this.config.getValue('enableTouch')) {
      this.setupTouchListeners();
    }
  }

  /**
   * Update input manager
   */
  public update(deltaTime: number): void {
    // Update devices
    for (const device of this.devices.values()) {
      device.update(deltaTime);
    }

    // Process event queue
    this.processEventQueue();

    // Update mapper
    this.mapper.update(deltaTime);

    // Update recorder playback
    if (this.recorder.getIsPlaying()) {
      const playbackEvents = this.recorder.update(deltaTime);
      for (const event of playbackEvents) {
        this.processEvent(event);
      }
    }

    // Clear transient states
    this.state.clearTransientStates();
  }

  /**
   * Create input context
   */
  public createContext(name: string, priority: number = 0): void {
    this.mapper.createContext(name, priority);
  }

  /**
   * Set active context
   */
  public setActiveContext(name: string): void {
    this.mapper.setActiveContext(name);
    // Emit event (EventEmitter implementation needed)
  }

  /**
   * Add action
   */
  public addAction(config: InputActionConfig, context: string = 'default'): void {
    this.mapper.addAction(context, config);
  }

  /**
   * Add axis
   */
  public addAxis(config: InputAxisConfig, context: string = 'default'): void {
    this.mapper.addAxis(context, config);
  }

  /**
   * Get action value
   */
  public getAction(name: string): number {
    return this.mapper.getAction(name);
  }

  /**
   * Check if action is triggered
   */
  public isActionTriggered(name: string): boolean {
    return this.mapper.isActionTriggered(name);
  }

  /**
   * Get axis value
   */
  public getAxis(name: string): number {
    return this.mapper.getAxis(name);
  }

  /**
   * Get key pressed
   */
  public isKeyPressed(key: string): boolean {
    return this.state.getKey(key).pressed;
  }

  /**
   * Get key just pressed
   */
  public isKeyJustPressed(key: string): boolean {
    return this.state.getKey(key).justPressed;
  }

  /**
   * Get mouse button pressed
   */
  public isMouseButtonPressed(button: number): boolean {
    return this.state.getMouseButton(button).pressed;
  }

  /**
   * Get mouse position
   */
  public getMousePosition(): Vector2 {
    return this.state.getMousePosition();
  }

  /**
   * Get mouse delta
   */
  public getMouseDelta(): Vector2 {
    return this.state.getMouseDelta();
  }

  /**
   * Start recording
   */
  public startRecording(): void {
    this.recorder.startRecording();
  }

  /**
   * Stop recording
   */
  public stopRecording(): InputRecording | null {
    return this.recorder.stopRecording();
  }

  /**
   * Start playback
   */
  public startPlayback(recording: any): void {
    this.recorder.startPlayback(recording);
  }

  /**
   * Add device
   */
  public addDevice(device: IInputDevice): void {
    this.devices.set(device.id, device);
    // Emit event (EventEmitter implementation needed)
  }

  /**
   * Remove device
   */
  public removeDevice(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      this.devices.delete(deviceId);
      // Emit event (EventEmitter implementation needed)
    }
  }

  /**
   * Process event queue
   */
  private processEventQueue(): void {
    for (const event of this.eventQueue) {
      this.processEvent(event);
    }
    this.eventQueue = [];
  }

  /**
   * Process single event
   */
  private processEvent(event: InputEvent): void {
    if (event.consumed) return;

    // Record event if recording
    if (this.recorder.getIsRecording()) {
      this.recorder.recordEvent(event);
    }

    // Process through mapper
    this.mapper.processInput(event.device, event.input, event.value);
  }

  /**
   * Queue input event
   */
  private queueEvent(event: InputEvent): void {
    this.eventQueue.push(event);
  }

  /**
   * Setup keyboard listeners
   */
  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => {
      const state = this.state.getKey(e.code);
      if (!state.pressed) {
        this.state.setKey(e.code, {
          pressed: true,
          justPressed: true,
          justReleased: false,
          pressTime: performance.now(),
          releaseTime: state.releaseTime
        });

        this.queueEvent({
          type: 'buttonDown' as InputEventType,
          device: 'keyboard' as InputDeviceType,
          deviceId: 'keyboard',
          input: e.code,
          value: 1,
          timestamp: performance.now(),
          consumed: false
        });
      }
    });

    window.addEventListener('keyup', (e) => {
      const state = this.state.getKey(e.code);
      this.state.setKey(e.code, {
        pressed: false,
        justPressed: false,
        justReleased: true,
        pressTime: state.pressTime,
        releaseTime: performance.now()
      });

      this.queueEvent({
        type: 'buttonUp' as InputEventType,
        device: 'keyboard' as InputDeviceType,
        deviceId: 'keyboard',
        input: e.code,
        value: 0,
        timestamp: performance.now(),
        consumed: false
      });
    });
  }

  /**
   * Setup mouse listeners
   */
  private setupMouseListeners(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas!.getBoundingClientRect();
      const position = new Vector2(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      this.state.setMousePosition(position);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const state = this.state.getMouseButton(e.button);
      this.state.setMouseButton(e.button, {
        pressed: true,
        justPressed: true,
        justReleased: false,
        pressTime: performance.now(),
        releaseTime: state.releaseTime
      });

      this.queueEvent({
        type: 'pointerDown' as InputEventType,
        device: 'mouse' as InputDeviceType,
        deviceId: 'mouse',
        input: `button_${e.button}`,
        value: 1,
        timestamp: performance.now(),
        consumed: false
      });
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const state = this.state.getMouseButton(e.button);
      this.state.setMouseButton(e.button, {
        pressed: false,
        justPressed: false,
        justReleased: true,
        pressTime: state.pressTime,
        releaseTime: performance.now()
      });

      this.queueEvent({
        type: 'pointerUp' as InputEventType,
        device: 'mouse' as InputDeviceType,
        deviceId: 'mouse',
        input: `button_${e.button}`,
        value: 0,
        timestamp: performance.now(),
        consumed: false
      });
    });

    this.canvas.addEventListener('wheel', (e) => {
      this.state.setMouseWheel(new Vector2(e.deltaX, e.deltaY));
    });
  }

  /**
   * Setup gamepad listeners
   */
  private setupGamepadListeners(): void {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
    });
  }

  /**
   * Setup touch listeners
   */
  private setupTouchListeners(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      // Touch handling implementation
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      // Touch handling implementation
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      // Touch handling implementation
    });
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    // Remove all event listeners
    // Clear all devices
    this.devices.clear();
  }
}
