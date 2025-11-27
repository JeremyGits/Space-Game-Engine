/**
 * Timer
 * 
 * Countdown timer with callback support.
 * Useful for delayed actions, cooldowns, and timed events.
 */

export type TimerCallback = () => void;

export class Timer {
  private duration: number;
  private elapsed: number = 0;
  private running: boolean = false;
  private loop: boolean = false;
  private callback: TimerCallback | null = null;
  private timeScale: number = 1.0;

  constructor(duration: number, callback?: TimerCallback, loop: boolean = false) {
    this.duration = duration;
    this.callback = callback || null;
    this.loop = loop;
  }

  /**
   * Start the timer
   */
  start(): void {
    this.running = true;
    this.elapsed = 0;
  }

  /**
   * Stop the timer
   */
  stop(): void {
    this.running = false;
  }

  /**
   * Pause the timer
   */
  pause(): void {
    this.running = false;
  }

  /**
   * Resume the timer
   */
  resume(): void {
    this.running = true;
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.elapsed = 0;
  }

  /**
   * Update the timer
   */
  update(deltaTime: number): void {
    if (!this.running) return;

    this.elapsed += deltaTime * this.timeScale;

    if (this.elapsed >= this.duration) {
      // Timer completed
      if (this.callback) {
        this.callback();
      }

      if (this.loop) {
        // Reset for next loop
        this.elapsed = this.elapsed % this.duration;
      } else {
        // Stop timer
        this.running = false;
        this.elapsed = this.duration;
      }
    }
  }

  /**
   * Check if timer is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Check if timer is complete
   */
  isComplete(): boolean {
    return this.elapsed >= this.duration;
  }

  /**
   * Get elapsed time
   */
  getElapsed(): number {
    return this.elapsed;
  }

  /**
   * Get remaining time
   */
  getRemaining(): number {
    return Math.max(0, this.duration - this.elapsed);
  }

  /**
   * Get progress (0 to 1)
   */
  getProgress(): number {
    return Math.min(1, this.elapsed / this.duration);
  }

  /**
   * Get duration
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * Set duration
   */
  setDuration(duration: number): void {
    this.duration = duration;
  }

  /**
   * Set callback
   */
  setCallback(callback: TimerCallback): void {
    this.callback = callback;
  }

  /**
   * Set loop
   */
  setLoop(loop: boolean): void {
    this.loop = loop;
  }

  /**
   * Set time scale
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
}
