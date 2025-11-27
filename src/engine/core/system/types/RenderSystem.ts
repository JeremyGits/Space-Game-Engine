/**
 * RenderSystem
 * 
 * Handles rendering of all visible entities.
 * Manages render queue, culling, and rendering pipeline.
 */

import { System, SystemPhase } from '../System';
import { SystemPriority } from '../SystemPriority';
import { EntityManager } from '../../entity/EntityManager';
import { ComponentManager } from '../../component/ComponentManager';
import { TransformComponent } from '../../component/types/TransformComponent';

/**
 * Temporary Mesh interface until we create the component
 */
interface MeshComponent {
  type: 'Mesh';
  enabled: boolean;
  visible: boolean;
  geometry: any;
  material: any;
  castShadow: boolean;
  receiveShadow: boolean;
}

/**
 * Temporary Camera interface
 */
interface CameraComponent {
  type: 'Camera';
  enabled: boolean;
  active: boolean;
  fov: number;
  aspect: number;
  near: number;
  far: number;
}

export class RenderSystem extends System {
  private renderQueue: Array<{
    entity: any;
    transform: TransformComponent;
    mesh: MeshComponent;
    distance: number;
  }> = [];

  private activeCamera: CameraComponent | null = null;
  private renderStats = {
    drawCalls: 0,
    triangles: 0,
    culled: 0
  };

  constructor(entityManager: EntityManager, componentManager: ComponentManager) {
    super('RenderSystem', entityManager, componentManager, {
      priority: SystemPriority.RENDER,
      phase: SystemPhase.RENDER,
      requiredComponents: ['Transform', 'Mesh']
    });
  }

  /**
   * Initialize system
   */
  initialize(): void {
    console.log('[RenderSystem] Initialized');
  }

  /**
   * Update (prepare render queue)
   */
  update(_deltaTime: number): void {
    const startTime = performance.now();

    // Find active camera
    this.findActiveCamera();

    // Build render queue
    this.buildRenderQueue();

    // Sort render queue (optional - for transparency, etc.)
    this.sortRenderQueue();

    this.trackUpdateTime(startTime);
  }

  /**
   * Render phase
   */
  render(): void {
    const startTime = performance.now();

    // Reset stats
    this.renderStats.drawCalls = 0;
    this.renderStats.triangles = 0;
    this.renderStats.culled = 0;

    if (!this.activeCamera) {
      console.warn('[RenderSystem] No active camera found');
      return;
    }

    // Render all items in queue
    this.renderQueue.forEach(item => {
      if (item.mesh.visible) {
        this.renderMesh(item);
        this.renderStats.drawCalls++;
      }
    });

    // Clear queue for next frame
    this.renderQueue = [];

    this.trackUpdateTime(startTime);
  }

  /**
   * Find active camera
   */
  private findActiveCamera(): void {
    const entities = this.entityManager.getAllEntities();
    
    for (const entity of entities) {
      const camera = this.componentManager.getComponent<CameraComponent>(
        entity.id,
        'Camera'
      );
      
      if (camera && camera.active) {
        this.activeCamera = camera;
        return;
      }
    }

    this.activeCamera = null;
  }

  /**
   * Build render queue
   */
  private buildRenderQueue(): void {
    this.renderQueue = [];

    const entities = this.getMatchingEntities();

    entities.forEach(entity => {
      const transform = this.componentManager.getComponent<TransformComponent>(
        entity.id,
        'Transform'
      );
      const mesh = this.componentManager.getComponent<MeshComponent>(
        entity.id,
        'Mesh'
      );

      if (transform && mesh && mesh.visible) {
        // Calculate distance from camera (for sorting)
        const distance = this.activeCamera 
          ? this.calculateDistanceToCamera(transform)
          : 0;

        this.renderQueue.push({
          entity,
          transform,
          mesh,
          distance
        });
      }
    });
  }

  /**
   * Sort render queue
   */
  private sortRenderQueue(): void {
    // Sort by distance (back to front for transparency)
    // Or front to back for opaque objects (optimization)
    this.renderQueue.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Render a single mesh
   */
  private renderMesh(_item: {
    entity: any;
    transform: TransformComponent;
    mesh: MeshComponent;
    distance: number;
  }): void {
    // TODO: Actual rendering with Three.js
    // This is a placeholder for the rendering logic
    
    // Get world matrix (for future use)
    // const worldMatrix = item.transform.getWorldMatrix();
    
    // Apply transform
    // Bind material
    // Draw geometry
    
    // For now, just log (will be replaced with actual Three.js rendering)
    // console.log(`[RenderSystem] Rendering entity ${item.entity.id}`);
  }

  /**
   * Calculate distance to camera
   */
  private calculateDistanceToCamera(transform: TransformComponent): number {
    // TODO: Get actual camera position
    // For now, return distance from origin
    const pos = transform.position;
    return Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  }

  /**
   * Get render statistics
   */
  getRenderStats(): typeof this.renderStats {
    return { ...this.renderStats };
  }

  /**
   * Set active camera
   */
  setActiveCamera(camera: CameraComponent): void {
    this.activeCamera = camera;
  }

  /**
   * Get active camera
   */
  getActiveCamera(): CameraComponent | null {
    return this.activeCamera;
  }

  /**
   * Cleanup system
   */
  cleanup(): void {
    this.renderQueue = [];
    this.activeCamera = null;
    console.log('[RenderSystem] Cleaned up');
  }
}
