/**
 * SystemPriority
 * 
 * Predefined priority levels for systems to control execution order.
 * Lower numbers execute first.
 */

export enum SystemPriority {
  // Critical systems that must run first
  CRITICAL = -1000,
  
  // Input processing
  INPUT = -500,
  
  // Physics and collision detection
  PHYSICS = -100,
  COLLISION = -90,
  
  // Transform updates
  TRANSFORM = 0,
  
  // Animation
  ANIMATION = 100,
  
  // Game logic
  SCRIPT = 200,
  GAMEPLAY = 300,
  
  // AI and pathfinding
  AI = 400,
  
  // Audio
  AUDIO = 500,
  
  // Rendering preparation
  PRE_RENDER = 800,
  
  // Rendering
  RENDER = 900,
  
  // Post-processing
  POST_RENDER = 1000,
  
  // UI and overlays
  UI = 1100,
  
  // Debug and diagnostics
  DEBUG = 2000
}

/**
 * System priority utilities
 */
export class SystemPriorityUtils {
  /**
   * Get priority name from value
   */
  static getPriorityName(priority: number): string {
    for (const [key, value] of Object.entries(SystemPriority)) {
      if (value === priority && typeof value === 'number') {
        return key;
      }
    }
    return 'CUSTOM';
  }

  /**
   * Check if priority is valid
   */
  static isValidPriority(priority: number): boolean {
    return Number.isFinite(priority);
  }

  /**
   * Get all predefined priorities
   */
  static getAllPriorities(): Array<{ name: string; value: number }> {
    return Object.entries(SystemPriority)
      .filter(([_, value]) => typeof value === 'number')
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => a.value - b.value);
  }

  /**
   * Get priority range for a category
   */
  static getPriorityRange(category: 'early' | 'normal' | 'late'): { min: number; max: number } {
    switch (category) {
      case 'early':
        return { min: SystemPriority.CRITICAL, max: SystemPriority.TRANSFORM };
      case 'normal':
        return { min: SystemPriority.ANIMATION, max: SystemPriority.AUDIO };
      case 'late':
        return { min: SystemPriority.PRE_RENDER, max: SystemPriority.DEBUG };
      default:
        return { min: 0, max: 1000 };
    }
  }

  /**
   * Suggest priority based on system type
   */
  static suggestPriority(systemType: string): number {
    const type = systemType.toLowerCase();
    
    if (type.includes('input')) return SystemPriority.INPUT;
    if (type.includes('physics')) return SystemPriority.PHYSICS;
    if (type.includes('collision')) return SystemPriority.COLLISION;
    if (type.includes('transform')) return SystemPriority.TRANSFORM;
    if (type.includes('animation')) return SystemPriority.ANIMATION;
    if (type.includes('script')) return SystemPriority.SCRIPT;
    if (type.includes('ai')) return SystemPriority.AI;
    if (type.includes('audio')) return SystemPriority.AUDIO;
    if (type.includes('render')) return SystemPriority.RENDER;
    if (type.includes('ui')) return SystemPriority.UI;
    if (type.includes('debug')) return SystemPriority.DEBUG;
    
    return SystemPriority.GAMEPLAY;
  }

  /**
   * Create custom priority between two priorities
   */
  static createBetween(priority1: number, priority2: number): number {
    return Math.floor((priority1 + priority2) / 2);
  }

  /**
   * Create priority before another
   */
  static createBefore(priority: number, offset: number = 10): number {
    return priority - offset;
  }

  /**
   * Create priority after another
   */
  static createAfter(priority: number, offset: number = 10): number {
    return priority + offset;
  }
}
