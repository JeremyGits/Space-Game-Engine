/**
 * Detail Level
 * 
 * Defines detail levels for voxel rendering.
 * Maps LOD levels to actual detail settings.
 */

/**
 * Detail level configuration
 */
export interface DetailLevelConfig {
  /** LOD level (0-7) */
  level: number;
  
  /** Voxel size multiplier */
  sizeMultiplier: number;
  
  /** Mesh resolution */
  meshResolution: number;
  
  /** Texture resolution */
  textureResolution: number;
  
  /** Shadow quality */
  shadowQuality: 'none' | 'low' | 'medium' | 'high' | 'ultra';
  
  /** Enable normal mapping */
  normalMapping: boolean;
  
  /** Enable AO */
  ambientOcclusion: boolean;
}

/**
 * Detail level manager
 */
export class DetailLevel {
  private levels: Map<number, DetailLevelConfig> = new Map();
  
  constructor() {
    this.initializeDefaultLevels();
  }
  
  /**
   * Initialize default detail levels
   */
  private initializeDefaultLevels(): void {
    // LOD 0 - Ultra (closest)
    this.levels.set(0, {
      level: 0,
      sizeMultiplier: 1.0,
      meshResolution: 256,
      textureResolution: 2048,
      shadowQuality: 'ultra',
      normalMapping: true,
      ambientOcclusion: true
    });
    
    // LOD 1 - High
    this.levels.set(1, {
      level: 1,
      sizeMultiplier: 1.0,
      meshResolution: 128,
      textureResolution: 1024,
      shadowQuality: 'high',
      normalMapping: true,
      ambientOcclusion: true
    });
    
    // LOD 2 - Medium-High
    this.levels.set(2, {
      level: 2,
      sizeMultiplier: 1.5,
      meshResolution: 64,
      textureResolution: 512,
      shadowQuality: 'medium',
      normalMapping: true,
      ambientOcclusion: false
    });
    
    // LOD 3 - Medium
    this.levels.set(3, {
      level: 3,
      sizeMultiplier: 2.0,
      meshResolution: 32,
      textureResolution: 256,
      shadowQuality: 'medium',
      normalMapping: false,
      ambientOcclusion: false
    });
    
    // LOD 4 - Medium-Low
    this.levels.set(4, {
      level: 4,
      sizeMultiplier: 3.0,
      meshResolution: 16,
      textureResolution: 128,
      shadowQuality: 'low',
      normalMapping: false,
      ambientOcclusion: false
    });
    
    // LOD 5 - Low
    this.levels.set(5, {
      level: 5,
      sizeMultiplier: 4.0,
      meshResolution: 8,
      textureResolution: 64,
      shadowQuality: 'low',
      normalMapping: false,
      ambientOcclusion: false
    });
    
    // LOD 6 - Very Low
    this.levels.set(6, {
      level: 6,
      sizeMultiplier: 6.0,
      meshResolution: 4,
      textureResolution: 32,
      shadowQuality: 'none',
      normalMapping: false,
      ambientOcclusion: false
    });
    
    // LOD 7 - Minimal (farthest)
    this.levels.set(7, {
      level: 7,
      sizeMultiplier: 8.0,
      meshResolution: 2,
      textureResolution: 16,
      shadowQuality: 'none',
      normalMapping: false,
      ambientOcclusion: false
    });
  }
  
  /**
   * Get detail level configuration
   */
  getLevel(lod: number): DetailLevelConfig {
    return this.levels.get(lod) || this.levels.get(7)!;
  }
  
  /**
   * Set custom detail level
   */
  setLevel(lod: number, config: DetailLevelConfig): void {
    this.levels.set(lod, config);
  }
  
  /**
   * Get all levels
   */
  getAllLevels(): DetailLevelConfig[] {
    return Array.from(this.levels.values()).sort((a, b) => a.level - b.level);
  }
}
