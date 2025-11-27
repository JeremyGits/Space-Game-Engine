/**
 * TransformComponent
 * 
 * Represents position, rotation, and scale in 3D space.
 * Essential component for any object that exists in the game world.
 */

import { Component } from '../Component';
import { Vector3 } from '../../../../utils/math/Vector3';
import { Quaternion } from '../../../../utils/math/Quaternion';

export class TransformComponent extends Component {
  // Position in world space
  public position: Vector3;
  
  // Rotation as quaternion
  public rotation: Quaternion;
  
  // Scale
  public scale: Vector3;
  
  // Local transform (relative to parent)
  public localPosition: Vector3;
  public localRotation: Quaternion;
  public localScale: Vector3;
  
  // Parent transform reference
  public parent: TransformComponent | null = null;
  
  // Children transforms
  public children: TransformComponent[] = [];
  
  // Cached matrices
  private worldMatrix: Float32Array | null = null;
  private localMatrix: Float32Array | null = null;
  private dirty: boolean = true;

  constructor() {
    super('Transform');
    
    this.position = new Vector3(0, 0, 0);
    this.rotation = new Quaternion(0, 0, 0, 1);
    this.scale = new Vector3(1, 1, 1);
    
    this.localPosition = new Vector3(0, 0, 0);
    this.localRotation = new Quaternion(0, 0, 0, 1);
    this.localScale = new Vector3(1, 1, 1);
  }

  /**
   * Set position
   */
  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    this.markDirty();
  }

  /**
   * Set rotation from Euler angles (degrees)
   */
  setRotation(x: number, y: number, z: number): void {
    this.rotation = Quaternion.fromEuler(x, y, z);
    this.markDirty();
  }

  /**
   * Set scale
   */
  setScale(x: number, y: number, z: number): void {
    this.scale.set(x, y, z);
    this.markDirty();
  }

  /**
   * Translate by offset
   */
  translate(x: number, y: number, z: number): void {
    this.position.x += x;
    this.position.y += y;
    this.position.z += z;
    this.markDirty();
  }

  /**
   * Rotate by Euler angles (degrees)
   */
  rotate(x: number, y: number, z: number): void {
    const deltaRotation = Quaternion.fromEuler(x, y, z);
    this.rotation.multiply(deltaRotation);
    this.markDirty();
  }

  /**
   * Look at target position
   */
  lookAt(target: Vector3, up: Vector3 = new Vector3(0, 1, 0)): void {
    const direction = target.clone().sub(this.position).normalize();
    this.rotation = Quaternion.lookRotation(direction, up);
    this.markDirty();
  }

  /**
   * Get forward vector
   */
  getForward(): Vector3 {
    return this.rotation.multiplyVector(new Vector3(0, 0, -1));
  }

  /**
   * Get right vector
   */
  getRight(): Vector3 {
    return this.rotation.multiplyVector(new Vector3(1, 0, 0));
  }

  /**
   * Get up vector
   */
  getUp(): Vector3 {
    return this.rotation.multiplyVector(new Vector3(0, 1, 0));
  }

  /**
   * Set parent transform
   */
  setParent(parent: TransformComponent | null): void {
    // Remove from old parent
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index !== -1) {
        this.parent.children.splice(index, 1);
      }
    }

    this.parent = parent;

    // Add to new parent
    if (parent) {
      parent.children.push(this);
    }

    this.markDirty();
  }

  /**
   * Mark transform as dirty (needs recalculation)
   */
  private markDirty(): void {
    this.dirty = true;
    this.worldMatrix = null;
    
    // Mark children as dirty too
    this.children.forEach(child => child.markDirty());
  }

  /**
   * Update world transform from local transform
   */
  updateWorldTransform(): void {
    if (!this.dirty) return;

    if (this.parent) {
      // Calculate world transform from parent
      this.parent.updateWorldTransform();
      
      // World = Parent * Local
      this.position = this.parent.position.clone().add(
        this.parent.rotation.multiplyVector(this.localPosition)
      );
      
      this.rotation = this.parent.rotation.clone().multiply(this.localRotation);
      
      this.scale.set(
        this.parent.scale.x * this.localScale.x,
        this.parent.scale.y * this.localScale.y,
        this.parent.scale.z * this.localScale.z
      );
    } else {
      // No parent, world = local
      this.position.copy(this.localPosition);
      this.rotation.copy(this.localRotation);
      this.scale.copy(this.localScale);
    }

    this.dirty = false;
  }

  /**
   * Get world matrix
   */
  getWorldMatrix(): Float32Array {
    if (!this.worldMatrix) {
      this.updateWorldTransform();
      this.worldMatrix = this.calculateMatrix(this.position, this.rotation, this.scale);
    }
    return this.worldMatrix;
  }

  /**
   * Get local matrix
   */
  getLocalMatrix(): Float32Array {
    if (!this.localMatrix) {
      this.localMatrix = this.calculateMatrix(this.localPosition, this.localRotation, this.localScale);
    }
    return this.localMatrix;
  }

  /**
   * Calculate transformation matrix
   */
  private calculateMatrix(pos: Vector3, rot: Quaternion, scale: Vector3): Float32Array {
    const matrix = new Float32Array(16);
    
    // Convert quaternion to rotation matrix
    const x = rot.x, y = rot.y, z = rot.z, w = rot.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    // Apply scale and rotation
    matrix[0] = (1 - (yy + zz)) * scale.x;
    matrix[1] = (xy + wz) * scale.x;
    matrix[2] = (xz - wy) * scale.x;
    matrix[3] = 0;

    matrix[4] = (xy - wz) * scale.y;
    matrix[5] = (1 - (xx + zz)) * scale.y;
    matrix[6] = (yz + wx) * scale.y;
    matrix[7] = 0;

    matrix[8] = (xz + wy) * scale.z;
    matrix[9] = (yz - wx) * scale.z;
    matrix[10] = (1 - (xx + yy)) * scale.z;
    matrix[11] = 0;

    // Apply translation
    matrix[12] = pos.x;
    matrix[13] = pos.y;
    matrix[14] = pos.z;
    matrix[15] = 1;

    return matrix;
  }

  /**
   * Reset to default values
   */
  reset(): void {
    this.position.set(0, 0, 0);
    this.rotation.set(0, 0, 0, 1);
    this.scale.set(1, 1, 1);
    this.localPosition.set(0, 0, 0);
    this.localRotation.set(0, 0, 0, 1);
    this.localScale.set(1, 1, 1);
    this.parent = null;
    this.children = [];
    this.markDirty();
  }

  /**
   * Clone transform
   */
  clone(): TransformComponent {
    const cloned = new TransformComponent();
    cloned.position.copy(this.position);
    cloned.rotation.copy(this.rotation);
    cloned.scale.copy(this.scale);
    cloned.localPosition.copy(this.localPosition);
    cloned.localRotation.copy(this.localRotation);
    cloned.localScale.copy(this.localScale);
    return cloned;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): Record<string, any> {
    return {
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      rotation: { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z, w: this.rotation.w },
      scale: { x: this.scale.x, y: this.scale.y, z: this.scale.z },
      localPosition: { x: this.localPosition.x, y: this.localPosition.y, z: this.localPosition.z },
      localRotation: { x: this.localRotation.x, y: this.localRotation.y, z: this.localRotation.z, w: this.localRotation.w },
      localScale: { x: this.localScale.x, y: this.localScale.y, z: this.localScale.z }
    };
  }

  /**
   * Deserialize from JSON
   */
  fromJSON(data: Record<string, any>): void {
    if (data.position) {
      this.position.set(data.position.x, data.position.y, data.position.z);
    }
    if (data.rotation) {
      this.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z, data.rotation.w);
    }
    if (data.scale) {
      this.scale.set(data.scale.x, data.scale.y, data.scale.z);
    }
    if (data.localPosition) {
      this.localPosition.set(data.localPosition.x, data.localPosition.y, data.localPosition.z);
    }
    if (data.localRotation) {
      this.localRotation.set(data.localRotation.x, data.localRotation.y, data.localRotation.z, data.localRotation.w);
    }
    if (data.localScale) {
      this.localScale.set(data.localScale.x, data.localScale.y, data.localScale.z);
    }
    this.markDirty();
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `Transform | Pos: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}, ${this.position.z.toFixed(2)}) | Children: ${this.children.length}`;
  }
}
