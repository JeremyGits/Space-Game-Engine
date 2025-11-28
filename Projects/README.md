# 🎮 DEMO PROJECTS

This folder contains standalone demo projects showcasing different capabilities of the Space Game Engine.

## 📁 Project Structure

```
Projects/
├── DragonWorld/          # Open world demo with dragon (8K assets)
├── HologramDemo/         # Voxel nanite hologram technology
├── MechaStreet/          # Urban mecha scene
├── TrumpDemo/            # Image-to-3D displacement demo
└── ComponentTests/       # AI-generated component testing
```

## 🚀 Demo Projects

### 1. Dragon World
**Path:** `Projects/DragonWorld/`  
**URL:** `http://localhost:5173/#dragon-world`

**Features:**
- 8K Dragon model with animations
- 8K PBR grass textures
- Procedural terrain generation
- GPU instancing (trees, rocks, grass)
- Dynamic lighting & shadows
- Open world rendering

**Assets Required:**
- Dragon model: `public/models/dragons/dragon-8k.glb`
- Grass textures: `public/textures/environment/grass-8k/`

---

### 2. Hologram Demo
**Path:** `Projects/HologramDemo/`  
**URL:** `http://localhost:5173/#hologram`

**Features:**
- 262,144 voxel nanites (512x512 resolution!)
- YOUR custom nanite technology
- 10,000 star particles
- 5,000 dynamic fog particles
- Cinematic lighting
- AAA rendering techniques

**Showcases:**
- Image-to-voxel conversion
- Depth-based desaturation
- Tone mapping
- Ultra-tight packing
- Professional staging

---

### 3. Mecha Street
**Path:** `Projects/MechaStreet/`  
**URL:** `http://localhost:5173/#mecha-street`

**Features:**
- Mecha robot model
- Urban environment
- Street lighting
- PBR materials
- Third-person camera
- Cinematic effects

**Assets:**
- Mecha model: `public/models/robots/mecha/mecha.glb`

---

### 4. Trump Demo
**Path:** `Projects/TrumpDemo/`  
**URL:** `http://localhost:5173/#image-to-3d`

**Features:**
- Displacement mapping (512x512 subdivisions!)
- Normal mapping
- AO mapping
- Particle systems (fire + smoke)
- Multiple lighting setups
- Real-time animation

**Showcases:**
- Image-to-3D pipeline
- Nanite-style geometry
- Advanced materials

---

### 5. Component Tests
**Path:** `Projects/ComponentTests/`  
**URLs:**
- `http://localhost:5173/#component-test`
- `http://localhost:5173/#panel-test`
- `http://localhost:5173/#detailed-panel-test`

**Features:**
- AI-generated components
- Ship panel library
- Displacement-mapped panels
- Material testing

---

## 🔧 Running Demos

### Development Mode
```bash
npm run dev
```

Then navigate to the demo URLs listed above.

### Building for Production
```bash
npm run build
```

## 📝 Adding New Demos

1. Create new folder in `Projects/`
2. Add demo component
3. Update `src/App.tsx` with route
4. Add entry to this README
5. Document features and requirements

## 🎯 Demo Organization

Each demo project should contain:
- Main component file
- README.md (project-specific docs)
- Assets folder (if needed)
- Configuration files (if needed)

## 📚 Documentation

For detailed engine documentation, see:
- `docs/MASTER_SYSTEM_INDEX.md` - Complete system catalog
- `docs/ENGINE_OVERVIEW_AND_CAPABILITIES.md` - Engine overview
- `docs/index.html` - HTML documentation portal

---

**These demos showcase the full power of the Space Game Engine!** 🚀
