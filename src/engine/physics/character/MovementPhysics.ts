/**
 * Movement Physics System
 * Handles physics calculations for character movement
 */

import * as THREE from 'three';
import { MovementState } from './MovementStateMachine';

export interface MovementConfig {
  // Speed settings (m/s)
  walkSpeed: number;
  runSpeed: number;
  crouchSpeed: number;
  
  // Jump settings
  jumpForce: number;
  jumpCooldown: number;
  
  // Acceleration
  groundAcceleration: number;
  groundDeceleration: number;
  airAcceleration: number;
  
  // Physics
  gravity: number;
  
  // Friction
  groundFriction: number;
  airFriction: number;
  
  // Limits
  maxSlopeAngle: number;
  stepHeight: number;
}

export class MovementPhysics {
  private config: MovementConfig;
  
  constructor(config: Partial<MovementConfig> = {}) {
    this.config = {
      // Default values
      walkSpeed: 3.0,
      runSpeed: 6.0,
      crouchSpeed: 1.5,
      jumpForce: 5.0,
      jumpCooldown: 0.3,
      groundAcceleration: 50.0,
      groundDeceleration: 50.0,
      airAcceleration: 10.0,
      gravity: 9.81,
      groundFriction: 10.0,
      airFriction: 0.1,
      maxSlopeAngle: 45,
      stepHeight: 0.3,
      ...config
    };
  }
  
  /**
   * Calculate movement velocity
   */
  calculateMovement(
    input: THREE.Vector3,           // Normalized input direction
    currentVelocity: THREE.Vector3,
    state: MovementState,
    isGrounded: boolean,
    deltaTime: number
  ): THREE.Vector3 {
    const targetSpeed = this.getTargetSpeed(state);
    const acceleration = isGrounded ? 
      this.config.groundAcceleration : 
      this.config.airAcceleration;
    
    // Calculate target velocity
    const targetVelocity = input.clone().multiplyScalar(targetSpeed);
    
    // Interpolate towards target
    const newVelocity = currentVelocity.clone();
    
    if (input.length() > 0) {
      // Apply acceleration
      newVelocity.x = this.moveTowards(
        currentVelocity.x,
        targetVelocity.x,
        acceleration * deltaTime
      );
      newVelocity.z = this.moveTowards(
        currentVelocity.z,
        targetVelocity.z,
        acceleration * deltaTime
      );
    } else if (isGrounded) {
      // Apply friction when no input
      const friction = this.config.groundFriction;
      newVelocity.x *= Math.max(0, 1 - friction * deltaTime);
      newVelocity.z *= Math.max(0, 1 - friction * deltaTime);
      
      // Stop completely if very slow
      if (Math.abs(newVelocity.x) < 0.01) newVelocity.x = 0;
      if (Math.abs(newVelocity.z) < 0.01) newVelocity.z = 0;
    } else {
      // Air friction
      const airFriction = this.config.airFriction;
      newVelocity.x *= Math.max(0, 1 - airFriction * deltaTime);
      newVelocity.z *= Math.max(0, 1 - airFriction * deltaTime);
    }
    
    return newVelocity;
  }
  
  /**
   * Get target speed based on movement state
   */
  private getTargetSpeed(state: MovementState): number {
    switch (state) {
      case MovementState.RUNNING:
        return this.config.runSpeed;
      case MovementState.CROUCHING:
        return this.config.crouchSpeed;
      case MovementState.WALKING:
      case MovementState.IDLE:
      default:
        return this.config.walkSpeed;
    }
  }
  
  /**
   * Move value towards target
   */
  private moveTowards(current: number, target: number, maxDelta: number): number {
    if (Math.abs(target - current) <= maxDelta) {
      return target;
    }
    return current + Math.sign(target - current) * maxDelta;
  }
  
  /**
   * Get jump force
   */
  getJumpForce(): number {
    return this.config.jumpForce;
  }
  
  /**
   * Get gravity
   */
  getGravity(): number {
    return this.config.gravity;
  }
  
  /**
   * Get configuration
   */
  getConfig(): MovementConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<MovementConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
