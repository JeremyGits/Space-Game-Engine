# 🎨 Space Game Engine - Asset Specification

**Version**: 1.0  
**Last Updated**: Phase 2  
**Purpose**: Complete specification for all game assets (graphics, models, textures, audio)

---

## 📁 Asset Directory Structure

```
src/assets/
├── models/              # 3D models (.glb, .gltf)
│   ├── spacecraft/      # Player ships
│   ├── stations/        # Space stations
│   ├── asteroids/       # Asteroid models
│   ├── planets/         # Celestial bodies
│   └── props/           # Misc objects
│
├── textures/            # Texture maps
│   ├── spacecraft/      # Ship textures
│   ├── stations/        # Station textures
│   ├── environment/     # Skybox, stars, nebulae
│   ├── ui/              # UI elements
│   └── effects/         # Particle textures
│
├── sounds/              # Audio files
│   ├── sfx/             # Sound effects
│   ├── music/           # Background music
│   └── ambient/         # Ambient sounds
│
└── fonts/               # Custom fonts (if needed)
```

---

## 🚀 1. SPACECRAFT MODELS

### 1.1 Player Spacecraft (Primary)
**File**: `src/assets/models/spacecraft/player-ship-01.glb`

**Specifications**:
- **Format**: GLB (GLTF Binary)
- **Polygon Count**: 2,000 - 5,000 triangles
- **Dimensions**: ~10-15 units (Three.js units)
- **Pivot Point**: Center of mass
- **LOD Levels**: 3 (High, Medium, Low)

**Required Components**:
- Main hull
- Cockpit (with transparency)
- Thruster nozzles (6 positions for RCS)
- Main engine
- Landing gear (optional)
- Docking port

**Textures Required**:
- Base Color: 2048x2048 PNG
- Normal Map: 2048x2048 PNG
- Metallic/Roughness: 2048x2048 PNG (combined)
- Emissive Map: 2048x2048 PNG (for lights/thrusters)
- AO (Ambient Occlusion): 2048x2048 PNG

**Variants** (Future):
- `player-ship-02.glb` - Heavier cargo ship
- `player-ship-03.glb` - Fast scout ship

---

### 1.2 Alternative Spacecraft (Unlockables)
**Files**: `src/assets/models/spacecraft/ship-[type]-[number].glb`

**Types to Create**:
1. **Scout Ship** - Fast, agile, low fuel capacity
2. **Cargo Ship** - Slow, high fuel, large
3. **Racing Ship** - Very fast, minimal fuel
4. **Rescue Ship** - Balanced, special equipment

**Same specs as primary ship**

---

## 🏗️ 2. SPACE STATIONS

### 2.1 ISS-Style Station
**File**: `src/assets/models/stations/iss-station.glb`

**Specifications**:
- **Format**: GLB
- **Polygon Count**: 10,000 - 20,000 triangles
- **Dimensions**: ~100 units length
- **Docking Ports**: 4-6 clearly marked

**Components**:
- Main truss structure
- Solar panels (animated rotation)
- Modules (cylindrical sections)
- Docking ports (with alignment markers)
- Communication arrays
- Radiators

**Textures**:
- Base Color: 4096x4096 PNG
- Normal Map: 4096x4096 PNG
- Metallic/Roughness: 4096x4096 PNG
- Emissive: 4096x4096 PNG (windows, lights)
- AO: 4096x4096 PNG

---

### 2.2 Rotating Space Station
**File**: `src/assets/models/stations/rotating-station.glb`

**Specifications**:
- Ring-shaped design
- Animated rotation
- Multiple docking ports
- Similar poly count and texture specs

---

### 2.3 Small Outpost
**File**: `src/assets/models/stations/outpost-small.glb`

**Specifications**:
- Simpler design
- 5,000 - 10,000 triangles
- 1-2 docking ports
- 2048x2048 textures

---

## 🪨 3. ASTEROIDS

### 3.1 Asteroid Set (Procedural Base)
**Files**: `src/assets/models/asteroids/asteroid-[size]-[variant].glb`

**Sizes**:
- **Small**: 2-5 units, 500-1000 tris
- **Medium**: 5-15 units, 1000-2000 tris
- **Large**: 15-30 units, 2000-4000 tris
- **Huge**: 30-50 units, 4000-8000 tris

**Variants per Size**: 5-10 different shapes

**Textures** (Shared Atlas):
- Base Color: 2048x2048 PNG (rocky surface)
- Normal Map: 2048x2048 PNG (surface detail)
- Roughness: 2048x2048 PNG
- AO: 2048x2048 PNG

**Special Types**:
- `asteroid-metallic-*.glb` - Shiny, valuable
- `asteroid-ice-*.glb` - Icy, reflective
- `asteroid-volcanic-*.glb` - Glowing cracks

---

## 🌍 4. PLANETS & CELESTIAL BODIES

### 4.1 Background Planets (Low Detail)
**Files**: `src/assets/models/planets/planet-[type].glb`

**Types**:
- Earth-like
- Gas giant
- Rocky/Mars-like
- Ice planet
- Lava planet

**Specifications**:
- **Format**: GLB or sphere primitive with texture
- **Polygon Count**: 1,000 - 2,000 (sphere subdivision)
- **Dimensions**: 200-500 units (background scale)

**Textures**:
- Base Color: 4096x4096 PNG (planet surface)
- Normal Map: 4096x4096 PNG (optional)
- Emissive: 4096x4096 PNG (for city lights/lava)
- Cloud Layer: 4096x4096 PNG with alpha (separate)

---

### 4.2 Moon
**File**: `src/assets/models/planets/moon.glb`

**Specifications**:
- Smaller scale (50-100 units)
- Cratered surface
- 2048x2048 textures

---

## ✨ 5. EFFECTS & PARTICLES

### 5.1 Particle Textures
**Location**: `src/assets/textures/effects/`

**Files Needed**:
1. **thruster-flame.png** (512x512, alpha)
   - Gradient flame texture
   - Used for RCS thrusters

2. **engine-glow.png** (512x512, alpha)
   - Bright core with falloff
   - Main engine exhaust

3. **explosion-sprite-sheet.png** (2048x2048)
   - 4x4 grid (16 frames)
   - Explosion animation

4. **spark.png** (256x256, alpha)
   - Small bright spark
   - Collision effects

5. **smoke.png** (512x512, alpha)
   - Wispy smoke texture
   - Damage effects

6. **star-glow.png** (256x256, alpha)
   - Soft circular glow
   - Distant stars

---

## 🌌 6. ENVIRONMENT

### 6.1 Skybox/Starfield
**Location**: `src/assets/textures/environment/`

**Option A: Cubemap Skybox**
**Files**: 
- `skybox-px.png` (2048x2048) - Positive X
- `skybox-nx.png` (2048x2048) - Negative X
- `skybox-py.png` (2048x2048) - Positive Y
- `skybox-ny.png` (2048x2048) - Negative Y
- `skybox-pz.png` (2048x2048) - Positive Z
- `skybox-nz.png` (2048x2048) - Negative Z

**Content**: Deep space with stars, distant nebulae

**Option B: Procedural Starfield** (Preferred)
- Generate stars programmatically
- More performant
- Dynamic

---

### 6.2 Nebula Textures
**Files**: `src/assets/textures/environment/nebula-[color].png`

**Specifications**:
- **Size**: 2048x2048 PNG with alpha
- **Colors**: Blue, purple, red, green
- **Usage**: Background atmosphere

---

## 🎵 7. AUDIO ASSETS

### 7.1 Sound Effects (SFX)
**Location**: `src/assets/sounds/sfx/`

**Required Files**:

1. **Thruster Sounds**
   - `thruster-rcs-fire.mp3` (0.5s loop)
   - `thruster-main-fire.mp3` (1s loop)
   - `thruster-boost.mp3` (0.3s)

2. **Collision Sounds**
   - `collision-light.mp3` (0.5s)
   - `collision-medium.mp3` (0.7s)
   - `collision-heavy.mp3` (1s)
   - `collision-asteroid.mp3` (0.8s)

3. **Docking Sounds**
   - `docking-approach.mp3` (2s)
   - `docking-capture.mp3` (1s)
   - `docking-lock.mp3` (1.5s)
   - `docking-success.mp3` (2s)
   - `docking-fail.mp3` (1s)

4. **UI Sounds**
   - `ui-button-click.mp3` (0.2s)
   - `ui-button-hover.mp3` (0.1s)
   - `ui-alert.mp3` (0.5s)
   - `ui-success.mp3` (0.7s)
   - `ui-error.mp3` (0.7s)

5. **Explosion Sounds**
   - `explosion-small.mp3` (1s)
   - `explosion-medium.mp3` (1.5s)
   - `explosion-large.mp3` (2s)

6. **Misc**
   - `fuel-low-warning.mp3` (1s loop)
   - `mission-complete.mp3` (2s)
   - `countdown-beep.mp3` (0.3s)

**Format**: MP3 or OGG
**Sample Rate**: 44.1kHz
**Bit Rate**: 128-192 kbps

---

### 7.2 Background Music
**Location**: `src/assets/sounds/music/`

**Required Tracks**:

1. **menu-theme.mp3** (2-3 min loop)
   - Ambient, atmospheric
   - Calm, spacey

2. **gameplay-ambient.mp3** (3-5 min loop)
   - Subtle, non-intrusive
   - Space exploration feel

3. **gameplay-action.mp3** (2-3 min loop)
   - More intense
   - For asteroid fields, challenges

4. **docking-tension.mp3** (2 min loop)
   - Builds tension
   - For precision docking

**Format**: MP3
**Sample Rate**: 44.1kHz
**Bit Rate**: 192-256 kbps

---

### 7.3 Ambient Sounds
**Location**: `src/assets/sounds/ambient/`

**Files**:
- `space-ambient.mp3` (30s loop) - Subtle space hum
- `station-interior.mp3` (30s loop) - Mechanical sounds
- `radio-chatter.mp3` (varies) - Mission control voices

---

## 🎨 8. UI TEXTURES

### 8.1 HUD Elements
**Location**: `src/assets/textures/ui/`

**Files**:

1. **hud-crosshair.png** (256x256, alpha)
   - Center targeting reticle

2. **hud-alignment-indicator.png** (512x512, alpha)
   - Docking alignment display

3. **hud-velocity-arrow.png** (128x128, alpha)
   - Direction indicator

4. **hud-frame.png** (1024x1024, alpha)
   - HUD border/frame elements

5. **hud-radar-bg.png** (512x512, alpha)
   - Radar background

6. **icon-fuel.png** (128x128, alpha)
7. **icon-health.png** (128x128, alpha)
8. **icon-speed.png** (128x128, alpha)
9. **icon-target.png** (128x128, alpha)

**Format**: PNG with alpha channel
**Style**: Futuristic, clean, high contrast

---

## 📊 9. ASSET LOADING PRIORITIES

### Priority 1 (Essential - Load First):
- Player spacecraft model + textures
- Basic station model + textures
- Small asteroid set (5 variants)
- Thruster particle textures
- Essential SFX (thrusters, collision, docking)

### Priority 2 (Important - Load Second):
- Additional spacecraft variants
- More asteroid variants
- Planet textures
- UI textures
- Background music

### Priority 3 (Optional - Load Last):
- Alternative stations
- Special asteroid types
- Ambient sounds
- Extra effects

---

## 🔧 10. ASSET CREATION GUIDELINES

### General Rules:
1. **Optimization First**
   - Keep poly counts reasonable
   - Use texture atlases where possible
   - Implement LOD (Level of Detail)

2. **Consistent Scale**
   - 1 unit = 1 meter in Three.js
   - Player ship: ~10-15 units
   - Station: ~100 units
   - Planets: 200-500 units (background)

3. **Texture Formats**
   - Use PNG for textures with alpha
   - Use JPG for opaque textures (smaller)
   - Power-of-2 dimensions (512, 1024, 2048, 4096)

4. **Model Formats**
   - GLB preferred (binary, smaller)
   - GLTF for debugging (JSON, readable)

5. **Audio Formats**
   - MP3 for music (better compression)
   - OGG for SFX (better quality at small sizes)

---

## 📦 11. ASSET LOADING SYSTEM

### Implementation:
```typescript
// Asset manifest
const ASSET_MANIFEST = {
  models: {
    spacecraft: {
      player: '/assets/models/spacecraft/player-ship-01.glb',
      // ...
    },
    stations: {
      iss: '/assets/models/stations/iss-station.glb',
      // ...
    }
  },
  textures: {
    effects: {
      thruster: '/assets/textures/effects/thruster-flame.png',
      // ...
    }
  },
  sounds: {
    sfx: {
      thrusterFire: '/assets/sounds/sfx/thruster-rcs-fire.mp3',
      // ...
    }
  }
};
```

### Loading Strategy:
1. Show loading screen
2. Load Priority 1 assets
3. Initialize game with basic assets
4. Stream Priority 2 & 3 in background
5. Enable features as assets load

---

## 🎯 12. MINIMUM VIABLE DEMO ASSETS

For initial demo, we need **at minimum**:

### Models (3 files):
1. ✅ Player spacecraft
2. ✅ One space station
3. ✅ 3-5 asteroid variants

### Textures (10 files):
1. ✅ Spacecraft textures (4: color, normal, metallic, emissive)
2. ✅ Station textures (4: color, normal, metallic, emissive)
3. ✅ Thruster particle (1)
4. ✅ Star glow (1)

### Audio (5 files):
1. ✅ Thruster sound
2. ✅ Collision sound
3. ✅ Docking success sound
4. ✅ UI click sound
5. ✅ Background music (1 track)

**Total Minimum**: ~18 files to get started

---

## 📝 13. ASSET CREATION TOOLS

### Recommended Software:

**3D Modeling**:
- Blender (Free, open-source)
- Maya (Professional)
- 3ds Max (Professional)

**Texturing**:
- Substance Painter (Industry standard)
- Photoshop
- GIMP (Free)

**Audio**:
- Audacity (Free)
- FL Studio
- Ableton Live

**Procedural**:
- Houdini (Procedural generation)
- Substance Designer (Procedural textures)

---

## 🚀 14. NEXT STEPS

### Phase 2 (Current):
- [ ] Set up asset loading system
- [ ] Create placeholder assets (primitives)
- [ ] Implement asset manager

### Phase 3:
- [ ] Create/source actual 3D models
- [ ] Create/source textures
- [ ] Create/source audio

### Phase 4:
- [ ] Optimize assets
- [ ] Implement LOD system
- [ ] Add asset streaming

---

## 📊 15. ESTIMATED FILE SIZES

### Models:
- Player ship: ~2-5 MB (with textures)
- Station: ~5-10 MB (with textures)
- Asteroids (set of 10): ~5-8 MB
- **Total Models**: ~15-25 MB

### Textures:
- Spacecraft: ~8 MB
- Station: ~16 MB
- Effects: ~2 MB
- UI: ~2 MB
- **Total Textures**: ~30 MB

### Audio:
- SFX: ~5 MB
- Music: ~10-15 MB
- **Total Audio**: ~15-20 MB

### **Grand Total**: ~60-75 MB (uncompressed)
### **Compressed**: ~30-40 MB (with gzip)

---

## ✅ SUMMARY

This specification provides a complete blueprint for all assets needed for the Space Game Engine demo. We'll start with **placeholder/primitive assets** during development, then replace with proper assets as we progress.

**Key Takeaways**:
- Organized directory structure
- Clear specifications for each asset type
- Optimization guidelines
- Loading priorities
- Minimum viable set for demo

**Ready to proceed with Scene Management implementation!** 🚀
