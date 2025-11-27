/**
 * TransformHierarchy
 * 
 * Manages transform updates in a hierarchical structure.
 * Efficiently propagates transform changes through the hierarchy using dirty flags.
 */

import { Transform } from './Transform';
import { EntityHierarchy } from './EntityHierarchy';

export class TransformHierarchy {
  private transforms: Map<string, Transform> = new Map();
  private entityHierarchy: EntityHierarchy;
  private dirtyTransforms: Set<string> = new Set();
  private updateOrder: string[] = [];
  private needsReorder: boolean = true;

  constructor(entityHierarchy: EntityHierarchy) {
    this.entityHierarchy = entityHierarchy;
  }

  /**
   * Add a transform to the hierarchy
   */
  addTransform(entityId: string, transform: Transform): void {
    this.transforms.set(entityId, transform);
    this.markDirty(entityId);
    this.needsReorder = true;
  }

  /**
   * Remove a transform from the hierarchy
   */
  removeTransform(entityId: string): void {
    this.transforms.delete(entityId);
    this.dirtyTransforms.delete(entityId);
    this.needsReorder = true;
  }

  /**
   * Get a transform
   */
  getTransform(entityId: string): Transform | null {
    return this.transforms.get(entityId) || null;
  }

  /**
   * Mark a transform as dirty (needs update)
   */
  markDirty(entityId: string): void {
    this.dirtyTransforms.add(entityId);
    
    // Mark all descendants as dirty
    const descendants = this.entityHierarchy.getDescendants(entityId);
    for (const descendant of descendants) {
      this.dirtyTransforms.add(descendant);
    }
  }

  /**
   * Update all dirty transforms
   */
  updateTransforms(): void {
    if (this.dirtyTransforms.size === 0) {
      return;
    }

    // Reorder if hierarchy changed
    if (this.needsReorder) {
      this.reorderTransforms();
    }

    // Update transforms in hierarchical order
    for (const entityId of this.updateOrder) {
      if (this.dirtyTransforms.has(entityId)) {
        this.updateTransform(entityId);
      }
    }

    // Clear dirty flags
    this.dirtyTransforms.clear();
  }

  /**
   * Update a single transform
   */
  private updateTransform(entityId: string): void {
    const transform = this.transforms.get(entityId);
    if (!transform) return;

    const parentId = this.entityHierarchy.getParent(entityId);
    
    if (parentId) {
      const parentTransform = this.transforms.get(parentId);
      if (parentTransform) {
        // Set parent transform to propagate world transform
        transform.setParent(parentTransform);
      }
    } else {
      // Root entity - no parent
      transform.setParent(null);
    }

    // Force update of world matrix
    transform.getWorldMatrix();
  }

  /**
   * Reorder transforms for efficient hierarchical updates
   */
  private reorderTransforms(): void {
    this.updateOrder = [];
    
    // Traverse hierarchy breadth-first to ensure parents are updated before children
    this.entityHierarchy.traverseBreadthFirst((entityId) => {
      if (this.transforms.has(entityId)) {
        this.updateOrder.push(entityId);
      }
    });

    this.needsReorder = false;
  }

  /**
   * Get world position of an entity
   */
  getWorldPosition(entityId: string): Float32Array | null {
    const transform = this.transforms.get(entityId);
    if (!transform) return null;

    const worldPos = transform.worldPosition;
    return new Float32Array([worldPos.x, worldPos.y, worldPos.z]);
  }

  /**
   * Get world rotation of an entity
   */
  getWorldRotation(entityId: string): Float32Array | null {
    const transform = this.transforms.get(entityId);
    if (!transform) return null;

    const worldRot = transform.worldRotation;
    return new Float32Array([worldRot.x, worldRot.y, worldRot.z, worldRot.w]);
  }

  /**
   * Get world scale of an entity
   */
  getWorldScale(entityId: string): Float32Array | null {
    const transform = this.transforms.get(entityId);
    if (!transform) return null;

    const worldScale = transform.worldScale;
    return new Float32Array([worldScale.x, worldScale.y, worldScale.z]);
  }

  /**
   * Get world matrix of an entity
   */
  getWorldMatrix(entityId: string): Float32Array | null {
    const transform = this.transforms.get(entityId);
    if (!transform) return null;

    return transform.getWorldMatrix();
  }

  /**
   * Get local matrix of an entity
   */
  getLocalMatrix(entityId: string): Float32Array | null {
    const transform = this.transforms.get(entityId);
    if (!transform) return null;

    return transform.getLocalMatrix();
  }

  /**
   * Set local position
   */
  setLocalPosition(entityId: string, x: number, y: number, z: number): void {
    const transform = this.transforms.get(entityId);
    if (!transform) return;

    transform.position.set(x, y, z);
    this.markDirty(entityId);
  }

  /**
   * Set local rotation (from euler angles)
   */
  setLocalRotation(entityId: string, x: number, y: number, z: number): void {
    const transform = this.transforms.get(entityId);
    if (!transform) return;

    transform.rotation.setFromEuler(x, y, z);
    this.markDirty(entityId);
  }

  /**
   * Set local scale
   */
  setLocalScale(entityId: string, x: number, y: number, z: number): void {
    const transform = this.transforms.get(entityId);
    if (!transform) return;

    transform.scale.set(x, y, z);
    this.markDirty(entityId);
  }

  /**
   * Translate entity in local space
   */
  translate(entityId: string, x: number, y: number, z: number): void {
    const transform = this.transforms.get(entityId);
    if (!transform) return;

    transform.position.add({ x, y, z } as any);
    this.markDirty(entityId);
  }

  /**
   * Rotate entity around axis
   */
  rotate(entityId: string, axisX: number, axisY: number, axisZ: number, angle: number): void {
    const transform = this.transforms.get(entityId);
    if (!transform) return;

    transform.rotate({ x: axisX, y: axisY, z: axisZ } as any, angle);
    this.markDirty(entityId);
  }

  /**
   * Scale entity uniformly
   */
  scaleUniform(entityId: string, factor: number): void {
    const transform = this.transforms.get(entityId);
    if (!transform) return;

    transform.scaleUniform(factor);
    this.markDirty(entityId);
  }

  /**
   * Make entity look at target position
   */
  lookAt(entityId: string, targetX: number, targetY: number, targetZ: number): void {
    const transform = this.transforms.get(entityId);
    if (!transform) return;

    transform.lookAt({ x: targetX, y: targetY, z: targetZ } as any);
    this.markDirty(entityId);
  }

  /**
   * Get transform count
   */
  getTransformCount(): number {
    return this.transforms.size;
  }

  /**
   * Get dirty transform count
   */
  getDirtyCount(): number {
    return this.dirtyTransforms.size;
  }

  /**
   * Clear all transforms
   */
  clear(): void {
    this.transforms.clear();
    this.dirtyTransforms.clear();
    this.updateOrder = [];
    this.needsReorder = true;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `TransformHierarchy | Transforms: ${this.transforms.size}, Dirty: ${this.dirtyTransforms.size}`;
  }

  /**
   * Get performance stats
   */
  getStats(): {
    totalTransforms: number;
    dirtyTransforms: number;
    updateOrderLength: number;
    needsReorder: boolean;
  } {
    return {
      totalTransforms: this.transforms.size,
      dirtyTransforms: this.dirtyTransforms.size,
      updateOrderLength: this.updateOrder.length,
      needsReorder: this.needsReorder
    };
  }
}
