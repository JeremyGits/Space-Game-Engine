/**
 * Voxel Performance Profiler
 * 
 * Monitors and tracks performance metrics for the voxel rendering system.
 * Helps identify bottlenecks and optimize voxel operations.
 */

export interface VoxelPerformanceMetrics {
  // Voxel counts
  totalVoxels: number;
  visibleVoxels: number;
  culledVoxels: number;
  
  // Octree metrics
  octreeNodes: number;
  octreeDepth: number;
  octreeTraversalTime: number;
  
  // Meshing metrics
  trianglesGenerated: number;
  verticesGenerated: number;
  meshingTime: number;
  greedyMeshReduction: number; // Percentage
  
  // Clustering metrics
  clustersCreated: number;
  averageClusterSize: number;
  clusteringTime: number;
  
  // GPU metrics
  gpuMemoryUsed: number;
  gpuComputeTime: number;
  drawCalls: number;
  
  // Frame timing
  totalFrameTime: number;
  voxelUpdateTime: number;
  voxelRenderTime: number;
  
  // Memory
  cpuMemoryUsed: number;
  cacheHitRate: number;
  
  // FPS impact
  fps: number;
  frameTimeImpact: number; // ms added by voxel system
}

export interface VoxelProfilerSample {
  timestamp: number;
  metrics: VoxelPerformanceMetrics;
}

export class VoxelProfiler {
  private enabled: boolean = false;
  private samples: VoxelProfilerSample[] = [];
  private maxSamples: number = 300; // 5 seconds at 60 FPS
  
  private currentMetrics: VoxelPerformanceMetrics;
  private startTimes: Map<string, number> = new Map();
  
  constructor() {
    this.currentMetrics = this.createEmptyMetrics();
  }
  
  /**
   * Enable profiling
   */
  enable(): void {
    this.enabled = true;
    this.samples = [];
    console.log('[VoxelProfiler] Profiling enabled');
  }
  
  /**
   * Disable profiling
   */
  disable(): void {
    this.enabled = false;
    console.log('[VoxelProfiler] Profiling disabled');
  }
  
  /**
   * Check if profiling is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Start timing a specific operation
   */
  startTimer(operation: string): void {
    if (!this.enabled) return;
    this.startTimes.set(operation, performance.now());
  }
  
  /**
   * End timing and record duration
   */
  endTimer(operation: string): number {
    if (!this.enabled) return 0;
    
    const startTime = this.startTimes.get(operation);
    if (startTime === undefined) {
      console.warn(`[VoxelProfiler] No start time for operation: ${operation}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.startTimes.delete(operation);
    
    return duration;
  }
  
  /**
   * Record voxel count metrics
   */
  recordVoxelCounts(total: number, visible: number, culled: number): void {
    if (!this.enabled) return;
    
    this.currentMetrics.totalVoxels = total;
    this.currentMetrics.visibleVoxels = visible;
    this.currentMetrics.culledVoxels = culled;
  }
  
  /**
   * Record octree metrics
   */
  recordOctreeMetrics(nodes: number, depth: number, traversalTime: number): void {
    if (!this.enabled) return;
    
    this.currentMetrics.octreeNodes = nodes;
    this.currentMetrics.octreeDepth = depth;
    this.currentMetrics.octreeTraversalTime = traversalTime;
  }
  
  /**
   * Record meshing metrics
   */
  recordMeshingMetrics(
    triangles: number,
    vertices: number,
    meshingTime: number,
    reduction: number
  ): void {
    if (!this.enabled) return;
    
    this.currentMetrics.trianglesGenerated = triangles;
    this.currentMetrics.verticesGenerated = vertices;
    this.currentMetrics.meshingTime = meshingTime;
    this.currentMetrics.greedyMeshReduction = reduction;
  }
  
  /**
   * Record clustering metrics
   */
  recordClusteringMetrics(
    clusters: number,
    averageSize: number,
    clusteringTime: number
  ): void {
    if (!this.enabled) return;
    
    this.currentMetrics.clustersCreated = clusters;
    this.currentMetrics.averageClusterSize = averageSize;
    this.currentMetrics.clusteringTime = clusteringTime;
  }
  
  /**
   * Record GPU metrics
   */
  recordGPUMetrics(memoryUsed: number, computeTime: number, drawCalls: number): void {
    if (!this.enabled) return;
    
    this.currentMetrics.gpuMemoryUsed = memoryUsed;
    this.currentMetrics.gpuComputeTime = computeTime;
    this.currentMetrics.drawCalls = drawCalls;
  }
  
  /**
   * Record frame timing
   */
  recordFrameTiming(
    totalTime: number,
    updateTime: number,
    renderTime: number,
    fps: number
  ): void {
    if (!this.enabled) return;
    
    this.currentMetrics.totalFrameTime = totalTime;
    this.currentMetrics.voxelUpdateTime = updateTime;
    this.currentMetrics.voxelRenderTime = renderTime;
    this.currentMetrics.fps = fps;
    this.currentMetrics.frameTimeImpact = updateTime + renderTime;
  }
  
  /**
   * Record memory usage
   */
  recordMemoryUsage(cpuMemory: number, cacheHitRate: number): void {
    if (!this.enabled) return;
    
    this.currentMetrics.cpuMemoryUsed = cpuMemory;
    this.currentMetrics.cacheHitRate = cacheHitRate;
  }
  
  /**
   * Complete current frame and store sample
   */
  endFrame(): void {
    if (!this.enabled) return;
    
    const sample: VoxelProfilerSample = {
      timestamp: performance.now(),
      metrics: { ...this.currentMetrics }
    };
    
    this.samples.push(sample);
    
    // Limit sample count
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    
    // Reset for next frame
    this.currentMetrics = this.createEmptyMetrics();
  }
  
  /**
   * Get current metrics
   */
  getCurrentMetrics(): VoxelPerformanceMetrics {
    return { ...this.currentMetrics };
  }
  
  /**
   * Get average metrics over last N samples
   */
  getAverageMetrics(sampleCount: number = 60): VoxelPerformanceMetrics {
    if (this.samples.length === 0) {
      return this.createEmptyMetrics();
    }
    
    const count = Math.min(sampleCount, this.samples.length);
    const recentSamples = this.samples.slice(-count);
    
    const avg = this.createEmptyMetrics();
    
    for (const sample of recentSamples) {
      const m = sample.metrics;
      avg.totalVoxels += m.totalVoxels;
      avg.visibleVoxels += m.visibleVoxels;
      avg.culledVoxels += m.culledVoxels;
      avg.octreeNodes += m.octreeNodes;
      avg.octreeDepth += m.octreeDepth;
      avg.octreeTraversalTime += m.octreeTraversalTime;
      avg.trianglesGenerated += m.trianglesGenerated;
      avg.verticesGenerated += m.verticesGenerated;
      avg.meshingTime += m.meshingTime;
      avg.greedyMeshReduction += m.greedyMeshReduction;
      avg.clustersCreated += m.clustersCreated;
      avg.averageClusterSize += m.averageClusterSize;
      avg.clusteringTime += m.clusteringTime;
      avg.gpuMemoryUsed += m.gpuMemoryUsed;
      avg.gpuComputeTime += m.gpuComputeTime;
      avg.drawCalls += m.drawCalls;
      avg.totalFrameTime += m.totalFrameTime;
      avg.voxelUpdateTime += m.voxelUpdateTime;
      avg.voxelRenderTime += m.voxelRenderTime;
      avg.cpuMemoryUsed += m.cpuMemoryUsed;
      avg.cacheHitRate += m.cacheHitRate;
      avg.fps += m.fps;
      avg.frameTimeImpact += m.frameTimeImpact;
    }
    
    // Divide by count to get averages
    const divisor = count;
    for (const key in avg) {
      (avg as any)[key] /= divisor;
    }
    
    return avg;
  }
  
  /**
   * Get performance summary
   */
  getSummary(): string {
    const avg = this.getAverageMetrics();
    
    return `
=== VOXEL PERFORMANCE SUMMARY ===

Voxels:
  Total: ${avg.totalVoxels.toFixed(0)}
  Visible: ${avg.visibleVoxels.toFixed(0)}
  Culled: ${avg.culledVoxels.toFixed(0)} (${((avg.culledVoxels / avg.totalVoxels) * 100).toFixed(1)}%)

Octree:
  Nodes: ${avg.octreeNodes.toFixed(0)}
  Depth: ${avg.octreeDepth.toFixed(0)}
  Traversal: ${avg.octreeTraversalTime.toFixed(2)}ms

Meshing:
  Triangles: ${avg.trianglesGenerated.toFixed(0)}
  Vertices: ${avg.verticesGenerated.toFixed(0)}
  Time: ${avg.meshingTime.toFixed(2)}ms
  Reduction: ${avg.greedyMeshReduction.toFixed(1)}%

Clustering:
  Clusters: ${avg.clustersCreated.toFixed(0)}
  Avg Size: ${avg.averageClusterSize.toFixed(1)} voxels
  Time: ${avg.clusteringTime.toFixed(2)}ms

GPU:
  Memory: ${(avg.gpuMemoryUsed / 1024 / 1024).toFixed(1)}MB
  Compute: ${avg.gpuComputeTime.toFixed(2)}ms
  Draw Calls: ${avg.drawCalls.toFixed(0)}

Performance:
  FPS: ${avg.fps.toFixed(1)}
  Frame Time: ${avg.totalFrameTime.toFixed(2)}ms
  Voxel Impact: ${avg.frameTimeImpact.toFixed(2)}ms (${((avg.frameTimeImpact / avg.totalFrameTime) * 100).toFixed(1)}%)
  
Memory:
  CPU: ${(avg.cpuMemoryUsed / 1024 / 1024).toFixed(1)}MB
  Cache Hit Rate: ${(avg.cacheHitRate * 100).toFixed(1)}%

================================
    `.trim();
  }
  
  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      samples: this.samples,
      average: this.getAverageMetrics(),
      timestamp: Date.now()
    }, null, 2);
  }
  
  /**
   * Clear all samples
   */
  clear(): void {
    this.samples = [];
    this.currentMetrics = this.createEmptyMetrics();
    console.log('[VoxelProfiler] Samples cleared');
  }
  
  /**
   * Get bottleneck analysis
   */
  getBottlenecks(): string[] {
    const avg = this.getAverageMetrics();
    const bottlenecks: string[] = [];
    
    // Check for high frame time impact
    if (avg.frameTimeImpact > 10) {
      bottlenecks.push(`High frame time impact: ${avg.frameTimeImpact.toFixed(2)}ms`);
    }
    
    // Check for low FPS
    if (avg.fps < 30) {
      bottlenecks.push(`Low FPS: ${avg.fps.toFixed(1)}`);
    }
    
    // Check for high memory usage
    if (avg.cpuMemoryUsed > 512 * 1024 * 1024) {
      bottlenecks.push(`High CPU memory: ${(avg.cpuMemoryUsed / 1024 / 1024).toFixed(1)}MB`);
    }
    
    if (avg.gpuMemoryUsed > 512 * 1024 * 1024) {
      bottlenecks.push(`High GPU memory: ${(avg.gpuMemoryUsed / 1024 / 1024).toFixed(1)}MB`);
    }
    
    // Check for slow operations
    if (avg.octreeTraversalTime > 3) {
      bottlenecks.push(`Slow octree traversal: ${avg.octreeTraversalTime.toFixed(2)}ms`);
    }
    
    if (avg.meshingTime > 5) {
      bottlenecks.push(`Slow meshing: ${avg.meshingTime.toFixed(2)}ms`);
    }
    
    if (avg.clusteringTime > 3) {
      bottlenecks.push(`Slow clustering: ${avg.clusteringTime.toFixed(2)}ms`);
    }
    
    // Check for low cache hit rate
    if (avg.cacheHitRate < 0.7) {
      bottlenecks.push(`Low cache hit rate: ${(avg.cacheHitRate * 100).toFixed(1)}%`);
    }
    
    // Check for high draw calls
    if (avg.drawCalls > 100) {
      bottlenecks.push(`High draw calls: ${avg.drawCalls.toFixed(0)}`);
    }
    
    return bottlenecks;
  }
  
  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): string[] {
    const bottlenecks = this.getBottlenecks();
    const suggestions: string[] = [];
    
    for (const bottleneck of bottlenecks) {
      if (bottleneck.includes('octree traversal')) {
        suggestions.push('Consider reducing octree depth or using GPU-accelerated traversal');
      }
      
      if (bottleneck.includes('meshing')) {
        suggestions.push('Enable greedy meshing or increase clustering threshold');
      }
      
      if (bottleneck.includes('clustering')) {
        suggestions.push('Increase clustering threshold or reduce voxel count');
      }
      
      if (bottleneck.includes('memory')) {
        suggestions.push('Enable compression or reduce voxel resolution');
      }
      
      if (bottleneck.includes('cache hit rate')) {
        suggestions.push('Increase cache size or improve spatial locality');
      }
      
      if (bottleneck.includes('draw calls')) {
        suggestions.push('Increase clustering or use instanced rendering');
      }
    }
    
    return suggestions;
  }
  
  /**
   * Log performance report to console
   */
  logReport(): void {
    console.log(this.getSummary());
    
    const bottlenecks = this.getBottlenecks();
    if (bottlenecks.length > 0) {
      console.warn('\n⚠️ BOTTLENECKS DETECTED:');
      bottlenecks.forEach(b => console.warn(`  - ${b}`));
      
      const suggestions = this.getOptimizationSuggestions();
      if (suggestions.length > 0) {
        console.info('\n💡 OPTIMIZATION SUGGESTIONS:');
        suggestions.forEach(s => console.info(`  - ${s}`));
      }
    } else {
      console.log('\n✅ No bottlenecks detected - performance is good!');
    }
  }
  
  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): VoxelPerformanceMetrics {
    return {
      totalVoxels: 0,
      visibleVoxels: 0,
      culledVoxels: 0,
      octreeNodes: 0,
      octreeDepth: 0,
      octreeTraversalTime: 0,
      trianglesGenerated: 0,
      verticesGenerated: 0,
      meshingTime: 0,
      greedyMeshReduction: 0,
      clustersCreated: 0,
      averageClusterSize: 0,
      clusteringTime: 0,
      gpuMemoryUsed: 0,
      gpuComputeTime: 0,
      drawCalls: 0,
      totalFrameTime: 0,
      voxelUpdateTime: 0,
      voxelRenderTime: 0,
      cpuMemoryUsed: 0,
      cacheHitRate: 0,
      fps: 0,
      frameTimeImpact: 0
    };
  }
}

/**
 * Global voxel profiler instance
 */
export const voxelProfiler = new VoxelProfiler();
