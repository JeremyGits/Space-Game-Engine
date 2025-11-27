/**
 * LOD Profiler
 * 
 * Profiles LOD system performance and provides analytics.
 */

/**
 * LOD metrics
 */
export interface LODMetrics {
  /** LOD calculations per frame */
  calculationsPerFrame: number;
  
  /** Average calculation time (ms) */
  avgCalculationTime: number;
  
  /** Cache hit rate */
  cacheHitRate: number;
  
  /** Active transitions */
  activeTransitions: number;
  
  /** Voxels per LOD level */
  voxelsPerLevel: Map<number, number>;
  
  /** Total voxels */
  totalVoxels: number;
}

/**
 * LOD profiler
 */
export class LODProfiler {
  private metrics: LODMetrics;
  private calculationTimes: number[] = [];
  private maxHistorySize: number = 100;
  
  constructor() {
    this.metrics = {
      calculationsPerFrame: 0,
      avgCalculationTime: 0,
      cacheHitRate: 0,
      activeTransitions: 0,
      voxelsPerLevel: new Map(),
      totalVoxels: 0
    };
  }
  
  /**
   * Record calculation
   */
  recordCalculation(timeMs: number): void {
    this.calculationTimes.push(timeMs);
    
    if (this.calculationTimes.length > this.maxHistorySize) {
      this.calculationTimes.shift();
    }
    
    this.metrics.calculationsPerFrame++;
  }
  
  /**
   * Update metrics
   */
  updateMetrics(
    cacheHitRate: number,
    activeTransitions: number,
    voxelsPerLevel: Map<number, number>
  ): void {
    this.metrics.cacheHitRate = cacheHitRate;
    this.metrics.activeTransitions = activeTransitions;
    this.metrics.voxelsPerLevel = new Map(voxelsPerLevel);
    
    // Calculate total voxels
    this.metrics.totalVoxels = 0;
    for (const count of voxelsPerLevel.values()) {
      this.metrics.totalVoxels += count;
    }
    
    // Calculate average calculation time
    if (this.calculationTimes.length > 0) {
      const sum = this.calculationTimes.reduce((acc, time) => acc + time, 0);
      this.metrics.avgCalculationTime = sum / this.calculationTimes.length;
    }
  }
  
  /**
   * Reset frame counters
   */
  resetFrame(): void {
    this.metrics.calculationsPerFrame = 0;
  }
  
  /**
   * Get metrics
   */
  getMetrics(): LODMetrics {
    return { ...this.metrics, voxelsPerLevel: new Map(this.metrics.voxelsPerLevel) };
  }
  
  /**
   * Get LOD distribution
   */
  getLODDistribution(): { level: number; count: number; percentage: number }[] {
    const distribution: { level: number; count: number; percentage: number }[] = [];
    
    for (const [level, count] of this.metrics.voxelsPerLevel) {
      distribution.push({
        level,
        count,
        percentage: this.metrics.totalVoxels > 0 ? (count / this.metrics.totalVoxels) * 100 : 0
      });
    }
    
    return distribution.sort((a, b) => a.level - b.level);
  }
  
  /**
   * Get performance summary
   */
  getPerformanceSummary(): string {
    const dist = this.getLODDistribution();
    
    let summary = '=== LOD Performance ===\n';
    summary += `Calculations/Frame: ${this.metrics.calculationsPerFrame}\n`;
    summary += `Avg Calc Time: ${this.metrics.avgCalculationTime.toFixed(2)}ms\n`;
    summary += `Cache Hit Rate: ${(this.metrics.cacheHitRate * 100).toFixed(1)}%\n`;
    summary += `Active Transitions: ${this.metrics.activeTransitions}\n`;
    summary += `Total Voxels: ${this.metrics.totalVoxels}\n\n`;
    summary += '=== LOD Distribution ===\n';
    
    for (const { level, count, percentage } of dist) {
      summary += `LOD ${level}: ${count} voxels (${percentage.toFixed(1)}%)\n`;
    }
    
    return summary;
  }
}
