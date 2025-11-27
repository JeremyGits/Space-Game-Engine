/**
 * PerformanceStats
 * 
 * Aggregates all performance statistics into a single interface.
 */

import { FPSCounter } from './FPSCounter';
import { FrameTimeTracker, FrameTimeStats } from './FrameTimeTracker';
import { MemoryMonitor, MemoryStats } from './MemoryMonitor';
import { ProfilerMarker } from './ProfilerMarker';

export interface AggregatedStats {
  fps: {
    current: number;
    average: number;
    min: number;
    max: number;
  };
  frameTime: FrameTimeStats;
  memory: MemoryStats | null;
  profiler: Map<string, {
    count: number;
    average: number;
    min: number;
    max: number;
    last: number;
  }>;
}

export class PerformanceStats {
  private fpsCounter: FPSCounter;
  private frameTimeTracker: FrameTimeTracker;
  private memoryMonitor: MemoryMonitor;
  private profilerMarker: ProfilerMarker;

  constructor() {
    this.fpsCounter = new FPSCounter();
    this.frameTimeTracker = new FrameTimeTracker();
    this.memoryMonitor = new MemoryMonitor();
    this.profilerMarker = new ProfilerMarker();
  }

  /**
   * Update all performance monitors
   */
  update(): void {
    this.fpsCounter.update();
    this.memoryMonitor.update();
  }

  /**
   * Begin frame timing
   */
  beginFrame(): void {
    this.frameTimeTracker.beginFrame();
  }

  /**
   * End frame timing
   */
  endFrame(): void {
    this.frameTimeTracker.endFrame();
  }

  /**
   * Get FPS counter
   */
  getFPSCounter(): FPSCounter {
    return this.fpsCounter;
  }

  /**
   * Get frame time tracker
   */
  getFrameTimeTracker(): FrameTimeTracker {
    return this.frameTimeTracker;
  }

  /**
   * Get memory monitor
   */
  getMemoryMonitor(): MemoryMonitor {
    return this.memoryMonitor;
  }

  /**
   * Get profiler marker
   */
  getProfilerMarker(): ProfilerMarker {
    return this.profilerMarker;
  }

  /**
   * Get aggregated statistics
   */
  getAggregatedStats(): AggregatedStats {
    return {
      fps: {
        current: this.fpsCounter.getFPS(),
        average: this.fpsCounter.getAverageFPS(),
        min: this.fpsCounter.getMinFPS(),
        max: this.fpsCounter.getMaxFPS()
      },
      frameTime: this.frameTimeTracker.getStats(),
      memory: this.memoryMonitor.getCurrentStats(),
      profiler: this.profilerMarker.getAllSummaries()
    };
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.fpsCounter.reset();
    this.frameTimeTracker.reset();
    this.memoryMonitor.reset();
    this.profilerMarker.clearAll();
  }

  /**
   * Export all statistics as JSON
   */
  export(): string {
    const stats = this.getAggregatedStats();
    
    return JSON.stringify({
      fps: stats.fps,
      frameTime: stats.frameTime,
      memory: stats.memory,
      profiler: Array.from(stats.profiler.entries()).map(([name, data]) => ({
        name,
        ...data
      }))
    }, null, 2);
  }

  /**
   * Get performance summary
   */
  getSummary(): string {
    const stats = this.getAggregatedStats();
    
    let summary = '=== Performance Summary ===\n\n';
    
    // FPS
    summary += `FPS:\n`;
    summary += `  Current: ${stats.fps.current}\n`;
    summary += `  Average: ${stats.fps.average}\n`;
    summary += `  Min: ${stats.fps.min}\n`;
    summary += `  Max: ${stats.fps.max}\n\n`;
    
    // Frame Time
    summary += `Frame Time:\n`;
    summary += `  Current: ${stats.frameTime.current.toFixed(2)}ms\n`;
    summary += `  Average: ${stats.frameTime.average.toFixed(2)}ms\n`;
    summary += `  Min: ${stats.frameTime.min.toFixed(2)}ms\n`;
    summary += `  Max: ${stats.frameTime.max.toFixed(2)}ms\n`;
    summary += `  95th: ${stats.frameTime.percentile95.toFixed(2)}ms\n`;
    summary += `  99th: ${stats.frameTime.percentile99.toFixed(2)}ms\n\n`;
    
    // Memory
    if (stats.memory) {
      summary += `Memory:\n`;
      summary += `  Used: ${MemoryMonitor.formatBytes(stats.memory.usedJSHeapSize)}\n`;
      summary += `  Total: ${MemoryMonitor.formatBytes(stats.memory.totalJSHeapSize)}\n`;
      summary += `  Limit: ${MemoryMonitor.formatBytes(stats.memory.jsHeapSizeLimit)}\n`;
      summary += `  Usage: ${stats.memory.usedPercentage.toFixed(2)}%\n\n`;
    }
    
    // Profiler
    if (stats.profiler.size > 0) {
      summary += `Profiler Markers:\n`;
      for (const [name, data] of stats.profiler) {
        summary += `  ${name}:\n`;
        summary += `    Count: ${data.count}\n`;
        summary += `    Avg: ${data.average.toFixed(2)}ms\n`;
        summary += `    Min: ${data.min.toFixed(2)}ms\n`;
        summary += `    Max: ${data.max.toFixed(2)}ms\n`;
      }
    }
    
    return summary;
  }
}
