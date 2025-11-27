/**
 * Player Slice
 * 
 * Manages player state including spacecraft, resources, stats, and unlocks
 */

import { StateCreator } from 'zustand';
import { Vector3 } from '../../utils/math/Vector3';
import { PlayerState } from '../../types/store/StoreTypes';

export interface PlayerSlice extends PlayerState {
  // Actions
  setSpacecraft: (spacecraftId: string) => void;
  updatePosition: (position: Vector3) => void;
  updateVelocity: (velocity: Vector3) => void;
  updateRotation: (rotation: { x: number; y: number; z: number }) => void;
  updateAngularVelocity: (angularVelocity: Vector3) => void;
  
  // Resources
  consumeFuel: (amount: number) => void;
  refuel: (amount: number) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  
  // Stats
  addScore: (points: number) => void;
  incrementMissionsCompleted: () => void;
  updateFlightTime: (deltaTime: number) => void;
  updateBestDockingScore: (score: number) => void;
  
  // Unlocks
  unlockSpacecraft: (spacecraftId: string) => void;
  unlockMission: (missionId: string) => void;
  addAchievement: (achievementId: string) => void;
  
  // Reset
  resetPlayer: () => void;
  respawn: () => void;
}

const initialPlayerState: PlayerState = {
  spacecraftId: null,
  position: new Vector3(0, 0, 0),
  velocity: new Vector3(0, 0, 0),
  rotation: { x: 0, y: 0, z: 0 },
  angularVelocity: new Vector3(0, 0, 0),
  
  fuel: 100,
  maxFuel: 100,
  health: 100,
  maxHealth: 100,
  
  score: 0,
  missionsCompleted: 0,
  totalFlightTime: 0,
  bestDockingScore: 0,
  
  unlockedSpacecraft: ['default'],
  unlockedMissions: ['tutorial'],
  achievements: []
};

export const createPlayerSlice: StateCreator<PlayerSlice> = (set) => ({
  ...initialPlayerState,
  
  // Spacecraft
  setSpacecraft: (spacecraftId: string) => set({ spacecraftId }),
  
  // Transform updates
  updatePosition: (position: Vector3) => set({ position }),
  
  updateVelocity: (velocity: Vector3) => set({ velocity }),
  
  updateRotation: (rotation: { x: number; y: number; z: number }) => set({ rotation }),
  
  updateAngularVelocity: (angularVelocity: Vector3) => set({ angularVelocity }),
  
  // Resources
  consumeFuel: (amount: number) => set((state) => ({
    fuel: Math.max(0, state.fuel - amount)
  })),
  
  refuel: (amount: number) => set((state) => ({
    fuel: Math.min(state.maxFuel, state.fuel + amount)
  })),
  
  takeDamage: (amount: number) => set((state) => {
    const newHealth = Math.max(0, state.health - amount);
    console.log(`[PlayerSlice] Took ${amount} damage. Health: ${newHealth}/${state.maxHealth}`);
    return { health: newHealth };
  }),
  
  heal: (amount: number) => set((state) => ({
    health: Math.min(state.maxHealth, state.health + amount)
  })),
  
  // Stats
  addScore: (points: number) => set((state) => {
    const newScore = state.score + points;
    console.log(`[PlayerSlice] Score: ${newScore} (+${points})`);
    return { score: newScore };
  }),
  
  incrementMissionsCompleted: () => set((state) => {
    const newCount = state.missionsCompleted + 1;
    console.log(`[PlayerSlice] Missions completed: ${newCount}`);
    return { missionsCompleted: newCount };
  }),
  
  updateFlightTime: (deltaTime: number) => set((state) => ({
    totalFlightTime: state.totalFlightTime + deltaTime
  })),
  
  updateBestDockingScore: (score: number) => set((state) => {
    if (score > state.bestDockingScore) {
      console.log(`[PlayerSlice] New best docking score: ${score}`);
      return { bestDockingScore: score };
    }
    return state;
  }),
  
  // Unlocks
  unlockSpacecraft: (spacecraftId: string) => set((state) => {
    if (!state.unlockedSpacecraft.includes(spacecraftId)) {
      console.log(`[PlayerSlice] Unlocked spacecraft: ${spacecraftId}`);
      return {
        unlockedSpacecraft: [...state.unlockedSpacecraft, spacecraftId]
      };
    }
    return state;
  }),
  
  unlockMission: (missionId: string) => set((state) => {
    if (!state.unlockedMissions.includes(missionId)) {
      console.log(`[PlayerSlice] Unlocked mission: ${missionId}`);
      return {
        unlockedMissions: [...state.unlockedMissions, missionId]
      };
    }
    return state;
  }),
  
  addAchievement: (achievementId: string) => set((state) => {
    if (!state.achievements.includes(achievementId)) {
      console.log(`[PlayerSlice] Achievement unlocked: ${achievementId}`);
      return {
        achievements: [...state.achievements, achievementId]
      };
    }
    return state;
  }),
  
  // Reset
  resetPlayer: () => {
    console.log('[PlayerSlice] Resetting player state');
    set(initialPlayerState);
  },
  
  respawn: () => set((state) => {
    console.log('[PlayerSlice] Respawning player');
    return {
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      rotation: { x: 0, y: 0, z: 0 },
      angularVelocity: new Vector3(0, 0, 0),
      health: state.maxHealth,
      fuel: state.maxFuel
    };
  })
});
