/**
 * LOD Transition
 * 
 * Manages smooth transitions between LOD levels.
 * Prevents popping artifacts.
 */

import { Voxel } from '../core/Voxel';

/**
 * Transition state
 */
export interface TransitionState {
  /** Current LOD */
  currentLOD: number;
  
  /** Target LOD */
  targetLOD: number;
  
  /** Transition progress (0-1) */
  progress: number;
  
  /** Transition duration (ms) */
  duration: number;
  
  /** Elapsed time (ms) */
  elapsed: number;
}

/**
 * LOD transition manager
 */
export class LODTransition {
  private transitions: Map<string, TransitionState> = new Map();
  private defaultDuration: number = 300; // ms
  
  constructor(defaultDuration: number = 300) {
    this.defaultDuration = defaultDuration;
  }
  
  /**
   * Start transition
   */
  startTransition(
    voxelId: string,
    currentLOD: number,
    targetLOD: number,
    duration?: number
  ): void {
    this.transitions.set(voxelId, {
      currentLOD,
      targetLOD,
      progress: 0,
      duration: duration ?? this.defaultDuration,
      elapsed: 0
    });
  }
  
  /**
   * Update transitions
   */
  update(deltaTime: number): void {
    for (const [id, state] of this.transitions) {
      state.elapsed += deltaTime;
      state.progress = Math.min(1, state.elapsed / state.duration);
      
      // Remove completed transitions
      if (state.progress >= 1) {
        this.transitions.delete(id);
      }
    }
  }
  
  /**
   * Get transition state
   */
  getTransition(voxelId: string): TransitionState | undefined {
    return this.transitions.get(voxelId);
  }
  
  /**
   * Get blend factor for voxel
   */
  getBlendFactor(voxelId: string): number {
    const transition = this.transitions.get(voxelId);
    if (!transition) return 0;
    
    // Smooth step interpolation
    const t = transition.progress;
    return t * t * (3 - 2 * t);
  }
  
  /**
   * Get effective LOD (interpolated)
   */
  getEffectiveLOD(voxelId: string): number {
    const transition = this.transitions.get(voxelId);
    if (!transition) return 0;
    
    const blend = this.getBlendFactor(voxelId);
    return transition.currentLOD + (transition.targetLOD - transition.currentLOD) * blend;
  }
  
  /**
   * Is transitioning
   */
  isTransitioning(voxelId: string): boolean {
    return this.transitions.has(voxelId);
  }
  
  /**
   * Cancel transition
   */
  cancelTransition(voxelId: string): void {
    this.transitions.delete(voxelId);
  }
  
  /**
   * Clear all transitions
   */
  clearAll(): void {
    this.transitions.clear();
  }
  
  /**
   * Get active transition count
   */
  getActiveCount(): number {
    return this.transitions.size;
  }
}
