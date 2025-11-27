# 🎯 Cockpit Blueprint System - Implementation Plan

## Overview

Build a proper cockpit reconstruction system that uses the original cockpit image as a blueprint to create accurate 3D representations with proper UV mapping.

---

## Phase 1: Manual Mapping (Quick Implementation)

### Step 1: Analyze Original Image
- Load `public/cockpit-scaled-orig.png`
- Identify major components and their positions
- Map out layers (hull → instruments → details)

### Step 2: Create Component Regions
Based on the cockpit image, identify:

**Layer 1: Hull/Frame**
- Canopy frame (top curved sections)
- Side panels (left/right structural)
- Dashboard base (bottom structural)
- Overhead panel (top center)

**Layer 2: Instrument Panels**
- Left MFD housing
- Center MFD housing  
- Right MFD housing
- Side console panels
- Center console

**Layer 3: Displays**
- Left MFD screen
- Center MFD screen
- Right MFD screen
- Small auxiliary displays

**Layer 4: Controls**
- Control stick (center bottom)
- Throttle (left side)
- Buttons and switches
- Knobs and dials

**Layer 5: Details**
- Warning labels
- Panel lines
- Rivets
- Wear/damage

### Step 3: UV Mapping Strategy
For each component:
```typescript
{
  name: "left_mfd",
  uvRegion: {
    x: 0.1,      // Start X (0-1 normalized)
    y: 0.3,      // Start Y (0-1 normalized)
    width: 0.2,  // Width (0-1 normalized)
    height: 0.25 // Height (0-1 normalized)
  },
  position3D: [-0.8, -0.3, -0.4],
  size3D: [0.5, 0.5, 0.1],
  layer: 2
}
```

### Step 4: Create Layered Cockpit Component
```typescript
<LayeredCockpit blueprint={cockpitBlueprint} texture={originalTexture} />
```

---

## Phase 2: Blueprint Analyzer Tool

### Interactive Web Tool
Create a tool where you can:
1. Load cockpit image
2. Click to mark component corners
3. Assign component type (MFD, button, panel, etc.)
4. Set layer depth
5. Export blueprint JSON
6. Auto-generate 3D cockpit

### Tool Features:
- **Visual Editor**: Click and drag to define regions
- **Component Library**: Select from CockpitComponentTypes
- **Layer Management**: Organize by depth
- **3D Preview**: See result in real-time
- **Export/Import**: Save blueprints as JSON
- **Auto-detection**: AI-assisted component recognition

---

## Implementation Steps

### Step 1: Create Blueprint Data Structure
```typescript
interface CockpitBlueprint {
  name: string;
  sourceImage: string;
  imageDimensions: { width: number; height: number };
  components: CockpitComponent[];
}

interface CockpitComponent {
  id: string;
  type: ComponentType; // From CockpitComponentTypes
  layer: number; // 0 = hull, 1 = panels, 2 = displays, etc.
  uvRegion: UVRegion;
  position3D: [number, number, number];
  rotation3D: [number, number, number];
  scale3D: [number, number, number];
  material: MaterialConfig;
}
```

### Step 2: Create UV-Mapped Mesh Generator
```typescript
function createUVMappedMesh(
  component: CockpitComponent,
  texture: THREE.Texture
): THREE.Mesh {
  // Create geometry
  // Apply UV coordinates for specific region
  // Apply material with texture
  // Position in 3D space
}
```

### Step 3: Manual Blueprint for Current Cockpit
Analyze the image and create initial blueprint:
- Measure component positions in pixels
- Convert to normalized UV coordinates
- Map to 3D positions
- Define layers

### Step 4: Build Layered Cockpit Renderer
```typescript
<LayeredCockpit>
  <Layer depth={0}>{/* Hull */}</Layer>
  <Layer depth={1}>{/* Panels */}</Layer>
  <Layer depth={2}>{/* Displays */}</Layer>
  <Layer depth={3}>{/* Controls */}</Layer>
  <Layer depth={4}>{/* Details */}</Layer>
</LayeredCockpit>
```

### Step 5: Create Blueprint Analyzer Tool
Interactive web tool:
- Canvas overlay on cockpit image
- Click to define regions
- Assign component types
- Set 3D properties
- Export JSON blueprint

---

## File Structure

```
src/tools/cockpit/
├── blueprint/
│   ├── BlueprintTypes.ts          # Data structures
│   ├── BlueprintLoader.ts         # Load/save blueprints
│   ├── UVMapper.ts                # UV coordinate mapping
│   ├── MeshGenerator.ts           # Generate meshes from blueprint
│   └── LayerManager.ts            # Layer organization
├── analyzer/
│   ├── BlueprintAnalyzer.tsx      # Interactive tool UI
│   ├── ComponentMarker.tsx        # Click to mark components
│   ├── RegionEditor.tsx           # Edit UV regions
│   └── PreviewRenderer.tsx        # 3D preview
└── blueprints/
    ├── fighter_cockpit.json       # Your current cockpit
    ├── transport_cockpit.json     # Future cockpits
    └── scout_cockpit.json
```

---

## Benefits

### Manual Mapping:
- ✅ Quick to implement
- ✅ Full control over placement
- ✅ Works immediately
- ✅ Accurate to original image

### Blueprint Analyzer:
- ✅ Reusable for any cockpit image
- ✅ Fast iteration
- ✅ Visual feedback
- ✅ Exportable blueprints
- ✅ Community can create cockpits

---

## Next Steps

1. **Immediate**: Create manual blueprint for current cockpit
2. **Short-term**: Build LayeredCockpit component
3. **Medium-term**: Create Blueprint Analyzer tool
4. **Long-term**: AI-assisted component detection

This approach will give us a REAL cockpit that matches your original image perfectly!
