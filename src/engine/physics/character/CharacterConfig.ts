/**
 * Character Controller Configuration
 * Default configuration values for the character controller
 */

import { MovementConfig } from './MovementPhysics';
import { StaminaConfig } from './StaminaSystem';

export const DEFAULT_CHARACTER_CONFIG: MovementConfig = {
  // Movement speeds (m/s)
  walkSpeed: 3.0,
  runSpeed: 6.0,
  crouchSpeed: 1.5,
  
  // Jump settings
  jumpForce: 5.0,
  jumpCooldown: 0.3,
  
  // Acceleration (m/s²)
  groundAcceleration: 50.0,
  groundDeceleration: 50.0,
  airAcceleration: 10.0,
  
  // Physics
  gravity: 9.81,
  
  // Friction
  groundFriction: 10.0,
  airFriction: 0.1,
  
  // Terrain limits
  maxSlopeAngle: 45,    // degrees
  stepHeight: 0.3       // meters
};

export const DEFAULT_STAMINA_CONFIG: StaminaConfig = {
  maxStamina: 100,
  drainRate: 20,        // Per second
  regenRate: 15,        // Per second
  regenDelay: 1.0,      // Seconds before regen starts
  minForSprint: 10      // Minimum stamina to sprint
};

/**
 * Preset configurations for different gameplay styles
 */
export const CHARACTER_PRESETS = {
  // Realistic simulation
  REALISTIC: {
    walkSpeed: 1.4,     // Average human walking speed
    runSpeed: 4.0,      // Average human running speed
    crouchSpeed: 0.7,
    jumpForce: 4.0,
    groundAcceleration: 30.0,
    groundFriction: 15.0,
    maxSlopeAngle: 35
  },
  
  // Arcade-style (more responsive)
  ARCADE: {
    walkSpeed: 4.0,
    runSpeed: 8.0,
    crouchSpeed: 2.0,
    jumpForce: 6.0,
    groundAcceleration: 80.0,
    groundFriction: 20.0,
    maxSlopeAngle: 50
  },
  
  // Tactical (slower, more deliberate)
  TACTICAL: {
    walkSpeed: 2.5,
    runSpeed: 5.0,
    crouchSpeed: 1.2,
    jumpForce: 4.5,
    groundAcceleration: 40.0,
    groundFriction: 12.0,
    maxSlopeAngle: 40
  },
  
  // Space suit (slower in heavy gear)
  SPACE_SUIT: {
    walkSpeed: 2.0,
    runSpeed: 3.5,
    crouchSpeed: 1.0,
    jumpForce: 3.0,
    groundAcceleration: 25.0,
    groundFriction: 8.0,
    maxSlopeAngle: 30
  }
};
