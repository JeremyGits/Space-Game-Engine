/**
 * Settings Store
 * 
 * Manages game settings including graphics, audio, controls, and accessibility
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { SettingsState, DifficultyLevel } from '../types/store/StoreTypes';

export interface SettingsStore extends SettingsState {
  // Graphics
  setGraphicsQuality: (quality: 'low' | 'medium' | 'high' | 'ultra') => void;
  setResolution: (width: number, height: number) => void;
  toggleFullscreen: () => void;
  toggleVSync: () => void;
  toggleAntialiasing: () => void;
  toggleShadows: () => void;
  toggleParticleEffects: () => void;
  togglePostProcessing: () => void;
  
  // Audio
  setMasterVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSFXVolume: (volume: number) => void;
  setAmbientVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // Controls
  toggleInvertY: () => void;
  toggleInvertX: () => void;
  setSensitivity: (sensitivity: number) => void;
  toggleVibration: () => void;
  setKeyBinding: (action: string, key: string) => void;
  setGamepadBinding: (action: string, button: number) => void;
  resetKeyBindings: () => void;
  
  // Gameplay
  setDifficulty: (difficulty: DifficultyLevel) => void;
  toggleTutorials: () => void;
  toggleAutoSave: () => void;
  toggleAssistMode: () => void;
  
  // Accessibility
  setColorBlindMode: (mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => void;
  toggleSubtitles: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleHighContrast: () => void;
  
  // Presets
  applyGraphicsPreset: (preset: 'low' | 'medium' | 'high' | 'ultra') => void;
  
  // Reset
  resetSettings: () => void;
  resetToDefaults: () => void;
}

const defaultKeyBindings: Record<string, string> = {
  forward: 'w',
  backward: 's',
  left: 'a',
  right: 'd',
  up: 'Space',
  down: 'Shift',
  rollLeft: 'q',
  rollRight: 'e',
  boost: 'Shift',
  brake: 'Control',
  dock: 'f',
  pause: 'Escape'
};

const defaultGamepadBindings: Record<string, number> = {
  forward: 7,    // Right trigger
  backward: 6,   // Left trigger
  boost: 0,      // A button
  brake: 1,      // B button
  dock: 2        // X button
};

const initialSettingsState: SettingsState = {
  graphics: {
    quality: 'high',
    resolution: { width: 1920, height: 1080 },
    fullscreen: false,
    vsync: true,
    antialiasing: true,
    shadows: true,
    particleEffects: true,
    postProcessing: true
  },
  
  audio: {
    masterVolume: 0.8,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    ambientVolume: 0.6,
    muted: false
  },
  
  controls: {
    invertY: false,
    invertX: false,
    sensitivity: 1.0,
    vibration: true,
    keyBindings: defaultKeyBindings,
    gamepadBindings: defaultGamepadBindings
  },
  
  gameplay: {
    difficulty: DifficultyLevel.MEDIUM,
    showTutorials: true,
    autoSave: true,
    assistMode: false
  },
  
  accessibility: {
    colorBlindMode: 'none',
    subtitles: false,
    fontSize: 'medium',
    highContrast: false
  }
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialSettingsState,
        
        // Graphics
        setGraphicsQuality: (quality) => {
          console.log(`[SettingsStore] Graphics quality: ${quality}`);
          set((state) => ({
            graphics: { ...state.graphics, quality }
          }));
        },
        
        setResolution: (width, height) => {
          console.log(`[SettingsStore] Resolution: ${width}x${height}`);
          set((state) => ({
            graphics: { ...state.graphics, resolution: { width, height } }
          }));
        },
        
        toggleFullscreen: () => set((state) => {
          const newState = !state.graphics.fullscreen;
          console.log(`[SettingsStore] Fullscreen: ${newState}`);
          return {
            graphics: { ...state.graphics, fullscreen: newState }
          };
        }),
        
        toggleVSync: () => set((state) => ({
          graphics: { ...state.graphics, vsync: !state.graphics.vsync }
        })),
        
        toggleAntialiasing: () => set((state) => ({
          graphics: { ...state.graphics, antialiasing: !state.graphics.antialiasing }
        })),
        
        toggleShadows: () => set((state) => ({
          graphics: { ...state.graphics, shadows: !state.graphics.shadows }
        })),
        
        toggleParticleEffects: () => set((state) => ({
          graphics: { ...state.graphics, particleEffects: !state.graphics.particleEffects }
        })),
        
        togglePostProcessing: () => set((state) => ({
          graphics: { ...state.graphics, postProcessing: !state.graphics.postProcessing }
        })),
        
        // Audio
        setMasterVolume: (volume) => set((state) => ({
          audio: { ...state.audio, masterVolume: Math.max(0, Math.min(1, volume)) }
        })),
        
        setMusicVolume: (volume) => set((state) => ({
          audio: { ...state.audio, musicVolume: Math.max(0, Math.min(1, volume)) }
        })),
        
        setSFXVolume: (volume) => set((state) => ({
          audio: { ...state.audio, sfxVolume: Math.max(0, Math.min(1, volume)) }
        })),
        
        setAmbientVolume: (volume) => set((state) => ({
          audio: { ...state.audio, ambientVolume: Math.max(0, Math.min(1, volume)) }
        })),
        
        toggleMute: () => set((state) => {
          const newState = !state.audio.muted;
          console.log(`[SettingsStore] Muted: ${newState}`);
          return {
            audio: { ...state.audio, muted: newState }
          };
        }),
        
        // Controls
        toggleInvertY: () => set((state) => ({
          controls: { ...state.controls, invertY: !state.controls.invertY }
        })),
        
        toggleInvertX: () => set((state) => ({
          controls: { ...state.controls, invertX: !state.controls.invertX }
        })),
        
        setSensitivity: (sensitivity) => set((state) => ({
          controls: { ...state.controls, sensitivity: Math.max(0.1, Math.min(5, sensitivity)) }
        })),
        
        toggleVibration: () => set((state) => ({
          controls: { ...state.controls, vibration: !state.controls.vibration }
        })),
        
        setKeyBinding: (action, key) => set((state) => {
          console.log(`[SettingsStore] Key binding: ${action} -> ${key}`);
          return {
            controls: {
              ...state.controls,
              keyBindings: { ...state.controls.keyBindings, [action]: key }
            }
          };
        }),
        
        setGamepadBinding: (action, button) => set((state) => {
          console.log(`[SettingsStore] Gamepad binding: ${action} -> Button ${button}`);
          return {
            controls: {
              ...state.controls,
              gamepadBindings: { ...state.controls.gamepadBindings, [action]: button }
            }
          };
        }),
        
        resetKeyBindings: () => {
          console.log('[SettingsStore] Reset key bindings');
          set((state) => ({
            controls: {
              ...state.controls,
              keyBindings: defaultKeyBindings,
              gamepadBindings: defaultGamepadBindings
            }
          }));
        },
        
        // Gameplay
        setDifficulty: (difficulty) => {
          console.log(`[SettingsStore] Difficulty: ${difficulty}`);
          set((state) => ({
            gameplay: { ...state.gameplay, difficulty }
          }));
        },
        
        toggleTutorials: () => set((state) => ({
          gameplay: { ...state.gameplay, showTutorials: !state.gameplay.showTutorials }
        })),
        
        toggleAutoSave: () => set((state) => ({
          gameplay: { ...state.gameplay, autoSave: !state.gameplay.autoSave }
        })),
        
        toggleAssistMode: () => set((state) => ({
          gameplay: { ...state.gameplay, assistMode: !state.gameplay.assistMode }
        })),
        
        // Accessibility
        setColorBlindMode: (mode) => {
          console.log(`[SettingsStore] Color blind mode: ${mode}`);
          set((state) => ({
            accessibility: { ...state.accessibility, colorBlindMode: mode }
          }));
        },
        
        toggleSubtitles: () => set((state) => ({
          accessibility: { ...state.accessibility, subtitles: !state.accessibility.subtitles }
        })),
        
        setFontSize: (size) => set((state) => ({
          accessibility: { ...state.accessibility, fontSize: size }
        })),
        
        toggleHighContrast: () => set((state) => ({
          accessibility: { ...state.accessibility, highContrast: !state.accessibility.highContrast }
        })),
        
        // Apply graphics preset
        applyGraphicsPreset: (preset) => {
          console.log(`[SettingsStore] Applying graphics preset: ${preset}`);
          
          const presets = {
            low: {
              quality: 'low' as const,
              antialiasing: false,
              shadows: false,
              particleEffects: false,
              postProcessing: false
            },
            medium: {
              quality: 'medium' as const,
              antialiasing: true,
              shadows: true,
              particleEffects: true,
              postProcessing: false
            },
            high: {
              quality: 'high' as const,
              antialiasing: true,
              shadows: true,
              particleEffects: true,
              postProcessing: true
            },
            ultra: {
              quality: 'ultra' as const,
              antialiasing: true,
              shadows: true,
              particleEffects: true,
              postProcessing: true
            }
          };
          
          set((state) => ({
            graphics: { ...state.graphics, ...presets[preset] }
          }));
        },
        
        // Reset settings
        resetSettings: () => {
          console.log('[SettingsStore] Resetting settings');
          set(initialSettingsState);
        },
        
        resetToDefaults: () => {
          console.log('[SettingsStore] Resetting to defaults');
          set(initialSettingsState);
        }
      }),
      {
        name: 'settings-storage',
        version: 1
      }
    ),
    {
      name: 'settings-store',
      enabled: import.meta.env.DEV
    }
  )
);

// Selectors
export const selectGraphicsSettings = (state: SettingsStore) => state.graphics;
export const selectAudioSettings = (state: SettingsStore) => state.audio;
export const selectControlSettings = (state: SettingsStore) => state.controls;
export const selectGameplaySettings = (state: SettingsStore) => state.gameplay;
export const selectAccessibilitySettings = (state: SettingsStore) => state.accessibility;
