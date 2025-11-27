/**
 * Game Store
 * 
 * Main game state store combining all slices
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PlayerSlice, createPlayerSlice } from './slices/playerSlice';
import { MissionSlice, createMissionSlice } from './slices/missionSlice';
import { EntitySlice, createEntitySlice } from './slices/entitySlice';
import { CameraSlice, createCameraSlice } from './slices/cameraSlice';
import { InputSlice, createInputSlice } from './slices/inputSlice';
import { GameState } from '../types/store/StoreTypes';

/**
 * Combined game store interface
 */
export interface GameStore extends
  PlayerSlice,
  MissionSlice,
  EntitySlice,
  CameraSlice,
  InputSlice {
  // Game state
  gameState: GameState;
  isPaused: boolean;
  isLoading: boolean;
  
  // Game state actions
  setGameState: (state: GameState) => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  setLoading: (loading: boolean) => void;
  
  // Global reset
  resetAll: () => void;
}

/**
 * Create the game store
 */
export const useGameStore = create<GameStore>()(
  devtools(
    (set, get, api) => ({
      // Game state
      gameState: GameState.MENU,
      isPaused: false,
      isLoading: false,
      
      // Combine all slices
      ...createPlayerSlice(set, get, api),
      ...createMissionSlice(set, get, api),
      ...createEntitySlice(set, get, api),
      ...createCameraSlice(set, get, api),
      ...createInputSlice(set, get, api),
      
      // Game state actions
      setGameState: (state: GameState) => {
        console.log(`[GameStore] Game state: ${state}`);
        set({ gameState: state });
      },
      
      startGame: () => {
        console.log('[GameStore] Starting game');
        set({
          gameState: GameState.PLAYING,
          isPaused: false,
          isLoading: false
        });
      },
      
      pauseGame: () => {
        console.log('[GameStore] Game paused');
        set({
          gameState: GameState.PAUSED,
          isPaused: true
        });
      },
      
      resumeGame: () => {
        console.log('[GameStore] Game resumed');
        set({
          gameState: GameState.PLAYING,
          isPaused: false
        });
      },
      
      endGame: () => {
        console.log('[GameStore] Game ended');
        set({
          gameState: GameState.GAME_OVER,
          isPaused: false
        });
      },
      
      setLoading: (loading: boolean) => {
        set({
          isLoading: loading,
          gameState: loading ? GameState.LOADING : get().gameState
        });
      },
      
      // Global reset
      resetAll: () => {
        console.log('[GameStore] Resetting all game state');
        get().resetPlayer();
        get().resetMission();
        get().resetEntities();
        get().resetCamera();
        get().resetInput();
        set({
          gameState: GameState.MENU,
          isPaused: false,
          isLoading: false
        });
      }
    }),
    {
      name: 'game-store',
      enabled: import.meta.env.DEV
    }
  )
);

// Export selectors for optimized re-renders
export const selectPlayer = (state: GameStore) => ({
  spacecraftId: state.spacecraftId,
  position: state.position,
  velocity: state.velocity,
  rotation: state.rotation,
  fuel: state.fuel,
  health: state.health,
  score: state.score
});

export const selectMission = (state: GameStore) => state.currentMission;

export const selectCamera = (state: GameStore) => ({
  mode: state.mode,
  position: state.position,
  target: state.target,
  fov: state.fov
});

export const selectInput = (state: GameStore) => ({
  activeDevice: state.activeDevice,
  keysPressed: state.keysPressed,
  gamepadConnected: state.gamepadConnected
});

export const selectGameState = (state: GameStore) => ({
  gameState: state.gameState,
  isPaused: state.isPaused,
  isLoading: state.isLoading
});
