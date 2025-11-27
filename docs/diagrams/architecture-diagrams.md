# Space Game Engine - Architecture Diagrams (Mermaid)

This document contains all architectural diagrams for the Space Game Engine using Mermaid syntax. These diagrams can be viewed in any Mermaid-compatible viewer or GitHub.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Component Hierarchy](#component-hierarchy)
3. [Data Flow](#data-flow)
4. [Game Loop](#game-loop)
5. [Physics System](#physics-system)
6. [State Management](#state-management)
7. [Entity Component System](#entity-component-system)
8. [Rendering Pipeline](#rendering-pipeline)

---

## System Architecture

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[React UI Components]
        HUD[HUD Components]
        Menu[Menu Components]
    end
    
    subgraph "Game Layer"
        Mission[Mission System]
        Spacecraft[Spacecraft Entities]
        Docking[Docking System]
        Progression[Progression System]
        Spawn[Spawn System]
    end
    
    subgraph "Engine Core"
        GameLoop[Game Loop - Fixed Timestep]
        Scene[Scene Management]
        Entity[Entity Component System]
    end
    
    subgraph "Engine Systems"
        Physics[Physics Engine - Rapier]
        Rendering[Rendering Engine - Three.js]
        Input[Input Manager - Gamepad API]
    end
    
    subgraph "State Management"
        GameState[Game State - Zustand]
        UIState[UI State - Zustand]
        Settings[Settings - Zustand]
    end
    
    UI --> GameState
    HUD --> GameState
    Menu --> UIState
    
    Mission --> GameLoop
    Spacecraft --> Entity
    Docking --> Physics
    
    GameLoop --> Physics
    GameLoop --> Rendering
    GameLoop --> Input
    
    Physics --> GameState
    Input --> GameState
    Rendering --> Scene
    
    Entity --> Scene
```

### Module Dependency Graph

```mermaid
graph LR
    subgraph "Core Dependencies"
        React[React 18]
        Three[Three.js]
        Rapier[Rapier Physics]
        Zustand[Zustand]
    end
    
    subgraph "Engine Modules"
        Core[Engine Core]
        PhysicsEngine[Physics Engine]
        RenderEngine[Render Engine]
        InputMgr[Input Manager]
    end
    
    subgraph "Game Modules"
        GameLogic[Game Logic]
        Entities[Game Entities]
        Systems[Game Systems]
    end
    
    subgraph "UI Modules"
        Components[React Components]
        HUDComp[HUD Components]
        MenuComp[Menu Components]
    end
    
    React --> Components
    React --> HUDComp
    React --> MenuComp
    
    Three --> RenderEngine
    Rapier --> PhysicsEngine
    Zustand --> Core
    
    Core --> PhysicsEngine
    Core --> RenderEngine
    Core --> InputMgr
    
    PhysicsEngine --> GameLogic
    RenderEngine --> GameLogic
    InputMgr --> GameLogic
    
    GameLogic --> Entities
    GameLogic --> Systems
    
    Entities --> Components
    Systems --> Components
```

---

## Component Hierarchy

### React Component Tree

```mermaid
graph TD
    App[App]
    
    App --> GameCanvas[GameCanvas]
    App --> HUD[HUD]
    App --> UI[UI]
    
    GameCanvas --> Scene[Scene]
    GameCanvas --> Camera[Camera]
    
    Scene --> Lighting[Lighting]
    Scene --> Environment[Environment]
    Scene --> Entities[Entities]
    Scene --> Effects[Effects]
    
    Lighting --> AmbientLight[AmbientLight]
    Lighting --> DirectionalLight[DirectionalLight]
    Lighting --> PointLight[PointLight]
    
    Environment --> Starfield[Starfield]
    Environment --> Planets[Planets]
    Environment --> Asteroids[Asteroids]
    
    Entities --> Spacecraft[Spacecraft]
    Entities --> SpaceStation[SpaceStation]
    
    Spacecraft --> RigidBody1[RigidBody]
    Spacecraft --> Collider1[Collider]
    Spacecraft --> Thrusters[Thrusters]
    Spacecraft --> Model1[3D Model]
    
    SpaceStation --> RigidBody2[RigidBody]
    SpaceStation --> DockingPorts[DockingPorts]
    SpaceStation --> Model2[3D Model]
    
    Effects --> ParticleSystem[ParticleSystem]
    Effects --> PostProcessing[PostProcessing]
    
    Camera --> CameraController[CameraController]
    
    HUD --> VelocityIndicator[VelocityIndicator]
    HUD --> AlignmentDisplay[AlignmentDisplay]
    HUD --> FuelGauge[FuelGauge]
    HUD --> DistanceIndicator[DistanceIndicator]
    HUD --> MissionObjective[MissionObjective]
    
    UI --> MainMenu[MainMenu]
    UI --> MissionSelect[MissionSelect]
    UI --> Settings[Settings]
    UI --> PauseMenu[PauseMenu]
    
    style App fill:#06b6d4
    style GameCanvas fill:#3fb950
    style HUD fill:#f59e0b
    style UI fill:#a855f7
```

---

## Data Flow

### Game Loop Data Flow

```mermaid
sequenceDiagram
    participant RAF as RequestAnimationFrame
    participant Accumulator as Fixed Update Accumulator
    participant Physics as Physics Engine
    participant Input as Input Manager
    participant Game as Game Logic
    participant Render as Rendering Engine
    participant UI as UI/HUD
    
    RAF->>Accumulator: Update (deltaTime)
    
    loop While accumulator >= fixedTimestep
        Accumulator->>Physics: Fixed Update (1/60s)
        Accumulator->>Input: Process Input
        Physics->>Game: Update Transforms
        Input->>Game: Apply Controls
        Game->>Game: Update Game State
    end
    
    Accumulator->>Render: Variable Update
    Render->>Render: Update Camera
    Render->>Render: Render Scene
    Render->>UI: Update UI
    UI->>UI: Render HUD
```

### State Flow Diagram

```mermaid
flowchart TD
    UserInput[User Input] --> InputManager[Input Manager]
    InputManager --> GameState[Game State - Zustand]
    
    GameState --> Physics[Physics Engine]
    GameState --> GameLogic[Game Logic]
    
    Physics --> SceneUpdate[Scene Updates]
    GameLogic --> SceneUpdate
    
    SceneUpdate --> RenderEngine[Rendering Engine]
    RenderEngine --> ReactComponents[React Components]
    ReactComponents --> UIUpdate[UI Updates]
    
    UIUpdate --> Display[Display to User]
    
    style UserInput fill:#06b6d4
    style GameState fill:#3fb950
    style Display fill:#f59e0b
```

### Event Flow

```mermaid
graph LR
    subgraph "Input Events"
        Keyboard[Keyboard Input]
        Gamepad[Gamepad Input]
        Mouse[Mouse Input]
    end
    
    subgraph "Input Processing"
        InputManager[Input Manager]
        ActionMap[Action Mapping]
    end
    
    subgraph "Game Events"
        Collision[Collision Events]
        Docking[Docking Events]
        Mission[Mission Events]
    end
    
    subgraph "State Updates"
        GameState[Game State]
        UIState[UI State]
    end
    
    subgraph "Reactions"
        Physics[Physics Response]
        Audio[Audio Feedback]
        Visual[Visual Effects]
        UI[UI Updates]
    end
    
    Keyboard --> InputManager
    Gamepad --> InputManager
    Mouse --> InputManager
    
    InputManager --> ActionMap
    ActionMap --> GameState
    
    Collision --> GameState
    Docking --> GameState
    Mission --> GameState
    
    GameState --> Physics
    GameState --> Audio
    GameState --> Visual
    GameState --> UI
    
    UIState --> UI
```

---

## Game Loop

### Fixed Timestep Game Loop

```mermaid
flowchart TD
    Start([Start Frame]) --> GetTime[Get Current Time]
    GetTime --> CalcDelta[Calculate Delta Time]
    CalcDelta --> AddAccum[Add to Accumulator]
    
    AddAccum --> CheckAccum{Accumulator >= Fixed Timestep?}
    
    CheckAccum -->|Yes| FixedUpdate[Fixed Update - Physics]
    FixedUpdate --> ProcessInput[Process Input]
    ProcessInput --> UpdateGame[Update Game Logic]
    UpdateGame --> SubAccum[Subtract Fixed Timestep]
    SubAccum --> CheckAccum
    
    CheckAccum -->|No| VarUpdate[Variable Update]
    VarUpdate --> UpdateCamera[Update Camera]
    UpdateCamera --> UpdateEffects[Update Effects]
    UpdateEffects --> Render[Render Scene]
    Render --> UpdateUI[Update UI/HUD]
    UpdateUI --> End([End Frame])
    
    End --> Start
    
    style FixedUpdate fill:#3fb950
    style Render fill:#06b6d4
    style UpdateUI fill:#f59e0b
```

### Update Cycle Timing

```mermaid
gantt
    title Game Loop Timing (16.67ms per frame @ 60 FPS)
    dateFormat X
    axisFormat %L ms
    
    section Physics
    Fixed Update 1    :0, 1
    Fixed Update 2    :1, 2
    Fixed Update 3    :2, 3
    
    section Input
    Process Input     :3, 5
    
    section Game Logic
    Update Entities   :5, 8
    Update Systems    :8, 10
    
    section Rendering
    Update Camera     :10, 11
    Render Scene      :11, 15
    
    section UI
    Update HUD        :15, 16
```

---

## Physics System

### Physics Update Flow

```mermaid
flowchart TD
    Start([Physics Update Start]) --> StepWorld[Step Physics World]
    StepWorld --> DetectCollisions[Detect Collisions]
    
    DetectCollisions --> HasCollisions{Collisions Detected?}
    
    HasCollisions -->|Yes| ProcessCollisions[Process Collisions]
    ProcessCollisions --> CalcImpulse[Calculate Impulse]
    CalcImpulse --> ApplyDamage[Apply Damage]
    ApplyDamage --> TriggerEffects[Trigger Effects]
    TriggerEffects --> SyncTransforms
    
    HasCollisions -->|No| SyncTransforms[Sync Transforms]
    
    SyncTransforms --> UpdateVelocities[Update Velocities]
    UpdateVelocities --> ApplyForces[Apply Forces]
    ApplyForces --> End([Physics Update End])
    
    style StepWorld fill:#3fb950
    style ProcessCollisions fill:#ef4444
    style SyncTransforms fill:#06b6d4
```

### Spacecraft Physics

```mermaid
graph TD
    subgraph "Input Forces"
        Thrust[Thrust Input]
        Rotation[Rotation Input]
    end
    
    subgraph "Force Calculation"
        CalcThrust[Calculate Thrust Force]
        CalcTorque[Calculate Torque]
        FuelConsumption[Fuel Consumption]
    end
    
    subgraph "Physics Application"
        ApplyForce[Apply Force to RigidBody]
        ApplyTorque[Apply Torque to RigidBody]
    end
    
    subgraph "State Update"
        UpdateVelocity[Update Linear Velocity]
        UpdateAngular[Update Angular Velocity]
        UpdatePosition[Update Position]
        UpdateRotation[Update Rotation]
    end
    
    subgraph "Constraints"
        MaxSpeed[Max Speed Limit]
        MaxAngular[Max Angular Velocity]
        FuelCheck[Fuel Available?]
    end
    
    Thrust --> CalcThrust
    Rotation --> CalcTorque
    
    CalcThrust --> FuelConsumption
    CalcTorque --> FuelConsumption
    
    FuelConsumption --> FuelCheck
    FuelCheck -->|Yes| ApplyForce
    FuelCheck -->|Yes| ApplyTorque
    FuelCheck -->|No| UpdateVelocity
    
    ApplyForce --> UpdateVelocity
    ApplyTorque --> UpdateAngular
    
    UpdateVelocity --> MaxSpeed
    UpdateAngular --> MaxAngular
    
    MaxSpeed --> UpdatePosition
    MaxAngular --> UpdateRotation
```

### Collision Detection

```mermaid
flowchart TD
    Start([Collision Check]) --> BroadPhase[Broad Phase - AABB]
    
    BroadPhase --> HasOverlap{AABB Overlap?}
    
    HasOverlap -->|No| End([No Collision])
    
    HasOverlap -->|Yes| NarrowPhase[Narrow Phase - Precise]
    
    NarrowPhase --> IsColliding{Actual Collision?}
    
    IsColliding -->|No| End
    
    IsColliding -->|Yes| CalcContact[Calculate Contact Points]
    CalcContact --> CalcNormal[Calculate Normal]
    CalcNormal --> CalcPenetration[Calculate Penetration]
    CalcPenetration --> ResolveCollision[Resolve Collision]
    
    ResolveCollision --> ApplyImpulse[Apply Impulse]
    ApplyImpulse --> Separate[Separate Objects]
    Separate --> TriggerEvent[Trigger Collision Event]
    TriggerEvent --> EndCollision([Collision Resolved])
    
    style BroadPhase fill:#3fb950
    style NarrowPhase fill:#06b6d4
    style ResolveCollision fill:#f59e0b
```

---

## State Management

### Zustand Store Architecture

```mermaid
graph TB
    subgraph "Game State Store"
        GameStatus[Game Status]
        PlayerData[Player Data]
        MissionData[Mission Data]
        EntityData[Entity Data]
    end
    
    subgraph "UI State Store"
        MenuState[Menu State]
        HUDState[HUD State]
        SettingsState[Settings State]
    end
    
    subgraph "Actions"
        GameActions[Game Actions]
        UIActions[UI Actions]
    end
    
    subgraph "Subscribers"
        GameComponents[Game Components]
        UIComponents[UI Components]
        Systems[Game Systems]
    end
    
    GameActions --> GameStatus
    GameActions --> PlayerData
    GameActions --> MissionData
    GameActions --> EntityData
    
    UIActions --> MenuState
    UIActions --> HUDState
    UIActions --> SettingsState
    
    GameStatus --> GameComponents
    PlayerData --> GameComponents
    MissionData --> GameComponents
    EntityData --> Systems
    
    MenuState --> UIComponents
    HUDState --> UIComponents
    SettingsState --> UIComponents
    
    style GameStatus fill:#3fb950
    style MenuState fill:#06b6d4
    style GameActions fill:#f59e0b
```

### State Update Flow

```mermaid
sequenceDiagram
    participant User
    participant Component
    participant Action
    participant Store
    participant Subscriber
    
    User->>Component: Interact
    Component->>Action: Call Action
    Action->>Store: Update State
    Store->>Store: Compute New State
    Store->>Subscriber: Notify Subscribers
    Subscriber->>Subscriber: Re-render
    Subscriber->>User: Display Update
```

---

## Entity Component System

### ECS Architecture

```mermaid
graph TD
    subgraph "Entities"
        Spacecraft[Spacecraft Entity]
        Station[Station Entity]
        Asteroid[Asteroid Entity]
    end
    
    subgraph "Components"
        Transform[Transform Component]
        RigidBody[RigidBody Component]
        Collider[Collider Component]
        Thruster[Thruster Component]
        Fuel[Fuel Component]
        Health[Health Component]
        Model[Model Component]
    end
    
    subgraph "Systems"
        PhysicsSystem[Physics System]
        RenderSystem[Render System]
        InputSystem[Input System]
        DockingSystem[Docking System]
    end
    
    Spacecraft --> Transform
    Spacecraft --> RigidBody
    Spacecraft --> Collider
    Spacecraft --> Thruster
    Spacecraft --> Fuel
    Spacecraft --> Health
    Spacecraft --> Model
    
    Station --> Transform
    Station --> RigidBody
    Station --> Collider
    Station --> Model
    
    Asteroid --> Transform
    Asteroid --> RigidBody
    Asteroid --> Collider
    Asteroid --> Model
    
    PhysicsSystem --> RigidBody
    PhysicsSystem --> Collider
    
    RenderSystem --> Transform
    RenderSystem --> Model
    
    InputSystem --> Thruster
    InputSystem --> Fuel
    
    DockingSystem --> Transform
    DockingSystem --> RigidBody
    
    style Spacecraft fill:#3fb950
    style PhysicsSystem fill:#06b6d4
    style Transform fill:#f59e0b
```

### Component Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: Create Component
    Created --> Initialized: Initialize
    Initialized --> Active: Activate
    Active --> Updated: Update Loop
    Updated --> Active: Continue
    Active --> Disabled: Disable
    Disabled --> Active: Enable
    Active --> Destroyed: Destroy
    Destroyed --> [*]
    
    note right of Updated
        Called every frame
        or fixed timestep
    end note
```

---

## Rendering Pipeline

### Three.js Rendering Pipeline

```mermaid
flowchart TD
    Start([Render Frame]) --> UpdateScene[Update Scene Graph]
    UpdateScene --> FrustumCull[Frustum Culling]
    
    FrustumCull --> SortObjects[Sort Objects]
    SortObjects --> SetupLights[Setup Lights]
    
    SetupLights --> RenderOpaque[Render Opaque Objects]
    RenderOpaque --> RenderTransparent[Render Transparent Objects]
    
    RenderTransparent --> RenderParticles[Render Particle Systems]
    RenderParticles --> PostProcess[Post-Processing]
    
    PostProcess --> Bloom[Bloom Effect]
    Bloom --> MotionBlur[Motion Blur]
    MotionBlur --> ColorGrading[Color Grading]
    
    ColorGrading --> Present[Present to Screen]
    Present --> End([Frame Complete])
    
    style UpdateScene fill:#3fb950
    style RenderOpaque fill:#06b6d4
    style PostProcess fill:#f59e0b
```

### Render Order

```mermaid
graph LR
    subgraph "Render Pass 1: Opaque"
        Skybox[Skybox]
        Planets[Planets]
        Stations[Space Stations]
        Spacecraft[Spacecraft]
        Asteroids[Asteroids]
    end
    
    subgraph "Render Pass 2: Transparent"
        Thrusters[Thruster Flames]
        Trails[Motion Trails]
        Shields[Energy Shields]
    end
    
    subgraph "Render Pass 3: Effects"
        Particles[Particle Systems]
        Explosions[Explosions]
        Lights[Light Glows]
    end
    
    subgraph "Render Pass 4: Post-Processing"
        Bloom[Bloom]
        Blur[Motion Blur]
        Grading[Color Grading]
    end
    
    Skybox --> Planets
    Planets --> Stations
    Stations --> Spacecraft
    Spacecraft --> Asteroids
    
    Asteroids --> Thrusters
    Thrusters --> Trails
    Trails --> Shields
    
    Shields --> Particles
    Particles --> Explosions
    Explosions --> Lights
    
    Lights --> Bloom
    Bloom --> Blur
    Blur --> Grading
```

### Camera System

```mermaid
stateDiagram-v2
    [*] --> CockpitView
    CockpitView --> ChaseView: Switch Camera
    ChaseView --> FreeView: Switch Camera
    FreeView --> CockpitView: Switch Camera
    
    CockpitView --> CockpitView: Update Position
    ChaseView --> ChaseView: Follow Target
    FreeView --> FreeView: Free Movement
    
    note right of CockpitView
        First-person view
        Fixed to spacecraft
    end note
    
    note right of ChaseView
        Third-person view
        Follows spacecraft
        Smooth interpolation
    end note
    
    note right of FreeView
        Free camera
        User-controlled
        Debug mode
    end note
```

---

## Docking System

### Docking State Machine

```mermaid
stateDiagram-v2
    [*] --> Approach: Start Docking
    Approach --> Alignment: Enter Capture Zone
    Alignment --> Capture: Aligned & Slow
    Capture --> Locked: Successful Dock
    Locked --> [*]: Complete
    
    Approach --> Approach: Adjust Position
    Alignment --> Approach: Exit Capture Zone
    Alignment --> Failed: Misaligned
    Capture --> Failed: Too Fast
    Failed --> [*]: Retry
    
    note right of Approach
        Distance > 100m
        Approach station
    end note
    
    note right of Alignment
        Distance < 100m
        Align with port
        Match rotation
    end note
    
    note right of Capture
        Distance < 10m
        Velocity < 0.5 m/s
        Rotation aligned
    end note
```

### Docking Alignment Check

```mermaid
flowchart TD
    Start([Check Docking]) --> CheckDistance{Distance < 100m?}
    
    CheckDistance -->|No| TooFar[Too Far - Approach]
    CheckDistance -->|Yes| CheckAlignment{Alignment < 5°?}
    
    CheckAlignment -->|No| Misaligned[Misaligned - Adjust]
    CheckAlignment -->|Yes| CheckVelocity{Velocity < 0.5 m/s?}
    
    CheckVelocity -->|No| TooFast[Too Fast - Slow Down]
    CheckVelocity -->|Yes| CheckRotation{Rotation Aligned?}
    
    CheckRotation -->|No| RotationOff[Rotation Off - Adjust]
    CheckRotation -->|Yes| InCaptureZone{In Capture Zone?}
    
    InCaptureZone -->|No| OutsideZone[Outside Zone]
    InCaptureZone -->|Yes| Success[Docking Successful!]
    
    TooFar --> End([Continue Approach])
    Misaligned --> End
    TooFast --> End
    RotationOff --> End
    OutsideZone --> End
    Success --> Locked([Locked to Station])
    
    style Success fill:#3fb950
    style TooFast fill:#ef4444
    style Misaligned fill:#f59e0b
```

---

## Mission System

### Mission Flow

```mermaid
flowchart TD
    Start([Mission Start]) --> LoadMission[Load Mission Data]
    LoadMission --> SpawnEntities[Spawn Entities]
    SpawnEntities --> SetObjectives[Set Objectives]
    
    SetObjectives --> WaitStart[Wait for Player]
    WaitStart --> MissionActive[Mission Active]
    
    MissionActive --> CheckObjectives{Check Objectives}
    
    CheckObjectives -->|Incomplete| UpdateProgress[Update Progress]
    UpdateProgress --> MissionActive
    
    CheckObjectives -->|Complete| CheckTime{Within Time Limit?}
    
    CheckTime -->|Yes| CheckFuel{Fuel Remaining?}
    CheckTime -->|No| MissionFailed[Mission Failed]
    
    CheckFuel -->|Yes| CheckDamage{Damage < Threshold?}
    CheckFuel -->|No| MissionFailed
    
    CheckDamage -->|Yes| CalcScore[Calculate Score]
    CheckDamage -->|No| MissionFailed
    
    CalcScore --> MissionSuccess[Mission Success!]
    
    MissionSuccess --> UnlockRewards[Unlock Rewards]
    MissionFailed --> ShowResults[Show Results]
    
    UnlockRewards --> End([Mission Complete])
    ShowResults --> End
    
    style MissionSuccess fill:#3fb950
    style MissionFailed fill:#ef4444
    style MissionActive fill:#06b6d4
```

---

*These diagrams provide a comprehensive visual representation of the Space Game Engine architecture. They can be viewed in any Mermaid-compatible viewer, including GitHub, GitLab, or dedicated Mermaid editors.*

**To view these diagrams:**
1. Copy the Mermaid code blocks
2. Paste into [Mermaid Live Editor](https://mermaid.live/)
3. Or view directly on GitHub (supports Mermaid natively)
