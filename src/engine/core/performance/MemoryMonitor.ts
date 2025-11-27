/**
 * MemoryMonitor
 * 
 * Monitors memory usage and provides statistics.
 * Note: Requires browser support for performance.memory API.
 */

export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercentage: number;
}

export class MemoryMonitor {
  private updateInterval: number = 1000; // Update every second
  private lastUpdateTime: number = 0;
  private currentStats: MemoryStats | null = null;
  private history: MemoryStats[] = [];
  private historySize: number = 60;
  private supported: boolean = false;

  constructor(historySize: number = 60) {
    this.historySize = historySize;
    this.lastUpdateTime = performance.now();
    
    // Check if memory API is supported
    this.supported = 'memory' in performance;
    
    if (!this.supported) {
      console.warn('[MemoryMonitor] performance.memory API not supported in this browser');
    }
  }

  /**
   * Update memory statistics
   */
  update(): void {
    if (!this.supported) return;

    const currentTime = performance.now();
    
    if (currentTime - this.lastUpdateTime >= this.updateInterval) {
      this.currentStats = this.getMemoryStats();
      
      if (this.currentStats) {
        this.history.push(this.currentStats);
        if (this.history.length > this.historySize) {
          this.history.shift();
        }
      }
      
      this.lastUpdateTime = currentTime;
    }
  }

  /**
   * Get current memory statistics
   */
  private getMemoryStats(): MemoryStats | null {
    if (!this.supported) return null;

    const memory = (performance as any).memory;
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }

  /**
   * Get current memory usage
   */
  getCurrentStats(): MemoryStats | null {
    return this.currentStats;
  }

  /**
   * Get used heap size in MB
   */
  getUsedHeapMB(): number {
    if (!this.currentStats) return 0;
    return this.currentStats.usedJSHeapSize / (1024 * 1024);
  }

  /**
   * Get total heap size in MB
   */
  getTotalHeapMB(): number {
    if (!this.currentStats) return 0;
    return this.currentStats.totalJSHeapSize / (1024 * 1024);
  }

  /**
   * Get heap size limit in MB
   */
  getHeapLimitMB(): number {
    if (!this.currentStats) return 0;
    return this.currentStats.jsHeapSizeLimit / (1024 * 1024);
  }

  /**
   * Get used percentage
   */
  getUsedPercentage(): number {
    if (!this.currentStats) return 0;
    return this.currentStats.usedPercentage;
  }

  /**
   * Get memory history
   */
  getHistory(): MemoryStats[] {
    return [...this.history];
  }

  /**
   * Get average memory usage
   */
  getAverageUsage(): number {
    if (this.history.length === 0) return 0;
    
    const sum = this.history.reduce((acc, stats) => acc + stats.usedJSHeapSize, 0);
    return sum / this.history.length;
  }

  /**
   * Get peak memory usage
   */
  getPeakUsage(): number {
    if (this.history.length === 0) return 0;
    
    return Math.max(...this.history.map(stats => stats.usedJSHeapSize));
  }

  /**
   * Check if memory usage is above threshold
   */
  isAboveThreshold(thresholdPercentage: number): boolean {
    if (!this.currentStats) return false;
    return this.currentStats.usedPercentage > thresholdPercentage;
  }

  /**
   * Check if API is supported
   */
  isSupported(): boolean {
    return this.supported;
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.history = [];
    this.currentStats = null;
    this.lastUpdateTime = performance.now();
  }

  /**
   * Set update interval
   */
  setUpdateInterval(interval: number): void {
    this.updateInterval = interval;
  }

  /**
   * Set history size
   */
  setHistorySize(size: number): void {
    this.historySize = size;
    if (this.history.length > size) {
      this.history = this.history.slice(-size);
    }
  }

  /**
   * Format bytes to human-readable string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}
