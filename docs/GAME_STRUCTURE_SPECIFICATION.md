# Game Structure Specification

## Overview
This document defines how the Space Game Engine loads and runs games, including the demo game structure, level format, and engine-game integration.

---

## Directory Structure

```
SpaceGame/
├── src/
│   ├── engine/              # Game Engine (reusable)
│   │   ├── core/
│   │   ├── physics/
│   │   ├── rendering/
│   │   ├── input/
│   │   └── audio/
│   │
│   ├── game/                # Demo Game (specific implementation)
│   │   ├── SpaceGame.ts     # Main game class
│   │   ├── config/
│   │   │   ├── gameConfig.ts
│   │   │   └── controls.ts
│   │   │
│   │   ├── entities/        # Game-specific entities
│   │   │   ├── Spacecraft.ts
│   │   │   ├── SpaceStation.ts
│   │   │   ├── Asteroid.ts
│   │   │   └── Planet.ts
│   │   │
│   │   ├── systems/         # Game-specific systems
│   │   │   ├── DockingSystem.ts
│   │   │   ├── NavigationSystem.ts
│   │   │   ├── MissionSystem.ts
│   │   │   └── SpawnSystem.ts
│   │   │
│   │   ├── components/      # Game-specific components
│   │   │   ├── SpacecraftComponent.ts
│   │   │   ├── DockingPortComponent.ts
│   │   │   ├── ThrusterComponent.ts
│   │   │   └── FuelComponent.ts
│   │   │
│   │   ├── levels/          # Level definitions
│   │   │   ├── tutorial.level.json
│   │   │   ├── docking-challenge.level.json
│   │   │   ├── asteroid-field.level.json
│   │   │   └── free-roam.level.json
│   │   │
│   │   ├── missions/        # Mission definitions
│   │   │   ├── basic-docking.mission.json
│   │   │   ├── precision-docking.mission.json
│   │   │   └── asteroid-navigation.mission.json
│   │   │
│   │   └── prefabs/         # Reusable entity templates
│   │       ├── spacecraft/
│   │       │   ├── player-ship.prefab.json
│   │       │   ├── cargo-ship.prefab.json
│   │       │   └── shuttle.prefab.json
│   │       ├── stations/
│   │       │   ├── iss-station.prefab.json
│   │       │   └── orbital-platform.prefab.json
│   │       └── asteroids/
│   │           ├── small-asteroid.prefab.json
│   │           ├── medium-asteroid.prefab.json
│   │           └── large-asteroid.prefab.json
│   │
│   └── App.tsx              # React entry point
│
└── public/
    └── assets/
        ├── models/
        ├── textures/
        └── sounds/
```

---

## Level Format Specification

### Level File Structure (.level.json)

```json
{
  "version": "1.0.0",
  "metadata": {
    "name": "Tutorial - Basic Docking",
    "description": "Learn the basics of spacecraft control and docking",
    "author": "Space Game Team",
    "difficulty": "easy",
    "estimatedTime": 300,
    "tags": ["tutorial", "docking"]
  },
  
  "environment": {
    "skybox": "space-skybox-1",
    "ambientLight": {
      "color": "#ffffff",
      "intensity": 0.3
    },
    "directionalLight": {
      "color": "#ffffff",
      "intensity": 0.8,
      "direction": [1, -1, -1]
    },
    "fog": {
      "enabled": false
    }
  },
  
  "player": {
    "spacecraft": "player-ship",
    "startPosition": [0, 0, -100],
    "startRotation": [0, 0, 0, 1],
    "startVelocity": [0, 0, 0],
    "fuel": 100,
    "health": 100
  },
  
  "entities": [
    {
      "id": "station-1",
      "prefab": "iss-station",
      "position": [0, 0, 0],
      "rotation": [0, 0, 0, 1],
      "scale": [1, 1, 1],
      "components": {
        "dockingPort": {
          "portPosition": [0, 10, 0],
          "portRotation": [0, 0, 0, 1],
          "captureRadius": 5,
          "alignmentTolerance": 0.1
        }
      }
    },
    {
      "id": "asteroid-1",
      "prefab": "medium-asteroid",
      "position": [50, 20, 30],
      "rotation": [0.1, 0.2, 0.3, 0.9],
      "velocity": [0.5, 0, 0.2],
      "angularVelocity": [0.01, 0.02, 0.01]
    }
  ],
  
  "missions": [
    {
      "id": "tutorial-docking",
      "type": "docking",
      "target": "station-1",
      "objectives": [
        {
          "type": "approach",
          "description": "Approach the space station",
          "distance": 50,
          "required": true
        },
        {
          "type": "align",
          "description": "Align with the docking port",
          "tolerance": 0.2,
          "required": true
        },
        {
          "type": "dock",
          "description": "Complete docking sequence",
          "required": true
        }
      ],
      "rewards": {
        "score": 1000,
        "unlocks": ["docking-challenge"]
      },
      "timeLimit": 600,
      "fuelLimit": null
    }
  ],
  
  "camera": {
    "mode": "chase",
    "distance": 20,
    "height": 5,
    "fov": 75,
    "near": 0.1,
    "far": 10000
  },
  
  "physics": {
    "gravity": [0, 0, 0],
    "timeScale": 1.0
  },
  
  "bounds": {
    "type": "sphere",
    "center": [0, 0, 0],
    "radius": 1000,
    "wrapAround": false
  }
}
```

---

## Prefab Format Specification

### Prefab File Structure (.prefab.json)

```json
{
  "version": "1.0.0",
  "metadata": {
    "name": "Player Spacecraft",
    "description": "Standard player-controlled spacecraft",
    "category": "spacecraft",
    "tags": ["player", "controllable"]
  },
  
  "model": {
    "path": "models/spacecraft/player-ship.glb",
    "scale": [1, 1, 1]
  },
  
  "components": [
    {
      "type": "Transform",
      "data": {
        "position": [0, 0, 0],
        "rotation": [0, 0, 0, 1],
        "scale": [1, 1, 1]
      }
    },
    {
      "type": "RigidBody",
      "data": {
        "mass": 1000,
        "drag": 0.1,
        "angularDrag": 0.2,
        "useGravity": false
      }
    },
    {
      "type": "Spacecraft",
      "data": {
        "maxSpeed": 50,
        "maxAngularSpeed": 2,
        "thrusterForce": 5000,
        "rcsForce": 1000
      }
    },
    {
      "type": "Fuel",
      "data": {
        "capacity": 100,
        "current": 100,
        "consumptionRate": 0.1
      }
    },
    {
      "type": "Health",
      "data": {
        "max": 100,
        "current": 100
      }
    },
    {
      "type": "Collider",
      "data": {
        "type": "box",
        "size": [2, 1, 3],
        "offset": [0, 0, 0]
      }
    },
    {
      "type": "Mesh",
      "data": {
        "castShadow": true,
        "receiveShadow": true
      }
    }
  ],
  
  "children": [
    {
      "name": "MainThruster",
      "components": [
        {
          "type": "Transform",
          "data": {
            "position": [0, 0, -1.5],
            "rotation": [0, 0, 0, 1],
            "scale": [1, 1, 1]
          }
        },
        {
          "type": "ParticleSystem",
          "data": {
            "emissionRate": 100,
            "lifetime": 0.5,
            "startColor": "#ff6600",
            "endColor": "#ff0000",
            "startSize": 0.2,
            "endSize": 0.05
          }
        }
      ]
    }
  ]
}
```

---

## Mission Format Specification

### Mission File Structure (.mission.json)

```json
{
  "version": "1.0.0",
  "metadata": {
    "id": "precision-docking-1",
    "name": "Precision Docking Challenge",
    "description": "Dock with the station under strict time and fuel constraints",
    "difficulty": "hard",
    "category": "docking",
    "prerequisites": ["tutorial-docking"],
    "rewards": {
      "score": 5000,
      "credits": 1000,
      "unlocks": ["advanced-spacecraft"]
    }
  },
  
  "level": "docking-challenge.level.json",
  
  "objectives": [
    {
      "id": "obj-1",
      "type": "approach",
      "description": "Approach within 100m of the station",
      "target": "station-1",
      "distance": 100,
      "required": true,
      "points": 500
    },
    {
      "id": "obj-2",
      "type": "align",
      "description": "Align with docking port (±5°)",
      "target": "station-1",
      "tolerance": 0.087,
      "required": true,
      "points": 1000
    },
    {
      "id": "obj-3",
      "type": "velocity-match",
      "description": "Match station velocity (±0.5 m/s)",
      "target": "station-1",
      "tolerance": 0.5,
      "required": true,
      "points": 1500
    },
    {
      "id": "obj-4",
      "type": "dock",
      "description": "Complete docking sequence",
      "target": "station-1",
      "required": true,
      "points": 2000
    },
    {
      "id": "bonus-1",
      "type": "fuel-efficiency",
      "description": "Complete with >50% fuel remaining",
      "threshold": 50,
      "required": false,
      "points": 1000
    }
  ],
  
  "constraints": {
    "timeLimit": 300,
    "fuelLimit": 80,
    "damageLimit": 20,
    "retryLimit": 3
  },
  
  "scoring": {
    "baseScore": 5000,
    "timeBonus": {
      "enabled": true,
      "maxBonus": 2000,
      "perfectTime": 120
    },
    "fuelBonus": {
      "enabled": true,
      "maxBonus": 1000,
      "perfectFuel": 70
    },
    "precisionBonus": {
      "enabled": true,
      "maxBonus": 1500,
      "perfectAlignment": 0.01
    }
  },
  
  "failureConditions": [
    {
      "type": "timeout",
      "message": "Mission failed: Time limit exceeded"
    },
    {
      "type": "out-of-fuel",
      "message": "Mission failed: Out of fuel"
    },
    {
      "type": "collision",
      "threshold": 50,
      "message": "Mission failed: Excessive damage"
    },
    {
      "type": "out-of-bounds",
      "message": "Mission failed: Left mission area"
    }
  ]
}
```

---

## Engine-Game Integration

### Game Loader System

```typescript
// src/engine/core/GameLoader.ts

export interface GameManifest {
  name: string;
  version: string;
  engine: string;
  entryPoint: string;
  assets: {
    models: string[];
    textures: string[];
    sounds: string[];
  };
  levels: string[];
  prefabs: string[];
  missions: string[];
}

export class GameLoader {
  async loadGame(manifestPath: string): Promise<Game> {
    // 1. Load game manifest
    const manifest = await this.loadManifest(manifestPath);
    
    // 2. Validate engine compatibility
    this.validateEngineVersion(manifest.engine);
    
    // 3. Load assets
    await this.loadAssets(manifest.assets);
    
    // 4. Load prefabs
    await this.loadPrefabs(manifest.prefabs);
    
    // 5. Load levels
    await this.loadLevels(manifest.levels);
    
    // 6. Load missions
    await this.loadMissions(manifest.missions);
    
    // 7. Initialize game
    const GameClass = await import(manifest.entryPoint);
    return new GameClass.default(this.engine);
  }
}
```

### Level Loader

```typescript
// src/engine/core/LevelLoader.ts

export class LevelLoader {
  async loadLevel(levelPath: string): Promise<Level> {
    // 1. Load level JSON
    const levelData = await this.loadJSON(levelPath);
    
    // 2. Validate level format
    this.validateLevel(levelData);
    
    // 3. Create scene
    const scene = this.createScene(levelData.environment);
    
    // 4. Spawn player
    const player = await this.spawnPlayer(levelData.player);
    
    // 5. Spawn entities
    for (const entityData of levelData.entities) {
      await this.spawnEntity(entityData);
    }
    
    // 6. Load missions
    for (const missionData of levelData.missions) {
      await this.loadMission(missionData);
    }
    
    // 7. Setup camera
    this.setupCamera(levelData.camera, player);
    
    // 8. Configure physics
    this.configurePhysics(levelData.physics);
    
    return new Level(scene, player, levelData);
  }
}
```

### Prefab System

```typescript
// src/engine/core/PrefabSystem.ts

export class PrefabSystem {
  private prefabs: Map<string, PrefabData> = new Map();
  
  async loadPrefab(prefabPath: string): Promise<void> {
    const prefabData = await this.loadJSON(prefabPath);
    this.prefabs.set(prefabData.metadata.name, prefabData);
  }
  
  instantiate(prefabName: string, overrides?: any): Entity {
    const prefabData = this.prefabs.get(prefabName);
    if (!prefabData) {
      throw new Error(`Prefab not found: ${prefabName}`);
    }
    
    // 1. Create entity
    const entity = this.entityManager.createEntity();
    
    // 2. Add components
    for (const componentData of prefabData.components) {
      const component = this.createComponent(
        componentData.type,
        { ...componentData.data, ...overrides }
      );
      this.entityManager.addComponent(entity, component);
    }
    
    // 3. Create children
    for (const childData of prefabData.children || []) {
      const child = this.instantiateChild(childData, entity);
    }
    
    return entity;
  }
}
```

---

## Demo Game Entry Point

```typescript
// src/game/SpaceGame.ts

export default class SpaceGame {
  private engine: GameEngine;
  private currentLevel: Level | null = null;
  private currentMission: Mission | null = null;
  
  constructor(engine: GameEngine) {
    this.engine = engine;
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    // Register game-specific systems
    this.registerSystems();
    
    // Register game-specific components
    this.registerComponents();
    
    // Load initial level
    await this.loadLevel('tutorial.level.json');
  }
  
  private registerSystems(): void {
    this.engine.registerSystem(new DockingSystem());
    this.engine.registerSystem(new NavigationSystem());
    this.engine.registerSystem(new MissionSystem());
    this.engine.registerSystem(new SpawnSystem());
  }
  
  private registerComponents(): void {
    this.engine.registerComponent('Spacecraft', SpacecraftComponent);
    this.engine.registerComponent('DockingPort', DockingPortComponent);
    this.engine.registerComponent('Thruster', ThrusterComponent);
    this.engine.registerComponent('Fuel', FuelComponent);
  }
  
  async loadLevel(levelName: string): Promise<void> {
    const levelPath = `src/game/levels/${levelName}`;
    this.currentLevel = await this.engine.levelLoader.loadLevel(levelPath);
    this.engine.setActiveScene(this.currentLevel.scene);
  }
  
  async startMission(missionId: string): Promise<void> {
    const mission = await this.engine.missionLoader.loadMission(missionId);
    this.currentMission = mission;
    mission.start();
  }
}
```

---

## Game Manifest

```json
// src/game/game.manifest.json
{
  "name": "Space Exploration & Docking Game",
  "version": "1.0.0",
  "engine": "^1.0.0",
  "entryPoint": "./SpaceGame.ts",
  
  "assets": {
    "models": [
      "public/assets/models/spacecraft/*.glb",
      "public/assets/models/stations/*.glb",
      "public/assets/models/asteroids/*.glb"
    ],
    "textures": [
      "public/assets/textures/**/*.png",
      "public/assets/textures/**/*.jpg"
    ],
    "sounds": [
      "public/assets/sounds/**/*.mp3",
      "public/assets/sounds/**/*.ogg"
    ]
  },
  
  "levels": [
    "src/game/levels/*.level.json"
  ],
  
  "prefabs": [
    "src/game/prefabs/**/*.prefab.json"
  ],
  
  "missions": [
    "src/game/missions/*.mission.json"
  ]
}
```

---

## Summary

This specification defines:
1. ✅ Clear separation between engine and game code
2. ✅ JSON-based level format for easy editing
3. ✅ Prefab system for reusable entities
4. ✅ Mission system with objectives and scoring
5. ✅ Game loader for engine-game integration
6. ✅ Extensible architecture for future games

The engine loads the game through the manifest, which points to all necessary resources and the game entry point.
