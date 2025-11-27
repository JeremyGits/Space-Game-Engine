/**
 * PerformanceMonitor
 * 
 * Monitors and tracks engine performance metrics including FPS,
 * frame time, memory usage, and system performance.
 */

import { EventEmitter } from './EventEmitter';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  averageFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
  entities: number;
  components: number;
  systems: number;
}

export interface PerformanceStats {
  current: PerformanceMetrics;
  history: PerformanceMetrics[];
  warnings: PerformanceWarning[];
}

export interface PerformanceWarning {
  type: 'fps' | 'memory' | 'frametime' | 'drawcalls';
  message: string;
  timestamp: number;
  value: number;
  threshold: number;
}

export interface PerformanceThresholds {
  minFPS: number;
  maxFrameTime: number;
  maxMemory: number;
  maxDrawCalls: number;
}

export class PerformanceMonitor {
  private eventEmitter: EventEmitter;
  private enabled: boolean = true;
  
  // Frame timing
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameTimes: number[] = [];
  private maxFrameHistory: number = 60;
  
  // FPS tracking
  private fps: number = 0;
  private fpsUpdateInterval: number = 1000; // Update FPS every second
  private lastFpsUpdate: number = 0;
  private framesSinceLastUpdate: number = 0;
  
  // Performance metrics
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    averageFrameTime: 0,
    minFrameTime: Infinity,
    maxFrameTime: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    entities: 0,
    components: 0,
    systems: 0
  };
  
  // Performance history
  private metricsHistory: PerformanceMetrics[] = [];
  private maxHistorySize: number = 300; // 5 seconds at 60 FPS
  
  // Warnings
  private warnings: PerformanceWarning[] = [];
  private maxWarnings: number = 100;
  
  // Thresholds
  private thresholds: PerformanceThresholds = {
    minFPS: 30,
    maxFrameTime: 33.33, // ~30 FPS
    maxMemory: 512 * 1024 * 1024, // 512 MB
    maxDrawCalls: 1000
  };

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    this.lastFrameTime = performance.now();
    this.lastFpsUpdate = this.lastFrameTime;
  }

  /**
   * Begin frame measurement
   */
  beginFrame(): void {
    if (!this.enabled) return;
    
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    
    // Update frame timing
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.maxFrameHistory) {
      this.frameTimes.shift();
    }
    
    // Update frame count
    this.frameCount++;
    this.framesSinceLastUpdate++;
    
    // Update FPS
    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.fps = (this.framesSinceLastUpdate / (now - this.lastFpsUpdate)) * 1000;
      this.framesSinceLastUpdate = 0;
      this.lastFpsUpdate = now;
      
      // Check FPS threshold
      if (this.fps < this.thresholds.minFPS) {
        this.addWarning('fps', `Low FPS: ${this.fps.toFixed(1)}`, this.fps, this.thresholds.minFPS);
      }
    }
    
    // Calculate frame time statistics
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const minFrameTime = Math.min(...this.frameTimes);
    const maxFrameTime = Math.max(...this.frameTimes);
    
    // Update metrics
    this.metrics.fps = this.fps;
    this.metrics.frameTime = deltaTime;
    this.metrics.averageFrameTime = avgFrameTime;
    this.metrics.minFrameTime = minFrameTime;
    this.metrics.maxFrameTime = maxFrameTime;
    
    // Check frame time threshold
    if (deltaTime > this.thresholds.maxFrameTime) {
      this.addWarning(
        'frametime',
        `High frame time: ${deltaTime.toFixed(2)}ms`,
        deltaTime,
        this.thresholds.maxFrameTime
      );
    }
    
    // Update memory usage (Chrome only)
    const perfWithMemory = performance as any;
    if (perfWithMemory.memory) {
      this.metrics.memoryUsage = perfWithMemory.memory.usedJSHeapSize;
      
      // Check memory threshold
      if (this.metrics.memoryUsage > this.thresholds.maxMemory) {
        this.addWarning(
          'memory',
          `High memory usage: ${(this.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
          this.metrics.memoryUsage,
          this.thresholds.maxMemory
        );
      }
    }
    
    this.lastFrameTime = now;
  }

  /**
   * End frame measurement
   */
  endFrame(): void {
    if (!this.enabled) return;
    
    // Store metrics in history
    this.metricsHistory.push({ ...this.metrics });
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  /**
   * Update rendering metrics
   */
  updateRenderMetrics(drawCalls: number, triangles: number): void {
    this.metrics.drawCalls = drawCalls;
    this.metrics.triangles = triangles;
    
    // Check draw calls threshold
    if (drawCalls > this.thresholds.maxDrawCalls) {
      this.addWarning(
        'drawcalls',
        `High draw calls: ${drawCalls}`,
        drawCalls,
        this.thresholds.maxDrawCalls
      );
    }
  }

  /**
   * Update ECS metrics
   */
  updateECSMetrics(entities: number, components: number, systems: number): void {
    this.metrics.entities = entities;
    this.metrics.components = components;
    this.metrics.systems = systems;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get metrics history
   */
  getHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Get warnings
   */
  getWarnings(): PerformanceWarning[] {
    return [...this.warnings];
  }

  /**
   * Clear warnings
   */
  clearWarnings(): void {
    this.warnings = [];
  }

  /**
   * Get performance stats
   */
  getStats(): PerformanceStats {
    return {
      current: this.getMetrics(),
      history: this.getHistory(),
      warnings: this.getWarnings()
    };
  }

  /**
   * Set performance thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get performance thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.frameCount = 0;
    this.frameTimes = [];
    this.metricsHistory = [];
    this.warnings = [];
    this.fps = 0;
    this.framesSinceLastUpdate = 0;
    this.lastFpsUpdate = performance.now();
    this.lastFrameTime = performance.now();
    
    this.metrics = {
      fps: 0,
      frameTime: 0,
      averageFrameTime: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0,
      entities: 0,
      components: 0,
      systems: 0
    };
  }

  /**
   * Get performance summary
   */
  getSummary(): string {
    const mem = this.metrics.memoryUsage / 1024 / 1024;
    return `FPS: ${this.metrics.fps.toFixed(1)} | Frame: ${this.metrics.frameTime.toFixed(2)}ms | Avg: ${this.metrics.averageFrameTime.toFixed(2)}ms | Mem: ${mem.toFixed(2)}MB | Draw Calls: ${this.metrics.drawCalls} | Entities: ${this.metrics.entities}`;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `PerformanceMonitor | ${this.getSummary()} | Warnings: ${this.warnings.length}`;
  }

  /**
   * Add a performance warning
   */
  private addWarning(
    type: PerformanceWarning['type'],
    message: string,
    value: number,
    threshold: number
  ): void {
    // Don't add duplicate warnings within 1 second
    const now = Date.now();
    const recentWarning = this.warnings.find(
      w => w.type === type && now - w.timestamp < 1000
    );
    
    if (recentWarning) return;
    
    const warning: PerformanceWarning = {
      type,
      message,
      timestamp: now,
      value,
      threshold
    };
    
    this.warnings.push(warning);
    
    // Limit warnings
    if (this.warnings.length > this.maxWarnings) {
      this.warnings.shift();
    }
    
    // Emit warning event
    this.eventEmitter.emit('performance:warning', warning);
    
    console.warn(`[PerformanceMonitor] ${message}`);
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      current: this.metrics,
      history: this.metricsHistory,
      warnings: this.warnings,
      thresholds: this.thresholds,
      frameCount: this.frameCount
    }, null, 2);
  }
}
