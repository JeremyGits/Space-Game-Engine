/**
 * TransformSystem
 * 
 * Updates transform hierarchies and world matrices.
 * Handles parent-child relationships and transform propagation.
 */

import { System, SystemPhase } from '../System';
import { SystemPriority } from '../SystemPriority';
import { EntityManager } from '../../entity/EntityManager';
import { ComponentManager } from '../../component/ComponentManager';
import { TransformComponent } from '../../component/types/TransformComponent';

export class TransformSystem extends System {
  constructor(entityManager: EntityManager, componentManager: ComponentManager) {
    super('TransformSystem', entityManager, componentManager, {
      priority: SystemPriority.TRANSFORM,
      phase: SystemPhase.UPDATE,
      requiredComponents: ['Transform']
    });
  }

  /**
   * Initialize system
   */
  initialize(): void {
    console.log('[TransformSystem] Initialized');
  }

  /**
   * Update all transforms
   */
  update(_deltaTime: number): void {
    const startTime = performance.now();

    // Get all entities with transform components
    const entities = this.getMatchingEntities();

    // Update transforms in hierarchy order (parents before children)
    const rootTransforms: TransformComponent[] = [];
    
    entities.forEach(entity => {
      const transform = this.componentManager.getComponent<TransformComponent>(
        entity.id,
        'Transform'
      );
      
      if (transform && !transform.parent) {
        rootTransforms.push(transform);
      }
    });

    // Update root transforms and their children recursively
    rootTransforms.forEach(transform => {
      this.updateTransformHierarchy(transform);
    });

    this.trackUpdateTime(startTime);
  }

  /**
   * Update transform hierarchy recursively
   */
  private updateTransformHierarchy(transform: TransformComponent): void {
    // Update this transform's world matrix
    transform.updateWorldTransform();

    // Update children
    transform.children.forEach(child => {
      this.updateTransformHierarchy(child);
    });
  }

  /**
   * Cleanup system
   */
  cleanup(): void {
    console.log('[TransformSystem] Cleaned up');
  }
}
