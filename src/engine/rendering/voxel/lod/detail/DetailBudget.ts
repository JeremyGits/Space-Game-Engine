/**
 * Detail Budget
 * 
 * Manages performance budget for detail levels.
 */

export interface BudgetConfig {
  targetFPS: number;
  maxVoxels: number;
  maxTriangles: number;
  maxMemoryMB: number;
}

export class DetailBudget {
  private config: BudgetConfig;
  
  constructor(config: Partial<BudgetConfig> = {}) {
    this.config = {
      targetFPS: config.targetFPS ?? 60,
      maxVoxels: config.maxVoxels ?? 100000,
      maxTriangles: config.maxTriangles ?? 500000,
      maxMemoryMB: config.maxMemoryMB ?? 200
    };
  }
  
  isWithinBudget(voxels: number, triangles: number, memoryMB: number): boolean {
    return voxels <= this.config.maxVoxels &&
           triangles <= this.config.maxTriangles &&
           memoryMB <= this.config.maxMemoryMB;
  }
  
  getUtilization(voxels: number, triangles: number, memoryMB: number) {
    return {
      voxels: voxels / this.config.maxVoxels,
      triangles: triangles / this.config.maxTriangles,
      memory: memoryMB / this.config.maxMemoryMB
    };
  }
}
