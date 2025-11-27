/**
 * FrustumCuller
 * 
 * Performs frustum culling to determine which objects are visible to the camera.
 * Significantly improves rendering performance by skipping objects outside the view.
 */

import { Vector3 } from '../../../../utils/math/Vector3';

/**
 * Frustum plane representation
 */
interface FrustumPlane {
  normal: Vector3;
  distance: number;
}

/**
 * Bounding sphere for culling tests
 */
export interface BoundingSphere {
  center: Vector3;
  radius: number;
}

/**
 * Axis-aligned bounding box
 */
export interface AABB {
  min: Vector3;
  max: Vector3;
}

/**
 * Culling result
 */
export enum CullingResult {
  INSIDE = 0,      // Fully inside frustum
  INTERSECTING = 1, // Partially inside frustum
  OUTSIDE = 2       // Fully outside frustum
}

export class FrustumCuller {
  private planes: FrustumPlane[] = [];
  private culledCount: number = 0;
  private testedCount: number = 0;

  constructor() {
    // Initialize 6 frustum planes (near, far, left, right, top, bottom)
    for (let i = 0; i < 6; i++) {
      this.planes.push({
        normal: new Vector3(0, 0, 0),
        distance: 0
      });
    }
  }

  /**
   * Update frustum from view-projection matrix
   */
  updateFromMatrix(viewProjectionMatrix: Float32Array): void {
    const m = viewProjectionMatrix;

    // Extract frustum planes from view-projection matrix
    // Left plane
    this.planes[0].normal.set(m[3] + m[0], m[7] + m[4], m[11] + m[8]);
    this.planes[0].distance = m[15] + m[12];

    // Right plane
    this.planes[1].normal.set(m[3] - m[0], m[7] - m[4], m[11] - m[8]);
    this.planes[1].distance = m[15] - m[12];

    // Bottom plane
    this.planes[2].normal.set(m[3] + m[1], m[7] + m[5], m[11] + m[9]);
    this.planes[2].distance = m[15] + m[13];

    // Top plane
    this.planes[3].normal.set(m[3] - m[1], m[7] - m[5], m[11] - m[9]);
    this.planes[3].distance = m[15] - m[13];

    // Near plane
    this.planes[4].normal.set(m[3] + m[2], m[7] + m[6], m[11] + m[10]);
    this.planes[4].distance = m[15] + m[14];

    // Far plane
    this.planes[5].normal.set(m[3] - m[2], m[7] - m[6], m[11] - m[10]);
    this.planes[5].distance = m[15] - m[14];

    // Normalize planes
    for (const plane of this.planes) {
      const length = plane.normal.length();
      if (length > 0) {
        plane.normal.divideScalar(length);
        plane.distance /= length;
      }
    }

    // Reset statistics
    this.culledCount = 0;
    this.testedCount = 0;
  }

  /**
   * Test if a sphere is visible
   */
  testSphere(sphere: BoundingSphere): CullingResult {
    this.testedCount++;

    let result = CullingResult.INSIDE;

    for (const plane of this.planes) {
      const distance = plane.normal.dot(sphere.center) + plane.distance;

      if (distance < -sphere.radius) {
        // Completely outside
        this.culledCount++;
        return CullingResult.OUTSIDE;
      } else if (distance < sphere.radius) {
        // Intersecting
        result = CullingResult.INTERSECTING;
      }
    }

    return result;
  }

  /**
   * Test if an AABB is visible
   */
  testAABB(aabb: AABB): CullingResult {
    this.testedCount++;

    let result = CullingResult.INSIDE;

    for (const plane of this.planes) {
      // Get positive vertex (furthest point in direction of plane normal)
      const pVertex = new Vector3(
        plane.normal.x > 0 ? aabb.max.x : aabb.min.x,
        plane.normal.y > 0 ? aabb.max.y : aabb.min.y,
        plane.normal.z > 0 ? aabb.max.z : aabb.min.z
      );

      // Get negative vertex (closest point in direction of plane normal)
      const nVertex = new Vector3(
        plane.normal.x > 0 ? aabb.min.x : aabb.max.x,
        plane.normal.y > 0 ? aabb.min.y : aabb.max.y,
        plane.normal.z > 0 ? aabb.min.z : aabb.max.z
      );

      // Test positive vertex
      if (plane.normal.dot(pVertex) + plane.distance < 0) {
        // Completely outside
        this.culledCount++;
        return CullingResult.OUTSIDE;
      }

      // Test negative vertex
      if (plane.normal.dot(nVertex) + plane.distance < 0) {
        // Intersecting
        result = CullingResult.INTERSECTING;
      }
    }

    return result;
  }

  /**
   * Test if a point is visible
   */
  testPoint(point: Vector3): boolean {
    this.testedCount++;

    for (const plane of this.planes) {
      if (plane.normal.dot(point) + plane.distance < 0) {
        this.culledCount++;
        return false;
      }
    }

    return true;
  }

  /**
   * Batch test multiple spheres
   */
  testSpheres(spheres: BoundingSphere[]): boolean[] {
    const results: boolean[] = [];

    for (const sphere of spheres) {
      results.push(this.testSphere(sphere) !== CullingResult.OUTSIDE);
    }

    return results;
  }

  /**
   * Batch test multiple AABBs
   */
  testAABBs(aabbs: AABB[]): boolean[] {
    const results: boolean[] = [];

    for (const aabb of aabbs) {
      results.push(this.testAABB(aabb) !== CullingResult.OUTSIDE);
    }

    return results;
  }

  /**
   * Get frustum corners in world space
   */
  getCorners(inverseViewProjection: Float32Array): Vector3[] {
    const corners: Vector3[] = [];

    // NDC cube corners
    const ndcCorners = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], // Near plane
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]      // Far plane
    ];

    for (const ndc of ndcCorners) {
      // Transform from NDC to world space
      const x = ndc[0];
      const y = ndc[1];
      const z = ndc[2];
      const w = 1;

      const worldX = inverseViewProjection[0] * x + inverseViewProjection[4] * y + 
                     inverseViewProjection[8] * z + inverseViewProjection[12] * w;
      const worldY = inverseViewProjection[1] * x + inverseViewProjection[5] * y + 
                     inverseViewProjection[9] * z + inverseViewProjection[13] * w;
      const worldZ = inverseViewProjection[2] * x + inverseViewProjection[6] * y + 
                     inverseViewProjection[10] * z + inverseViewProjection[14] * w;
      const worldW = inverseViewProjection[3] * x + inverseViewProjection[7] * y + 
                     inverseViewProjection[11] * z + inverseViewProjection[15] * w;

      corners.push(new Vector3(worldX / worldW, worldY / worldW, worldZ / worldW));
    }

    return corners;
  }

  /**
   * Get culling statistics
   */
  getStats(): {
    tested: number;
    culled: number;
    visible: number;
    cullRate: number;
  } {
    return {
      tested: this.testedCount,
      culled: this.culledCount,
      visible: this.testedCount - this.culledCount,
      cullRate: this.testedCount > 0 ? (this.culledCount / this.testedCount) * 100 : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.culledCount = 0;
    this.testedCount = 0;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    const stats = this.getStats();
    return `FrustumCuller | Tested: ${stats.tested}, Culled: ${stats.culled} (${stats.cullRate.toFixed(1)}%)`;
  }

  /**
   * Create bounding sphere from AABB
   */
  static createSphereFromAABB(aabb: AABB): BoundingSphere {
    const center = new Vector3(
      (aabb.min.x + aabb.max.x) * 0.5,
      (aabb.min.y + aabb.max.y) * 0.5,
      (aabb.min.z + aabb.max.z) * 0.5
    );

    const radius = center.distanceTo(aabb.max);

    return { center, radius };
  }

  /**
   * Create AABB from points
   */
  static createAABBFromPoints(points: Vector3[]): AABB {
    if (points.length === 0) {
      return {
        min: new Vector3(0, 0, 0),
        max: new Vector3(0, 0, 0)
      };
    }

    const min = points[0].clone();
    const max = points[0].clone();

    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      min.x = Math.min(min.x, p.x);
      min.y = Math.min(min.y, p.y);
      min.z = Math.min(min.z, p.z);
      max.x = Math.max(max.x, p.x);
      max.y = Math.max(max.y, p.y);
      max.z = Math.max(max.z, p.z);
    }

    return { min, max };
  }

  /**
   * Expand AABB by a point
   */
  static expandAABB(aabb: AABB, point: Vector3): void {
    aabb.min.x = Math.min(aabb.min.x, point.x);
    aabb.min.y = Math.min(aabb.min.y, point.y);
    aabb.min.z = Math.min(aabb.min.z, point.z);
    aabb.max.x = Math.max(aabb.max.x, point.x);
    aabb.max.y = Math.max(aabb.max.y, point.y);
    aabb.max.z = Math.max(aabb.max.z, point.z);
  }
}
