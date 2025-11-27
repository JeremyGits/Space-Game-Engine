/**
 * FPSCounter
 * 
 * Tracks frames per second with smoothing and statistics.
 */

export class FPSCounter {
  private frameCount: number = 0;
  private lastTime: number = 0;
  private currentFPS: number = 0;
  private averageFPS: number = 0;
  private minFPS: number = Infinity;
  private maxFPS: number = 0;
  private fpsHistory: number[] = [];
  private historySize: number = 60;
  private updateInterval: number = 1000; // Update every second
  private lastUpdateTime: number = 0;

  constructor(historySize: number = 60) {
    this.historySize = historySize;
    this.lastTime = performance.now();
    this.lastUpdateTime = this.lastTime;
  }

  /**
   * Update FPS counter (call once per frame)
   */
  update(): void {
    const currentTime = performance.now();
    this.frameCount++;

    // Update FPS every interval
    if (currentTime - this.lastUpdateTime >= this.updateInterval) {
      const deltaTime = currentTime - this.lastUpdateTime;
      this.currentFPS = (this.frameCount / deltaTime) * 1000;
      
      // Update history
      this.fpsHistory.push(this.currentFPS);
      if (this.fpsHistory.length > this.historySize) {
        this.fpsHistory.shift();
      }

      // Update statistics
      this.updateStatistics();

      // Reset counters
      this.frameCount = 0;
      this.lastUpdateTime = currentTime;
    }

    this.lastTime = currentTime;
  }

  /**
   * Update FPS statistics
   */
  private updateStatistics(): void {
    if (this.fpsHistory.length === 0) return;

    // Calculate average
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    this.averageFPS = sum / this.fpsHistory.length;

    // Update min/max
    this.minFPS = Math.min(this.minFPS, this.currentFPS);
    this.maxFPS = Math.max(this.maxFPS, this.currentFPS);
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return Math.round(this.currentFPS);
  }

  /**
   * Get average FPS
   */
  getAverageFPS(): number {
    return Math.round(this.averageFPS);
  }

  /**
   * Get minimum FPS
   */
  getMinFPS(): number {
    return Math.round(this.minFPS);
  }

  /**
   * Get maximum FPS
   */
  getMaxFPS(): number {
    return Math.round(this.maxFPS);
  }

  /**
   * Get FPS history
   */
  getHistory(): number[] {
    return [...this.fpsHistory];
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.frameCount = 0;
    this.currentFPS = 0;
    this.averageFPS = 0;
    this.minFPS = Infinity;
    this.maxFPS = 0;
    this.fpsHistory = [];
    this.lastTime = performance.now();
    this.lastUpdateTime = this.lastTime;
  }

  /**
   * Set history size
   */
  setHistorySize(size: number): void {
    this.historySize = size;
    if (this.fpsHistory.length > size) {
      this.fpsHistory = this.fpsHistory.slice(-size);
    }
  }

  /**
   * Set update interval
   */
  setUpdateInterval(interval: number): void {
    this.updateInterval = interval;
  }
}
