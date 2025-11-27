/**
 * Transform
 * 
 * Represents position, rotation, and scale in 3D space.
 * Core component for all spatial entities in the scene.
 */

import { Vector3 } from '../../../../utils/math/Vector3';
import { Quaternion } from '../../../../utils/math/Quaternion';

export class Transform {
  // Local transform (relative to parent)
  private _position: Vector3;
  private _rotation: Quaternion;
  private _scale: Vector3;
  
  // World transform (absolute in world space)
  private _worldPosition: Vector3;
  private _worldRotation: Quaternion;
  private _worldScale: Vector3;
  
  // Dirty flags for optimization
  private _localDirty: boolean = true;
  private _worldDirty: boolean = true;
  
  // Cached matrices
  private _localMatrix: Float32Array;
  private _worldMatrix: Float32Array;
  
  // Parent reference
  private _parent: Transform | null = null;
  private _children: Transform[] = [];

  constructor(
    position: Vector3 = new Vector3(0, 0, 0),
    rotation: Quaternion = new Quaternion(0, 0, 0, 1),
    scale: Vector3 = new Vector3(1, 1, 1)
  ) {
    this._position = position.clone();
    this._rotation = rotation.clone();
    this._scale = scale.clone();
    
    this._worldPosition = position.clone();
    this._worldRotation = rotation.clone();
    this._worldScale = scale.clone();
    
    this._localMatrix = new Float32Array(16);
    this._worldMatrix = new Float32Array(16);
    
    this.updateLocalMatrix();
  }

  /**
   * Get local position
   */
  get position(): Vector3 {
    return this._position;
  }

  /**
   * Set local position
   */
  set position(value: Vector3) {
    this._position.copy(value);
    this.markDirty();
  }

  /**
   * Get local rotation
   */
  get rotation(): Quaternion {
    return this._rotation;
  }

  /**
   * Set local rotation
   */
  set rotation(value: Quaternion) {
    this._rotation.copy(value);
    this.markDirty();
  }

  /**
   * Get local scale
   */
  get scale(): Vector3 {
    return this._scale;
  }

  /**
   * Set local scale
   */
  set scale(value: Vector3) {
    this._scale.copy(value);
    this.markDirty();
  }

  /**
   * Get world position
   */
  get worldPosition(): Vector3 {
    if (this._worldDirty) {
      this.updateWorldTransform();
    }
    return this._worldPosition;
  }

  /**
   * Get world rotation
   */
  get worldRotation(): Quaternion {
    if (this._worldDirty) {
      this.updateWorldTransform();
    }
    return this._worldRotation;
  }

  /**
   * Get world scale
   */
  get worldScale(): Vector3 {
    if (this._worldDirty) {
      this.updateWorldTransform();
    }
    return this._worldScale;
  }

  /**
   * Get local matrix
   */
  getLocalMatrix(): Float32Array {
    if (this._localDirty) {
      this.updateLocalMatrix();
    }
    return this._localMatrix;
  }

  /**
   * Get world matrix
   */
  getWorldMatrix(): Float32Array {
    if (this._worldDirty) {
      this.updateWorldTransform();
    }
    return this._worldMatrix;
  }

  /**
   * Set parent transform
   */
  setParent(parent: Transform | null): void {
    // Remove from old parent
    if (this._parent) {
      const index = this._parent._children.indexOf(this);
      if (index !== -1) {
        this._parent._children.splice(index, 1);
      }
    }
    
    // Set new parent
    this._parent = parent;
    
    // Add to new parent
    if (parent) {
      parent._children.push(this);
    }
    
    this.markDirty();
  }

  /**
   * Get parent transform
   */
  getParent(): Transform | null {
    return this._parent;
  }

  /**
   * Get children transforms
   */
  getChildren(): Transform[] {
    return [...this._children];
  }

  /**
   * Translate in local space
   */
  translate(offset: Vector3): void {
    this._position.add(offset);
    this.markDirty();
  }

  /**
   * Rotate around axis
   */
  rotate(axis: Vector3, angle: number): void {
    const rotation = Quaternion.fromAxisAngle(axis, angle);
    this._rotation.multiply(rotation);
    this.markDirty();
  }

  /**
   * Scale uniformly
   */
  scaleUniform(factor: number): void {
    this._scale.multiplyScalar(factor);
    this.markDirty();
  }

  /**
   * Look at target position
   */
  lookAt(target: Vector3, up: Vector3 = new Vector3(0, 1, 0)): void {
    const worldPos = this.worldPosition;
    const direction = target.clone().subtract(worldPos).normalize();
    
    // Calculate rotation to look at target
    const right = up.clone().cross(direction).normalize();
    const newUp = direction.clone().cross(right).normalize();
    
    // Create rotation matrix and convert to quaternion
    // This is a simplified version - full implementation would use matrix math
    this._rotation = Quaternion.lookRotation(direction, newUp);
    this.markDirty();
  }

  /**
   * Get forward vector (local Z axis)
   */
  forward(): Vector3 {
    return this._rotation.multiplyVector(new Vector3(0, 0, 1));
  }

  /**
   * Get right vector (local X axis)
   */
  right(): Vector3 {
    return this._rotation.multiplyVector(new Vector3(1, 0, 0));
  }

  /**
   * Get up vector (local Y axis)
   */
  up(): Vector3 {
    return this._rotation.multiplyVector(new Vector3(0, 1, 0));
  }

  /**
   * Mark transform as dirty
   */
  private markDirty(): void {
    this._localDirty = true;
    this._worldDirty = true;
    
    // Mark all children as dirty
    this.markChildrenDirty();
  }

  /**
   * Mark all children as dirty recursively
   */
  private markChildrenDirty(): void {
    for (const child of this._children) {
      child._worldDirty = true;
      child.markChildrenDirty();
    }
  }

  /**
   * Update local matrix
   */
  private updateLocalMatrix(): void {
    // Create TRS matrix (Translation * Rotation * Scale)
    const m = this._localMatrix;
    
    // Get rotation matrix from quaternion
    const q = this._rotation;
    const x = q.x, y = q.y, z = q.z, w = q.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    
    const sx = this._scale.x, sy = this._scale.y, sz = this._scale.z;
    
    m[0] = (1 - (yy + zz)) * sx;
    m[1] = (xy + wz) * sx;
    m[2] = (xz - wy) * sx;
    m[3] = 0;
    
    m[4] = (xy - wz) * sy;
    m[5] = (1 - (xx + zz)) * sy;
    m[6] = (yz + wx) * sy;
    m[7] = 0;
    
    m[8] = (xz + wy) * sz;
    m[9] = (yz - wx) * sz;
    m[10] = (1 - (xx + yy)) * sz;
    m[11] = 0;
    
    m[12] = this._position.x;
    m[13] = this._position.y;
    m[14] = this._position.z;
    m[15] = 1;
    
    this._localDirty = false;
  }

  /**
   * Update world transform
   */
  private updateWorldTransform(): void {
    if (this._localDirty) {
      this.updateLocalMatrix();
    }
    
    if (this._parent) {
      // Multiply parent world matrix with local matrix
      const parentWorld = this._parent.getWorldMatrix();
      this.multiplyMatrices(this._worldMatrix, parentWorld, this._localMatrix);
      
      // Extract world position, rotation, scale from matrix
      this.extractTransformFromMatrix(this._worldMatrix);
    } else {
      // No parent, world = local
      this._worldMatrix.set(this._localMatrix);
      this._worldPosition.copy(this._position);
      this._worldRotation.copy(this._rotation);
      this._worldScale.copy(this._scale);
    }
    
    this._worldDirty = false;
  }

  /**
   * Multiply two 4x4 matrices
   */
  private multiplyMatrices(out: Float32Array, a: Float32Array, b: Float32Array): void {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    
    const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
    const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
    const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
    const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];
    
    out[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
    out[1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
    out[2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
    out[3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
    
    out[4] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
    out[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
    out[6] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
    out[7] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
    
    out[8] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
    out[9] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
    out[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
    out[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
    
    out[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
    out[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
    out[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
    out[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
  }

  /**
   * Extract position, rotation, scale from matrix
   */
  private extractTransformFromMatrix(matrix: Float32Array): void {
    // Extract position
    this._worldPosition.set(matrix[12], matrix[13], matrix[14]);
    
    // Extract scale
    const sx = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1] + matrix[2] * matrix[2]);
    const sy = Math.sqrt(matrix[4] * matrix[4] + matrix[5] * matrix[5] + matrix[6] * matrix[6]);
    const sz = Math.sqrt(matrix[8] * matrix[8] + matrix[9] * matrix[9] + matrix[10] * matrix[10]);
    
    this._worldScale.set(sx, sy, sz);
    
    // Extract rotation (normalize by scale)
    const m00 = matrix[0] / sx, m01 = matrix[1] / sx, m02 = matrix[2] / sx;
    const m10 = matrix[4] / sy, m11 = matrix[5] / sy, m12 = matrix[6] / sy;
    const m20 = matrix[8] / sz, m21 = matrix[9] / sz, m22 = matrix[10] / sz;
    
    // Convert rotation matrix to quaternion
    this._worldRotation = Quaternion.fromRotationMatrix(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }

  /**
   * Clone transform
   */
  clone(): Transform {
    const clone = new Transform(
      this._position.clone(),
      this._rotation.clone(),
      this._scale.clone()
    );
    return clone;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `Transform | Pos: ${this._position.toString()}, Rot: ${this._rotation.toString()}, Scale: ${this._scale.toString()}`;
  }
}
