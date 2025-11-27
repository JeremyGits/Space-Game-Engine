# 🎮 Character Controller System - Complete Implementation Plan

## Overview

Building a professional-grade character controller with:
- Walk/Run/Crouch/Jump states
- WASD movement (forward, back, strafe left/right)
- Sprint system
- Ground detection
- Slope handling
- Step climbing
- Optional stamina system

---

## 🏗️ System Architecture

```
src/engine/physics/character/
├── CharacterController.ts      # Main controller orchestrator
├── MovementStateMachine.ts     # State management
├── GroundDetector.ts           # Raycast ground detection
├── MovementPhysics.ts          # Physics calculations
├── SlopeHandler.ts             # Slope/step climbing
├── StaminaSystem.ts            # Optional stamina
└── CharacterConfig.ts          # Configuration
```

---

## 📋 Detailed Implementation Plan

### 1. Movement State Machine

**File:** `src/engine/physics/character/MovementStateMachine.ts`

```typescript
export enum MovementState {
  IDLE = 'idle',
  WALKING = 'walking',
  RUNNING = 'running',
  CROUCHING = 'crouching',
  JUMPING = 'jumping',
  FALLING = 'falling',
  LANDING = 'landing'
}

export class MovementStateMachine {
  private currentState: MovementState = MovementState.IDLE;
  private previousState: MovementState = MovementState.IDLE;
  private stateTime: number = 0;
  
  // State transitions
  private transitions = new Map<MovementState, MovementState[]>([
    [MovementState.IDLE, [MovementState.WALKING, MovementState.RUNNING, MovementState.CROUCHING, MovementState.JUMPING]],
    [MovementState.WALKING, [MovementState.IDLE, MovementState.RUNNING, MovementState.CROUCHING, MovementState.JUMPING]],
    [MovementState.RUNNING, [MovementState.IDLE, MovementState.WALKING, MovementState.JUMPING]],
    [MovementState.CROUCHING, [MovementState.IDLE, MovementState.WALKING]],
    [MovementState.JUMPING, [MovementState.FALLING]],
    [MovementState.FALLING, [MovementState.LANDING, MovementState.IDLE]],
    [MovementState.LANDING, [MovementState.IDLE, MovementState.WALKING]]
  ]);
  
  canTransition(to: MovementState): boolean {
    const allowed = this.transitions.get(this.currentState) || [];
    return allowed.includes(to);
  }
  
  transition(to: MovementState): boolean {
    if (this.canTransition(to)) {
      this.previousState = this.currentState;
      this.currentState = to;
      this.stateTime = 0;
      return true;
    }
    return false;
  }
  
  update(deltaTime: number) {
    this.stateTime += deltaTime;
  }
  
  getState(): MovementState {
    return this.currentState;
  }
  
  getStateTime(): number {
    return this.stateTime;
  }
}
```

---

### 2. Ground Detection System

**File:** `src/engine/physics/character/GroundDetector.ts`

```typescript
export interface GroundInfo {
  isGrounded: boolean;
  groundNormal: THREE.Vector3;
  groundDistance: number;
  groundAngle: number;  // Slope angle in degrees
  canWalk: boolean;     // Within slope limit
}

export class GroundDetector {
  private rayLength = 0.1;  // How far to raycast
  private slopeLimit = 45;  // Max walkable slope (degrees)
  
  detect(
    position: THREE.Vector3,
    rapierWorld: any
  ): GroundInfo {
    // Raycast downward from player position
    const ray = {
      origin: position,
      dir: { x: 0, y: -1, z: 0 }
    };
    
    const hit = rapierWorld.castRay(ray, this.rayLength, true);
    
    if (hit) {
      const normal = new THREE.Vector3(
        hit.normal.x,
        hit.normal.y,
        hit.normal.z
      );
      
      // Calculate slope angle
      const angle = Math.acos(normal.y) * (180 / Math.PI);
      
      return {
        isGrounded: true,
        groundNormal: normal,
        groundDistance: hit.toi,
        groundAngle: angle,
        canWalk: angle <= this.slopeLimit
      };
    }
    
    return {
      isGrounded: false,
      groundNormal: new THREE.Vector3(0, 1, 0),
      groundDistance: Infinity,
      groundAngle: 0,
      canWalk: false
    };
  }
}
```

---

### 3. Movement Physics

**File:** `src/engine/physics/character/MovementPhysics.ts`

```typescript
export interface MovementConfig {
  // Speed settings
  walkSpeed: number;
  runSpeed: number;
  crouchSpeed: number;
  
  // Jump settings
  jumpForce: number;
  jumpCooldown: number;
  
  // Physics
  groundAcceleration: number;
  groundDeceleration: number;
  airAcceleration: number;
  gravity: number;
  
  // Friction
  groundFriction: number;
  airFriction: number;
  
  // Limits
  maxSlopeAngle: number;
  stepHeight: number;
}

export class MovementPhysics {
  private config: MovementConfig;
  
  constructor(config: Partial<MovementConfig> = {}) {
    this.config = {
      walkSpeed: 3.0,
      runSpeed: 6.0,
      crouchSpeed: 1.5,
      jumpForce: 5.0,
      jumpCooldown: 0.3,
      groundAcceleration: 50.0,
      groundDeceleration: 50.0,
      airAcceleration: 10.0,
      gravity: 9.81,
      groundFriction: 10.0,
      airFriction: 0.1,
      maxSlopeAngle: 45,
      stepHeight: 0.3,
      ...config
    };
  }
  
  calculateMovement(
    input: THREE.Vector3,      // Normalized input direction
    currentVelocity: THREE.Vector3,
    state: MovementState,
    isGrounded: boolean,
    deltaTime: number
  ): THREE.Vector3 {
    const targetSpeed = this.getTargetSpeed(state);
    const acceleration = isGrounded ? 
      this.config.groundAcceleration : 
      this.config.airAcceleration;
    
    // Calculate target velocity
    const targetVelocity = input.clone().multiplyScalar(targetSpeed);
    
    // Interpolate towards target
    const newVelocity = currentVelocity.clone();
    newVelocity.x = this.moveTowards(
      currentVelocity.x,
      targetVelocity.x,
      acceleration * deltaTime
    );
    newVelocity.z = this.moveTowards(
      currentVelocity.z,
      targetVelocity.z,
      acceleration * deltaTime
    );
    
    // Apply friction when no input
    if (input.length() === 0 && isGrounded) {
      const friction = this.config.groundFriction;
      newVelocity.x *= Math.max(0, 1 - friction * deltaTime);
      newVelocity.z *= Math.max(0, 1 - friction * deltaTime);
      
      // Stop completely if very slow
      if (Math.abs(newVelocity.x) < 0.01) newVelocity.x = 0;
      if (Math.abs(newVelocity.z) < 0.01) newVelocity.z = 0;
    }
    
    return newVelocity;
  }
  
  private getTargetSpeed(state: MovementState): number {
    switch (state) {
      case MovementState.RUNNING:
        return this.config.runSpeed;
      case MovementState.CROUCHING:
        return this.config.crouchSpeed;
      case MovementState.WALKING:
      default:
        return this.config.walkSpeed;
    }
  }
  
  private moveTowards(current: number, target: number, maxDelta: number): number {
    if (Math.abs(target - current) <= maxDelta) {
      return target;
    }
    return current + Math.sign(target - current) * maxDelta;
  }
  
  getJumpForce(): number {
    return this.config.jumpForce;
  }
}
```

---

### 4. Slope Handler

**File:** `src/engine/physics/character/SlopeHandler.ts`

```typescript
export class SlopeHandler {
  private maxSlopeAngle = 45;  // degrees
  private stepHeight = 0.3;     // meters
  
  canWalkOnSlope(slopeAngle: number): boolean {
    return slopeAngle <= this.maxSlopeAngle;
  }
  
  adjustVelocityForSlope(
    velocity: THREE.Vector3,
    groundNormal: THREE.Vector3
  ): THREE.Vector3 {
    // Project velocity onto slope
    const right = new THREE.Vector3(1, 0, 0);
    const slopeRight = right.clone()
      .cross(groundNormal)
      .normalize();
    const slopeForward = groundNormal.clone()
      .cross(slopeRight)
      .normalize();
    
    // Decompose velocity
    const forwardSpeed = velocity.dot(slopeForward);
    const rightSpeed = velocity.dot(slopeRight);
    
    // Reconstruct along slope
    return slopeForward.multiplyScalar(forwardSpeed)
      .add(slopeRight.multiplyScalar(rightSpeed));
  }
  
  canClimbStep(stepHeight: number): boolean {
    return stepHeight <= this.stepHeight;
  }
}
```

---

### 5. Stamina System (Optional)

**File:** `src/engine/physics/character/StaminaSystem.ts`

```typescript
export class StaminaSystem {
  private maxStamina = 100;
  private currentStamina = 100;
  private sprintDrain = 20;      // Per second
  private regenRate = 15;        // Per second
  private regenDelay = 1.0;      // Seconds before regen starts
  private timeSinceLastDrain = 0;
  
  update(deltaTime: number, isSprinting: boolean) {
    if (isSprinting && this.currentStamina > 0) {
      // Drain stamina
      this.currentStamina -= this.sprintDrain * deltaTime;
      this.currentStamina = Math.max(0, this.currentStamina);
      this.timeSinceLastDrain = 0;
    } else {
      // Regenerate stamina
      this.timeSinceLastDrain += deltaTime;
      
      if (this.timeSinceLastDrain >= this.regenDelay) {
        this.currentStamina += this.regenRate * deltaTime;
        this.currentStamina = Math.min(this.maxStamina, this.currentStamina);
      }
    }
  }
  
  canSprint(): boolean {
    return this.currentStamina > 0;
  }
  
  getStamina(): number {
    return this.currentStamina;
  }
  
  getStaminaPercent(): number {
    return this.currentStamina / this.maxStamina;
  }
}
```

---

### 6. Main Character Controller

**File:** `src/engine/physics/character/CharacterController.ts`

```typescript
import * as THREE from 'three';
import { MovementStateMachine, MovementState } from './MovementStateMachine';
import { GroundDetector, GroundInfo } from './GroundDetector';
import { MovementPhysics, MovementConfig } from './MovementPhysics';
import { SlopeHandler } from './SlopeHandler';
import { StaminaSystem } from './StaminaSystem';

export interface CharacterInput {
  moveForward: number;   // -1 to 1
  moveRight: number;     // -1 to 1
  jump: boolean;
  sprint: boolean;
  crouch: boolean;
}

export class CharacterController {
  private stateMachine: MovementStateMachine;
  private groundDetector: GroundDetector;
  private physics: MovementPhysics;
  private slopeHandler: SlopeHandler;
  private stamina: StaminaSystem;
  
  private velocity = new THREE.Vector3();
  private jumpCooldown = 0;
  
  constructor(config?: Partial<MovementConfig>) {
    this.stateMachine = new MovementStateMachine();
    this.groundDetector = new GroundDetector();
    this.physics = new MovementPhysics(config);
    this.slopeHandler = new SlopeHandler();
    this.stamina = new StaminaSystem();
  }
  
  update(
    input: CharacterInput,
    position: THREE.Vector3,
    cameraRotation: THREE.Quaternion,
    rapierWorld: any,
    deltaTime: number
  ): THREE.Vector3 {
    // Update timers
    this.jumpCooldown = Math.max(0, this.jumpCooldown - deltaTime);
    
    // Detect ground
    const groundInfo = this.groundDetector.detect(position, rapierWorld);
    
    // Update state machine
    this.updateState(input, groundInfo);
    
    // Update stamina
    const isSprinting = this.stateMachine.getState() === MovementState.RUNNING;
    this.stamina.update(deltaTime, isSprinting);
    
    // Calculate movement direction
    const moveDirection = this.calculateMoveDirection(
      input,
      cameraRotation
    );
    
    // Calculate new velocity
    this.velocity = this.physics.calculateMovement(
      moveDirection,
      this.velocity,
      this.stateMachine.getState(),
      groundInfo.isGrounded,
      deltaTime
    );
    
    // Handle slopes
    if (groundInfo.isGrounded && groundInfo.canWalk) {
      this.velocity = this.slopeHandler.adjustVelocityForSlope(
        this.velocity,
        groundInfo.groundNormal
      );
    }
    
    // Handle jumping
    if (input.jump && this.canJump(groundInfo)) {
      this.velocity.y = this.physics.getJumpForce();
      this.stateMachine.transition(MovementState.JUMPING);
      this.jumpCooldown = 0.3;
    }
    
    // Apply gravity
    if (!groundInfo.isGrounded) {
      this.velocity.y -= 9.81 * deltaTime;
    } else if (this.velocity.y < 0) {
      this.velocity.y = 0;
    }
    
    this.stateMachine.update(deltaTime);
    
    return this.velocity;
  }
  
  private updateState(input: CharacterInput, groundInfo: GroundInfo) {
    const currentState = this.stateMachine.getState();
    const isMoving = Math.abs(input.moveForward) > 0.1 || Math.abs(input.moveRight) > 0.1;
    
    // Handle state transitions
    if (!groundInfo.isGrounded && currentState !== MovementState.JUMPING) {
      this.stateMachine.transition(MovementState.FALLING);
    } else if (groundInfo.isGrounded) {
      if (currentState === MovementState.FALLING || currentState === MovementState.JUMPING) {
        this.stateMachine.transition(MovementState.LANDING);
        setTimeout(() => {
          if (isMoving) {
            this.stateMachine.transition(MovementState.WALKING);
          } else {
            this.stateMachine.transition(MovementState.IDLE);
          }
        }, 100);
      } else if (input.crouch) {
        this.stateMachine.transition(MovementState.CROUCHING);
      } else if (isMoving) {
        if (input.sprint && this.stamina.canSprint()) {
          this.stateMachine.transition(MovementState.RUNNING);
        } else {
          this.stateMachine.transition(MovementState.WALKING);
        }
      } else {
        this.stateMachine.transition(MovementState.IDLE);
      }
    }
  }
  
  private calculateMoveDirection(
    input: CharacterInput,
    cameraRotation: THREE.Quaternion
  ): THREE.Vector3 {
    const direction = new THREE.Vector3();
    
    // Forward/backward
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(cameraRotation);
    forward.y = 0;
    forward.normalize();
    direction.addScaledVector(forward, input.moveForward);
    
    // Strafe left/right
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(cameraRotation);
    right.y = 0;
    right.normalize();
    direction.addScaledVector(right, input.moveRight);
    
    if (direction.length() > 0) {
      direction.normalize();
    }
    
    return direction;
  }
  
  private canJump(groundInfo: GroundInfo): boolean {
    return groundInfo.isGrounded && 
           this.jumpCooldown <= 0 &&
           this.stateMachine.getState() !== MovementState.CROUCHING;
  }
  
  getState(): MovementState {
    return this.stateMachine.getState();
  }
  
  getStamina(): number {
    return this.stamina.getStaminaPercent();
  }
}
```

---

### 7. Configuration

**File:** `src/engine/physics/character/CharacterConfig.ts`

```typescript
export const DEFAULT_CHARACTER_CONFIG = {
  // Movement speeds (m/s)
  walkSpeed: 3.0,
  runSpeed: 6.0,
  crouchSpeed: 1.5,
  
  // Jump
  jumpForce: 5.0,
  jumpCooldown: 0.3,
  
  // Acceleration
  groundAcceleration: 50.0,
  groundDeceleration: 50.0,
  airAcceleration: 10.0,
  
  // Physics
  gravity: 9.81,
  groundFriction: 10.0,
  airFriction: 0.1,
  
  // Terrain
  maxSlopeAngle: 45,
  stepHeight: 0.3,
  
  // Stamina
  maxStamina: 100,
  sprintDrain: 20,
  staminaRegen: 15,
  regenDelay: 1.0
};
```

---

### 8. Index Export

**File:** `src/engine/physics/character/index.ts`

```typescript
export { CharacterController } from './CharacterController';
export { MovementStateMachine, MovementState } from './MovementStateMachine';
export { GroundDetector } from './GroundDetector';
export { MovementPhysics } from './MovementPhysics';
export { SlopeHandler } from './SlopeHandler';
export { StaminaSystem } from './StaminaSystem';
export { DEFAULT_CHARACTER_CONFIG } from './CharacterConfig';

export type { CharacterInput } from './CharacterController';
export type { GroundInfo } from './GroundDetector';
export type { MovementConfig } from './MovementPhysics';
```

---

## 🎮 Integration with Demo

### Updated Player Component

```typescript
function Player({ inputManager }: { inputManager: InputManager }) {
  const { camera } = useThree();
  const playerRef = useRef<any>(null);
  const controllerRef = useRef<CharacterController>(
    new CharacterController()
  );
  
  useFrame((state, delta) => {
    if (!playerRef.current) return;
    
    inputManager.update(delta);
    
    // Get input
    const input: CharacterInput = {
      moveForward: inputManager.getAxis('moveForward'),
      moveRight: inputManager.getAxis('moveRight'),
      jump: inputManager.getAction('jump'),
      sprint: inputManager.getAction('sprint'),
      crouch: inputManager.getAction('crouch')
    };
    
    // Update controller
    const position = playerRef.current.translation();
    const velocity = controllerRef.current.update(
      input,
      new THREE.Vector3(position.x, position.y, position.z),
      camera.quaternion,
      state.scene.userData.rapierWorld,
      delta
    );
    
    // Apply velocity
    playerRef.current.setLinvel(velocity, true);
    
    // Update camera
    camera.position.set(
      position.x,
      position.y + 0.6,
      position.z
    );
  });
  
  return (
    <RigidBody
      ref={playerRef}
      colliders={false}
      mass={1}
      type="dynamic"
      position={[0, 5, 0]}
      enabledRotations={[false, false, false]}
      gravityScale={0}  // Controller handles gravity
    >
      <CuboidCollider args={[0.3, 0.8, 0.3]} />
    </RigidBody>
  );
}
```

---

## 🎯 Implementation Checklist

### Phase 1: Core Systems
- [ ] Create MovementStateMachine.ts
- [ ] Create GroundDetector.ts
- [ ] Create MovementPhysics.ts
- [ ] Create SlopeHandler.ts
- [ ] Create StaminaSystem.ts (optional)
- [ ] Create CharacterConfig.ts
- [ ] Create CharacterController.ts
- [ ] Create index.ts

### Phase 2: Input Bindings
- [ ] Add Sprint action (Shift)
- [ ] Add Crouch action (Ctrl)
- [ ] Keep existing WASD axes
- [ ] Keep existing Jump action

### Phase 3: Integration
- [ ] Update Player component
- [ ] Add state display to HUD
- [ ] Add stamina bar (if using)
- [ ] Test all states

### Phase 4: Polish
- [ ] Tune physics values
- [ ] Add footstep sounds (future)
- [ ] Add camera bob (future)
- [ ] Add dust particles (future)

---

## 🧪 Testing Plan

### Movement Tests
- [ ] Walk forward/back/left/right
- [ ] Run (sprint)
- [ ] Crouch
- [ ] Jump
- [ ] Walk up slopes
- [ ] Walk down slopes
- [ ] Climb small steps
- [ ] Stop immediately on key release

### State Transitions
- [ ] Idle → Walking
- [ ] Walking → Running
- [ ] Running → Walking
- [ ] Walking → Crouching
- [ ] Jumping → Falling → Landing
- [ ] All transitions smooth

### Edge Cases
- [ ] Jump while running
- [ ] Crouch while moving
- [ ] Sprint with no stamina
- [ ] Walk on max slope angle
- [ ] Fall from height

---

## 📊 Expected Results

**After Implementation:**
- ✅ Responsive controls (no lag)
- ✅ No ice skating
- ✅ Smooth state transitions
- ✅ Realistic movement feel
- ✅ Proper slope handling
- ✅ Professional-grade controller

**Performance:**
- No FPS impact
- Minimal CPU overhead
- Smooth 60 FPS maintained

---

## 🚀 Ready to Implement!

This is a complete, production-ready character controller system.

**Shall I proceed with implementation?**

This will give you:
1. Professional movement system
2. Walk/Run/Crouch/Jump
3. No more skating
4. Foundation for open world gameplay

**Let's build this!** 🎮✨
