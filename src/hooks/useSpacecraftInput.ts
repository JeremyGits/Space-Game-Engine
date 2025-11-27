import { useEffect, useState, useRef } from 'react';
import { SpacecraftInput } from '../game/systems/SpacecraftController';

export function useSpacecraftInput(): SpacecraftInput {
  const [input, setInput] = useState<SpacecraftInput>({
    forward: 0,
    right: 0,
    up: 0,
    pitch: 0,
    yaw: 0,
    roll: 0,
    boost: false,
    brake: false
  });

  const keysPressed = useRef<Set<string>>(new Set());
  const gamepadIndex = useRef<number | null>(null);

  useEffect(() => {
    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };

    // Gamepad connection handlers
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad.id);
      gamepadIndex.current = e.gamepad.index;
    };

    const handleGamepadDisconnected = () => {
      console.log('Gamepad disconnected');
      gamepadIndex.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Update loop
    const updateInput = () => {
      const newInput: SpacecraftInput = {
        forward: 0,
        right: 0,
        up: 0,
        pitch: 0,
        yaw: 0,
        roll: 0,
        boost: false,
        brake: false
      };

      // === KEYBOARD INPUT ===
      
      // Translation
      if (keysPressed.current.has('KeyW')) newInput.forward += 1;
      if (keysPressed.current.has('KeyS')) newInput.forward -= 1;
      if (keysPressed.current.has('KeyD')) newInput.right += 1;
      if (keysPressed.current.has('KeyA')) newInput.right -= 1;
      if (keysPressed.current.has('Space')) newInput.up += 1;
      if (keysPressed.current.has('ControlLeft') || keysPressed.current.has('ControlRight')) newInput.up -= 1;

      // Rotation
      if (keysPressed.current.has('ArrowUp')) newInput.pitch += 1;
      if (keysPressed.current.has('ArrowDown')) newInput.pitch -= 1;
      if (keysPressed.current.has('ArrowLeft')) newInput.yaw += 1;
      if (keysPressed.current.has('ArrowRight')) newInput.yaw -= 1;
      if (keysPressed.current.has('KeyQ')) newInput.roll -= 1;
      if (keysPressed.current.has('KeyE')) newInput.roll += 1;

      // Actions
      if (keysPressed.current.has('ShiftLeft') || keysPressed.current.has('ShiftRight')) newInput.boost = true;
      if (keysPressed.current.has('KeyX')) newInput.brake = true;

      // === GAMEPAD INPUT ===
      if (gamepadIndex.current !== null) {
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[gamepadIndex.current];

        if (gamepad) {
          const deadzone = 0.15;

          // Left stick - Translation (forward/right)
          const leftX = Math.abs(gamepad.axes[0]) > deadzone ? gamepad.axes[0] : 0;
          const leftY = Math.abs(gamepad.axes[1]) > deadzone ? gamepad.axes[1] : 0;
          
          newInput.right += leftX;
          newInput.forward -= leftY; // Inverted

          // Right stick - Rotation (pitch/yaw)
          const rightX = Math.abs(gamepad.axes[2]) > deadzone ? gamepad.axes[2] : 0;
          const rightY = Math.abs(gamepad.axes[3]) > deadzone ? gamepad.axes[3] : 0;
          
          newInput.yaw -= rightX;
          newInput.pitch -= rightY;

          // Triggers - Up/Down
          const leftTrigger = gamepad.buttons[6]?.value || 0;
          const rightTrigger = gamepad.buttons[7]?.value || 0;
          
          newInput.up += rightTrigger;
          newInput.up -= leftTrigger;

          // Bumpers - Roll
          if (gamepad.buttons[4]?.pressed) newInput.roll -= 1; // LB
          if (gamepad.buttons[5]?.pressed) newInput.roll += 1; // RB

          // Buttons
          if (gamepad.buttons[0]?.pressed) newInput.boost = true; // A
          if (gamepad.buttons[1]?.pressed) newInput.brake = true; // B
        }
      }

      // Clamp values to -1 to 1
      newInput.forward = Math.max(-1, Math.min(1, newInput.forward));
      newInput.right = Math.max(-1, Math.min(1, newInput.right));
      newInput.up = Math.max(-1, Math.min(1, newInput.up));
      newInput.pitch = Math.max(-1, Math.min(1, newInput.pitch));
      newInput.yaw = Math.max(-1, Math.min(1, newInput.yaw));
      newInput.roll = Math.max(-1, Math.min(1, newInput.roll));

      setInput(newInput);
      requestAnimationFrame(updateInput);
    };

    const rafId = requestAnimationFrame(updateInput);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return input;
}
