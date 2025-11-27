/**
 * Store Index
 * 
 * Central export for all stores
 */

// Main stores
export { useGameStore, selectPlayer, selectMission, selectCamera, selectInput, selectGameState } from './gameStore';
export type { GameStore } from './gameStore';

export { useUIStore, selectNotifications, selectActiveDialog, selectHUDSettings } from './uiStore';
export type { UIStore } from './uiStore';

export {
  useSettingsStore,
  selectGraphicsSettings,
  selectAudioSettings,
  selectControlSettings,
  selectGameplaySettings,
  selectAccessibilitySettings
} from './settingsStore';
export type { SettingsStore } from './settingsStore';

export {
  useDebugStore,
  selectPerformanceStats,
  selectEngineStats,
  selectPhysicsStats,
  selectVisualization,
  selectLogs,
  selectProfileData
} from './debugStore';
export type { DebugStore } from './debugStore';

// Slices
export type { PlayerSlice } from './slices/playerSlice';
export type { MissionSlice } from './slices/missionSlice';
export type { EntitySlice } from './slices/entitySlice';
export type { CameraSlice } from './slices/cameraSlice';
export type { InputSlice } from './slices/inputSlice';
