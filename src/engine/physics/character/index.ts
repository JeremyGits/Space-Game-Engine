/**
 * Character Controller System
 * Export all character controller components
 */

export { CharacterController } from './CharacterController';
export { MovementStateMachine, MovementState } from './MovementStateMachine';
export { GroundDetector } from './GroundDetector';
export { MovementPhysics } from './MovementPhysics';
export { SlopeHandler } from './SlopeHandler';
export { StaminaSystem } from './StaminaSystem';
export { 
  DEFAULT_CHARACTER_CONFIG, 
  DEFAULT_STAMINA_CONFIG,
  CHARACTER_PRESETS 
} from './CharacterConfig';

export type { CharacterInput } from './CharacterController';
export type { GroundInfo } from './GroundDetector';
export type { MovementConfig } from './MovementPhysics';
export type { StaminaConfig } from './StaminaSystem';
