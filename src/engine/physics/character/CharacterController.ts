/**
 * Character Controller
 * Main orchestrator for character movement and physics
 */

import * as THREE from 'three';
import { MovementStateMachine, MovementState } from './MovementStateMachine';
import { GroundDetector, GroundInfo } from './GroundDetector';
import { MovementPhysics, MovementConfig } from './MovementPhysics';
import { SlopeHandler } from './SlopeHandler';
import { StaminaSystem } from './StaminaSystem';

export interface CharacterInput {
  moveForward: number;   // -1 to 1
  moveRight: number;     // -1 to 1
  jump: boolean;
  sprint: boolean;
  crouch: boolean;
}

export class CharacterController {
  private stateMachine: MovementStateMachine;
  private groundDetector: GroundDetector;
  private physics: MovementPhysics;
  private slopeHandler: SlopeHandler;
  private stamina: StaminaSystem;
  
  private velocity = new THREE.Vector3();
  private jumpCooldown = 0;
  private lastGroundInfo: GroundInfo | null = null;
  
  constructor(config?: Partial<MovementConfig>) {
    this.stateMachine = new MovementStateMachine();
    this.groundDetector = new GroundDetector();
    this.physics = new MovementPhysics(config);
    this.slopeHandler = new SlopeHandler();
    this.stamina = new StaminaSystem();
  }
  
  /**
   * Main update loop
   */
  update(
    input: CharacterInput,
    position: THREE.Vector3,
    cameraRotation: THREE.Quaternion,
    rapierWorld: any,
    deltaTime: number
  ): THREE.Vector3 {
    // Update timers
    this.jumpCooldown = Math.max(0, this.jumpCooldown - deltaTime);
    
    // Detect ground
    const groundInfo = this.groundDetector.detect(position, rapierWorld);
    this.lastGroundInfo = groundInfo;
    
    // Update state machine
    this.updateState(input, groundInfo);
    
    // Update stamina
    const isSprinting = this.stateMachine.getState() === MovementState.RUNNING;
    this.stamina.update(deltaTime, isSprinting);
    
    // Calculate movement direction
    const moveDirection = this.calculateMoveDirection(input, cameraRotation);
    
    // Calculate new velocity
    const horizontalVelocity = this.physics.calculateMovement(
      moveDirection,
      new THREE.Vector3(this.velocity.x, 0, this.velocity.z),
      this.stateMachine.getState(),
      groundInfo.isGrounded,
      deltaTime
    );
    
    // Update horizontal velocity
    this.velocity.x = horizontalVelocity.x;
    this.velocity.z = horizontalVelocity.z;
    
    // Handle slopes
    if (groundInfo.isGrounded && groundInfo.canWalk) {
      const slopeAdjusted = this.slopeHandler.adjustVelocityForSlope(
        this.velocity,
        groundInfo.groundNormal
      );
      this.velocity.x = slopeAdjusted.x;
      this.velocity.z = slopeAdjusted.z;
    }
    
    // Handle jumping
    if (input.jump && this.canJump(groundInfo)) {
      this.velocity.y = this.physics.getJumpForce();
      this.stateMachine.transition(MovementState.JUMPING);
      this.jumpCooldown = 0.3;
    }
    
    // Apply gravity
    if (!groundInfo.isGrounded) {
      this.velocity.y -= this.physics.getGravity() * deltaTime;
    } else {
      // Snap to ground
      if (this.velocity.y < 0) {
        this.velocity.y = -0.1; // Small downward force to stay grounded
      }
    }
    
    // Update state machine timer
    this.stateMachine.update(deltaTime);
    
    return this.velocity.clone();
  }
  
  /**
   * Update movement state based on input and ground info
   */
  private updateState(input: CharacterInput, groundInfo: GroundInfo): void {
    const currentState = this.stateMachine.getState();
    const isMoving = Math.abs(input.moveForward) > 0.1 || Math.abs(input.moveRight) > 0.1;
    
    // Handle airborne states
    if (!groundInfo.isGrounded) {
      if (currentState !== MovementState.JUMPING && currentState !== MovementState.FALLING) {
        this.stateMachine.transition(MovementState.FALLING);
      } else if (currentState === MovementState.JUMPING && this.velocity.y < 0) {
        this.stateMachine.transition(MovementState.FALLING);
      }
      return;
    }
    
    // Handle landing
    if (currentState === MovementState.FALLING || currentState === MovementState.JUMPING) {
      this.stateMachine.transition(MovementState.LANDING);
      // Auto-transition out of landing after short delay
      setTimeout(() => {
        if (this.stateMachine.getState() === MovementState.LANDING) {
          if (isMoving) {
            this.stateMachine.transition(MovementState.WALKING);
          } else {
            this.stateMachine.transition(MovementState.IDLE);
          }
        }
      }, 100);
      return;
    }
    
    // Handle grounded states
    if (input.crouch) {
      this.stateMachine.transition(MovementState.CROUCHING);
    } else if (isMoving) {
      if (input.sprint && this.stamina.canSprint() && !input.crouch) {
        this.stateMachine.transition(MovementState.RUNNING);
      } else {
        this.stateMachine.transition(MovementState.WALKING);
      }
    } else {
      this.stateMachine.transition(MovementState.IDLE);
    }
  }
  
  /**
   * Calculate movement direction from input and camera
   */
  private calculateMoveDirection(
    input: CharacterInput,
    cameraRotation: THREE.Quaternion
  ): THREE.Vector3 {
    const direction = new THREE.Vector3();
    
    // Forward/backward
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(cameraRotation);
    forward.y = 0;
    forward.normalize();
    direction.addScaledVector(forward, input.moveForward);
    
    // Strafe left/right
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(cameraRotation);
    right.y = 0;
    right.normalize();
    direction.addScaledVector(right, input.moveRight);
    
    // Normalize if moving
    if (direction.length() > 0) {
      direction.normalize();
    }
    
    return direction;
  }
  
  /**
   * Check if character can jump
   */
  private canJump(groundInfo: GroundInfo): boolean {
    return (
      groundInfo.isGrounded &&
      this.jumpCooldown <= 0 &&
      this.stateMachine.getState() !== MovementState.CROUCHING &&
      this.stateMachine.getState() !== MovementState.JUMPING &&
      this.stateMachine.getState() !== MovementState.FALLING
    );
  }
  
  /**
   * Get current movement state
   */
  getState(): MovementState {
    return this.stateMachine.getState();
  }
  
  /**
   * Get current velocity
   */
  getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }
  
  /**
   * Get stamina percentage
   */
  getStamina(): number {
    return this.stamina.getStamina();
  }
  
  /**
   * Get ground info
   */
  getGroundInfo(): GroundInfo | null {
    return this.lastGroundInfo;
  }
  
  /**
   * Check if grounded
   */
  isGrounded(): boolean {
    return this.lastGroundInfo?.isGrounded || false;
  }
  
  /**
   * Reset controller state
   */
  reset(): void {
    this.velocity.set(0, 0, 0);
    this.jumpCooldown = 0;
    this.stamina.reset();
    this.stateMachine.forceTransition(MovementState.IDLE);
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<MovementConfig>): void {
    this.physics.updateConfig(config);
  }
}
