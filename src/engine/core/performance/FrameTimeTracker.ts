/**
 * FrameTimeTracker
 * 
 * Tracks frame time statistics for performance analysis.
 */

export interface FrameTimeStats {
  current: number;
  average: number;
  min: number;
  max: number;
  percentile95: number;
  percentile99: number;
}

export class FrameTimeTracker {
  private frameTimes: number[] = [];
  private historySize: number = 120; // 2 seconds at 60 FPS
  private currentFrameTime: number = 0;
  private lastFrameTime: number = 0;

  constructor(historySize: number = 120) {
    this.historySize = historySize;
    this.lastFrameTime = performance.now();
  }

  /**
   * Begin frame timing
   */
  beginFrame(): void {
    this.lastFrameTime = performance.now();
  }

  /**
   * End frame timing
   */
  endFrame(): void {
    const currentTime = performance.now();
    this.currentFrameTime = currentTime - this.lastFrameTime;
    
    // Add to history
    this.frameTimes.push(this.currentFrameTime);
    if (this.frameTimes.length > this.historySize) {
      this.frameTimes.shift();
    }
  }

  /**
   * Get current frame time
   */
  getCurrentFrameTime(): number {
    return this.currentFrameTime;
  }

  /**
   * Get average frame time
   */
  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }

  /**
   * Get minimum frame time
   */
  getMinFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return Math.min(...this.frameTimes);
  }

  /**
   * Get maximum frame time
   */
  getMaxFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return Math.max(...this.frameTimes);
  }

  /**
   * Get percentile frame time
   */
  getPercentile(percentile: number): number {
    if (this.frameTimes.length === 0) return 0;
    
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get 95th percentile frame time
   */
  get95thPercentile(): number {
    return this.getPercentile(95);
  }

  /**
   * Get 99th percentile frame time
   */
  get99thPercentile(): number {
    return this.getPercentile(99);
  }

  /**
   * Get all statistics
   */
  getStats(): FrameTimeStats {
    return {
      current: this.currentFrameTime,
      average: this.getAverageFrameTime(),
      min: this.getMinFrameTime(),
      max: this.getMaxFrameTime(),
      percentile95: this.get95thPercentile(),
      percentile99: this.get99thPercentile()
    };
  }

  /**
   * Get frame time history
   */
  getHistory(): number[] {
    return [...this.frameTimes];
  }

  /**
   * Check if frame time is above threshold
   */
  isAboveThreshold(threshold: number): boolean {
    return this.currentFrameTime > threshold;
  }

  /**
   * Get frame time variance
   */
  getVariance(): number {
    if (this.frameTimes.length === 0) return 0;
    
    const avg = this.getAverageFrameTime();
    const squaredDiffs = this.frameTimes.map(time => Math.pow(time - avg, 2));
    const sum = squaredDiffs.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }

  /**
   * Get standard deviation
   */
  getStandardDeviation(): number {
    return Math.sqrt(this.getVariance());
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.frameTimes = [];
    this.currentFrameTime = 0;
    this.lastFrameTime = performance.now();
  }

  /**
   * Set history size
   */
  setHistorySize(size: number): void {
    this.historySize = size;
    if (this.frameTimes.length > size) {
      this.frameTimes = this.frameTimes.slice(-size);
    }
  }
}
