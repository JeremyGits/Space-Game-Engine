/**
 * Slope Handler
 * Handles slope detection and velocity adjustment for walking on slopes
 */

import * as THREE from 'three';

export class SlopeHandler {
  private maxSlopeAngle: number;
  private stepHeight: number;
  
  constructor(
    maxSlopeAngle: number = 45,
    stepHeight: number = 0.3
  ) {
    this.maxSlopeAngle = maxSlopeAngle;
    this.stepHeight = stepHeight;
  }
  
  /**
   * Check if slope is walkable
   */
  canWalkOnSlope(slopeAngle: number): boolean {
    return slopeAngle <= this.maxSlopeAngle;
  }
  
  /**
   * Adjust velocity to follow slope surface
   */
  adjustVelocityForSlope(
    velocity: THREE.Vector3,
    groundNormal: THREE.Vector3
  ): THREE.Vector3 {
    // If ground is flat, no adjustment needed
    if (Math.abs(groundNormal.y - 1.0) < 0.01) {
      return velocity;
    }
    
    // Calculate slope-aligned directions
    const right = new THREE.Vector3(1, 0, 0);
    const slopeRight = right.clone()
      .cross(groundNormal)
      .normalize();
    
    const slopeForward = groundNormal.clone()
      .cross(slopeRight)
      .normalize();
    
    // Project velocity onto slope
    const forwardSpeed = new THREE.Vector3(velocity.x, 0, velocity.z)
      .dot(slopeForward);
    const rightSpeed = new THREE.Vector3(velocity.x, 0, velocity.z)
      .dot(slopeRight);
    
    // Reconstruct velocity along slope
    const slopeVelocity = slopeForward.multiplyScalar(forwardSpeed)
      .add(slopeRight.multiplyScalar(rightSpeed));
    
    // Keep vertical velocity
    slopeVelocity.y = velocity.y;
    
    return slopeVelocity;
  }
  
  /**
   * Check if character can climb a step
   */
  canClimbStep(stepHeight: number): boolean {
    return stepHeight <= this.stepHeight;
  }
  
  /**
   * Calculate step climb velocity boost
   */
  getStepClimbBoost(stepHeight: number): number {
    if (!this.canClimbStep(stepHeight)) {
      return 0;
    }
    
    // Provide upward boost proportional to step height
    return stepHeight * 10; // Adjust multiplier as needed
  }
  
  /**
   * Set max slope angle
   */
  setMaxSlopeAngle(degrees: number): void {
    this.maxSlopeAngle = degrees;
  }
  
  /**
   * Set step height
   */
  setStepHeight(height: number): void {
    this.stepHeight = height;
  }
  
  /**
   * Get max slope angle
   */
  getMaxSlopeAngle(): number {
    return this.maxSlopeAngle;
  }
  
  /**
   * Get step height
   */
  getStepHeight(): number {
    return this.stepHeight;
  }
}
