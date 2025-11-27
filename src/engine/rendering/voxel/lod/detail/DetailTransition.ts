/**
 * Detail Transition
 * 
 * Manages smooth transitions between detail levels.
 */

export class DetailTransition {
  private transitionDuration: number = 500; // ms
  
  /**
   * Calculate transition blend
   */
  calculateBlend(fromLevel: number, toLevel: number, progress: number): number {
    // Smooth step interpolation
    const t = Math.max(0, Math.min(1, progress));
    return t * t * (3 - 2 * t);
  }
  
  /**
   * Interpolate detail settings
   */
  interpolate<T extends Record<string, number>>(from: T, to: T, blend: number): T {
    const result = {} as T;
    
    for (const key in from) {
      if (typeof from[key] === 'number' && typeof to[key] === 'number') {
        result[key] = from[key] + (to[key] - from[key]) * blend as any;
      }
    }
    
    return result;
  }
}
