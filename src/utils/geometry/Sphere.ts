/**
 * Sphere
 * 
 * Represents a bounding sphere for collision detection and spatial queries
 */

import { Vector3 } from '../math/Vector3';
import { AABB } from './AABB';

/**
 * Bounding Sphere
 */
export class Sphere {
  /** Center point */
  public center: Vector3;
  
  /** Radius */
  public radius: number;
  
  /**
   * Create a new Sphere
   */
  constructor(center?: Vector3, radius: number = 0) {
    this.center = center ? center.clone() : new Vector3();
    this.radius = radius;
  }
  
  /**
   * Create sphere from points (Ritter's algorithm)
   */
  static fromPoints(points: Vector3[]): Sphere {
    if (points.length === 0) {
      return new Sphere();
    }
    
    // Find most separated points
    let minX = points[0], maxX = points[0];
    let minY = points[0], maxY = points[0];
    let minZ = points[0], maxZ = points[0];
    
    for (const point of points) {
      if (point.x < minX.x) minX = point;
      if (point.x > maxX.x) maxX = point;
      if (point.y < minY.y) minY = point;
      if (point.y > maxY.y) maxY = point;
      if (point.z < minZ.z) minZ = point;
      if (point.z > maxZ.z) maxZ = point;
    }
    
    // Find the pair with maximum distance
    const dx = maxX.distanceTo(minX);
    const dy = maxY.distanceTo(minY);
    const dz = maxZ.distanceTo(minZ);
    
    let p1, p2;
    if (dx > dy && dx > dz) {
      p1 = minX;
      p2 = maxX;
    } else if (dy > dz) {
      p1 = minY;
      p2 = maxY;
    } else {
      p1 = minZ;
      p2 = maxZ;
    }
    
    // Initial sphere
    const center = p1.clone().add(p2).multiplyScalar(0.5);
    let radius = p1.distanceTo(p2) * 0.5;
    
    // Expand to include all points
    for (const point of points) {
      const dist = center.distanceTo(point);
      if (dist > radius) {
        const newRadius = (radius + dist) * 0.5;
        const k = (newRadius - radius) / dist;
        radius = newRadius;
        center.add(point.clone().subtract(center).multiplyScalar(k));
      }
    }
    
    return new Sphere(center, radius);
  }
  
  /**
   * Create sphere from AABB
   */
  static fromAABB(aabb: AABB): Sphere {
    const center = aabb.getCenter();
    const radius = center.distanceTo(aabb.max);
    return new Sphere(center, radius);
  }
  
  /**
   * Check if point is inside sphere
   */
  containsPoint(point: Vector3): boolean {
    return this.center.distanceToSquared(point) <= this.radius * this.radius;
  }
  
  /**
   * Check if sphere contains another sphere
   */
  containsSphere(sphere: Sphere): boolean {
    const distance = this.center.distanceTo(sphere.center);
    return distance + sphere.radius <= this.radius;
  }
  
  /**
   * Check if sphere intersects another sphere
   */
  intersectsSphere(sphere: Sphere): boolean {
    const distance = this.center.distanceTo(sphere.center);
    return distance <= this.radius + sphere.radius;
  }
  
  /**
   * Check if sphere intersects AABB
   */
  intersectsAABB(aabb: AABB): boolean {
    const closestPoint = aabb.closestPoint(this.center);
    return this.containsPoint(closestPoint);
  }
  
  /**
   * Get closest point on sphere to a point
   */
  closestPoint(point: Vector3): Vector3 {
    const direction = point.clone().subtract(this.center);
    const distance = direction.length();
    
    if (distance === 0) {
      // Point is at center, return any point on surface
      return this.center.clone().add(new Vector3(this.radius, 0, 0));
    }
    
    direction.normalize().multiplyScalar(this.radius);
    return this.center.clone().add(direction);
  }
  
  /**
   * Get distance from point to sphere surface
   */
  distanceToPoint(point: Vector3): number {
    return Math.max(0, this.center.distanceTo(point) - this.radius);
  }
  
  /**
   * Expand sphere by point
   */
  expandByPoint(point: Vector3): this {
    const distance = this.center.distanceTo(point);
    if (distance > this.radius) {
      const newRadius = (this.radius + distance) * 0.5;
      const k = (newRadius - this.radius) / distance;
      this.center.add(point.clone().subtract(this.center).multiplyScalar(k));
      this.radius = newRadius;
    }
    return this;
  }
  
  /**
   * Expand sphere by scalar
   */
  expandByScalar(scalar: number): this {
    this.radius += scalar;
    return this;
  }
  
  /**
   * Merge with another sphere
   */
  union(sphere: Sphere): this {
    const distance = this.center.distanceTo(sphere.center);
    
    // One sphere contains the other
    if (distance + sphere.radius <= this.radius) {
      return this;
    }
    if (distance + this.radius <= sphere.radius) {
      this.center.copy(sphere.center);
      this.radius = sphere.radius;
      return this;
    }
    
    // Compute new sphere
    const newRadius = (this.radius + sphere.radius + distance) * 0.5;
    const direction = sphere.center.clone().subtract(this.center).normalize();
    this.center.add(direction.multiplyScalar(newRadius - this.radius));
    this.radius = newRadius;
    
    return this;
  }
  
  /**
   * Translate sphere
   */
  translate(offset: Vector3): this {
    this.center.add(offset);
    return this;
  }
  
  /**
   * Check if sphere is empty
   */
  isEmpty(): boolean {
    return this.radius <= 0;
  }
  
  /**
   * Make sphere empty
   */
  makeEmpty(): this {
    this.center.set(0, 0, 0);
    this.radius = 0;
    return this;
  }
  
  /**
   * Get volume
   */
  getVolume(): number {
    return (4 / 3) * Math.PI * this.radius * this.radius * this.radius;
  }
  
  /**
   * Get surface area
   */
  getSurfaceArea(): number {
    return 4 * Math.PI * this.radius * this.radius;
  }
  
  /**
   * Clone sphere
   */
  clone(): Sphere {
    return new Sphere(this.center.clone(), this.radius);
  }
  
  /**
   * Copy from another sphere
   */
  copy(sphere: Sphere): this {
    this.center.copy(sphere.center);
    this.radius = sphere.radius;
    return this;
  }
  
  /**
   * Check if equal to another sphere
   */
  equals(sphere: Sphere): boolean {
    return this.center.equals(sphere.center) && this.radius === sphere.radius;
  }
  
  /**
   * Transform sphere by matrix
   */
  transform(matrix: any): this {
    // Transform center
    if (matrix.transformPoint) {
      this.center = matrix.transformPoint(this.center);
    }
    
    // Scale radius by maximum scale component
    if (matrix.getMaxScaleOnAxis) {
      this.radius *= matrix.getMaxScaleOnAxis();
    }
    
    return this;
  }
  
  /**
   * Convert to AABB
   */
  toAABB(): AABB {
    const r = new Vector3(this.radius, this.radius, this.radius);
    return new AABB(
      this.center.clone().subtract(r),
      this.center.clone().add(r)
    );
  }
  
  /**
   * Convert to string
   */
  toString(): string {
    return `Sphere(center: ${this.center.toString()}, radius: ${this.radius})`;
  }
}
