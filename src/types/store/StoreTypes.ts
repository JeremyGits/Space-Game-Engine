/**
 * Store Type Definitions
 * 
 * Comprehensive type definitions for all Zustand stores
 */

import { Vector3 } from '../../utils/math/Vector3';

/**
 * Game State
 */
export enum GameState {
  MENU = 'menu',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  MISSION_COMPLETE = 'mission_complete'
}

/**
 * Difficulty Levels
 */
export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  SIMULATION = 'simulation'
}

/**
 * Mission Types
 */
export enum MissionType {
  DOCKING = 'docking',
  NAVIGATION = 'navigation',
  RESCUE = 'rescue',
  EXPLORATION = 'exploration',
  TIME_TRIAL = 'time_trial',
  ASTEROID_FIELD = 'asteroid_field'
}

/**
 * Mission Status
 */
export enum MissionStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Camera Mode
 */
export enum CameraMode {
  COCKPIT = 'cockpit',
  CHASE = 'chase',
  FREE = 'free',
  ORBIT = 'orbit',
  CINEMATIC = 'cinematic'
}

/**
 * Input Device
 */
export enum InputDevice {
  KEYBOARD = 'keyboard',
  GAMEPAD = 'gamepad',
  MOUSE = 'mouse'
}

/**
 * Player State
 */
export interface PlayerState {
  // Spacecraft
  spacecraftId: string | null;
  position: Vector3;
  velocity: Vector3;
  rotation: { x: number; y: number; z: number };
  angularVelocity: Vector3;
  
  // Resources
  fuel: number;
  maxFuel: number;
  health: number;
  maxHealth: number;
  
  // Stats
  score: number;
  missionsCompleted: number;
  totalFlightTime: number;
  bestDockingScore: number;
  
  // Unlocks
  unlockedSpacecraft: string[];
  unlockedMissions: string[];
  achievements: string[];
}

/**
 * Mission Objective
 */
export interface MissionObjective {
  id: string;
  description: string;
  completed: boolean;
  optional: boolean;
  progress?: number;
  maxProgress?: number;
}

/**
 * Mission Data
 */
export interface MissionData {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  difficulty: DifficultyLevel;
  status: MissionStatus;
  objectives: MissionObjective[];
  timeLimit?: number;
  timeElapsed: number;
  score: number;
  rewards: {
    credits: number;
    experience: number;
    unlocks: string[];
  };
}

/**
 * Entity State (for tracking game entities)
 */
export interface EntityState {
  id: string;
  type: string;
  position: Vector3;
  rotation: { x: number; y: number; z: number };
  active: boolean;
  metadata: Record<string, any>;
}

/**
 * Camera State
 */
export interface CameraState {
  mode: CameraMode;
  position: Vector3;
  target: Vector3;
  fov: number;
  distance: number;
  smoothing: number;
  locked: boolean;
}

/**
 * Input State
 */
export interface InputState {
  // Active devices
  activeDevice: InputDevice;
  gamepadConnected: boolean;
  gamepadIndex: number | null;
  
  // Keyboard
  keysPressed: Set<string>;
  
  // Mouse
  mousePosition: { x: number; y: number };
  mouseButtons: Set<number>;
  mouseDelta: { x: number; y: number };
  
  // Gamepad
  gamepadAxes: number[];
  gamepadButtons: boolean[];
  
  // Input mapping
  actionMap: Map<string, string[]>;
  sensitivity: {
    mouse: number;
    gamepad: number;
  };
  
  // Deadzone
  deadzone: number;
  
  // Vibration
  vibrationEnabled: boolean;
}

/**
 * UI State
 */
export interface UIState {
  // Visibility
  showHUD: boolean;
  showMinimap: boolean;
  showDebugInfo: boolean;
  showMenu: boolean;
  showSettings: boolean;
  showMissionBriefing: boolean;
  
  // Notifications
  notifications: Notification[];
  
  // Dialogs
  activeDialog: string | null;
  dialogData: any;
  
  // HUD Elements
  hudOpacity: number;
  hudScale: number;
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration: number;
  timestamp: number;
}

/**
 * Settings State
 */
export interface SettingsState {
  // Graphics
  graphics: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    resolution: { width: number; height: number };
    fullscreen: boolean;
    vsync: boolean;
    antialiasing: boolean;
    shadows: boolean;
    particleEffects: boolean;
    postProcessing: boolean;
  };
  
  // Audio
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    ambientVolume: number;
    muted: boolean;
  };
  
  // Controls
  controls: {
    invertY: boolean;
    invertX: boolean;
    sensitivity: number;
    vibration: boolean;
    keyBindings: Record<string, string>;
    gamepadBindings: Record<string, number>;
  };
  
  // Gameplay
  gameplay: {
    difficulty: DifficultyLevel;
    showTutorials: boolean;
    autoSave: boolean;
    assistMode: boolean;
  };
  
  // Accessibility
  accessibility: {
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    subtitles: boolean;
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
  };
}

/**
 * Debug State
 */
export interface DebugState {
  // Performance
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
  
  // Engine Stats
  entityCount: number;
  componentCount: number;
  systemCount: number;
  
  // Physics
  physicsSteps: number;
  collisionChecks: number;
  
  // Profiling
  profilingEnabled: boolean;
  profileData: Map<string, number>;
  
  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logs: DebugLog[];
  maxLogs: number;
  
  // Visualization
  showColliders: boolean;
  showVelocity: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showStats: boolean;
}

/**
 * Debug Log Entry
 */
export interface DebugLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

/**
 * Persist Config
 */
export interface PersistConfig {
  name: string;
  version: number;
  storage: Storage;
  partialize?: (state: any) => any;
  onRehydrateStorage?: (state: any) => void;
}
