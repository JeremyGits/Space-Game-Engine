/**
 * Camera
 * 
 * Base camera class for rendering
 */

import { Vector3 } from '../../../utils/math/Vector3';
import { Matrix4 } from '../../../utils/math/Matrix4';
import { Quaternion } from '../../../utils/math/Quaternion';
import { EventEmitter } from '../../core/EventEmitter';

/**
 * Camera projection type
 */
export enum CameraProjection {
  PERSPECTIVE = 'perspective',
  ORTHOGRAPHIC = 'orthographic'
}

/**
 * Camera configuration
 */
export interface CameraConfig {
  projection: CameraProjection;
  fov?: number;
  aspect?: number;
  near: number;
  far: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

/**
 * Base camera class
 */
export class Camera extends EventEmitter {
  // Transform
  public position: Vector3;
  public rotation: Quaternion;
  public target: Vector3;
  public up: Vector3;
  
  // Projection
  protected projection: CameraProjection;
  protected fov: number;
  protected aspect: number;
  protected near: number;
  protected far: number;
  protected left: number;
  protected right: number;
  protected top: number;
  protected bottom: number;
  
  // Matrices
  protected viewMatrix: Matrix4;
  protected projectionMatrix: Matrix4;
  protected viewProjectionMatrix: Matrix4;
  protected inverseViewMatrix: Matrix4;
  protected inverseProjectionMatrix: Matrix4;
  
  // Flags
  protected viewMatrixDirty: boolean = true;
  protected projectionMatrixDirty: boolean = true;
  
  /**
   * Create camera
   */
  constructor(config: CameraConfig) {
    super();
    
    this.position = new Vector3(0, 0, 10);
    this.rotation = new Quaternion();
    this.target = new Vector3(0, 0, 0);
    this.up = new Vector3(0, 1, 0);
    
    this.projection = config.projection;
    this.fov = config.fov || 75;
    this.aspect = config.aspect || 16 / 9;
    this.near = config.near;
    this.far = config.far;
    this.left = config.left || -1;
    this.right = config.right || 1;
    this.top = config.top || 1;
    this.bottom = config.bottom || -1;
    
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.viewProjectionMatrix = new Matrix4();
    this.inverseViewMatrix = new Matrix4();
    this.inverseProjectionMatrix = new Matrix4();
    
    this.updateProjectionMatrix();
  }
  
  /**
   * Update view matrix
   */
  updateViewMatrix(): void {
    if (!this.viewMatrixDirty) return;
    
    this.viewMatrix.lookAt(this.position, this.target, this.up);
    this.inverseViewMatrix.copy(this.viewMatrix).invert();
    
    this.viewMatrixDirty = false;
    this.updateViewProjectionMatrix();
  }
  
  /**
   * Update projection matrix
   */
  updateProjectionMatrix(): void {
    if (!this.projectionMatrixDirty) return;
    
    if (this.projection === CameraProjection.PERSPECTIVE) {
      // Convert FOV to frustum bounds
      const top = this.near * Math.tan((this.fov * Math.PI / 180) * 0.5);
      const height = 2 * top;
      const width = this.aspect * height;
      const left = -0.5 * width;
      const right = left + width;
      const bottom = top - height;
      
      this.projectionMatrix.makePerspective(
        left,
        right,
        top,
        bottom,
        this.near,
        this.far
      );
    } else {
      this.projectionMatrix.makeOrthographic(
        this.left,
        this.right,
        this.top,
        this.bottom,
        this.near,
        this.far
      );
    }
    
    this.inverseProjectionMatrix.copy(this.projectionMatrix).invert();
    
    this.projectionMatrixDirty = false;
    this.updateViewProjectionMatrix();
  }
  
  /**
   * Update view-projection matrix
   */
  protected updateViewProjectionMatrix(): void {
    this.viewProjectionMatrix.copy(this.projectionMatrix).multiply(this.viewMatrix);
  }
  
  /**
   * Update camera
   */
  update(_deltaTime: number): void {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
  }
  
  /**
   * Look at target
   */
  lookAt(target: Vector3): void {
    this.target.copy(target);
    this.viewMatrixDirty = true;
  }
  
  /**
   * Set position
   */
  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    this.viewMatrixDirty = true;
  }
  
  /**
   * Set aspect ratio
   */
  setAspect(aspect: number): void {
    this.aspect = aspect;
    this.projectionMatrixDirty = true;
  }
  
  /**
   * Set field of view
   */
  setFov(fov: number): void {
    this.fov = fov;
    this.projectionMatrixDirty = true;
  }
  
  /**
   * Set near/far planes
   */
  setClippingPlanes(near: number, far: number): void {
    this.near = near;
    this.far = far;
    this.projectionMatrixDirty = true;
  }
  
  /**
   * Get view matrix
   */
  getViewMatrix(): Matrix4 {
    this.updateViewMatrix();
    return this.viewMatrix;
  }
  
  /**
   * Get projection matrix
   */
  getProjectionMatrix(): Matrix4 {
    this.updateProjectionMatrix();
    return this.projectionMatrix;
  }
  
  /**
   * Get view-projection matrix
   */
  getViewProjectionMatrix(): Matrix4 {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
    return this.viewProjectionMatrix;
  }
  
  /**
   * Get inverse view matrix
   */
  getInverseViewMatrix(): Matrix4 {
    this.updateViewMatrix();
    return this.inverseViewMatrix;
  }
  
  /**
   * Get inverse projection matrix
   */
  getInverseProjectionMatrix(): Matrix4 {
    this.updateProjectionMatrix();
    return this.inverseProjectionMatrix;
  }
  
  /**
   * Get forward vector
   */
  getForward(): Vector3 {
    return this.target.clone().subtract(this.position).normalize();
  }
  
  /**
   * Get right vector
   */
  getRight(): Vector3 {
    return this.getForward().cross(this.up).normalize();
  }
  
  /**
   * Get up vector
   */
  getUp(): Vector3 {
    return this.up.clone();
  }
  
  /**
   * Screen to world coordinates
   */
  screenToWorld(screenX: number, screenY: number, screenZ: number = 0): Vector3 {
    // Normalize screen coordinates to NDC (-1 to 1)
    const ndc = new Vector3(
      screenX * 2 - 1,
      -(screenY * 2 - 1),
      screenZ * 2 - 1
    );
    
    // Transform by inverse projection matrix
    const clip = ndc.clone();
    const invProj = this.getInverseProjectionMatrix();
    const te = invProj.elements;
    
    const x = clip.x * te[0] + clip.y * te[4] + clip.z * te[8] + te[12];
    const y = clip.x * te[1] + clip.y * te[5] + clip.z * te[9] + te[13];
    const z = clip.x * te[2] + clip.y * te[6] + clip.z * te[10] + te[14];
    const w = clip.x * te[3] + clip.y * te[7] + clip.z * te[11] + te[15];
    
    const view = new Vector3(x / w, y / w, z / w);
    
    // Transform by inverse view matrix
    const invView = this.getInverseViewMatrix();
    const ve = invView.elements;
    
    const wx = view.x * ve[0] + view.y * ve[4] + view.z * ve[8] + ve[12];
    const wy = view.x * ve[1] + view.y * ve[5] + view.z * ve[9] + ve[13];
    const wz = view.x * ve[2] + view.y * ve[6] + view.z * ve[10] + ve[14];
    
    return new Vector3(wx, wy, wz);
  }
  
  /**
   * World to screen coordinates
   */
  worldToScreen(world: Vector3): Vector3 {
    // Transform by view matrix
    const view = this.getViewMatrix();
    const ve = view.elements;
    
    let x = world.x * ve[0] + world.y * ve[4] + world.z * ve[8] + ve[12];
    let y = world.x * ve[1] + world.y * ve[5] + world.z * ve[9] + ve[13];
    let z = world.x * ve[2] + world.y * ve[6] + world.z * ve[10] + ve[14];
    let w = world.x * ve[3] + world.y * ve[7] + world.z * ve[11] + ve[15];
    
    // Transform by projection matrix
    const proj = this.getProjectionMatrix();
    const pe = proj.elements;
    
    const px = x * pe[0] + y * pe[4] + z * pe[8] + w * pe[12];
    const py = x * pe[1] + y * pe[5] + z * pe[9] + w * pe[13];
    const pz = x * pe[2] + y * pe[6] + z * pe[10] + w * pe[14];
    const pw = x * pe[3] + y * pe[7] + z * pe[11] + w * pe[15];
    
    // Perspective divide
    const ndcX = px / pw;
    const ndcY = py / pw;
    const ndcZ = pz / pw;
    
    // Convert from NDC to screen space
    return new Vector3(
      (ndcX + 1) / 2,
      (1 - ndcY) / 2,
      (ndcZ + 1) / 2
    );
  }
  
  /**
   * Get ray from screen position
   */
  getRay(screenX: number, screenY: number): { origin: Vector3; direction: Vector3 } {
    const near = this.screenToWorld(screenX, screenY, 0);
    const far = this.screenToWorld(screenX, screenY, 1);
    
    return {
      origin: near,
      direction: far.subtract(near).normalize()
    };
  }
  
  /**
   * Clone camera
   */
  clone(): Camera {
    const camera = new Camera({
      projection: this.projection,
      fov: this.fov,
      aspect: this.aspect,
      near: this.near,
      far: this.far,
      left: this.left,
      right: this.right,
      top: this.top,
      bottom: this.bottom
    });
    
    camera.position.copy(this.position);
    camera.rotation.copy(this.rotation);
    camera.target.copy(this.target);
    camera.up.copy(this.up);
    
    return camera;
  }
  
  /**
   * Dispose camera
   */
  dispose(): void {
    this.removeAllListeners();
  }
}
