/**
 * Ground Detection System
 * Uses raycasting to detect ground and calculate slope information
 */

import * as THREE from 'three';

export interface GroundInfo {
  isGrounded: boolean;
  groundNormal: THREE.Vector3;
  groundDistance: number;
  groundAngle: number;  // Slope angle in degrees
  canWalk: boolean;     // Within slope limit
  groundPoint: THREE.Vector3 | null;
}

export class GroundDetector {
  private rayLength: number;
  private slopeLimit: number;
  private rayOffset: number;
  
  constructor(
    rayLength: number = 0.15,
    slopeLimit: number = 45,
    rayOffset: number = 0.1
  ) {
    this.rayLength = rayLength;
    this.slopeLimit = slopeLimit;
    this.rayOffset = rayOffset;
  }
  
  /**
   * Detect ground using raycast
   */
  detect(
    position: THREE.Vector3,
    rapierWorld: any
  ): GroundInfo {
    // Cast ray slightly below character center
    const rayOrigin = position.clone();
    rayOrigin.y -= this.rayOffset;
    
    const ray = {
      origin: { x: rayOrigin.x, y: rayOrigin.y, z: rayOrigin.z },
      dir: { x: 0, y: -1, z: 0 }
    };
    
    const hit = rapierWorld.castRay(ray, this.rayLength, true);
    
    if (hit && hit.toi !== undefined) {
      // Get normal from hit, or default to up vector
      const normal = hit.normal 
        ? new THREE.Vector3(hit.normal.x, hit.normal.y, hit.normal.z)
        : new THREE.Vector3(0, 1, 0);
      
      // Calculate slope angle (angle between normal and up vector)
      const angle = Math.acos(Math.max(-1, Math.min(1, normal.y))) * (180 / Math.PI);
      
      const groundPoint = new THREE.Vector3(
        rayOrigin.x,
        rayOrigin.y - hit.toi,
        rayOrigin.z
      );
      
      return {
        isGrounded: true,
        groundNormal: normal,
        groundDistance: hit.toi,
        groundAngle: angle,
        canWalk: angle <= this.slopeLimit,
        groundPoint
      };
    }
    
    return {
      isGrounded: false,
      groundNormal: new THREE.Vector3(0, 1, 0),
      groundDistance: Infinity,
      groundAngle: 0,
      canWalk: false,
      groundPoint: null
    };
  }
  
  /**
   * Detect ground with multiple rays for better accuracy
   */
  detectMultiRay(
    position: THREE.Vector3,
    rapierWorld: any,
    radius: number = 0.2
  ): GroundInfo {
    const rays = [
      new THREE.Vector3(0, 0, 0),           // Center
      new THREE.Vector3(radius, 0, 0),      // Right
      new THREE.Vector3(-radius, 0, 0),     // Left
      new THREE.Vector3(0, 0, radius),      // Forward
      new THREE.Vector3(0, 0, -radius)      // Back
    ];
    
    let closestHit: GroundInfo | null = null;
    let minDistance = Infinity;
    
    for (const offset of rays) {
      const rayPos = position.clone().add(offset);
      const hit = this.detect(rayPos, rapierWorld);
      
      if (hit.isGrounded && hit.groundDistance < minDistance) {
        minDistance = hit.groundDistance;
        closestHit = hit;
      }
    }
    
    return closestHit || {
      isGrounded: false,
      groundNormal: new THREE.Vector3(0, 1, 0),
      groundDistance: Infinity,
      groundAngle: 0,
      canWalk: false,
      groundPoint: null
    };
  }
  
  /**
   * Set slope limit
   */
  setSlopeLimit(degrees: number): void {
    this.slopeLimit = degrees;
  }
  
  /**
   * Set ray length
   */
  setRayLength(length: number): void {
    this.rayLength = length;
  }
}
