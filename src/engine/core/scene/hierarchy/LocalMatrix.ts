/**
 * LocalMatrix
 * 
 * Utility class for local matrix operations.
 * Provides methods for working with local space transforms.
 */

import { Vector3 } from '../../../../utils/math/Vector3';
import { Quaternion } from '../../../../utils/math/Quaternion';

export class LocalMatrix {
  /**
   * Create translation matrix
   */
  static createTranslation(x: number, y: number, z: number): Float32Array {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ]);
  }

  /**
   * Create rotation matrix from quaternion
   */
  static createRotation(rotation: Quaternion): Float32Array {
    const matrix = new Float32Array(16);
    const q = rotation;
    const x = q.x, y = q.y, z = q.z, w = q.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    
    matrix[0] = 1 - (yy + zz);
    matrix[1] = xy + wz;
    matrix[2] = xz - wy;
    matrix[3] = 0;
    
    matrix[4] = xy - wz;
    matrix[5] = 1 - (xx + zz);
    matrix[6] = yz + wx;
    matrix[7] = 0;
    
    matrix[8] = xz + wy;
    matrix[9] = yz - wx;
    matrix[10] = 1 - (xx + yy);
    matrix[11] = 0;
    
    matrix[12] = 0;
    matrix[13] = 0;
    matrix[14] = 0;
    matrix[15] = 1;
    
    return matrix;
  }

  /**
   * Create scale matrix
   */
  static createScale(x: number, y: number, z: number): Float32Array {
    return new Float32Array([
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * Create rotation matrix from Euler angles (XYZ order)
   */
  static createRotationFromEuler(x: number, y: number, z: number): Float32Array {
    const cx = Math.cos(x), sx = Math.sin(x);
    const cy = Math.cos(y), sy = Math.sin(y);
    const cz = Math.cos(z), sz = Math.sin(z);
    
    return new Float32Array([
      cy * cz, cy * sz, -sy, 0,
      sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy, 0,
      cx * sy * cz + sx * sz, cx * sy * sz - sx * cz, cx * cy, 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * Create look-at matrix
   */
  static createLookAt(eye: Vector3, target: Vector3, up: Vector3): Float32Array {
    const z = eye.clone().sub(target).normalize();
    const x = up.clone().cross(z).normalize();
    const y = z.clone().cross(x);
    
    return new Float32Array([
      x.x, y.x, z.x, 0,
      x.y, y.y, z.y, 0,
      x.z, y.z, z.z, 0,
      eye.x, eye.y, eye.z, 1
    ]);
  }

  /**
   * Decompose matrix into TRS components
   */
  static decompose(matrix: Float32Array): {
    position: Vector3;
    rotation: Quaternion;
    scale: Vector3;
  } {
    // Extract position
    const position = new Vector3(matrix[12], matrix[13], matrix[14]);
    
    // Extract scale
    const sx = Math.sqrt(
      matrix[0] * matrix[0] +
      matrix[1] * matrix[1] +
      matrix[2] * matrix[2]
    );
    
    const sy = Math.sqrt(
      matrix[4] * matrix[4] +
      matrix[5] * matrix[5] +
      matrix[6] * matrix[6]
    );
    
    const sz = Math.sqrt(
      matrix[8] * matrix[8] +
      matrix[9] * matrix[9] +
      matrix[10] * matrix[10]
    );
    
    const scale = new Vector3(sx, sy, sz);
    
    // Extract rotation (normalize by scale)
    const m00 = matrix[0] / sx;
    const m01 = matrix[1] / sx;
    const m02 = matrix[2] / sx;
    const m10 = matrix[4] / sy;
    const m11 = matrix[5] / sy;
    const m12 = matrix[6] / sy;
    const m20 = matrix[8] / sz;
    const m21 = matrix[9] / sz;
    const m22 = matrix[10] / sz;
    
    const rotation = Quaternion.fromRotationMatrix(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
    
    return { position, rotation, scale };
  }

  /**
   * Compose matrix from TRS components
   */
  static compose(position: Vector3, rotation: Quaternion, scale: Vector3): Float32Array {
    const matrix = new Float32Array(16);
    
    const q = rotation;
    const x = q.x, y = q.y, z = q.z, w = q.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    
    const sx = scale.x, sy = scale.y, sz = scale.z;
    
    matrix[0] = (1 - (yy + zz)) * sx;
    matrix[1] = (xy + wz) * sx;
    matrix[2] = (xz - wy) * sx;
    matrix[3] = 0;
    
    matrix[4] = (xy - wz) * sy;
    matrix[5] = (1 - (xx + zz)) * sy;
    matrix[6] = (yz + wx) * sy;
    matrix[7] = 0;
    
    matrix[8] = (xz + wy) * sz;
    matrix[9] = (yz - wx) * sz;
    matrix[10] = (1 - (xx + yy)) * sz;
    matrix[11] = 0;
    
    matrix[12] = position.x;
    matrix[13] = position.y;
    matrix[14] = position.z;
    matrix[15] = 1;
    
    return matrix;
  }

  /**
   * Interpolate between two matrices
   */
  static lerp(a: Float32Array, b: Float32Array, t: number): Float32Array {
    const result = new Float32Array(16);
    
    for (let i = 0; i < 16; i++) {
      result[i] = a[i] + (b[i] - a[i]) * t;
    }
    
    return result;
  }

  /**
   * Get forward vector from matrix
   */
  static getForward(matrix: Float32Array): Vector3 {
    return new Vector3(matrix[8], matrix[9], matrix[10]).normalize();
  }

  /**
   * Get right vector from matrix
   */
  static getRight(matrix: Float32Array): Vector3 {
    return new Vector3(matrix[0], matrix[1], matrix[2]).normalize();
  }

  /**
   * Get up vector from matrix
   */
  static getUp(matrix: Float32Array): Vector3 {
    return new Vector3(matrix[4], matrix[5], matrix[6]).normalize();
  }

  /**
   * Check if matrix is identity
   */
  static isIdentity(matrix: Float32Array, epsilon: number = 0.0001): boolean {
    const identity = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
    
    for (let i = 0; i < 16; i++) {
      if (Math.abs(matrix[i] - identity[i]) > epsilon) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get determinant of matrix
   */
  static determinant(matrix: Float32Array): number {
    const m = matrix;
    
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
    const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
    const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
    const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
    
    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;
    
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  }

  /**
   * Transpose matrix
   */
  static transpose(matrix: Float32Array): Float32Array {
    const m = matrix;
    return new Float32Array([
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15]
    ]);
  }
}
