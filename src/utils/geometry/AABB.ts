/**
 * AABB (Axis-Aligned Bounding Box)
 * 
 * Represents an axis-aligned bounding box for collision detection and spatial queries
 */

import { Vector3 } from '../math/Vector3';

/**
 * Axis-Aligned Bounding Box
 */
export class AABB {
  /** Minimum point */
  public min: Vector3;
  
  /** Maximum point */
  public max: Vector3;
  
  /**
   * Create a new AABB
   */
  constructor(min?: Vector3, max?: Vector3) {
    this.min = min ? min.clone() : new Vector3(Infinity, Infinity, Infinity);
    this.max = max ? max.clone() : new Vector3(-Infinity, -Infinity, -Infinity);
  }
  
  /**
   * Create AABB from center and half extents
   */
  static fromCenterAndExtents(center: Vector3, halfExtents: Vector3): AABB {
    return new AABB(
      center.clone().subtract(halfExtents),
      center.clone().add(halfExtents)
    );
  }
  
  /**
   * Create AABB from points
   */
  static fromPoints(points: Vector3[]): AABB {
    const aabb = new AABB();
    for (const point of points) {
      aabb.expandByPoint(point);
    }
    return aabb;
  }
  
  /**
   * Create AABB from sphere
   */
  static fromSphere(center: Vector3, radius: number): AABB {
    const r = new Vector3(radius, radius, radius);
    return new AABB(
      center.clone().subtract(r),
      center.clone().add(r)
    );
  }
  
  /**
   * Get center point
   */
  getCenter(): Vector3 {
    return this.min.clone().add(this.max).multiplyScalar(0.5);
  }
  
  /**
   * Get half extents (size / 2)
   */
  getHalfExtents(): Vector3 {
    return this.max.clone().subtract(this.min).multiplyScalar(0.5);
  }
  
  /**
   * Get full size
   */
  getSize(): Vector3 {
    return this.max.clone().subtract(this.min);
  }
  
  /**
   * Get volume
   */
  getVolume(): number {
    const size = this.getSize();
    return size.x * size.y * size.z;
  }
  
  /**
   * Get surface area
   */
  getSurfaceArea(): number {
    const size = this.getSize();
    return 2 * (size.x * size.y + size.x * size.z + size.y * size.z);
  }
  
  /**
   * Check if point is inside AABB
   */
  containsPoint(point: Vector3): boolean {
    return point.x >= this.min.x && point.x <= this.max.x &&
           point.y >= this.min.y && point.y <= this.max.y &&
           point.z >= this.min.z && point.z <= this.max.z;
  }
  
  /**
   * Check if AABB contains another AABB
   */
  containsAABB(aabb: AABB): boolean {
    return this.min.x <= aabb.min.x && this.max.x >= aabb.max.x &&
           this.min.y <= aabb.min.y && this.max.y >= aabb.max.y &&
           this.min.z <= aabb.min.z && this.max.z >= aabb.max.z;
  }
  
  /**
   * Check if AABB intersects another AABB
   */
  intersectsAABB(aabb: AABB): boolean {
    return this.min.x <= aabb.max.x && this.max.x >= aabb.min.x &&
           this.min.y <= aabb.max.y && this.max.y >= aabb.min.y &&
           this.min.z <= aabb.max.z && this.max.z >= aabb.min.z;
  }
  
  /**
   * Get closest point on AABB to a point
   */
  closestPoint(point: Vector3): Vector3 {
    return new Vector3(
      Math.max(this.min.x, Math.min(point.x, this.max.x)),
      Math.max(this.min.y, Math.min(point.y, this.max.y)),
      Math.max(this.min.z, Math.min(point.z, this.max.z))
    );
  }
  
  /**
   * Get distance from point to AABB
   */
  distanceToPoint(point: Vector3): number {
    const closest = this.closestPoint(point);
    return point.distanceTo(closest);
  }
  
  /**
   * Expand AABB by point
   */
  expandByPoint(point: Vector3): this {
    this.min.x = Math.min(this.min.x, point.x);
    this.min.y = Math.min(this.min.y, point.y);
    this.min.z = Math.min(this.min.z, point.z);
    
    this.max.x = Math.max(this.max.x, point.x);
    this.max.y = Math.max(this.max.y, point.y);
    this.max.z = Math.max(this.max.z, point.z);
    
    return this;
  }
  
  /**
   * Expand AABB by scalar
   */
  expandByScalar(scalar: number): this {
    this.min.x -= scalar;
    this.min.y -= scalar;
    this.min.z -= scalar;
    
    this.max.x += scalar;
    this.max.y += scalar;
    this.max.z += scalar;
    
    return this;
  }
  
  /**
   * Expand AABB by vector
   */
  expandByVector(vector: Vector3): this {
    this.min.subtract(vector);
    this.max.add(vector);
    return this;
  }
  
  /**
   * Merge with another AABB
   */
  union(aabb: AABB): this {
    this.min.x = Math.min(this.min.x, aabb.min.x);
    this.min.y = Math.min(this.min.y, aabb.min.y);
    this.min.z = Math.min(this.min.z, aabb.min.z);
    
    this.max.x = Math.max(this.max.x, aabb.max.x);
    this.max.y = Math.max(this.max.y, aabb.max.y);
    this.max.z = Math.max(this.max.z, aabb.max.z);
    
    return this;
  }
  
  /**
   * Intersect with another AABB
   */
  intersect(aabb: AABB): this {
    this.min.x = Math.max(this.min.x, aabb.min.x);
    this.min.y = Math.max(this.min.y, aabb.min.y);
    this.min.z = Math.max(this.min.z, aabb.min.z);
    
    this.max.x = Math.min(this.max.x, aabb.max.x);
    this.max.y = Math.min(this.max.y, aabb.max.y);
    this.max.z = Math.min(this.max.z, aabb.max.z);
    
    return this;
  }
  
  /**
   * Translate AABB
   */
  translate(offset: Vector3): this {
    this.min.add(offset);
    this.max.add(offset);
    return this;
  }
  
  /**
   * Check if AABB is empty
   */
  isEmpty(): boolean {
    return this.max.x < this.min.x ||
           this.max.y < this.min.y ||
           this.max.z < this.min.z;
  }
  
  /**
   * Make AABB empty
   */
  makeEmpty(): this {
    this.min.set(Infinity, Infinity, Infinity);
    this.max.set(-Infinity, -Infinity, -Infinity);
    return this;
  }
  
  /**
   * Clone AABB
   */
  clone(): AABB {
    return new AABB(this.min.clone(), this.max.clone());
  }
  
  /**
   * Copy from another AABB
   */
  copy(aabb: AABB): this {
    this.min.copy(aabb.min);
    this.max.copy(aabb.max);
    return this;
  }
  
  /**
   * Check if equal to another AABB
   */
  equals(aabb: AABB): boolean {
    return this.min.equals(aabb.min) && this.max.equals(aabb.max);
  }
  
  /**
   * Get corners of AABB
   */
  getCorners(): Vector3[] {
    return [
      new Vector3(this.min.x, this.min.y, this.min.z),
      new Vector3(this.max.x, this.min.y, this.min.z),
      new Vector3(this.min.x, this.max.y, this.min.z),
      new Vector3(this.max.x, this.max.y, this.min.z),
      new Vector3(this.min.x, this.min.y, this.max.z),
      new Vector3(this.max.x, this.min.y, this.max.z),
      new Vector3(this.min.x, this.max.y, this.max.z),
      new Vector3(this.max.x, this.max.y, this.max.z)
    ];
  }
  
  /**
   * Transform AABB by matrix (creates new AABB from transformed corners)
   */
  transform(matrix: any): AABB {
    const corners = this.getCorners();
    const transformed = corners.map(corner => {
      // Assuming matrix has a transformPoint method
      return matrix.transformPoint ? matrix.transformPoint(corner) : corner;
    });
    return AABB.fromPoints(transformed);
  }
  
  /**
   * Convert to string
   */
  toString(): string {
    return `AABB(min: ${this.min.toString()}, max: ${this.max.toString()})`;
  }
}
