/**
 * CollisionSystem
 * 
 * Handles collision detection and response.
 * Works with PhysicsSystem to provide collision callbacks.
 */

import { System, SystemPhase } from '../System';
import { SystemPriority } from '../SystemPriority';
import { EntityManager } from '../../entity/EntityManager';
import { ComponentManager } from '../../component/ComponentManager';
import { TransformComponent } from '../../component/types/TransformComponent';
import { Vector3 } from '../../../../utils/math/Vector3';

/**
 * Collision shape types
 */
enum CollisionShape {
  SPHERE = 'sphere',
  BOX = 'box',
  CAPSULE = 'capsule',
  MESH = 'mesh'
}

/**
 * Temporary Collider interface
 */
interface ColliderComponent {
  type: 'Collider';
  enabled: boolean;
  
  // Shape
  shape: CollisionShape;
  size: Vector3;
  radius: number;
  
  // Properties
  isTrigger: boolean;
  layer: number;
  
  // Collision tracking
  collidingWith: Set<string>;
}

/**
 * Collision info
 */
interface CollisionInfo {
  entityA: string;
  entityB: string;
  point: Vector3;
  normal: Vector3;
  penetration: number;
}

export class CollisionSystem extends System {
  private collisionPairs: Map<string, CollisionInfo> = new Map();
  private previousCollisions: Set<string> = new Set();
  private currentCollisions: Set<string> = new Set();

  constructor(entityManager: EntityManager, componentManager: ComponentManager) {
    super('CollisionSystem', entityManager, componentManager, {
      priority: SystemPriority.COLLISION,
      phase: SystemPhase.FIXED_UPDATE,
      requiredComponents: ['Transform', 'Collider']
    });
  }

  /**
   * Initialize system
   */
  initialize(): void {
    console.log('[CollisionSystem] Initialized');
  }

  /**
   * Fixed update for collision detection
   */
  fixedUpdate(_fixedDeltaTime: number): void {
    const startTime = performance.now();

    // Clear current collisions
    this.currentCollisions.clear();

    // Get all entities with colliders
    const entities = this.getMatchingEntities();

    // Broad phase: Check all pairs
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        this.checkCollisionPair(entities[i].id, entities[j].id);
      }
    }

    // Detect collision events (enter/exit)
    this.detectCollisionEvents();

    // Update previous collisions
    this.previousCollisions = new Set(this.currentCollisions);

    this.trackUpdateTime(startTime);
  }

  /**
   * Regular update (placeholder)
   */
  update(_deltaTime: number): void {
    // Collision detection happens in fixed update
  }

  /**
   * Check collision between two entities
   */
  private checkCollisionPair(entityIdA: string, entityIdB: string): void {
    const transformA = this.componentManager.getComponent<TransformComponent>(
      entityIdA,
      'Transform'
    );
    const colliderA = this.componentManager.getComponent<ColliderComponent>(
      entityIdA,
      'Collider'
    );

    const transformB = this.componentManager.getComponent<TransformComponent>(
      entityIdB,
      'Transform'
    );
    const colliderB = this.componentManager.getComponent<ColliderComponent>(
      entityIdB,
      'Collider'
    );

    if (!transformA || !colliderA || !transformB || !colliderB) return;
    if (!colliderA.enabled || !colliderB.enabled) return;

    // Perform collision detection based on shapes
    const collision = this.detectCollision(
      transformA,
      colliderA,
      transformB,
      colliderB
    );

    if (collision) {
      const pairKey = this.getPairKey(entityIdA, entityIdB);
      this.currentCollisions.add(pairKey);
      this.collisionPairs.set(pairKey, {
        entityA: entityIdA,
        entityB: entityIdB,
        point: collision.point,
        normal: collision.normal,
        penetration: collision.penetration
      });

      // Track in colliders
      colliderA.collidingWith.add(entityIdB);
      colliderB.collidingWith.add(entityIdA);
    }
  }

  /**
   * Detect collision between two colliders
   */
  private detectCollision(
    transformA: TransformComponent,
    colliderA: ColliderComponent,
    transformB: TransformComponent,
    colliderB: ColliderComponent
  ): CollisionInfo | null {
    // Simplified collision detection
    // In production, use proper collision detection algorithms

    if (colliderA.shape === CollisionShape.SPHERE && colliderB.shape === CollisionShape.SPHERE) {
      return this.sphereVsSphere(transformA, colliderA, transformB, colliderB);
    }

    if (colliderA.shape === CollisionShape.BOX && colliderB.shape === CollisionShape.BOX) {
      return this.boxVsBox(transformA, colliderA, transformB, colliderB);
    }

    // TODO: Implement other shape combinations
    return null;
  }

  /**
   * Sphere vs Sphere collision
   */
  private sphereVsSphere(
    transformA: TransformComponent,
    colliderA: ColliderComponent,
    transformB: TransformComponent,
    colliderB: ColliderComponent
  ): CollisionInfo | null {
    const posA = transformA.position;
    const posB = transformB.position;

    const distance = posA.distanceTo(posB);
    const radiusSum = colliderA.radius + colliderB.radius;

    if (distance < radiusSum) {
      const normal = posB.clone().sub(posA).normalize();
      const penetration = radiusSum - distance;
      const point = posA.clone().add(normal.clone().multiplyScalar(colliderA.radius));

      return {
        entityA: '',
        entityB: '',
        point,
        normal,
        penetration
      };
    }

    return null;
  }

  /**
   * Box vs Box collision (AABB)
   */
  private boxVsBox(
    transformA: TransformComponent,
    colliderA: ColliderComponent,
    transformB: TransformComponent,
    colliderB: ColliderComponent
  ): CollisionInfo | null {
    const posA = transformA.position;
    const posB = transformB.position;
    const sizeA = colliderA.size;
    const sizeB = colliderB.size;

    // AABB collision detection
    const minA = new Vector3(
      posA.x - sizeA.x / 2,
      posA.y - sizeA.y / 2,
      posA.z - sizeA.z / 2
    );
    const maxA = new Vector3(
      posA.x + sizeA.x / 2,
      posA.y + sizeA.y / 2,
      posA.z + sizeA.z / 2
    );

    const minB = new Vector3(
      posB.x - sizeB.x / 2,
      posB.y - sizeB.y / 2,
      posB.z - sizeB.z / 2
    );
    const maxB = new Vector3(
      posB.x + sizeB.x / 2,
      posB.y + sizeB.y / 2,
      posB.z + sizeB.z / 2
    );

    // Check overlap
    if (
      maxA.x > minB.x && minA.x < maxB.x &&
      maxA.y > minB.y && minA.y < maxB.y &&
      maxA.z > minB.z && minA.z < maxB.z
    ) {
      // Calculate collision normal and penetration
      const normal = posB.clone().sub(posA).normalize();
      const penetration = 0.1; // Simplified

      return {
        entityA: '',
        entityB: '',
        point: posA.clone().add(posB).multiplyScalar(0.5),
        normal,
        penetration
      };
    }

    return null;
  }

  /**
   * Detect collision events (enter/exit)
   */
  private detectCollisionEvents(): void {
    // Check for new collisions (enter)
    this.currentCollisions.forEach(pairKey => {
      if (!this.previousCollisions.has(pairKey)) {
        const collision = this.collisionPairs.get(pairKey);
        if (collision) {
          this.onCollisionEnter(collision);
        }
      }
    });

    // Check for ended collisions (exit)
    this.previousCollisions.forEach(pairKey => {
      if (!this.currentCollisions.has(pairKey)) {
        const collision = this.collisionPairs.get(pairKey);
        if (collision) {
          this.onCollisionExit(collision);
        }
        this.collisionPairs.delete(pairKey);
      }
    });
  }

  /**
   * Collision enter event
   */
  private onCollisionEnter(collision: CollisionInfo): void {
    console.log(`[CollisionSystem] Collision enter: ${collision.entityA} <-> ${collision.entityB}`);
    
    // TODO: Trigger script callbacks
    // This would integrate with ScriptSystem
  }

  /**
   * Collision exit event
   */
  private onCollisionExit(collision: CollisionInfo): void {
    console.log(`[CollisionSystem] Collision exit: ${collision.entityA} <-> ${collision.entityB}`);
    
    // Clear collision tracking
    const colliderA = this.componentManager.getComponent<ColliderComponent>(
      collision.entityA,
      'Collider'
    );
    const colliderB = this.componentManager.getComponent<ColliderComponent>(
      collision.entityB,
      'Collider'
    );

    if (colliderA) colliderA.collidingWith.delete(collision.entityB);
    if (colliderB) colliderB.collidingWith.delete(collision.entityA);
  }

  /**
   * Get pair key for collision tracking
   */
  private getPairKey(entityIdA: string, entityIdB: string): string {
    return entityIdA < entityIdB 
      ? `${entityIdA}:${entityIdB}` 
      : `${entityIdB}:${entityIdA}`;
  }

  /**
   * Check if entities are colliding
   */
  isColliding(entityIdA: string, entityIdB: string): boolean {
    const pairKey = this.getPairKey(entityIdA, entityIdB);
    return this.currentCollisions.has(pairKey);
  }

  /**
   * Get collision info
   */
  getCollisionInfo(entityIdA: string, entityIdB: string): CollisionInfo | null {
    const pairKey = this.getPairKey(entityIdA, entityIdB);
    return this.collisionPairs.get(pairKey) || null;
  }

  /**
   * Get all collisions for an entity
   */
  getEntityCollisions(entityId: string): CollisionInfo[] {
    const collisions: CollisionInfo[] = [];

    this.collisionPairs.forEach(collision => {
      if (collision.entityA === entityId || collision.entityB === entityId) {
        collisions.push(collision);
      }
    });

    return collisions;
  }

  /**
   * Raycast (placeholder)
   */
  raycast(_origin: Vector3, _direction: Vector3, _maxDistance: number): any {
    // TODO: Implement raycasting
    console.warn('[CollisionSystem] Raycast not yet implemented');
    return null;
  }

  /**
   * Cleanup system
   */
  cleanup(): void {
    this.collisionPairs.clear();
    this.previousCollisions.clear();
    this.currentCollisions.clear();
    console.log('[CollisionSystem] Cleaned up');
  }
}
