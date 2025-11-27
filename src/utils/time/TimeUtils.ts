/**
 * TimeUtils
 * 
 * Utility functions for time-related operations.
 */

export const TimeUtils = {
  /**
   * Convert milliseconds to seconds
   */
  msToSeconds(ms: number): number {
    return ms / 1000;
  },

  /**
   * Convert seconds to milliseconds
   */
  secondsToMs(seconds: number): number {
    return seconds * 1000;
  },

  /**
   * Format time as MM:SS
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Format time as HH:MM:SS
   */
  formatTimeHMS(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Format milliseconds with precision
   */
  formatMs(ms: number, precision: number = 2): string {
    return `${ms.toFixed(precision)}ms`;
  },

  /**
   * Get current timestamp
   */
  now(): number {
    return Date.now();
  },

  /**
   * Get high-precision timestamp
   */
  nowPrecise(): number {
    return performance.now();
  },

  /**
   * Sleep for specified milliseconds (async)
   */
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Debounce a function
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number | null = null;
    
    return function(...args: Parameters<T>) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait) as unknown as number;
    };
  },

  /**
   * Throttle a function
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;
    
    return function(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Convert frames to seconds
   */
  framesToSeconds(frames: number, fps: number = 60): number {
    return frames / fps;
  },

  /**
   * Convert seconds to frames
   */
  secondsToFrames(seconds: number, fps: number = 60): number {
    return Math.floor(seconds * fps);
  },

  /**
   * Lerp between two time values
   */
  lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  },

  /**
   * Check if time has elapsed
   */
  hasElapsed(startTime: number, duration: number): boolean {
    return (Date.now() - startTime) >= duration;
  },

  /**
   * Get time remaining
   */
  getRemaining(startTime: number, duration: number): number {
    return Math.max(0, duration - (Date.now() - startTime));
  },

  /**
   * Get progress (0 to 1)
   */
  getProgress(startTime: number, duration: number): number {
    const elapsed = Date.now() - startTime;
    return Math.min(1, elapsed / duration);
  }
};
