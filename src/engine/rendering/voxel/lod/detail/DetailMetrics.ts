/**
 * Detail Metrics
 * 
 * Tracks quality metrics for detail levels.
 */

export interface QualityMetrics {
  visualQuality: number;      // 0-1
  performance: number;         // 0-1
  memoryEfficiency: number;    // 0-1
  overallScore: number;        // 0-1
}

export class DetailMetrics {
  calculateQuality(
    triangleCount: number,
    textureResolution: number,
    features: { normalMapping: boolean; ao: boolean; shadows: boolean }
  ): QualityMetrics {
    const visual = (triangleCount / 100000) * 0.4 +
                   (textureResolution / 2048) * 0.3 +
                   (features.normalMapping ? 0.15 : 0) +
                   (features.ao ? 0.1 : 0) +
                   (features.shadows ? 0.05 : 0);
    
    const perf = 1 - (triangleCount / 500000);
    const memory = 1 - (textureResolution / 4096);
    
    return {
      visualQuality: Math.min(1, visual),
      performance: Math.max(0, perf),
      memoryEfficiency: Math.max(0, memory),
      overallScore: (visual + perf + memory) / 3
    };
  }
}
