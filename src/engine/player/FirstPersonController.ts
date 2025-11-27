/**
 * First Person Controller
 * Engine-level player controller with defined coordinate system
 * 
 * COORDINATE SYSTEM:
 * - Forward: -Z axis (into screen)
 * - Back: +Z axis (out of screen)
 * - Right: +X axis
 * - Left: -X axis
 * - Up: +Y axis
 * - Down: -Y axis
 * 
 * CAMERA:
 * - Pitch: Rotation around X axis (look up/down)
 * - Yaw: Rotation around Y axis (look left/right)
 * - Roll: Rotation around Z axis (tilt - usually locked)
 */

import * as THREE from 'three';

export interface FirstPersonInput {
  moveForward: number;   // -1 to 1
  moveRight: number;     // -1 to 1
  moveUp: number;        // -1 to 1 (for flying/swimming)
  lookDeltaX: number;    // Mouse delta X
  lookDeltaY: number;    // Mouse delta Y
  sprint: boolean;
  crouch: boolean;
  jump: boolean;
}

export interface FirstPersonConfig {
  // Movement
  walkSpeed: number;
  runSpeed: number;
  crouchSpeed: number;
  
  // Camera
  mouseSensitivity: number;
  invertY: boolean;
  minPitch: number;      // degrees
  maxPitch: number;      // degrees
  
  // Position
  eyeHeight: number;
  crouchHeight: number;
}

export class FirstPersonController {
  private position: THREE.Vector3;
  private rotation: THREE.Euler;
  private velocity: THREE.Vector3;
  
  private pitch: number = 0;  // Up/down rotation (degrees)
  private yaw: number = 0;    // Left/right rotation (degrees)
  
  private config: FirstPersonConfig;
  
  constructor(config?: Partial<FirstPersonConfig>) {
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3();
    
    this.config = {
      walkSpeed: 3.0,
      runSpeed: 6.0,
      crouchSpeed: 1.5,
      mouseSensitivity: 0.002,
      invertY: false,
      minPitch: -89,
      maxPitch: 89,
      eyeHeight: 1.6,
      crouchHeight: 0.8,
      ...config
    };
  }
  
  /**
   * Update controller
   */
  update(input: FirstPersonInput, deltaTime: number): void {
    // Update camera rotation
    this.updateRotation(input);
    
    // Calculate movement
    this.updateMovement(input, deltaTime);
  }
  
  /**
   * Update camera rotation from mouse input
   */
  private updateRotation(input: FirstPersonInput): void {
    // Update yaw (left/right)
    this.yaw -= input.lookDeltaX * this.config.mouseSensitivity * 180 / Math.PI;
    
    // Update pitch (up/down)
    const pitchDelta = input.lookDeltaY * this.config.mouseSensitivity * 180 / Math.PI;
    this.pitch += this.config.invertY ? pitchDelta : -pitchDelta;
    
    // Clamp pitch
    this.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, this.pitch));
    
    // Update rotation euler
    this.rotation.set(
      this.pitch * Math.PI / 180,
      this.yaw * Math.PI / 180,
      0,
      'YXZ'
    );
  }
  
  /**
   * Update movement from input
   */
  private updateMovement(input: FirstPersonInput, deltaTime: number): void {
    // Determine speed
    let speed = this.config.walkSpeed;
    if (input.sprint) speed = this.config.runSpeed;
    if (input.crouch) speed = this.config.crouchSpeed;
    
    // Get forward and right vectors from yaw only (ignore pitch for movement)
    const forward = new THREE.Vector3(0, 0, -1);
    const yawQuat = new THREE.Quaternion();
    yawQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw * Math.PI / 180);
    forward.applyQuaternion(yawQuat);
    
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(yawQuat);
    
    // Calculate movement direction
    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(forward, input.moveForward);
    moveDir.addScaledVector(right, input.moveRight);
    
    // Normalize if moving
    if (moveDir.length() > 0) {
      moveDir.normalize();
    }
    
    // Apply speed
    this.velocity.copy(moveDir.multiplyScalar(speed));
    
    // Update position
    this.position.addScaledVector(this.velocity, deltaTime);
  }
  
  /**
   * Get camera position (position + eye height)
   */
  getCameraPosition(): THREE.Vector3 {
    const eyeHeight = this.config.eyeHeight;
    return new THREE.Vector3(
      this.position.x,
      this.position.y + eyeHeight,
      this.position.z
    );
  }
  
  /**
   * Get camera quaternion
   */
  getCameraQuaternion(): THREE.Quaternion {
    const quat = new THREE.Quaternion();
    quat.setFromEuler(this.rotation);
    return quat;
  }
  
  /**
   * Get camera rotation (euler)
   */
  getCameraRotation(): THREE.Euler {
    return this.rotation.clone();
  }
  
  /**
   * Get player position (feet)
   */
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }
  
  /**
   * Set player position
   */
  setPosition(pos: THREE.Vector3): void {
    this.position.copy(pos);
  }
  
  /**
   * Get velocity
   */
  getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }
  
  /**
   * Get forward vector (where player is facing)
   */
  getForwardVector(): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, -1);
    const yawQuat = new THREE.Quaternion();
    yawQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw * Math.PI / 180);
    forward.applyQuaternion(yawQuat);
    return forward;
  }
  
  /**
   * Get right vector
   */
  getRightVector(): THREE.Vector3 {
    const right = new THREE.Vector3(1, 0, 0);
    const yawQuat = new THREE.Quaternion();
    yawQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw * Math.PI / 180);
    right.applyQuaternion(yawQuat);
    return right;
  }
  
  /**
   * Set yaw (facing direction)
   */
  setYaw(degrees: number): void {
    this.yaw = degrees;
  }
  
  /**
   * Set pitch (look up/down)
   */
  setPitch(degrees: number): void {
    this.pitch = Math.max(this.config.minPitch, Math.min(this.config.maxPitch, degrees));
  }
  
  /**
   * Reset controller
   */
  reset(): void {
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.pitch = 0;
    this.yaw = 0;
  }
}
