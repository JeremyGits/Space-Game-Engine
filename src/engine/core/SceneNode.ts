/**
 * SceneNode
 * 
 * Base class for all objects in the scene graph.
 * Provides hierarchical transform management and lifecycle.
 */

import { ISceneNode } from '../../types/engine/SceneTypes';

export class SceneNode implements ISceneNode {
  public id: string;
  public name: string;
  public parent: ISceneNode | null = null;
  public children: ISceneNode[] = [];
  public active: boolean = true;
  
  // Transform (local space)
  protected position: [number, number, number] = [0, 0, 0];
  protected rotation: [number, number, number, number] = [0, 0, 0, 1]; // Quaternion
  protected scale: [number, number, number] = [1, 1, 1];
  
  // Cached world transform
  private worldPosition: [number, number, number] = [0, 0, 0];
  private worldRotation: [number, number, number, number] = [0, 0, 0, 1];
  private worldScale: [number, number, number] = [1, 1, 1];
  private worldTransformDirty: boolean = true;
  
  // Metadata
  public tags: Set<string> = new Set();
  public layer: number = 0;
  public userData: Record<string, any> = {};

  constructor(name: string = 'SceneNode') {
    this.id = this.generateId();
    this.name = name;
  }

  /**
   * Initialize the node
   */
  initialize(): void {
    // Override in derived classes
    this.children.forEach(child => child.initialize());
  }

  /**
   * Update the node
   */
  update(deltaTime: number): void {
    if (!this.active) {
      return;
    }

    // Update this node
    this.onUpdate(deltaTime);

    // Update children
    this.children.forEach(child => {
      if (child.active) {
        child.update(deltaTime);
      }
    });
  }

  /**
   * Destroy the node
   */
  destroy(): void {
    // Destroy children first
    this.children.forEach(child => child.destroy());
    this.children = [];

    // Remove from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }

    // Override in derived classes for cleanup
    this.onDestroy();
  }

  /**
   * Add a child node
   */
  addChild(child: ISceneNode): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }

    this.children.push(child);
    child.parent = this;
    this.markWorldTransformDirty();
  }

  /**
   * Remove a child node
   */
  removeChild(child: ISceneNode): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
    }
  }

  /**
   * Get a child by name
   */
  getChild(name: string): ISceneNode | null {
    return this.children.find(child => child.name === name) || null;
  }

  /**
   * Get all children
   */
  getChildren(): ISceneNode[] {
    return [...this.children];
  }

  /**
   * Find a descendant by name (recursive)
   */
  findDescendant(name: string): ISceneNode | null {
    // Check direct children
    const child = this.getChild(name);
    if (child) {
      return child;
    }

    // Check descendants
    for (const child of this.children) {
      const descendant = child.getChild(name);
      if (descendant) {
        return descendant;
      }
    }

    return null;
  }

  /**
   * Get world position
   */
  getWorldPosition(): [number, number, number] {
    this.updateWorldTransform();
    return [...this.worldPosition] as [number, number, number];
  }

  /**
   * Get world rotation
   */
  getWorldRotation(): [number, number, number, number] {
    this.updateWorldTransform();
    return [...this.worldRotation] as [number, number, number, number];
  }

  /**
   * Get world scale
   */
  getWorldScale(): [number, number, number] {
    this.updateWorldTransform();
    return [...this.worldScale] as [number, number, number];
  }

  /**
   * Set local position
   */
  setPosition(x: number, y: number, z: number): void {
    this.position = [x, y, z];
    this.markWorldTransformDirty();
  }

  /**
   * Get local position
   */
  getPosition(): [number, number, number] {
    return [...this.position] as [number, number, number];
  }

  /**
   * Set local rotation (quaternion)
   */
  setRotation(x: number, y: number, z: number, w: number): void {
    this.rotation = [x, y, z, w];
    this.markWorldTransformDirty();
  }

  /**
   * Get local rotation
   */
  getRotation(): [number, number, number, number] {
    return [...this.rotation] as [number, number, number, number];
  }

  /**
   * Set local scale
   */
  setScale(x: number, y: number, z: number): void {
    this.scale = [x, y, z];
    this.markWorldTransformDirty();
  }

  /**
   * Get local scale
   */
  getScale(): [number, number, number] {
    return [...this.scale] as [number, number, number];
  }

  /**
   * Add a tag
   */
  addTag(tag: string): void {
    this.tags.add(tag);
  }

  /**
   * Remove a tag
   */
  removeTag(tag: string): void {
    this.tags.delete(tag);
  }

  /**
   * Check if has tag
   */
  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  /**
   * Set active state
   */
  setActive(active: boolean): void {
    this.active = active;
  }

  /**
   * Check if active in hierarchy
   */
  isActiveInHierarchy(): boolean {
    if (!this.active) {
      return false;
    }

    if (this.parent) {
      return this.parent.isActiveInHierarchy();
    }

    return true;
  }

  /**
   * Get depth in hierarchy
   */
  getDepth(): number {
    let depth = 0;
    let current: ISceneNode | null = this.parent;
    
    while (current) {
      depth++;
      current = current.parent;
    }
    
    return depth;
  }

  /**
   * Get root node
   */
  getRoot(): ISceneNode {
    let root: ISceneNode = this;
    while (root.parent) {
      root = root.parent;
    }
    return root;
  }

  /**
   * Override in derived classes
   */
  protected onUpdate(_deltaTime: number): void {
    // Override in derived classes
  }

  /**
   * Override in derived classes
   */
  protected onDestroy(): void {
    // Override in derived classes
  }

  /**
   * Update world transform
   */
  private updateWorldTransform(): void {
    if (!this.worldTransformDirty) {
      return;
    }

    if (this.parent) {
      // Get parent world transform
      const parentPos = this.parent.getWorldPosition();
      const parentRot = this.parent.getWorldRotation();
      const parentScale = this.parent.getWorldScale();

      // Combine transforms (simplified - proper implementation would use matrices)
      this.worldPosition = [
        parentPos[0] + this.position[0] * parentScale[0],
        parentPos[1] + this.position[1] * parentScale[1],
        parentPos[2] + this.position[2] * parentScale[2]
      ];

      // Combine rotations (simplified quaternion multiplication)
      this.worldRotation = this.multiplyQuaternions(parentRot, this.rotation);

      // Combine scales
      this.worldScale = [
        parentScale[0] * this.scale[0],
        parentScale[1] * this.scale[1],
        parentScale[2] * this.scale[2]
      ];
    } else {
      // No parent, world = local
      this.worldPosition = [...this.position] as [number, number, number];
      this.worldRotation = [...this.rotation] as [number, number, number, number];
      this.worldScale = [...this.scale] as [number, number, number];
    }

    this.worldTransformDirty = false;
  }

  /**
   * Mark world transform as dirty
   */
  private markWorldTransformDirty(): void {
    this.worldTransformDirty = true;
    
    // Mark all children as dirty
    this.children.forEach(child => {
      if (child instanceof SceneNode) {
        child.markWorldTransformDirty();
      }
    });
  }

  /**
   * Multiply two quaternions (simplified)
   */
  private multiplyQuaternions(
    a: [number, number, number, number],
    b: [number, number, number, number]
  ): [number, number, number, number] {
    const [ax, ay, az, aw] = a;
    const [bx, by, bz, bw] = b;

    return [
      ax * bw + aw * bx + ay * bz - az * by,
      ay * bw + aw * by + az * bx - ax * bz,
      az * bw + aw * bz + ax * by - ay * bx,
      aw * bw - ax * bx - ay * by - az * bz
    ];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clone this node (shallow)
   */
  clone(): SceneNode {
    const cloned = new SceneNode(this.name);
    cloned.position = [...this.position] as [number, number, number];
    cloned.rotation = [...this.rotation] as [number, number, number, number];
    cloned.scale = [...this.scale] as [number, number, number];
    cloned.active = this.active;
    cloned.layer = this.layer;
    cloned.tags = new Set(this.tags);
    cloned.userData = { ...this.userData };
    return cloned;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `${this.name} (${this.id}) - Children: ${this.children.length}, Active: ${this.active}, Depth: ${this.getDepth()}`;
  }
}
