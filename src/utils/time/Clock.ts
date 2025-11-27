/**
 * Clock
 * 
 * High-precision clock for tracking time in the game engine.
 * Provides delta time, total time, and time scaling capabilities.
 */

export class Clock {
  private startTime: number;
  private lastTime: number;
  private currentTime: number;
  private deltaTime: number;
  private totalTime: number;
  private timeScale: number = 1.0;
  private paused: boolean = false;
  private pauseStartTime: number = 0;
  private totalPausedTime: number = 0;

  constructor(autoStart: boolean = true) {
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.currentTime = this.startTime;
    this.deltaTime = 0;
    this.totalTime = 0;

    if (autoStart) {
      this.start();
    }
  }

  /**
   * Start the clock
   */
  start(): void {
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.currentTime = this.startTime;
    this.deltaTime = 0;
    this.totalTime = 0;
    this.paused = false;
    this.totalPausedTime = 0;
  }

  /**
   * Update the clock (call once per frame)
   */
  tick(): number {
    if (this.paused) {
      this.deltaTime = 0;
      return 0;
    }

    this.currentTime = performance.now();
    this.deltaTime = (this.currentTime - this.lastTime) * this.timeScale;
    this.lastTime = this.currentTime;
    this.totalTime += this.deltaTime;

    return this.deltaTime;
  }

  /**
   * Get delta time in seconds
   */
  getDeltaTime(): number {
    return this.deltaTime / 1000;
  }

  /**
   * Get delta time in milliseconds
   */
  getDeltaTimeMs(): number {
    return this.deltaTime;
  }

  /**
   * Get total elapsed time in seconds
   */
  getTotalTime(): number {
    return this.totalTime / 1000;
  }

  /**
   * Get total elapsed time in milliseconds
   */
  getTotalTimeMs(): number {
    return this.totalTime;
  }

  /**
   * Get current time
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Set time scale (1.0 = normal, 0.5 = half speed, 2.0 = double speed)
   */
  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, scale);
  }

  /**
   * Get time scale
   */
  getTimeScale(): number {
    return this.timeScale;
  }

  /**
   * Pause the clock
   */
  pause(): void {
    if (!this.paused) {
      this.paused = true;
      this.pauseStartTime = performance.now();
    }
  }

  /**
   * Resume the clock
   */
  resume(): void {
    if (this.paused) {
      this.paused = false;
      const pauseDuration = performance.now() - this.pauseStartTime;
      this.totalPausedTime += pauseDuration;
      this.lastTime = performance.now();
    }
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Reset the clock
   */
  reset(): void {
    this.start();
  }

  /**
   * Get total paused time
   */
  getTotalPausedTime(): number {
    return this.totalPausedTime;
  }

  /**
   * Get actual elapsed time (including paused time)
   */
  getActualElapsedTime(): number {
    return performance.now() - this.startTime;
  }
}
