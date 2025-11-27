/**
 * Matrix3
 * 
 * 3x3 matrix class for 2D transformations and rotations
 * Column-major order (like OpenGL)
 */

import { Vector2 } from './Vector2';

export class Matrix3 {
  public elements: Float32Array;

  constructor() {
    this.elements = new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  static identity(): Matrix3 {
    return new Matrix3();
  }

  static zero(): Matrix3 {
    const m = new Matrix3();
    m.elements.fill(0);
    return m;
  }

  // ============================================================================
  // Basic Operations
  // ============================================================================

  set(
    n11: number, n12: number, n13: number,
    n21: number, n22: number, n23: number,
    n31: number, n32: number, n33: number
  ): this {
    const te = this.elements;
    te[0] = n11; te[3] = n12; te[6] = n13;
    te[1] = n21; te[4] = n22; te[7] = n23;
    te[2] = n31; te[5] = n32; te[8] = n33;
    return this;
  }

  identity(): this {
    this.set(
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    );
    return this;
  }

  copy(m: Matrix3): this {
    const te = this.elements;
    const me = m.elements;
    for (let i = 0; i < 9; i++) {
      te[i] = me[i];
    }
    return this;
  }

  clone(): Matrix3 {
    const m = new Matrix3();
    return m.copy(this);
  }

  // ============================================================================
  // Matrix Operations
  // ============================================================================

  multiply(m: Matrix3): this {
    return this.multiplyMatrices(this, m);
  }

  premultiply(m: Matrix3): this {
    return this.multiplyMatrices(m, this);
  }

  multiplyMatrices(a: Matrix3, b: Matrix3): this {
    const ae = a.elements;
    const be = b.elements;
    const te = this.elements;

    const a11 = ae[0], a12 = ae[3], a13 = ae[6];
    const a21 = ae[1], a22 = ae[4], a23 = ae[7];
    const a31 = ae[2], a32 = ae[5], a33 = ae[8];

    const b11 = be[0], b12 = be[3], b13 = be[6];
    const b21 = be[1], b22 = be[4], b23 = be[7];
    const b31 = be[2], b32 = be[5], b33 = be[8];

    te[0] = a11 * b11 + a12 * b21 + a13 * b31;
    te[3] = a11 * b12 + a12 * b22 + a13 * b32;
    te[6] = a11 * b13 + a12 * b23 + a13 * b33;

    te[1] = a21 * b11 + a22 * b21 + a23 * b31;
    te[4] = a21 * b12 + a22 * b22 + a23 * b32;
    te[7] = a21 * b13 + a22 * b23 + a23 * b33;

    te[2] = a31 * b11 + a32 * b21 + a33 * b31;
    te[5] = a31 * b12 + a32 * b22 + a33 * b32;
    te[8] = a31 * b13 + a32 * b23 + a33 * b33;

    return this;
  }

  multiplyScalar(s: number): this {
    const te = this.elements;
    for (let i = 0; i < 9; i++) {
      te[i] *= s;
    }
    return this;
  }

  // ============================================================================
  // Determinant & Inverse
  // ============================================================================

  determinant(): number {
    const te = this.elements;
    const a = te[0], b = te[1], c = te[2];
    const d = te[3], e = te[4], f = te[5];
    const g = te[6], h = te[7], i = te[8];

    return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
  }

  invert(): this {
    const te = this.elements;
    const n11 = te[0], n21 = te[1], n31 = te[2];
    const n12 = te[3], n22 = te[4], n32 = te[5];
    const n13 = te[6], n23 = te[7], n33 = te[8];

    const t11 = n33 * n22 - n32 * n23;
    const t12 = n32 * n13 - n33 * n12;
    const t13 = n23 * n12 - n22 * n13;

    const det = n11 * t11 + n21 * t12 + n31 * t13;

    if (det === 0) {
      console.warn('Matrix3: Cannot invert matrix, determinant is 0');
      return this.identity();
    }

    const detInv = 1 / det;

    te[0] = t11 * detInv;
    te[1] = (n31 * n23 - n33 * n21) * detInv;
    te[2] = (n32 * n21 - n31 * n22) * detInv;

    te[3] = t12 * detInv;
    te[4] = (n33 * n11 - n31 * n13) * detInv;
    te[5] = (n31 * n12 - n32 * n11) * detInv;

    te[6] = t13 * detInv;
    te[7] = (n21 * n13 - n23 * n11) * detInv;
    te[8] = (n22 * n11 - n21 * n12) * detInv;

    return this;
  }

  // ============================================================================
  // Transpose
  // ============================================================================

  transpose(): this {
    const te = this.elements;
    let tmp: number;

    tmp = te[1]; te[1] = te[3]; te[3] = tmp;
    tmp = te[2]; te[2] = te[6]; te[6] = tmp;
    tmp = te[5]; te[5] = te[7]; te[7] = tmp;

    return this;
  }

  // ============================================================================
  // Transformations
  // ============================================================================

  setTranslation(x: number, y: number): this {
    this.set(
      1, 0, x,
      0, 1, y,
      0, 0, 1
    );
    return this;
  }

  setRotation(angle: number): this {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    this.set(
      c, -s, 0,
      s,  c, 0,
      0,  0, 1
    );
    return this;
  }

  setScale(x: number, y: number): this {
    this.set(
      x, 0, 0,
      0, y, 0,
      0, 0, 1
    );
    return this;
  }

  translate(x: number, y: number): this {
    const te = this.elements;
    te[6] += x * te[0] + y * te[3];
    te[7] += x * te[1] + y * te[4];
    te[8] += x * te[2] + y * te[5];
    return this;
  }

  rotate(angle: number): this {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const te = this.elements;

    const a11 = te[0], a12 = te[3], a13 = te[6];
    const a21 = te[1], a22 = te[4], a23 = te[7];

    te[0] = c * a11 + s * a21;
    te[3] = c * a12 + s * a22;
    te[6] = c * a13 + s * a23;

    te[1] = c * a21 - s * a11;
    te[4] = c * a22 - s * a12;
    te[7] = c * a23 - s * a13;

    return this;
  }

  scale(x: number, y: number): this {
    const te = this.elements;
    te[0] *= x; te[3] *= x; te[6] *= x;
    te[1] *= y; te[4] *= y; te[7] *= y;
    return this;
  }

  // ============================================================================
  // Vector Transformation
  // ============================================================================

  transformVector2(v: Vector2): Vector2 {
    const te = this.elements;
    const x = v.x, y = v.y;
    return new Vector2(
      te[0] * x + te[3] * y + te[6],
      te[1] * x + te[4] * y + te[7]
    );
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  equals(m: Matrix3, epsilon: number = 0): boolean {
    const te = this.elements;
    const me = m.elements;

    if (epsilon === 0) {
      for (let i = 0; i < 9; i++) {
        if (te[i] !== me[i]) return false;
      }
    } else {
      for (let i = 0; i < 9; i++) {
        if (Math.abs(te[i] - me[i]) > epsilon) return false;
      }
    }
    return true;
  }

  // ============================================================================
  // Conversion
  // ============================================================================

  toArray(array: number[] = [], offset: number = 0): number[] {
    const te = this.elements;
    for (let i = 0; i < 9; i++) {
      array[offset + i] = te[i];
    }
    return array;
  }

  fromArray(array: number[], offset: number = 0): this {
    const te = this.elements;
    for (let i = 0; i < 9; i++) {
      te[i] = array[offset + i];
    }
    return this;
  }

  toJSON(): number[] {
    return Array.from(this.elements);
  }

  toString(): string {
    const te = this.elements;
    return `Matrix3(\n` +
      `  ${te[0]}, ${te[3]}, ${te[6]}\n` +
      `  ${te[1]}, ${te[4]}, ${te[7]}\n` +
      `  ${te[2]}, ${te[5]}, ${te[8]}\n` +
      `)`;
  }

  // ============================================================================
  // Static Utility Methods
  // ============================================================================

  static multiply(a: Matrix3, b: Matrix3): Matrix3 {
    return new Matrix3().multiplyMatrices(a, b);
  }

  static translation(x: number, y: number): Matrix3 {
    return new Matrix3().setTranslation(x, y);
  }

  static rotation(angle: number): Matrix3 {
    return new Matrix3().setRotation(angle);
  }

  static scaling(x: number, y: number): Matrix3 {
    return new Matrix3().setScale(x, y);
  }
}
