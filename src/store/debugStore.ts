/**
 * Debug Store
 * 
 * Manages debug state, performance metrics, logging, and visualization
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DebugState, DebugLog } from '../types/store/StoreTypes';

export interface DebugStore extends DebugState {
  // Performance
  updateFPS: (fps: number) => void;
  updateFrameTime: (frameTime: number) => void;
  updateMemoryUsage: (memoryUsage: number) => void;
  updateDrawCalls: (drawCalls: number) => void;
  updateTriangles: (triangles: number) => void;
  
  // Engine stats
  updateEntityCount: (count: number) => void;
  updateComponentCount: (count: number) => void;
  updateSystemCount: (count: number) => void;
  
  // Physics
  updatePhysicsSteps: (steps: number) => void;
  updateCollisionChecks: (checks: number) => void;
  
  // Profiling
  enableProfiling: () => void;
  disableProfiling: () => void;
  addProfileData: (name: string, time: number) => void;
  clearProfileData: () => void;
  
  // Logging
  setLogLevel: (level: 'debug' | 'info' | 'warn' | 'error') => void;
  addLog: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => void;
  clearLogs: () => void;
  
  // Visualization
  toggleColliders: () => void;
  toggleVelocity: () => void;
  toggleGrid: () => void;
  toggleAxes: () => void;
  toggleStats: () => void;
  
  // Reset
  resetDebug: () => void;
}

const initialDebugState: DebugState = {
  fps: 60,
  frameTime: 16.67,
  memoryUsage: 0,
  drawCalls: 0,
  triangles: 0,
  
  entityCount: 0,
  componentCount: 0,
  systemCount: 0,
  
  physicsSteps: 0,
  collisionChecks: 0,
  
  profilingEnabled: false,
  profileData: new Map(),
  
  logLevel: 'info',
  logs: [],
  maxLogs: 100,
  
  showColliders: false,
  showVelocity: false,
  showGrid: false,
  showAxes: false,
  showStats: true
};

export const useDebugStore = create<DebugStore>()(
  devtools(
    (set) => ({
      ...initialDebugState,
      
      // Update FPS
      updateFPS: (fps) => set({ fps }),
      
      // Update frame time
      updateFrameTime: (frameTime) => set({ frameTime }),
      
      // Update memory usage
      updateMemoryUsage: (memoryUsage) => set({ memoryUsage }),
      
      // Update draw calls
      updateDrawCalls: (drawCalls) => set({ drawCalls }),
      
      // Update triangles
      updateTriangles: (triangles) => set({ triangles }),
      
      // Update entity count
      updateEntityCount: (count) => set({ entityCount: count }),
      
      // Update component count
      updateComponentCount: (count) => set({ componentCount: count }),
      
      // Update system count
      updateSystemCount: (count) => set({ systemCount: count }),
      
      // Update physics steps
      updatePhysicsSteps: (steps) => set({ physicsSteps: steps }),
      
      // Update collision checks
      updateCollisionChecks: (checks) => set({ collisionChecks: checks }),
      
      // Enable profiling
      enableProfiling: () => {
        console.log('[DebugStore] Profiling enabled');
        set({ profilingEnabled: true });
      },
      
      // Disable profiling
      disableProfiling: () => {
        console.log('[DebugStore] Profiling disabled');
        set({ profilingEnabled: false, profileData: new Map() });
      },
      
      // Add profile data
      addProfileData: (name, time) => set((state) => {
        const newData = new Map(state.profileData);
        newData.set(name, time);
        return { profileData: newData };
      }),
      
      // Clear profile data
      clearProfileData: () => set({ profileData: new Map() }),
      
      // Set log level
      setLogLevel: (level) => {
        console.log(`[DebugStore] Log level: ${level}`);
        set({ logLevel: level });
      },
      
      // Add log
      addLog: (level, message, data) => set((state) => {
        const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = logLevels[state.logLevel];
        const messageLevel = logLevels[level];
        
        // Only add if message level is >= current log level
        if (messageLevel < currentLevel) {
          return state;
        }
        
        const newLog: DebugLog = {
          timestamp: Date.now(),
          level,
          message,
          data
        };
        
        const newLogs = [...state.logs, newLog];
        
        // Keep only maxLogs entries
        if (newLogs.length > state.maxLogs) {
          newLogs.shift();
        }
        
        return { logs: newLogs };
      }),
      
      // Clear logs
      clearLogs: () => {
        console.log('[DebugStore] Cleared logs');
        set({ logs: [] });
      },
      
      // Toggle colliders
      toggleColliders: () => set((state) => {
        const newState = !state.showColliders;
        console.log(`[DebugStore] Show colliders: ${newState}`);
        return { showColliders: newState };
      }),
      
      // Toggle velocity
      toggleVelocity: () => set((state) => {
        const newState = !state.showVelocity;
        console.log(`[DebugStore] Show velocity: ${newState}`);
        return { showVelocity: newState };
      }),
      
      // Toggle grid
      toggleGrid: () => set((state) => {
        const newState = !state.showGrid;
        console.log(`[DebugStore] Show grid: ${newState}`);
        return { showGrid: newState };
      }),
      
      // Toggle axes
      toggleAxes: () => set((state) => {
        const newState = !state.showAxes;
        console.log(`[DebugStore] Show axes: ${newState}`);
        return { showAxes: newState };
      }),
      
      // Toggle stats
      toggleStats: () => set((state) => {
        const newState = !state.showStats;
        console.log(`[DebugStore] Show stats: ${newState}`);
        return { showStats: newState };
      }),
      
      // Reset debug
      resetDebug: () => {
        console.log('[DebugStore] Resetting debug state');
        set(initialDebugState);
      }
    }),
    {
      name: 'debug-store',
      enabled: import.meta.env.DEV
    }
  )
);

// Selectors
export const selectPerformanceStats = (state: DebugStore) => ({
  fps: state.fps,
  frameTime: state.frameTime,
  memoryUsage: state.memoryUsage,
  drawCalls: state.drawCalls,
  triangles: state.triangles
});

export const selectEngineStats = (state: DebugStore) => ({
  entityCount: state.entityCount,
  componentCount: state.componentCount,
  systemCount: state.systemCount
});

export const selectPhysicsStats = (state: DebugStore) => ({
  physicsSteps: state.physicsSteps,
  collisionChecks: state.collisionChecks
});

export const selectVisualization = (state: DebugStore) => ({
  showColliders: state.showColliders,
  showVelocity: state.showVelocity,
  showGrid: state.showGrid,
  showAxes: state.showAxes,
  showStats: state.showStats
});

export const selectLogs = (state: DebugStore) => state.logs;
export const selectProfileData = (state: DebugStore) => state.profileData;
