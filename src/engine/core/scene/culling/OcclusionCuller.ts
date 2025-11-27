/**
 * OcclusionCuller
 * 
 * Performs occlusion culling to hide objects blocked by other objects.
 * Uses a simplified approach suitable for real-time applications.
 */

import { Vector3 } from '../../../../utils/math/Vector3';
import { AABB } from './FrustumCuller';

/**
 * Occluder object (blocks visibility)
 */
export interface Occluder {
  id: string;
  bounds: AABB;
  position: Vector3;
  isStatic: boolean; // Static occluders can be cached
}

/**
 * Occludee object (can be occluded)
 */
export interface Occludee {
  id: string;
  bounds: AABB;
  position: Vector3;
  testPoint?: Vector3; // Optional specific point to test
}

/**
 * Occlusion test result
 */
export interface OcclusionResult {
  occluded: boolean;
  occludedBy?: string[]; // IDs of occluders blocking this object
  visibilityFactor: number; // 0 = fully occluded, 1 = fully visible
}

export class OcclusionCuller {
  private occluders: Map<string, Occluder> = new Map();
  private occlusionCache: Map<string, OcclusionResult> = new Map();
  private cameraPosition: Vector3 = new Vector3(0, 0, 0);
  private cameraDirection: Vector3 = new Vector3(0, 0, -1);
  private enabled: boolean = true;
  private cacheEnabled: boolean = true;
  private testCount: number = 0;
  private occludedCount: number = 0;

  /**
   * Enable/disable occlusion culling
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.occlusionCache.clear();
    }
  }

  /**
   * Enable/disable result caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.occlusionCache.clear();
    }
  }

  /**
   * Update camera position and direction
   */
  updateCamera(position: Vector3, direction: Vector3): void {
    this.cameraPosition.copy(position);
    this.cameraDirection.copy(direction).normalize();
    
    // Clear cache when camera moves significantly
    if (!this.cacheEnabled) {
      this.occlusionCache.clear();
    }
  }

  /**
   * Register an occluder
   */
  registerOccluder(occluder: Occluder): void {
    this.occluders.set(occluder.id, occluder);
    this.occlusionCache.clear(); // Clear cache when occluders change
  }

  /**
   * Unregister an occluder
   */
  unregisterOccluder(id: string): void {
    this.occluders.delete(id);
    this.occlusionCache.clear();
  }

  /**
   * Test if an object is occluded
   */
  testOcclusion(occludee: Occludee): OcclusionResult {
    if (!this.enabled) {
      return { occluded: false, visibilityFactor: 1.0 };
    }

    this.testCount++;

    // Check cache
    if (this.cacheEnabled && this.occlusionCache.has(occludee.id)) {
      return this.occlusionCache.get(occludee.id)!;
    }

    // Perform occlusion test
    const result = this.performOcclusionTest(occludee);

    // Cache result
    if (this.cacheEnabled) {
      this.occlusionCache.set(occludee.id, result);
    }

    if (result.occluded) {
      this.occludedCount++;
    }

    return result;
  }

  /**
   * Perform actual occlusion test
   */
  private performOcclusionTest(occludee: Occludee): OcclusionResult {
    const testPoint = occludee.testPoint || this.getAABBCenter(occludee.bounds);
    const occludedBy: string[] = [];
    let visibilityFactor = 1.0;

    // Get distance from camera to occludee
    const occludeeDistance = this.cameraPosition.distanceTo(testPoint);

    // Test against all occluders
    for (const occluder of this.occluders.values()) {
      // Skip if occluder is behind occludee
      const occluderDistance = this.cameraPosition.distanceTo(occluder.position);
      if (occluderDistance >= occludeeDistance) {
        continue;
      }

      // Check if occluder blocks line of sight
      if (this.testLineOfSight(testPoint, occluder)) {
        occludedBy.push(occluder.id);
        visibilityFactor *= 0.5; // Reduce visibility for each occluder
      }
    }

    return {
      occluded: occludedBy.length > 0 && visibilityFactor < 0.3,
      occludedBy: occludedBy.length > 0 ? occludedBy : undefined,
      visibilityFactor: Math.max(0, visibilityFactor)
    };
  }

  /**
   * Test if an occluder blocks line of sight to a point
   */
  private testLineOfSight(point: Vector3, occluder: Occluder): boolean {
    // Simple ray-AABB intersection test
    const direction = point.clone().sub(this.cameraPosition).normalize();
    return this.rayAABBIntersection(this.cameraPosition, direction, occluder.bounds);
  }

  /**
   * Ray-AABB intersection test
   */
  private rayAABBIntersection(origin: Vector3, direction: Vector3, aabb: AABB): boolean {
    const invDir = new Vector3(
      1 / direction.x,
      1 / direction.y,
      1 / direction.z
    );

    const t1 = (aabb.min.x - origin.x) * invDir.x;
    const t2 = (aabb.max.x - origin.x) * invDir.x;
    const t3 = (aabb.min.y - origin.y) * invDir.y;
    const t4 = (aabb.max.y - origin.y) * invDir.y;
    const t5 = (aabb.min.z - origin.z) * invDir.z;
    const t6 = (aabb.max.z - origin.z) * invDir.z;

    const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
    const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

    // Ray intersects AABB if tmax >= tmin and tmax >= 0
    return tmax >= tmin && tmax >= 0;
  }

  /**
   * Get center of AABB
   */
  private getAABBCenter(aabb: AABB): Vector3 {
    return new Vector3(
      (aabb.min.x + aabb.max.x) * 0.5,
      (aabb.min.y + aabb.max.y) * 0.5,
      (aabb.min.z + aabb.max.z) * 0.5
    );
  }

  /**
   * Batch test multiple objects
   */
  testMultiple(occludees: Occludee[]): Map<string, OcclusionResult> {
    const results = new Map<string, OcclusionResult>();

    for (const occludee of occludees) {
      results.set(occludee.id, this.testOcclusion(occludee));
    }

    return results;
  }

  /**
   * Get all occluded object IDs
   */
  getOccludedObjects(): string[] {
    const occluded: string[] = [];

    for (const [id, result] of this.occlusionCache.entries()) {
      if (result.occluded) {
        occluded.push(id);
      }
    }

    return occluded;
  }

  /**
   * Clear occlusion cache
   */
  clearCache(): void {
    this.occlusionCache.clear();
  }

  /**
   * Clear all occluders
   */
  clearOccluders(): void {
    this.occluders.clear();
    this.occlusionCache.clear();
  }

  /**
   * Get statistics
   */
  getStats(): {
    occluderCount: number;
    testsPerformed: number;
    objectsOccluded: number;
    cacheSize: number;
    occlusionRate: number;
  } {
    return {
      occluderCount: this.occluders.size,
      testsPerformed: this.testCount,
      objectsOccluded: this.occludedCount,
      cacheSize: this.occlusionCache.size,
      occlusionRate: this.testCount > 0 ? (this.occludedCount / this.testCount) * 100 : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.testCount = 0;
    this.occludedCount = 0;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `OcclusionCuller | Occluders: ${stats.occluderCount}, Occluded: ${stats.objectsOccluded}/${stats.testsPerformed} (${stats.occlusionRate.toFixed(1)}%)`;
  }

  /**
   * Create occluder from AABB
   */
  static createOccluder(
    id: string,
    bounds: AABB,
    isStatic: boolean = true
  ): Occluder {
    const position = new Vector3(
      (bounds.min.x + bounds.max.x) * 0.5,
      (bounds.min.y + bounds.max.y) * 0.5,
      (bounds.min.z + bounds.max.z) * 0.5
    );

    return {
      id,
      bounds,
      position,
      isStatic
    };
  }

  /**
   * Create occludee from AABB
   */
  static createOccludee(
    id: string,
    bounds: AABB,
    testPoint?: Vector3
  ): Occludee {
    const position = new Vector3(
      (bounds.min.x + bounds.max.x) * 0.5,
      (bounds.min.y + bounds.max.y) * 0.5,
      (bounds.min.z + bounds.max.z) * 0.5
    );

    return {
      id,
      bounds,
      position,
      testPoint
    };
  }
}
