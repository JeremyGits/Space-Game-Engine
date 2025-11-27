/**
 * Pipeline Profiler
 * 
 * Profiles the complete voxel pipeline performance.
 */

export interface PipelineMetrics {
  conversionTime: number;
  clusteringTime: number;
  meshingTime: number;
  uploadTime: number;
  totalTime: number;
}

export class PipelineProfiler {
  private metrics: PipelineMetrics = {
    conversionTime: 0,
    clusteringTime: 0,
    meshingTime: 0,
    uploadTime: 0,
    totalTime: 0
  };
  
  recordStage(stage: string, duration: number): void {
    switch (stage) {
      case 'conversion':
        this.metrics.conversionTime = duration;
        break;
      case 'clustering':
        this.metrics.clusteringTime = duration;
        break;
      case 'meshing':
        this.metrics.meshingTime = duration;
        break;
      case 'upload':
        this.metrics.uploadTime = duration;
        break;
    }
    
    this.metrics.totalTime = 
      this.metrics.conversionTime +
      this.metrics.clusteringTime +
      this.metrics.meshingTime +
      this.metrics.uploadTime;
  }
  
  getMetrics(): PipelineMetrics {
    return { ...this.metrics };
  }
  
  getSummary(): string {
    return `Pipeline: ${this.metrics.totalTime.toFixed(0)}ms (Conv: ${this.metrics.conversionTime.toFixed(0)}ms, Cluster: ${this.metrics.clusteringTime.toFixed(0)}ms, Mesh: ${this.metrics.meshingTime.toFixed(0)}ms, Upload: ${this.metrics.uploadTime.toFixed(0)}ms)`;
  }
}
