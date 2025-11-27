/**
 * Stopwatch
 * 
 * Simple stopwatch for measuring elapsed time.
 * Useful for profiling and timing operations.
 */

export class Stopwatch {
  private startTime: number = 0;
  private stopTime: number = 0;
  private running: boolean = false;
  private elapsed: number = 0;

  /**
   * Start the stopwatch
   */
  start(): void {
    if (!this.running) {
      this.startTime = performance.now();
      this.running = true;
    }
  }

  /**
   * Stop the stopwatch
   */
  stop(): number {
    if (this.running) {
      this.stopTime = performance.now();
      this.elapsed += this.stopTime - this.startTime;
      this.running = false;
    }
    return this.elapsed;
  }

  /**
   * Reset the stopwatch
   */
  reset(): void {
    this.startTime = 0;
    this.stopTime = 0;
    this.elapsed = 0;
    this.running = false;
  }

  /**
   * Restart the stopwatch
   */
  restart(): void {
    this.reset();
    this.start();
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedMs(): number {
    if (this.running) {
      return this.elapsed + (performance.now() - this.startTime);
    }
    return this.elapsed;
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsedSeconds(): number {
    return this.getElapsedMs() / 1000;
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Measure execution time of a function
   */
  static measure(fn: () => void): number {
    const stopwatch = new Stopwatch();
    stopwatch.start();
    fn();
    return stopwatch.stop();
  }

  /**
   * Measure async execution time
   */
  static async measureAsync(fn: () => Promise<void>): Promise<number> {
    const stopwatch = new Stopwatch();
    stopwatch.start();
    await fn();
    return stopwatch.stop();
  }
}
