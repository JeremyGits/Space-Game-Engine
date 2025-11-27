/**
 * Pipeline Optimizer
 * 
 * Optimizes the voxel rendering pipeline.
 */

export class PipelineOptimizer {
  optimizeVoxelCount(targetCount: number, currentCount: number): number {
    if (currentCount <= targetCount) return currentCount;
    
    // Calculate reduction ratio
    const ratio = targetCount / currentCount;
    return Math.floor(currentCount * ratio);
  }
  
  suggestResolution(targetVoxels: number): number {
    // Suggest image resolution based on target voxel count
    const sideLength = Math.sqrt(targetVoxels);
    const resolutions = [64, 128, 256, 512, 1024];
    
    for (const res of resolutions) {
      if (res >= sideLength) return res;
    }
    
    return 1024;
  }
}
