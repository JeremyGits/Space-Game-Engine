/**
 * LODManager
 * 
 * Manages Level of Detail (LOD) for objects based on distance from camera.
 * Automatically switches between different detail levels to optimize performance.
 */

import { Vector3 } from '../../../../utils/math/Vector3';

/**
 * LOD level definition
 */
export interface LODLevel {
  distance: number;      // Maximum distance for this LOD level
  meshIndex: number;     // Index of mesh to use at this level
  screenCoverage?: number; // Optional: screen coverage percentage
}

/**
 * LOD object configuration
 */
export interface LODObject {
  id: string;
  position: Vector3;
  levels: LODLevel[];
  currentLevel: number;
  boundingRadius: number;
}

/**
 * LOD selection strategy
 */
export enum LODStrategy {
  DISTANCE = 'distance',           // Based on distance from camera
  SCREEN_COVERAGE = 'screen_coverage', // Based on screen space coverage
  HYBRID = 'hybrid'                // Combination of both
}

export class LODManager {
  private objects: Map<string, LODObject> = new Map();
  private cameraPosition: Vector3 = new Vector3(0, 0, 0);
  private strategy: LODStrategy = LODStrategy.DISTANCE;
  private lodBias: number = 1.0; // Multiplier for LOD distances
  private transitionCount: number = 0;
  private updateCount: number = 0;

  /**
   * Set LOD selection strategy
   */
  setStrategy(strategy: LODStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Set LOD bias (higher = use higher detail at greater distances)
   */
  setLODBias(bias: number): void {
    this.lodBias = Math.max(0.1, bias);
  }

  /**
   * Update camera position
   */
  updateCameraPosition(position: Vector3): void {
    this.cameraPosition.copy(position);
  }

  /**
   * Register an LOD object
   */
  registerObject(object: LODObject): void {
    // Sort levels by distance (ascending)
    object.levels.sort((a, b) => a.distance - b.distance);
    object.currentLevel = 0;
    this.objects.set(object.id, object);
  }

  /**
   * Unregister an LOD object
   */
  unregisterObject(id: string): void {
    this.objects.delete(id);
  }

  /**
   * Update all LOD objects
   */
  update(): void {
    this.updateCount++;
    this.transitionCount = 0;

    for (const object of this.objects.values()) {
      const newLevel = this.selectLODLevel(object);
      
      if (newLevel !== object.currentLevel) {
        object.currentLevel = newLevel;
        this.transitionCount++;
      }
    }
  }

  /**
   * Select appropriate LOD level for an object
   */
  private selectLODLevel(object: LODObject): number {
    switch (this.strategy) {
      case LODStrategy.DISTANCE:
        return this.selectByDistance(object);
      case LODStrategy.SCREEN_COVERAGE:
        return this.selectByScreenCoverage(object);
      case LODStrategy.HYBRID:
        return this.selectHybrid(object);
      default:
        return this.selectByDistance(object);
    }
  }

  /**
   * Select LOD by distance
   */
  private selectByDistance(object: LODObject): number {
    const distance = this.cameraPosition.distanceTo(object.position);
    const adjustedDistance = distance / this.lodBias;

    // Find appropriate LOD level
    for (let i = 0; i < object.levels.length; i++) {
      if (adjustedDistance <= object.levels[i].distance) {
        return i;
      }
    }

    // Use lowest detail if beyond all distances
    return object.levels.length - 1;
  }

  /**
   * Select LOD by screen coverage (simplified)
   */
  private selectByScreenCoverage(object: LODObject): number {
    const distance = this.cameraPosition.distanceTo(object.position);
    
    // Estimate screen coverage based on distance and bounding radius
    // This is a simplified calculation
    const screenCoverage = (object.boundingRadius / distance) * 100;

    // Find appropriate LOD level based on screen coverage
    for (let i = 0; i < object.levels.length; i++) {
      const level = object.levels[i];
      if (level.screenCoverage && screenCoverage >= level.screenCoverage) {
        return i;
      }
    }

    return object.levels.length - 1;
  }

  /**
   * Select LOD using hybrid approach
   */
  private selectHybrid(object: LODObject): number {
    const distanceLevel = this.selectByDistance(object);
    const coverageLevel = this.selectByScreenCoverage(object);
    
    // Use the higher detail level (lower index)
    return Math.min(distanceLevel, coverageLevel);
  }

  /**
   * Get current LOD level for an object
   */
  getCurrentLevel(id: string): number {
    const object = this.objects.get(id);
    return object ? object.currentLevel : -1;
  }

  /**
   * Get current mesh index for an object
   */
  getCurrentMeshIndex(id: string): number {
    const object = this.objects.get(id);
    if (!object || object.currentLevel >= object.levels.length) {
      return -1;
    }
    return object.levels[object.currentLevel].meshIndex;
  }

  /**
   * Force LOD level for an object
   */
  forceLODLevel(id: string, level: number): void {
    const object = this.objects.get(id);
    if (object && level >= 0 && level < object.levels.length) {
      object.currentLevel = level;
    }
  }

  /**
   * Get distance to camera for an object
   */
  getDistanceToCamera(id: string): number {
    const object = this.objects.get(id);
    if (!object) return Infinity;
    return this.cameraPosition.distanceTo(object.position);
  }

  /**
   * Update object position
   */
  updateObjectPosition(id: string, position: Vector3): void {
    const object = this.objects.get(id);
    if (object) {
      object.position.copy(position);
    }
  }

  /**
   * Get all objects at a specific LOD level
   */
  getObjectsAtLevel(level: number): string[] {
    const result: string[] = [];
    
    for (const [id, object] of this.objects.entries()) {
      if (object.currentLevel === level) {
        result.push(id);
      }
    }
    
    return result;
  }

  /**
   * Get LOD distribution statistics
   */
  getLODDistribution(): Map<number, number> {
    const distribution = new Map<number, number>();
    
    for (const object of this.objects.values()) {
      const count = distribution.get(object.currentLevel) || 0;
      distribution.set(object.currentLevel, count + 1);
    }
    
    return distribution;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalObjects: number;
    transitionsThisFrame: number;
    updateCount: number;
    lodDistribution: Map<number, number>;
    averageDistance: number;
  } {
    let totalDistance = 0;
    for (const object of this.objects.values()) {
      totalDistance += this.cameraPosition.distanceTo(object.position);
    }

    return {
      totalObjects: this.objects.size,
      transitionsThisFrame: this.transitionCount,
      updateCount: this.updateCount,
      lodDistribution: this.getLODDistribution(),
      averageDistance: this.objects.size > 0 ? totalDistance / this.objects.size : 0
    };
  }

  /**
   * Clear all objects
   */
  clear(): void {
    this.objects.clear();
    this.transitionCount = 0;
    this.updateCount = 0;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `LODManager | Objects: ${stats.totalObjects}, Transitions: ${stats.transitionsThisFrame}, Strategy: ${this.strategy}`;
  }

  /**
   * Create default LOD levels
   */
  static createDefaultLevels(baseDistance: number = 50): LODLevel[] {
    return [
      { distance: baseDistance * 0.3, meshIndex: 0, screenCoverage: 10 },      // High detail
      { distance: baseDistance * 0.6, meshIndex: 1, screenCoverage: 5 },       // Medium detail
      { distance: baseDistance * 1.0, meshIndex: 2, screenCoverage: 2 },       // Low detail
      { distance: baseDistance * 2.0, meshIndex: 3, screenCoverage: 0.5 }      // Very low detail
    ];
  }

  /**
   * Calculate optimal LOD distances based on object size
   */
  static calculateLODDistances(
    objectRadius: number,
    targetScreenSizes: number[] = [0.2, 0.1, 0.05, 0.02]
  ): number[] {
    // Simplified calculation: distance = radius / targetScreenSize
    return targetScreenSizes.map(size => objectRadius / size);
  }

  /**
   * Create LOD object from configuration
   */
  static createLODObject(
    id: string,
    position: Vector3,
    boundingRadius: number,
    meshIndices: number[],
    distances?: number[]
  ): LODObject {
    const levels: LODLevel[] = [];
    const lodDistances = distances || this.calculateLODDistances(boundingRadius);

    for (let i = 0; i < meshIndices.length; i++) {
      levels.push({
        distance: lodDistances[i] || (i + 1) * 50,
        meshIndex: meshIndices[i]
      });
    }

    return {
      id,
      position: position.clone(),
      levels,
      currentLevel: 0,
      boundingRadius
    };
  }
}
