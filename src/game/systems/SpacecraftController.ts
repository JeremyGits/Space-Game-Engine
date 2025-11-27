import * as THREE from 'three';

export interface SpacecraftInput {
  // Translation (linear movement)
  forward: number;    // -1 to 1
  right: number;      // -1 to 1
  up: number;         // -1 to 1
  
  // Rotation (angular movement)
  pitch: number;      // -1 to 1 (nose up/down)
  yaw: number;        // -1 to 1 (nose left/right)
  roll: number;       // -1 to 1 (barrel roll)
  
  // Actions
  boost: boolean;
  brake: boolean;
}

export interface SpacecraftConfig {
  mass: number;              // kg
  thrustForce: number;       // Newtons
  rcsForce: number;          // Newtons (Reaction Control System)
  boostMultiplier: number;   // Boost thrust multiplier
  maxSpeed: number;          // m/s
  maxAngularSpeed: number;   // rad/s
  fuel: number;
  maxFuel: number;
  fuelConsumption: number;   // fuel per second at full thrust
}

export class SpacecraftController {
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private rotation: THREE.Quaternion;
  private angularVelocity: THREE.Vector3;
  private config: SpacecraftConfig;
  
  constructor(config: Partial<SpacecraftConfig> = {}) {
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    
    this.config = {
      mass: 1000,
      thrustForce: 5000,
      rcsForce: 1000,
      boostMultiplier: 2.0,
      maxSpeed: 50,
      maxAngularSpeed: 2.0,
      fuel: 100,
      maxFuel: 100,
      fuelConsumption: 10,
      ...config
    };
  }
  
  update(input: SpacecraftInput, deltaTime: number): void {
    // Calculate thrust multiplier
    let thrustMultiplier = 1.0;
    if (input.boost && this.config.fuel > 0) {
      thrustMultiplier = this.config.boostMultiplier;
    }
    
    // Calculate linear forces (in local space)
    const localForce = new THREE.Vector3(
      input.right * this.config.thrustForce * thrustMultiplier,
      input.up * this.config.thrustForce * thrustMultiplier,
      -input.forward * this.config.thrustForce * thrustMultiplier  // Negative Z is forward
    );
    
    // Transform force to world space
    const worldForce = localForce.clone().applyQuaternion(this.rotation);
    
    // Apply braking
    if (input.brake) {
      const brakeForce = this.velocity.clone().normalize().multiplyScalar(-this.config.thrustForce * 2);
      worldForce.add(brakeForce);
    }
    
    // Calculate acceleration (F = ma, so a = F/m)
    const acceleration = worldForce.divideScalar(this.config.mass);
    
    // Update velocity (v = v + a * dt)
    this.velocity.add(acceleration.multiplyScalar(deltaTime));
    
    // Clamp velocity to max speed
    if (this.velocity.length() > this.config.maxSpeed) {
      this.velocity.normalize().multiplyScalar(this.config.maxSpeed);
    }
    
    // Update position (p = p + v * dt)
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Calculate angular forces (torque)
    const torque = new THREE.Vector3(
      input.pitch * this.config.rcsForce,
      input.yaw * this.config.rcsForce,
      input.roll * this.config.rcsForce
    );
    
    // Calculate angular acceleration (simplified, assuming uniform mass distribution)
    const momentOfInertia = this.config.mass * 10; // Simplified
    const angularAcceleration = torque.divideScalar(momentOfInertia);
    
    // Update angular velocity
    this.angularVelocity.add(angularAcceleration.multiplyScalar(deltaTime));
    
    // Apply angular damping (space has no air resistance, but we add slight damping for control)
    this.angularVelocity.multiplyScalar(0.98);
    
    // Clamp angular velocity
    if (this.angularVelocity.length() > this.config.maxAngularSpeed) {
      this.angularVelocity.normalize().multiplyScalar(this.config.maxAngularSpeed);
    }
    
    // Update rotation
    const deltaRotation = new THREE.Quaternion();
    const axis = this.angularVelocity.clone().normalize();
    const angle = this.angularVelocity.length() * deltaTime;
    
    if (angle > 0.0001) {
      deltaRotation.setFromAxisAngle(axis, angle);
      this.rotation.multiply(deltaRotation);
      this.rotation.normalize();
    }
    
    // Update fuel
    const thrustMagnitude = Math.abs(input.forward) + Math.abs(input.right) + Math.abs(input.up);
    const angularMagnitude = Math.abs(input.pitch) + Math.abs(input.yaw) + Math.abs(input.roll);
    const totalThrust = (thrustMagnitude + angularMagnitude * 0.5) * thrustMultiplier;
    
    if (totalThrust > 0) {
      this.config.fuel = Math.max(0, this.config.fuel - this.config.fuelConsumption * totalThrust * deltaTime);
    }
  }
  
  // Getters
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }
  
  getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }
  
  getRotation(): THREE.Quaternion {
    return this.rotation.clone();
  }
  
  getAngularVelocity(): THREE.Vector3 {
    return this.angularVelocity.clone();
  }
  
  getFuel(): number {
    return this.config.fuel;
  }
  
  getFuelPercent(): number {
    return this.config.fuel / this.config.maxFuel;
  }
  
  getSpeed(): number {
    return this.velocity.length();
  }
  
  getForwardVector(): THREE.Vector3 {
    const forward = new THREE.Vector3(0, 0, -1);
    return forward.applyQuaternion(this.rotation);
  }
  
  getRightVector(): THREE.Vector3 {
    const right = new THREE.Vector3(1, 0, 0);
    return right.applyQuaternion(this.rotation);
  }
  
  getUpVector(): THREE.Vector3 {
    const up = new THREE.Vector3(0, 1, 0);
    return up.applyQuaternion(this.rotation);
  }
  
  // Setters
  setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
  }
  
  setRotation(rotation: THREE.Quaternion): void {
    this.rotation.copy(rotation);
  }
  
  setVelocity(velocity: THREE.Vector3): void {
    this.velocity.copy(velocity);
  }
  
  refuel(amount: number): void {
    this.config.fuel = Math.min(this.config.maxFuel, this.config.fuel + amount);
  }
  
  reset(): void {
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.rotation.identity();
    this.angularVelocity.set(0, 0, 0);
    this.config.fuel = this.config.maxFuel;
  }
}
