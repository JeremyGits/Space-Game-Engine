/**
 * DistanceCuller
 * 
 * Culls objects based on distance from camera.
 * Useful for large open worlds where distant objects can be safely hidden.
 */

import { Vector3 } from '../../../../utils/math/Vector3';

/**
 * Distance culling configuration
 */
export interface DistanceCullingConfig {
  maxDistance: number;        // Maximum render distance
  fadeDistance?: number;      // Distance to start fading (for smooth transitions)
  minDistance?: number;       // Minimum render distance (for very close objects)
  useSquaredDistance?: boolean; // Use squared distance for faster calculations
}

/**
 * Cullable object
 */
export interface CullableObject {
  id: string;
  position: Vector3;
  cullDistance?: number;  // Override max distance for this object
  important?: boolean;    // Never cull if true
}

export class DistanceCuller {
  private config: DistanceCullingConfig;
  private cameraPosition: Vector3 = new Vector3(0, 0, 0);
  private culledObjects: Set<string> = new Set();
  private visibleObjects: Set<string> = new Set();
  private fadeObjects: Map<string, number> = new Map(); // id -> fade factor (0-1)

  constructor(config: DistanceCullingConfig) {
    this.config = {
      useSquaredDistance: true,
      fadeDistance: config.maxDistance * 0.9,
      minDistance: 0,
      ...config
    };
  }

  /**
   * Update camera position
   */
  updateCameraPosition(position: Vector3): void {
    this.cameraPosition.copy(position);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DistanceCullingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Test if an object should be culled
   */
  shouldCull(object: CullableObject): boolean {
    // Never cull important objects
    if (object.important) {
      return false;
    }

    const maxDist = object.cullDistance || this.config.maxDistance;
    const distance = this.getDistance(object.position);

    // Check minimum distance
    if (this.config.minDistance && distance < this.config.minDistance) {
      return true;
    }

    // Check maximum distance
    return distance > maxDist;
  }

  /**
   * Get fade factor for an object (0 = fully culled, 1 = fully visible)
   */
  getFadeFactor(object: CullableObject): number {
    if (object.important) {
      return 1.0;
    }

    const maxDist = object.cullDistance || this.config.maxDistance;
    const fadeDist = this.config.fadeDistance || maxDist * 0.9;
    const distance = this.getDistance(object.position);

    if (distance <= fadeDist) {
      return 1.0; // Fully visible
    } else if (distance >= maxDist) {
      return 0.0; // Fully culled
    } else {
      // Linear fade between fadeDistance and maxDistance
      return 1.0 - (distance - fadeDist) / (maxDist - fadeDist);
    }
  }

  /**
   * Update culling for multiple objects
   */
  updateObjects(objects: CullableObject[]): void {
    this.culledObjects.clear();
    this.visibleObjects.clear();
    this.fadeObjects.clear();

    for (const object of objects) {
      if (this.shouldCull(object)) {
        this.culledObjects.add(object.id);
      } else {
        this.visibleObjects.add(object.id);
        
        // Calculate fade factor if in fade range
        const fadeFactor = this.getFadeFactor(object);
        if (fadeFactor < 1.0) {
          this.fadeObjects.set(object.id, fadeFactor);
        }
      }
    }
  }

  /**
   * Check if object is culled
   */
  isCulled(id: string): boolean {
    return this.culledObjects.has(id);
  }

  /**
   * Check if object is visible
   */
  isVisible(id: string): boolean {
    return this.visibleObjects.has(id);
  }

  /**
   * Get fade factor for object
   */
  getObjectFadeFactor(id: string): number {
    return this.fadeObjects.get(id) || 1.0;
  }

  /**
   * Get distance to camera (respects useSquaredDistance config)
   */
  private getDistance(position: Vector3): number {
    if (this.config.useSquaredDistance) {
      return this.cameraPosition.distanceToSquared(position);
    }
    return this.cameraPosition.distanceTo(position);
  }

  /**
   * Get actual distance to camera (always returns real distance)
   */
  getActualDistance(position: Vector3): number {
    return this.cameraPosition.distanceTo(position);
  }

  /**
   * Get all culled object IDs
   */
  getCulledObjects(): string[] {
    return Array.from(this.culledObjects);
  }

  /**
   * Get all visible object IDs
   */
  getVisibleObjects(): string[] {
    return Array.from(this.visibleObjects);
  }

  /**
   * Get all fading object IDs with their fade factors
   */
  getFadingObjects(): Map<string, number> {
    return new Map(this.fadeObjects);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalTested: number;
    culled: number;
    visible: number;
    fading: number;
    cullRate: number;
  } {
    const total = this.culledObjects.size + this.visibleObjects.size;
    
    return {
      totalTested: total,
      culled: this.culledObjects.size,
      visible: this.visibleObjects.size,
      fading: this.fadeObjects.size,
      cullRate: total > 0 ? (this.culledObjects.size / total) * 100 : 0
    };
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.culledObjects.clear();
    this.visibleObjects.clear();
    this.fadeObjects.clear();
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `DistanceCuller | Visible: ${stats.visible}, Culled: ${stats.culled}, Fading: ${stats.fading}`;
  }

  /**
   * Create distance rings for visualization
   */
  getDistanceRings(ringCount: number = 5): Array<{ distance: number; color: string }> {
    const rings: Array<{ distance: number; color: string }> = [];
    const maxDist = this.config.maxDistance;
    const fadeDist = this.config.fadeDistance || maxDist * 0.9;

    for (let i = 1; i <= ringCount; i++) {
      const distance = (maxDist / ringCount) * i;
      let color = '#00ff00'; // Green for visible

      if (distance > fadeDist) {
        color = '#ffff00'; // Yellow for fade zone
      }
      if (distance >= maxDist) {
        color = '#ff0000'; // Red for culled
      }

      rings.push({ distance, color });
    }

    return rings;
  }

  /**
   * Get configuration
   */
  getConfig(): DistanceCullingConfig {
    return { ...this.config };
  }

  /**
   * Set maximum distance
   */
  setMaxDistance(distance: number): void {
    this.config.maxDistance = distance;
    if (this.config.fadeDistance) {
      this.config.fadeDistance = Math.min(this.config.fadeDistance, distance * 0.9);
    }
  }

  /**
   * Set fade distance
   */
  setFadeDistance(distance: number): void {
    this.config.fadeDistance = Math.min(distance, this.config.maxDistance);
  }
}
