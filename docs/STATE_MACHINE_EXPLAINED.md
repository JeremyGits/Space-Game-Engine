# 🎮 State Machines Explained - Simple & Visual!

## 🤔 What IS a State Machine?

A **State Machine** is like a traffic light for your game logic! It manages different "states" and controls how you can move between them.

---

## 🚦 Real-World Example: Traffic Light

```
     RED
      ↓
   YELLOW
      ↓
    GREEN
      ↓
   YELLOW
      ↓
   (back to RED)
```

**Rules:**
- ❌ Can't go RED → GREEN directly
- ✅ Must go RED → YELLOW → GREEN
- ✅ Each state has specific behavior

---

## 🎮 Game Example: Character Movement

### Your Engine Already Has This!

**File:** `src/engine/physics/character/MovementStateMachine.ts`

### States:
```
IDLE ──→ WALKING ──→ RUNNING
  ↓         ↓           ↓
  └────→ JUMPING ──→ FALLING ──→ LANDING ──→ back to IDLE
           ↓
       CROUCHING
```

### How It Works:

```typescript
// Character starts IDLE
currentState = IDLE

// Player presses W key
if (canTransition(IDLE → WALKING)) {
  currentState = WALKING
  // Play walk animation
  // Apply walk speed
}

// Player presses Shift
if (canTransition(WALKING → RUNNING)) {
  currentState = RUNNING
  // Play run animation
  // Apply run speed
}

// Player presses Space
if (canTransition(RUNNING → JUMPING)) {
  currentState = JUMPING
  // Play jump animation
  // Apply jump force
}

// Gravity takes over
if (canTransition(JUMPING → FALLING)) {
  currentState = FALLING
  // Play fall animation
  // Apply gravity
}

// Hits ground
if (canTransition(FALLING → LANDING)) {
  currentState = LANDING
  // Play land animation
  // Brief pause
}

// Landing complete
if (canTransition(LANDING → IDLE)) {
  currentState = IDLE
  // Back to idle animation
}
```

---

## 🎭 Why Use State Machines?

### Without State Machine (BAD):
```typescript
// Chaos! Anything can happen!
if (jumpPressed) jump();
if (walkPressed) walk();
if (runPressed) run();
// Can jump while already jumping!
// Can walk while falling!
// BUGS EVERYWHERE!
```

### With State Machine (GOOD):
```typescript
// Controlled! Only valid transitions!
if (jumpPressed && stateMachine.canTransition(JUMPING)) {
  stateMachine.transition(JUMPING);
  // Only jumps if currently in valid state!
}
```

---

## 🎨 Animation State Machine

For your mecha, you'd use it like this:

```
        IDLE
         ↓
    ┌────┴────┐
    ↓         ↓
  WALK      RUN
    ↓         ↓
    └────┬────┘
         ↓
      ATTACK
         ↓
    ┌────┴────┐
    ↓         ↓
  SHOOT    MELEE
    ↓         ↓
    └────┬────┘
         ↓
       IDLE
```

**Each state:**
- Plays specific animation
- Has specific behavior
- Can only transition to allowed states

---

## 💡 Your Engine's State Machine

### Current Implementation:

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

// Usage:
const stateMachine = new MovementStateMachine();

// Try to walk
if (stateMachine.canTransition(MovementState.WALKING)) {
  stateMachine.transition(MovementState.WALKING);
  // Now in WALKING state!
}

// Check current state
if (stateMachine.isState(MovementState.WALKING)) {
  // Apply walk speed
  // Play walk animation
}
```

---

## 🤖 For Your Mecha - Animation State Machine

### What You Need:

```typescript
export enum MechaAnimationState {
  // Locomotion
  IDLE = 'idle',
  WALK = 'walk',
  RUN = 'run',
  TURN_LEFT = 'turn_left',
  TURN_RIGHT = 'turn_right',
  
  // Combat
  AIM = 'aim',
  SHOOT = 'shoot',
  RELOAD = 'reload',
  MELEE = 'melee',
  
  // Special
  JUMP = 'jump',
  LAND = 'land',
  DAMAGED = 'damaged',
  DEATH = 'death'
}

class MechaAnimationStateMachine {
  private currentState: MechaAnimationState;
  private currentAnimation: AnimationAction;
  
  transition(to: MechaAnimationState) {
    // Blend from current animation to new one
    const newAnim = this.animations[to];
    newAnim.fadeIn(0.2);  // Smooth blend!
    this.currentAnimation.fadeOut(0.2);
    this.currentState = to;
  }
}
```

---

## 🎯 State Machine Benefits:

### 1. **Prevents Bugs**
```
❌ Can't jump while already jumping
❌ Can't walk while falling
❌ Can't shoot while reloading
✅ Only valid transitions allowed!
```

### 2. **Smooth Animations**
```
IDLE → WALK: Blend over 0.2 seconds
WALK → RUN: Blend over 0.15 seconds
RUN → JUMP: Instant transition
JUMP → FALL: Blend over 0.1 seconds
```

### 3. **Easy to Debug**
```
console.log(stateMachine.getState());
// "Currently in WALKING state"
// "Time in state: 2.5 seconds"
// "Can transition to: IDLE, RUNNING, JUMPING"
```

### 4. **Organized Code**
```typescript
switch (stateMachine.getState()) {
  case IDLE:
    // Idle behavior
    break;
  case WALKING:
    // Walking behavior
    break;
  case RUNNING:
    // Running behavior
    break;
}
```

---

## 🚀 Next Level: Blend Trees

**State machines** control WHICH animation plays.
**Blend trees** control HOW MUCH of each animation plays.

### Example: Directional Movement

```
        IDLE (0%)
          ↓
    ┌─────┼─────┐
    ↓     ↓     ↓
  WALK  WALK  WALK
  LEFT  FWD   RIGHT
   ↓     ↓     ↓
  Blend based on input direction!
```

**Input:** Joystick at 45° right
**Result:** 50% Walk Forward + 50% Walk Right = Diagonal walk!

---

## 📊 Visual State Machine Diagram

```
┌─────────┐
│  IDLE   │◄─────────────────┐
└────┬────┘                  │
     │                       │
     ├──→ WALKING ──→ RUNNING│
     │       │          │    │
     │       └──→ JUMP ─┘    │
     │              │        │
     └──→ CROUCH    │        │
                    ↓        │
                 FALLING     │
                    │        │
                    ↓        │
                 LANDING ────┘
```

**Each arrow = allowed transition**
**No arrow = blocked transition**

---

## 🎬 Animation State Machine for Mecha

### What You'll Build:

```typescript
class AnimationStateMachine {
  states: Map<string, AnimationState>
  currentState: AnimationState
  
  // Each state knows:
  - Which animation to play
  - What states it can transition to
  - Blend time for transitions
  - Events to trigger
  
  transition(to: string) {
    // 1. Check if valid
    // 2. Fade out current animation
    // 3. Fade in new animation
    // 4. Update current state
    // 5. Trigger events
  }
}
```

### Usage:
```typescript
// Mecha is idle
animStateMachine.transition('walk');
// Smoothly blends from idle → walk animation

// Player shoots
animStateMachine.transition('shoot');
// Blends from walk → shoot animation

// Shoot finishes
animStateMachine.transition('walk');
// Back to walking
```

---

## 🔥 Why This Matters for Your Mecha:

### Current (No Animation System):
- ❌ Model just rotates
- ❌ No walking animation
- ❌ No shooting animation
- ❌ Static pose

### With Animation State Machine:
- ✅ Smooth walk cycle
- ✅ Running animation
- ✅ Shooting animation
- ✅ Reloading animation
- ✅ Damaged reactions
- ✅ Death animation
- ✅ All blend smoothly!

---

## 🎯 Summary:

**State Machine = Traffic Controller for Animations**

- Manages which animation plays
- Controls transitions between animations
- Prevents invalid states
- Makes animations smooth
- Keeps code organized

**You already have one for movement!**
**Now you need one for animations!**

---

## 🚀 Next Steps:

1. **Build Animation State Machine**
2. **Load animations from GLB**
3. **Connect to input**
4. **Add blend trees**
5. **Watch your mecha come to life!**

Ready to build it? 🤖✨
