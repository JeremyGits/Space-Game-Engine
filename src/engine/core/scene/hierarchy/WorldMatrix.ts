/**
 * WorldMatrix
 * 
 * Utility class for world matrix operations.
 * Provides methods for converting between local and world space.
 */

import { Vector3 } from '../../../../utils/math/Vector3';
import { Quaternion } from '../../../../utils/math/Quaternion';

export class WorldMatrix {
  /**
   * Create a TRS (Translation, Rotation, Scale) matrix
   */
  static createTRS(
    position: Vector3,
    rotation: Quaternion,
    scale: Vector3
  ): Float32Array {
    const matrix = new Float32Array(16);
    
    // Get rotation matrix from quaternion
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
   * Multiply two 4x4 matrices
   */
  static multiply(a: Float32Array, b: Float32Array): Float32Array {
    const result = new Float32Array(16);
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] = 
          a[i * 4 + 0] * b[0 * 4 + j] +
          a[i * 4 + 1] * b[1 * 4 + j] +
          a[i * 4 + 2] * b[2 * 4 + j] +
          a[i * 4 + 3] * b[3 * 4 + j];
      }
    }
    
    return result;
  }

  /**
   * Extract position from matrix
   */
  static extractPosition(matrix: Float32Array): Vector3 {
    return new Vector3(matrix[12], matrix[13], matrix[14]);
  }

  /**
   * Extract scale from matrix
   */
  static extractScale(matrix: Float32Array): Vector3 {
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
    
    return new Vector3(sx, sy, sz);
  }

  /**
   * Extract rotation from matrix
   */
  static extractRotation(matrix: Float32Array): Quaternion {
    const scale = WorldMatrix.extractScale(matrix);
    
    // Normalize by scale
    const m00 = matrix[0] / scale.x;
    const m01 = matrix[1] / scale.x;
    const m02 = matrix[2] / scale.x;
    const m10 = matrix[4] / scale.y;
    const m11 = matrix[5] / scale.y;
    const m12 = matrix[6] / scale.y;
    const m20 = matrix[8] / scale.z;
    const m21 = matrix[9] / scale.z;
    const m22 = matrix[10] / scale.z;
    
    return Quaternion.fromRotationMatrix(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  /**
   * Invert a matrix
   */
  static invert(matrix: Float32Array): Float32Array {
    const result = new Float32Array(16);
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
    
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    
    if (det === 0) {
      return matrix; // Return original if not invertible
    }
    
    det = 1.0 / det;
    
    result[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    result[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    result[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    result[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    result[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    result[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    result[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    result[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    result[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    result[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    result[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    result[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    result[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    result[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    result[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    result[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    
    return result;
  }

  /**
   * Transform a point by a matrix
   */
  static transformPoint(matrix: Float32Array, point: Vector3): Vector3 {
    const x = point.x, y = point.y, z = point.z;
    
    const w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
    const invW = w === 0 ? 1 : 1 / w;
    
    return new Vector3(
      (matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]) * invW,
      (matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]) * invW,
      (matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]) * invW
    );
  }

  /**
   * Transform a direction by a matrix (ignores translation)
   */
  static transformDirection(matrix: Float32Array, direction: Vector3): Vector3 {
    const x = direction.x, y = direction.y, z = direction.z;
    
    return new Vector3(
      matrix[0] * x + matrix[4] * y + matrix[8] * z,
      matrix[1] * x + matrix[5] * y + matrix[9] * z,
      matrix[2] * x + matrix[6] * y + matrix[10] * z
    ).normalize();
  }

  /**
   * Create identity matrix
   */
  static identity(): Float32Array {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * Clone a matrix
   */
  static clone(matrix: Float32Array): Float32Array {
    return new Float32Array(matrix);
  }

  /**
   * Check if two matrices are equal
   */
  static equals(a: Float32Array, b: Float32Array, epsilon: number = 0.0001): boolean {
    for (let i = 0; i < 16; i++) {
      if (Math.abs(a[i] - b[i]) > epsilon) {
        return false;
      }
    }
    return true;
  }

  /**
   * Convert matrix to string (for debugging)
   */
  static toString(matrix: Float32Array): string {
    const m = matrix;
    return `Matrix4x4:\n` +
      `[${m[0].toFixed(3)}, ${m[4].toFixed(3)}, ${m[8].toFixed(3)}, ${m[12].toFixed(3)}]\n` +
      `[${m[1].toFixed(3)}, ${m[5].toFixed(3)}, ${m[9].toFixed(3)}, ${m[13].toFixed(3)}]\n` +
      `[${m[2].toFixed(3)}, ${m[6].toFixed(3)}, ${m[10].toFixed(3)}, ${m[14].toFixed(3)}]\n` +
      `[${m[3].toFixed(3)}, ${m[7].toFixed(3)}, ${m[11].toFixed(3)}, ${m[15].toFixed(3)}]`;
  }
}
