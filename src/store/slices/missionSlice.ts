/**
 * Mission Slice
 * 
 * Manages mission state, objectives, progress, and completion
 */

import { StateCreator } from 'zustand';
import {
  MissionData,
  MissionStatus,
  MissionType,
  DifficultyLevel
} from '../../types/store/StoreTypes';

export interface MissionSlice {
  // State
  currentMission: MissionData | null;
  availableMissions: MissionData[];
  completedMissions: string[];
  
  // Actions
  startMission: (missionId: string) => void;
  completeMission: () => void;
  failMission: () => void;
  abandonMission: () => void;
  
  // Objectives
  updateObjectiveProgress: (objectiveId: string, progress: number) => void;
  completeObjective: (objectiveId: string) => void;
  
  // Time
  updateMissionTime: (deltaTime: number) => void;
  
  // Score
  addMissionScore: (points: number) => void;
  
  // Mission Management
  loadMissions: (missions: MissionData[]) => void;
  getMissionById: (missionId: string) => MissionData | null;
  getAvailableMissions: () => MissionData[];
  getCompletedMissions: () => MissionData[];
  
  // Reset
  resetMission: () => void;
}

const createDefaultMission = (
  id: string,
  name: string,
  type: MissionType,
  difficulty: DifficultyLevel
): MissionData => ({
  id,
  name,
  description: `Complete ${name}`,
  type,
  difficulty,
  status: MissionStatus.NOT_STARTED,
  objectives: [],
  timeElapsed: 0,
  score: 0,
  rewards: {
    credits: 1000,
    experience: 100,
    unlocks: []
  }
});

const initialMissions: MissionData[] = [
  {
    ...createDefaultMission('tutorial', 'Tutorial: Basic Flight', MissionType.NAVIGATION, DifficultyLevel.EASY),
    description: 'Learn the basics of spacecraft control',
    objectives: [
      {
        id: 'move-forward',
        description: 'Move forward using thrusters',
        completed: false,
        optional: false
      },
      {
        id: 'rotate',
        description: 'Rotate your spacecraft',
        completed: false,
        optional: false
      },
      {
        id: 'stop',
        description: 'Come to a complete stop',
        completed: false,
        optional: false
      }
    ]
  },
  {
    ...createDefaultMission('docking-1', 'Docking Practice', MissionType.DOCKING, DifficultyLevel.EASY),
    description: 'Practice docking with a stationary station',
    objectives: [
      {
        id: 'approach',
        description: 'Approach the docking port',
        completed: false,
        optional: false,
        progress: 0,
        maxProgress: 100
      },
      {
        id: 'align',
        description: 'Align with the docking port',
        completed: false,
        optional: false
      },
      {
        id: 'dock',
        description: 'Complete the docking procedure',
        completed: false,
        optional: false
      }
    ],
    timeLimit: 300
  }
];

export const createMissionSlice: StateCreator<MissionSlice> = (set, get) => ({
  currentMission: null,
  availableMissions: initialMissions,
  completedMissions: [],
  
  // Start mission
  startMission: (missionId: string) => {
    const mission = get().availableMissions.find(m => m.id === missionId);
    if (mission) {
      console.log(`[MissionSlice] Starting mission: ${mission.name}`);
      set({
        currentMission: {
          ...mission,
          status: MissionStatus.IN_PROGRESS,
          timeElapsed: 0,
          score: 0,
          objectives: mission.objectives.map(obj => ({ ...obj, completed: false, progress: 0 }))
        }
      });
    } else {
      console.warn(`[MissionSlice] Mission not found: ${missionId}`);
    }
  },
  
  // Complete mission
  completeMission: () => set((state) => {
    if (!state.currentMission) return state;
    
    console.log(`[MissionSlice] Mission completed: ${state.currentMission.name}`);
    console.log(`[MissionSlice] Score: ${state.currentMission.score}`);
    console.log(`[MissionSlice] Time: ${state.currentMission.timeElapsed.toFixed(2)}s`);
    
    return {
      currentMission: {
        ...state.currentMission,
        status: MissionStatus.COMPLETED
      },
      completedMissions: [...state.completedMissions, state.currentMission.id]
    };
  }),
  
  // Fail mission
  failMission: () => set((state) => {
    if (!state.currentMission) return state;
    
    console.log(`[MissionSlice] Mission failed: ${state.currentMission.name}`);
    
    return {
      currentMission: {
        ...state.currentMission,
        status: MissionStatus.FAILED
      }
    };
  }),
  
  // Abandon mission
  abandonMission: () => {
    console.log('[MissionSlice] Mission abandoned');
    set({ currentMission: null });
  },
  
  // Update objective progress
  updateObjectiveProgress: (objectiveId: string, progress: number) => set((state) => {
    if (!state.currentMission) return state;
    
    const objectives = state.currentMission.objectives.map(obj => {
      if (obj.id === objectiveId) {
        const newProgress = Math.min(progress, obj.maxProgress || 100);
        
        // Auto-complete if progress reaches max
        if (newProgress >= (obj.maxProgress || 100) && !obj.completed) {
          console.log(`[MissionSlice] Objective completed: ${obj.description}`);
          return { ...obj, progress: newProgress, completed: true };
        }
        
        return { ...obj, progress: newProgress };
      }
      return obj;
    });
    
    return {
      currentMission: {
        ...state.currentMission,
        objectives
      }
    };
  }),
  
  // Complete objective
  completeObjective: (objectiveId: string) => set((state) => {
    if (!state.currentMission) return state;
    
    const objectives = state.currentMission.objectives.map(obj => {
      if (obj.id === objectiveId && !obj.completed) {
        console.log(`[MissionSlice] Objective completed: ${obj.description}`);
        return { ...obj, completed: true };
      }
      return obj;
    });
    
    // Check if all required objectives are complete
    const allRequiredComplete = objectives
      .filter(obj => !obj.optional)
      .every(obj => obj.completed);
    
    if (allRequiredComplete) {
      console.log('[MissionSlice] All required objectives completed!');
    }
    
    return {
      currentMission: {
        ...state.currentMission,
        objectives
      }
    };
  }),
  
  // Update mission time
  updateMissionTime: (deltaTime: number) => set((state) => {
    if (!state.currentMission || state.currentMission.status !== MissionStatus.IN_PROGRESS) {
      return state;
    }
    
    const newTime = state.currentMission.timeElapsed + deltaTime;
    
    // Check time limit
    if (state.currentMission.timeLimit && newTime >= state.currentMission.timeLimit) {
      console.log('[MissionSlice] Time limit exceeded!');
      return {
        currentMission: {
          ...state.currentMission,
          timeElapsed: state.currentMission.timeLimit,
          status: MissionStatus.FAILED
        }
      };
    }
    
    return {
      currentMission: {
        ...state.currentMission,
        timeElapsed: newTime
      }
    };
  }),
  
  // Add mission score
  addMissionScore: (points: number) => set((state) => {
    if (!state.currentMission) return state;
    
    return {
      currentMission: {
        ...state.currentMission,
        score: state.currentMission.score + points
      }
    };
  }),
  
  // Load missions
  loadMissions: (missions: MissionData[]) => {
    console.log(`[MissionSlice] Loaded ${missions.length} missions`);
    set({ availableMissions: missions });
  },
  
  // Get mission by ID
  getMissionById: (missionId: string) => {
    return get().availableMissions.find(m => m.id === missionId) || null;
  },
  
  // Get available missions
  getAvailableMissions: () => {
    return get().availableMissions.filter(
      m => !get().completedMissions.includes(m.id)
    );
  },
  
  // Get completed missions
  getCompletedMissions: () => {
    const completedIds = get().completedMissions;
    return get().availableMissions.filter(m => completedIds.includes(m.id));
  },
  
  // Reset mission
  resetMission: () => {
    console.log('[MissionSlice] Resetting mission state');
    set({
      currentMission: null,
      availableMissions: initialMissions,
      completedMissions: []
    });
  }
});
