/**
 * AnimationSystem
 * 
 * Handles animation playback and blending.
 * Supports skeletal animations, morph targets, and property animations.
 */

import { System, SystemPhase } from '../System';
import { SystemPriority } from '../SystemPriority';
import { EntityManager } from '../../entity/EntityManager';
import { ComponentManager } from '../../component/ComponentManager';

/**
 * Animation state
 */
enum AnimationState {
  STOPPED = 'stopped',
  PLAYING = 'playing',
  PAUSED = 'paused'
}

/**
 * Temporary Animation interface until we create the component
 */
interface AnimationComponent {
  type: 'Animation';
  enabled: boolean;
  
  // Animation data
  clips: Map<string, any>;
  currentClip: string | null;
  
  // Playback
  state: AnimationState;
  time: number;
  speed: number;
  loop: boolean;
  
  // Blending
  blendTime: number;
  blendTarget: string | null;
  
  // Methods
  play(clipName: string, blendTime?: number): void;
  pause(): void;
  stop(): void;
  setSpeed(speed: number): void;
}

export class AnimationSystem extends System {
  private animationMixers: Map<string, any> = new Map();

  constructor(entityManager: EntityManager, componentManager: ComponentManager) {
    super('AnimationSystem', entityManager, componentManager, {
      priority: SystemPriority.ANIMATION,
      phase: SystemPhase.UPDATE,
      requiredComponents: ['Animation']
    });
  }

  /**
   * Initialize system
   */
  initialize(): void {
    console.log('[AnimationSystem] Initialized');
  }

  /**
   * Update animations
   */
  update(deltaTime: number): void {
    const startTime = performance.now();

    const entities = this.getMatchingEntities();

    entities.forEach(entity => {
      const animation = this.componentManager.getComponent<AnimationComponent>(
        entity.id,
        'Animation'
      );

      if (animation && animation.state === AnimationState.PLAYING) {
        this.updateAnimation(entity.id, animation, deltaTime);
      }
    });

    this.trackUpdateTime(startTime);
  }

  /**
   * Update a single animation
   */
  private updateAnimation(
    entityId: string,
    animation: AnimationComponent,
    deltaTime: number
  ): void {
    if (!animation.currentClip) return;

    // Update animation time
    animation.time += deltaTime * animation.speed;

    // Get clip data
    const clip = animation.clips.get(animation.currentClip);
    if (!clip) return;

    // Handle looping
    if (animation.loop) {
      animation.time = animation.time % clip.duration;
    } else if (animation.time >= clip.duration) {
      animation.time = clip.duration;
      animation.state = AnimationState.STOPPED;
      this.onAnimationComplete(entityId, animation.currentClip);
    }

    // Apply animation (placeholder)
    this.applyAnimation(entityId, animation, clip);

    // Handle blending
    if (animation.blendTarget && animation.blendTime > 0) {
      this.updateBlending(entityId, animation, deltaTime);
    }
  }

  /**
   * Apply animation to entity
   */
  private applyAnimation(
    _entityId: string,
    _animation: AnimationComponent,
    _clip: any
  ): void {
    // TODO: Implement actual animation application
    // This would involve:
    // 1. Sampling keyframes at current time
    // 2. Interpolating between keyframes
    // 3. Applying transforms to bones/properties
    
    // Placeholder for now
  }

  /**
   * Update animation blending
   */
  private updateBlending(
    _entityId: string,
    animation: AnimationComponent,
    deltaTime: number
  ): void {
    animation.blendTime -= deltaTime;

    if (animation.blendTime <= 0) {
      // Blend complete, switch to target
      animation.currentClip = animation.blendTarget;
      animation.blendTarget = null;
      animation.blendTime = 0;
      animation.time = 0;
    }
  }

  /**
   * Play animation
   */
  playAnimation(
    entityId: string,
    clipName: string,
    blendTime: number = 0
  ): void {
    const animation = this.componentManager.getComponent<AnimationComponent>(
      entityId,
      'Animation'
    );

    if (!animation) {
      console.warn(`[AnimationSystem] No animation component on entity ${entityId}`);
      return;
    }

    if (!animation.clips.has(clipName)) {
      console.warn(`[AnimationSystem] Animation clip not found: ${clipName}`);
      return;
    }

    if (blendTime > 0 && animation.currentClip) {
      // Blend to new animation
      animation.blendTarget = clipName;
      animation.blendTime = blendTime;
    } else {
      // Immediate switch
      animation.currentClip = clipName;
      animation.time = 0;
      animation.state = AnimationState.PLAYING;
    }

    console.log(`[AnimationSystem] Playing animation: ${clipName} on entity ${entityId}`);
  }

  /**
   * Pause animation
   */
  pauseAnimation(entityId: string): void {
    const animation = this.componentManager.getComponent<AnimationComponent>(
      entityId,
      'Animation'
    );

    if (animation) {
      animation.state = AnimationState.PAUSED;
    }
  }

  /**
   * Stop animation
   */
  stopAnimation(entityId: string): void {
    const animation = this.componentManager.getComponent<AnimationComponent>(
      entityId,
      'Animation'
    );

    if (animation) {
      animation.state = AnimationState.STOPPED;
      animation.time = 0;
      animation.currentClip = null;
    }
  }

  /**
   * Set animation speed
   */
  setAnimationSpeed(entityId: string, speed: number): void {
    const animation = this.componentManager.getComponent<AnimationComponent>(
      entityId,
      'Animation'
    );

    if (animation) {
      animation.speed = speed;
    }
  }

  /**
   * Animation complete callback
   */
  private onAnimationComplete(entityId: string, clipName: string): void {
    console.log(`[AnimationSystem] Animation complete: ${clipName} on entity ${entityId}`);
    // Could emit event here for game logic to respond
  }

  /**
   * Add animation clip
   */
  addAnimationClip(
    entityId: string,
    clipName: string,
    clipData: any
  ): void {
    const animation = this.componentManager.getComponent<AnimationComponent>(
      entityId,
      'Animation'
    );

    if (animation) {
      animation.clips.set(clipName, clipData);
      console.log(`[AnimationSystem] Added clip: ${clipName} to entity ${entityId}`);
    }
  }

  /**
   * Remove animation clip
   */
  removeAnimationClip(entityId: string, clipName: string): void {
    const animation = this.componentManager.getComponent<AnimationComponent>(
      entityId,
      'Animation'
    );

    if (animation) {
      animation.clips.delete(clipName);
    }
  }

  /**
   * Get animation state
   */
  getAnimationState(entityId: string): AnimationState | null {
    const animation = this.componentManager.getComponent<AnimationComponent>(
      entityId,
      'Animation'
    );

    return animation ? animation.state : null;
  }

  /**
   * Cleanup system
   */
  cleanup(): void {
    this.animationMixers.clear();
    console.log('[AnimationSystem] Cleaned up');
  }
}
