/**
 * Quaternion
 * 
 * Quaternion class for representing rotations in 3D space.
 * Quaternions avoid gimbal lock and provide smooth interpolation.
 */

import { Vector3 } from './Vector3';

export class Quaternion {
  public x: number;
  public y: number;
  public z: number;
  public w: number;

  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  /**
   * Set quaternion components
   */
  set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  /**
   * Copy from another quaternion
   */
  copy(q: Quaternion): this {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
  }

  /**
   * Clone this quaternion
   */
  clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  /**
   * Set from Euler angles (in radians)
   */
  setFromEuler(x: number, y: number, z: number, order: string = 'XYZ'): this {
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);

    switch (order) {
      case 'XYZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case 'YXZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      case 'ZXY':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      default:
        console.warn(`Unknown rotation order: ${order}`);
    }

    return this;
  }

  /**
   * Set from axis and angle
   */
  setFromAxisAngle(axis: Vector3, angle: number): this {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);

    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos(halfAngle);

    return this;
  }

  /**
   * Set from rotation matrix (3x3)
   */
  setFromRotationMatrix(m: number[]): this {
    // m is a 3x3 rotation matrix in column-major order
    const m11 = m[0], m12 = m[3], m13 = m[6];
    const m21 = m[1], m22 = m[4], m23 = m[7];
    const m31 = m[2], m32 = m[5], m33 = m[8];

    const trace = m11 + m22 + m33;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);
      this.w = 0.25 / s;
      this.x = (m32 - m23) * s;
      this.y = (m13 - m31) * s;
      this.z = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
      this.w = (m32 - m23) / s;
      this.x = 0.25 * s;
      this.y = (m12 + m21) / s;
      this.z = (m13 + m31) / s;
    } else if (m22 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
      this.w = (m13 - m31) / s;
      this.x = (m12 + m21) / s;
      this.y = 0.25 * s;
      this.z = (m23 + m32) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
      this.w = (m21 - m12) / s;
      this.x = (m13 + m31) / s;
      this.y = (m23 + m32) / s;
      this.z = 0.25 * s;
    }

    return this;
  }

  /**
   * Multiply by another quaternion
   */
  multiply(q: Quaternion): this {
    return this.multiplyQuaternions(this, q);
  }

  /**
   * Multiply two quaternions
   */
  multiplyQuaternions(a: Quaternion, b: Quaternion): this {
    const qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    const qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

    return this;
  }

  /**
   * Spherical linear interpolation
   */
  slerp(q: Quaternion, t: number): this {
    if (t === 0) return this;
    if (t === 1) return this.copy(q);

    const x = this.x, y = this.y, z = this.z, w = this.w;

    let cosHalfTheta = w * q.w + x * q.x + y * q.y + z * q.z;

    if (cosHalfTheta < 0) {
      this.w = -q.w;
      this.x = -q.x;
      this.y = -q.y;
      this.z = -q.z;
      cosHalfTheta = -cosHalfTheta;
    } else {
      this.copy(q);
    }

    if (cosHalfTheta >= 1.0) {
      this.w = w;
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }

    const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

    if (sqrSinHalfTheta <= Number.EPSILON) {
      const s = 1 - t;
      this.w = s * w + t * this.w;
      this.x = s * x + t * this.x;
      this.y = s * y + t * this.y;
      this.z = s * z + t * this.z;
      return this.normalize();
    }

    const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    this.w = w * ratioA + this.w * ratioB;
    this.x = x * ratioA + this.x * ratioB;
    this.y = y * ratioA + this.y * ratioB;
    this.z = z * ratioA + this.z * ratioB;

    return this;
  }

  /**
   * Invert this quaternion
   */
  invert(): this {
    return this.conjugate();
  }

  /**
   * Conjugate this quaternion
   */
  conjugate(): this {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
    return this;
  }

  /**
   * Dot product
   */
  dot(q: Quaternion): number {
    return this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
  }

  /**
   * Get length (magnitude)
   */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  /**
   * Get squared length
   */
  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }

  /**
   * Normalize
   */
  normalize(): this {
    let l = this.length();

    if (l === 0) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      l = 1 / l;
      this.x = this.x * l;
      this.y = this.y * l;
      this.z = this.z * l;
      this.w = this.w * l;
    }

    return this;
  }

  /**
   * Rotate a vector by this quaternion
   */
  rotateVector(v: Vector3): Vector3 {
    const x = v.x, y = v.y, z = v.z;
    const qx = this.x, qy = this.y, qz = this.z, qw = this.w;

    // Calculate quat * vector
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    // Calculate result * inverse quat
    return new Vector3(
      ix * qw + iw * -qx + iy * -qz - iz * -qy,
      iy * qw + iw * -qy + iz * -qx - ix * -qz,
      iz * qw + iw * -qz + ix * -qy - iy * -qx
    );
  }

  /**
   * Check if equals another quaternion
   */
  equals(q: Quaternion): boolean {
    return this.x === q.x && this.y === q.y && this.z === q.z && this.w === q.w;
  }

  /**
   * Convert to array
   */
  toArray(): [number, number, number, number] {
    return [this.x, this.y, this.z, this.w];
  }

  /**
   * From array
   */
  fromArray(array: number[], offset: number = 0): this {
    this.x = array[offset];
    this.y = array[offset + 1];
    this.z = array[offset + 2];
    this.w = array[offset + 3];
    return this;
  }

  /**
   * To string
   */
  toString(): string {
    return `Quaternion(${this.x.toFixed(3)}, ${this.y.toFixed(3)}, ${this.z.toFixed(3)}, ${this.w.toFixed(3)})`;
  }

  // Static methods

  /**
   * Spherical linear interpolation between two quaternions
   */
  static slerp(qa: Quaternion, qb: Quaternion, t: number): Quaternion {
    return qa.clone().slerp(qb, t);
  }

  /**
   * Create from Euler angles
   */
  static fromEuler(x: number, y: number, z: number, order?: string): Quaternion {
    return new Quaternion().setFromEuler(x, y, z, order);
  }

  /**
   * Create from axis and angle
   */
  static fromAxisAngle(axis: Vector3, angle: number): Quaternion {
    return new Quaternion().setFromAxisAngle(axis, angle);
  }

  /**
   * Identity quaternion
   */
  static identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1);
  }

  /**
   * Create quaternion from rotation matrix (3x3 components)
   */
  static fromRotationMatrix(
    m00: number, m01: number, m02: number,
    m10: number, m11: number, m12: number,
    m20: number, m21: number, m22: number
  ): Quaternion {
    const trace = m00 + m11 + m22;
    const q = new Quaternion();

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);
      q.w = 0.25 / s;
      q.x = (m21 - m12) * s;
      q.y = (m02 - m20) * s;
      q.z = (m10 - m01) * s;
    } else if (m00 > m11 && m00 > m22) {
      const s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22);
      q.w = (m21 - m12) / s;
      q.x = 0.25 * s;
      q.y = (m01 + m10) / s;
      q.z = (m02 + m20) / s;
    } else if (m11 > m22) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22);
      q.w = (m02 - m20) / s;
      q.x = (m01 + m10) / s;
      q.y = 0.25 * s;
      q.z = (m12 + m21) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11);
      q.w = (m10 - m01) / s;
      q.x = (m02 + m20) / s;
      q.y = (m12 + m21) / s;
      q.z = 0.25 * s;
    }

    return q;
  }

  /**
   * Create look rotation quaternion
   */
  static lookRotation(forward: Vector3, up: Vector3 = new Vector3(0, 1, 0)): Quaternion {
    // Normalize forward
    const f = forward.clone().normalize();
    
    // Calculate right vector
    const r = up.clone().cross(f).normalize();
    
    // Recalculate up vector
    const u = f.clone().cross(r);
    
    // Create rotation matrix and convert to quaternion
    return Quaternion.fromRotationMatrix(
      r.x, u.x, f.x,
      r.y, u.y, f.y,
      r.z, u.z, f.z
    );
  }

  /**
   * Multiply vector by quaternion (alias for rotateVector)
   */
  multiplyVector(v: Vector3): Vector3 {
    return this.rotateVector(v);
  }
}
