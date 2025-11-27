# Cockpit Generator Tool 🚀

Automatically generate 3D cockpits from 2D images for your space game!

## Features

✅ **Automatic Geometry Generation** - Creates curved panels from flat images
✅ **UV Mapping** - Intelligently maps textures onto 3D surfaces  
✅ **Screen Detection** - Identifies and creates emissive screens
✅ **Interactive Elements** - Buttons, switches, levers
✅ **Multiple Presets** - Fighter, Transport, Shuttle, Racing
✅ **Customizable** - Full control over every parameter
✅ **React Integration** - Easy to use React components

## Quick Start

### 1. Basic Usage

```typescript
import { CockpitGenerator } from './tools/cockpit/CockpitGenerator';
import { CockpitPreset } from './tools/cockpit/types/CockpitTypes';

// Create a preset configuration
const config = CockpitGenerator.createPreset(
  CockpitPreset.FIGHTER,
  '/path/to/your/cockpit-image.jpg'
);

// Generate the cockpit
const generator = new CockpitGenerator(config);
const cockpit = await generator.generate();

// Add to your scene
scene.add(cockpit.mesh);

// Position camera
camera.position.copy(cockpit.cameraPosition);
camera.lookAt(cockpit.cameraTarget);
```

### 2. Using React Component

```typescript
import { FighterCockpitDemo } from './examples/FighterCockpitExample';

function App() {
  return <FighterCockpitDemo />;
}
```

### 3. Custom Configuration

```typescript
import { CockpitConfig } from './tools/cockpit/types/CockpitTypes';
import * as THREE from 'three';

const customConfig: CockpitConfig = {
  imageUrl: '/my-cockpit.jpg',
  
  geometry: {
    curvature: 120,  // degrees
    width: 2.0,      // meters
    height: 1.5,
    depth: 1.5,
    seatPosition: new THREE.Vector3(0, -0.2, 0)
  },
  
  panels: {
    left: {
      enabled: true,
      curve: 0.3,
      depth: 0.5,
      angle: -30,
      uvRegion: { x: 0, y: 0, width: 0.3, height: 1 },
      segments: 16
    },
    // ... more panels
  },
  
  materials: {
    metalness: 0.7,
    roughness: 0.3,
    emissiveIntensity: 0.5,
    normalScale: 1.0
  }
};
```

## How It Works

### 1. Image Analysis
The tool analyzes your cockpit image to understand:
- Panel boundaries
- Screen locations
- Control positions
- Depth cues

### 2. Geometry Generation
Creates 3D geometry:
- **Curved Panels** - Left, right, top, center
- **Screens** - Flat emissive surfaces
- **Controls** - Buttons, switches, levers

### 3. UV Mapping
Maps your image onto the 3D geometry:
- Automatic UV coordinate calculation
- Region-based mapping
- Seamless texture application

### 4. Material Creation
Generates appropriate materials:
- **Base Material** - Metallic panels
- **Screen Material** - Emissive displays
- **Interactive Material** - Glowing buttons

## Configuration Guide

### Geometry Settings

```typescript
geometry: {
  curvature: 120,    // How much the cockpit curves (degrees)
  width: 2.0,        // Width in meters
  height: 1.5,       // Height in meters
  depth: 1.5,        // Depth in meters
  seatPosition: new THREE.Vector3(0, -0.2, 0)  // Pilot eye position
}
```

### Panel Configuration

```typescript
panels: {
  left: {
    enabled: true,      // Show this panel
    curve: 0.3,         // Curve amount (0-1)
    depth: 0.5,         // Distance from center (meters)
    angle: -30,         // Rotation angle (degrees)
    uvRegion: {         // Which part of image to use
      x: 0,             // Start X (0-1)
      y: 0,             // Start Y (0-1)
      width: 0.3,       // Width (0-1)
      height: 1         // Height (0-1)
    },
    segments: 16        // Smoothness (higher = smoother)
  }
}
```

### Screen Configuration

```typescript
screens: [
  {
    id: 'center_mfd',
    position: new THREE.Vector3(0, 0.1, -0.6),
    size: new THREE.Vector2(0.25, 0.25),
    rotation: new THREE.Euler(0, 0, 0),
    uvRegion: { x: 0.45, y: 0.3, width: 0.1, height: 0.15 },
    emissive: true,
    emissiveColor: new THREE.Color(0x00ff00),
    emissiveIntensity: 0.5
  }
]
```

## Presets

### Fighter
- Aggressive 120° curve
- Tight, compact layout
- High metalness
- Perfect for combat spacecraft

### Transport
- Gentle 90° curve
- Spacious layout
- Lower metalness
- Good for cargo/passenger ships

### Shuttle
- Moderate 100° curve
- Balanced layout
- Medium metalness
- Versatile design

### Racing
- Extreme 140° curve
- Minimal, focused layout
- Very high metalness
- Speed-focused design

## Tips for Best Results

### 1. Image Preparation
- Use high-resolution images (2048x2048 or higher)
- Ensure good lighting
- Clear panel boundaries
- Visible screen areas

### 2. UV Mapping
- Adjust `uvRegion` values to match your image layout
- Use 0-1 coordinates (0 = left/top, 1 = right/bottom)
- Test different regions to find best fit

### 3. Curvature
- Start with preset values
- Adjust `curve` parameter for each panel
- Higher values = more curve
- Match the perspective in your image

### 4. Materials
- `metalness`: 0.5-0.8 for realistic metal
- `roughness`: 0.2-0.5 for worn surfaces
- `emissiveIntensity`: 0.3-0.6 for screens

## Examples

### Your Fighter Cockpit

```typescript
import { fighterCockpitConfig } from './examples/FighterCockpitExample';
import { CockpitGenerator } from './tools/cockpit/CockpitGenerator';

// Generate your specific cockpit
const generator = new CockpitGenerator(fighterCockpitConfig);
const cockpit = await generator.generate();
```

### Quick Preset

```typescript
import { PresetCockpitViewer } from './components/CockpitViewer';
import { CockpitPreset } from './tools/cockpit/types/CockpitTypes';

<PresetCockpitViewer 
  preset={CockpitPreset.FIGHTER}
  imageUrl="/your-cockpit.jpg"
/>
```

## API Reference

### CockpitGenerator

```typescript
class CockpitGenerator {
  constructor(config: CockpitConfig, options?: GenerationOptions)
  
  async generate(): Promise<GeneratedCockpit>
  
  static createPreset(
    preset: CockpitPreset, 
    imageUrl: string
  ): CockpitConfig
}
```

### GeometryGenerator

```typescript
class GeometryGenerator {
  static generateCurvedPanel(
    config: PanelConfig,
    width: number,
    height: number
  ): THREE.BufferGeometry
  
  static generateCockpitShell(
    width: number,
    height: number,
    depth: number,
    curvature: number
  ): THREE.BufferGeometry
  
  static generateScreen(
    width: number,
    height: number
  ): THREE.BufferGeometry
}
```

## Integration with Space Game

```typescript
// In your space game component
import { CockpitGenerator } from './tools/cockpit/CockpitGenerator';
import { fighterCockpitConfig } from './examples/FighterCockpitExample';

function SpaceGame() {
  const [cockpitView, setCockpitView] = useState(false);
  
  // Toggle between chase cam and cockpit view
  const toggleView = () => {
    if (cockpitView) {
      // Switch to chase camera
      camera.position.set(0, 5, 10);
    } else {
      // Switch to cockpit camera
      camera.position.copy(cockpit.cameraPosition);
    }
    setCockpitView(!cockpitView);
  };
  
  return (
    <>
      {cockpitView && <CockpitMesh config={fighterCockpitConfig} />}
      <Spacecraft />
      <button onClick={toggleView}>Toggle View</button>
    </>
  );
}
```

## Troubleshooting

### Cockpit looks distorted
- Adjust `curvature` value
- Check `uvRegion` coordinates
- Increase `segments` for smoother curves

### Texture doesn't align
- Verify `uvRegion` values (0-1 range)
- Check image dimensions
- Adjust panel `angle` values

### Screens not glowing
- Set `emissive: true`
- Increase `emissiveIntensity`
- Check `emissiveColor` value

### Performance issues
- Reduce `segments` count
- Optimize texture size
- Use LOD system

## Future Enhancements

- [ ] Automatic depth estimation from image
- [ ] Neural network for panel detection
- [ ] Real Gaussian Splatting integration
- [ ] Interactive button functionality
- [ ] Animation system for switches/levers
- [ ] Multi-image support (different angles)
- [ ] Procedural wear and tear
- [ ] Dynamic screen content

## License

Part of the Space Game Engine project.
