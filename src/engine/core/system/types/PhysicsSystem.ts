/**
 * PhysicsSystem
 * 
 * Handles physics simulation including forces, velocities, and collisions.
 * Implements Newtonian mechanics for realistic space physics.
 */

import { System, SystemPhase } from '../System';
import { SystemPriority } from '../SystemPriority';
import { EntityManager } from '../../entity/EntityManager';
import { ComponentManager } from '../../component/ComponentManager';
import { TransformComponent } from '../../component/types/TransformComponent';
import { Vector3 } from '../../../../utils/math/Vector3';

/**
 * Temporary RigidBody interface until we create the component
 */
interface RigidBodyComponent {
  type: 'RigidBody';
  enabled: boolean;
  
  // Physics properties
  mass: number;
  velocity: Vector3;
  angularVelocity: Vector3;
  acceleration: Vector3;
  
  // Forces
  force: Vector3;
  torque: Vector3;
  
  // Damping
  linearDamping: number;
  angularDamping: number;
  
  // State
  isKinematic: boolean;
  useGravity: boolean;
  
  // Methods
  addForce(force: Vector3): void;
  addTorque(torque: Vector3): void;
  clearForces(): void;
}

export class PhysicsSystem extends System {
  private gravity: Vector3 = new Vector3(0, -9.81, 0);
  private fixedTimeStep: number = 1 / 60; // 60 FPS physics
  private accumulator: number = 0;
  private maxSubSteps: number = 5;

  constructor(entityManager: EntityManager, componentManager: ComponentManager) {
    super('PhysicsSystem', entityManager, componentManager, {
      priority: SystemPriority.PHYSICS,
      phase: SystemPhase.FIXED_UPDATE,
      requiredComponents: ['Transform', 'RigidBody']
    });
  }

  /**
   * Initialize system
   */
  initialize(): void {
    console.log('[PhysicsSystem] Initialized');
  }

  /**
   * Fixed update for physics simulation
   */
  fixedUpdate(fixedDeltaTime: number): void {
    const startTime = performance.now();

    // Get all entities with physics
    const entities = this.getMatchingEntities();

    entities.forEach(entity => {
      const transform = this.componentManager.getComponent<TransformComponent>(
        entity.id,
        'Transform'
      );
      const rigidBody = this.componentManager.getComponent<RigidBodyComponent>(
        entity.id,
        'RigidBody'
      );

      if (transform && rigidBody && !rigidBody.isKinematic) {
        this.updatePhysics(transform, rigidBody, fixedDeltaTime);
      }
    });

    this.trackUpdateTime(startTime);
  }

  /**
   * Regular update (for accumulator)
   */
  update(deltaTime: number): void {
    // Physics runs in fixed update, but we track time here
    this.accumulator += deltaTime;
    
    // Clamp accumulator to prevent spiral of death
    if (this.accumulator > this.fixedTimeStep * this.maxSubSteps) {
      this.accumulator = this.fixedTimeStep * this.maxSubSteps;
    }
  }

  /**
   * Update physics for a single entity
   */
  private updatePhysics(
    transform: TransformComponent,
    rigidBody: RigidBodyComponent,
    deltaTime: number
  ): void {
    // Apply gravity
    if (rigidBody.useGravity) {
      const gravityForce = this.gravity.clone().multiplyScalar(rigidBody.mass);
      rigidBody.addForce(gravityForce);
    }

    // Calculate acceleration (F = ma, so a = F/m)
    rigidBody.acceleration = rigidBody.force.clone().multiplyScalar(1 / rigidBody.mass);

    // Update velocity
    const deltaVelocity = rigidBody.acceleration.clone().multiplyScalar(deltaTime);
    rigidBody.velocity.add(deltaVelocity);

    // Apply linear damping
    rigidBody.velocity.multiplyScalar(1 - rigidBody.linearDamping * deltaTime);

    // Update position
    const deltaPosition = rigidBody.velocity.clone().multiplyScalar(deltaTime);
    transform.position.add(deltaPosition);

    // Update angular velocity with damping
    rigidBody.angularVelocity.multiplyScalar(1 - rigidBody.angularDamping * deltaTime);

    // Update rotation (simplified - would need proper quaternion integration)
    if (rigidBody.angularVelocity.length() > 0.001) {
      const angle = rigidBody.angularVelocity.length() * deltaTime;
      const axis = rigidBody.angularVelocity.clone().normalize();
      
      // This is a simplified rotation update
      // In production, use proper quaternion integration
      transform.rotate(
        axis.x * angle * (180 / Math.PI),
        axis.y * angle * (180 / Math.PI),
        axis.z * angle * (180 / Math.PI)
      );
    }

    // Clear forces for next frame
    rigidBody.clearForces();

    // Mark transform as dirty
    transform.setPosition(transform.position.x, transform.position.y, transform.position.z);
  }

  /**
   * Set gravity
   */
  setGravity(x: number, y: number, z: number): void {
    this.gravity.set(x, y, z);
    console.log(`[PhysicsSystem] Gravity set to (${x}, ${y}, ${z})`);
  }

  /**
   * Get gravity
   */
  getGravity(): Vector3 {
    return this.gravity.clone();
  }

  /**
   * Set fixed time step
   */
  setFixedTimeStep(timeStep: number): void {
    this.fixedTimeStep = timeStep;
    console.log(`[PhysicsSystem] Fixed time step set to ${timeStep}s`);
  }

  /**
   * Get fixed time step
   */
  getFixedTimeStep(): number {
    return this.fixedTimeStep;
  }

  /**
   * Raycast (placeholder for future implementation)
   */
  raycast(_origin: Vector3, _direction: Vector3, _maxDistance: number): any {
    // TODO: Implement raycasting
    console.warn('[PhysicsSystem] Raycast not yet implemented');
    return null;
  }

  /**
   * Cleanup system
   */
  cleanup(): void {
    console.log('[PhysicsSystem] Cleaned up');
  }
}
