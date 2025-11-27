/**
 * Camera Slice
 * 
 * Manages camera state, modes, and controls
 */

import { StateCreator } from 'zustand';
import { Vector3 } from '../../utils/math/Vector3';
import { CameraState, CameraMode } from '../../types/store/StoreTypes';

export interface CameraSlice extends CameraState {
  // Actions
  setCameraMode: (mode: CameraMode) => void;
  setPosition: (position: Vector3) => void;
  setTarget: (target: Vector3) => void;
  setFOV: (fov: number) => void;
  setDistance: (distance: number) => void;
  setSmoothing: (smoothing: number) => void;
  lockCamera: () => void;
  unlockCamera: () => void;
  
  // Camera movement
  moveCamera: (delta: Vector3) => void;
  rotateCamera: (deltaX: number, deltaY: number) => void;
  zoomCamera: (delta: number) => void;
  
  // Presets
  setCockpitView: () => void;
  setChaseView: (distance?: number) => void;
  setOrbitView: (distance?: number) => void;
  setFreeView: () => void;
  
  // Target tracking
  followTarget: (targetPosition: Vector3) => void;
  lookAt: (target: Vector3) => void;
  
  // Reset
  resetCamera: () => void;
}

const initialCameraState: CameraState = {
  mode: CameraMode.CHASE,
  position: new Vector3(0, 5, 10),
  target: new Vector3(0, 0, 0),
  fov: 75,
  distance: 10,
  smoothing: 0.1,
  locked: false
};

export const createCameraSlice: StateCreator<CameraSlice> = (set, get) => ({
  ...initialCameraState,
  
  // Set camera mode
  setCameraMode: (mode: CameraMode) => {
    console.log(`[CameraSlice] Camera mode: ${mode}`);
    set({ mode });
    
    // Apply mode-specific settings
    switch (mode) {
      case CameraMode.COCKPIT:
        get().setCockpitView();
        break;
      case CameraMode.CHASE:
        get().setChaseView();
        break;
      case CameraMode.ORBIT:
        get().setOrbitView();
        break;
      case CameraMode.FREE:
        get().setFreeView();
        break;
    }
  },
  
  // Set position
  setPosition: (position: Vector3) => set({ position }),
  
  // Set target
  setTarget: (target: Vector3) => set({ target }),
  
  // Set FOV
  setFOV: (fov: number) => {
    const clampedFOV = Math.max(30, Math.min(120, fov));
    set({ fov: clampedFOV });
  },
  
  // Set distance
  setDistance: (distance: number) => {
    const clampedDistance = Math.max(1, Math.min(100, distance));
    set({ distance: clampedDistance });
  },
  
  // Set smoothing
  setSmoothing: (smoothing: number) => {
    const clampedSmoothing = Math.max(0, Math.min(1, smoothing));
    set({ smoothing: clampedSmoothing });
  },
  
  // Lock camera
  lockCamera: () => {
    console.log('[CameraSlice] Camera locked');
    set({ locked: true });
  },
  
  // Unlock camera
  unlockCamera: () => {
    console.log('[CameraSlice] Camera unlocked');
    set({ locked: false });
  },
  
  // Move camera
  moveCamera: (delta: Vector3) => set((state) => {
    if (state.locked) return state;
    
    const newPosition = state.position.clone().add(delta);
    return { position: newPosition };
  }),
  
  // Rotate camera
  rotateCamera: (deltaX: number, deltaY: number) => set((state) => {
    if (state.locked || state.mode === CameraMode.COCKPIT) return state;
    
    // Calculate new position based on rotation
    const radius = state.distance;
    const theta = Math.atan2(
      state.position.x - state.target.x,
      state.position.z - state.target.z
    ) + deltaX;
    const phi = Math.acos(
      (state.position.y - state.target.y) / radius
    ) + deltaY;
    
    // Clamp phi to prevent flipping
    const clampedPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
    
    const newPosition = new Vector3(
      state.target.x + radius * Math.sin(clampedPhi) * Math.sin(theta),
      state.target.y + radius * Math.cos(clampedPhi),
      state.target.z + radius * Math.sin(clampedPhi) * Math.cos(theta)
    );
    
    return { position: newPosition };
  }),
  
  // Zoom camera
  zoomCamera: (delta: number) => set((state) => {
    if (state.locked || state.mode === CameraMode.COCKPIT) return state;
    
    const newDistance = Math.max(1, Math.min(100, state.distance + delta));
    
    // Update position to maintain direction
    const direction = state.position.clone().sub(state.target).normalize();
    const newPosition = state.target.clone().add(direction.multiplyScalar(newDistance));
    
    return {
      distance: newDistance,
      position: newPosition
    };
  }),
  
  // Cockpit view
  setCockpitView: () => {
    console.log('[CameraSlice] Cockpit view');
    set({
      mode: CameraMode.COCKPIT,
      distance: 0,
      fov: 90,
      smoothing: 0.05,
      locked: false
    });
  },
  
  // Chase view
  setChaseView: (distance = 10) => {
    console.log('[CameraSlice] Chase view');
    set({
      mode: CameraMode.CHASE,
      distance,
      fov: 75,
      smoothing: 0.1,
      locked: false
    });
  },
  
  // Orbit view
  setOrbitView: (distance = 15) => {
    console.log('[CameraSlice] Orbit view');
    set({
      mode: CameraMode.ORBIT,
      distance,
      fov: 60,
      smoothing: 0.15,
      locked: false
    });
  },
  
  // Free view
  setFreeView: () => {
    console.log('[CameraSlice] Free view');
    set({
      mode: CameraMode.FREE,
      fov: 75,
      smoothing: 0.2,
      locked: false
    });
  },
  
  // Follow target
  followTarget: (targetPosition: Vector3) => set((state) => {
    if (state.locked) return state;
    
    // Calculate desired position based on mode
    let desiredPosition: Vector3;
    
    switch (state.mode) {
      case CameraMode.COCKPIT:
        desiredPosition = targetPosition.clone();
        break;
        
      case CameraMode.CHASE:
        // Position behind and above target
        desiredPosition = targetPosition.clone().add(new Vector3(0, 2, state.distance));
        break;
        
      case CameraMode.ORBIT:
        // Maintain current relative position
        const offset = state.position.clone().sub(state.target);
        desiredPosition = targetPosition.clone().add(offset);
        break;
        
      case CameraMode.FREE:
        // Don't follow in free mode
        return { target: targetPosition };
        
      default:
        desiredPosition = state.position.clone();
    }
    
    // Smooth interpolation
    const newPosition = state.position.clone().lerp(desiredPosition, state.smoothing);
    
    return {
      position: newPosition,
      target: targetPosition
    };
  }),
  
  // Look at target
  lookAt: (target: Vector3) => set({ target }),
  
  // Reset camera
  resetCamera: () => {
    console.log('[CameraSlice] Resetting camera');
    set(initialCameraState);
  }
});
