# Advanced Cockpit & Rendering Systems

## Overview

This document covers the advanced rendering systems implemented for the Space Game Engine, including:
- 3D Cockpit System
- PBR Material Manager
- Camera Projection System
- UV Mapping & Texture Projection

---

## 1. 3D Cockpit System

### Location
`src/game/entities/Cockpit3D.tsx`

### Features

**Real 3D Geometry**
- Dashboard with actual depth (0.1m thick panels)
- Raised MFD screen housings (0.08m elevation)
- Angled side panels for immersion
- Overhead panel with switches
- Window frames for structure
- Center console with throttle and stick
- Seat edges visible on sides
- Detail pipes and cables

**Components**
```typescript
- Main Dashboard (angled 0.3 radians)
  ├── Base panel (box geometry)
  ├── Top surface (plane with texture)
  ├── Left MFD (box + screen)
  ├── Center MFD (cylinder + radar)
  ├── Right MFD (box + screen)
  └── Control buttons (4x boxes)

- Side Panels (left/right angled)
- Overhead Panel (switches)
- Window Frames (top/left/right)
- Center Console (throttle/stick)
- Seat Edges
- Detail Elements (cables, lights)
```

**Materials**
- Metallic surfaces (metalness 0.7-0.9)
- Plastic components (metalness 0.1)
- Glass screens (clearcoat support)
- Fabric seats (roughness 0.9)

---

## 2. PBR Material Manager

### Location
`src/engine/rendering/materials/PBRMaterialManager.ts`

### Purpose
Comprehensive PBR (Physically Based Rendering) workflow manager supporting industry-standard material properties.

### Features

**Full PBR Workflow Support**
- Albedo/Base Color (color + texture)
- Metallic workflow (value + map)
- Roughness (value + map)
- Normal mapping (with scale control)
- Ambient Occlusion (AO map + intensity)
- Emissive (color + map + intensity)
- Height/Displacement mapping
- Environment mapping
- Clearcoat (for glossy surfaces)
- Transparency (opacity + alpha map)

**Material Configuration**
```typescript
interface PBRMaterialConfig {
  name: string;
  
  // Base
  albedoColor?: THREE.Color | string;
  albedoMap?: THREE.Texture | string;
  
  // Metallic/Roughness
  metalness?: number;
  metallicMap?: THREE.Texture | string;
  roughness?: number;
  roughnessMap?: THREE.Texture | string;
  
  // Normal
  normalMap?: THREE.Texture | string;
  normalScale?: THREE.Vector2;
  
  // AO
  aoMap?: THREE.Texture | string;
  aoMapIntensity?: number;
  
  // Emissive
  emissive?: THREE.Color | string;
  emissiveMap?: THREE.Texture | string;
  emissiveIntensity?: number;
  
  // Displacement
  displacementMap?: THREE.Texture | string;
  displacementScale?: number;
  
  // Environment
  envMap?: THREE.Texture;
  envMapIntensity?: number;
  
  // Clearcoat
  clearcoat?: number;
  clearcoatRoughness?: number;
  clearcoatMap?: THREE.Texture | string;
  
  // Transparency
  transparent?: boolean;
  opacity?: number;
  alphaMap?: THREE.Texture | string;
}
```

**Usage Example**
```typescript
import { pbrMaterialManager } from './PBRMaterialManager';

// Create material
const material = await pbrMaterialManager.createMaterial({
  name: 'cockpit_metal',
  albedoColor: '#1a1a1a',
  metalness: 0.9,
  roughness: 0.2,
  normalMap: '/textures/metal_normal.png',
  aoMap: '/textures/metal_ao.png',
  envMapIntensity: 1.0
});

// Get cached material
const cached = pbrMaterialManager.getMaterial('cockpit_metal');

// Update material
pbrMaterialManager.updateMaterial('cockpit_metal', {
  metalness: 0.8,
  roughness: 0.3
});
```

**Preset Materials**
- `cockpit_metal`: Dark metallic (0.9 metalness, 0.2 roughness)
- `cockpit_plastic`: Dark plastic (0.1 metalness, 0.6 roughness)
- `screen_glass`: Glass with clearcoat (emissive green)
- `seat_fabric`: Non-metallic fabric (0.9 roughness)

**Key Features**
- Texture caching (prevents duplicate loads)
- Material caching (reuse materials)
- Async texture loading
- Automatic resource management
- MeshPhysicalMaterial for advanced effects

---

## 3. Camera Projection System

### Location
`src/engine/rendering/camera/CameraProjectionSystem.ts`

### Purpose
Advanced camera projection, UV mapping, and texture projection system for dynamic texturing and effects.

### Components

#### A. UV Projection Mapper

**Purpose**: Project textures onto geometry using camera projection

**Features**:
- Calculate projection matrices
- Project UV coordinates onto meshes
- Custom projection shaders
- Perspective-correct mapping

**Usage**:
```typescript
const mapper = new UVProjectionMapper();

// Project UVs onto mesh
mapper.projectUVs(mesh, camera, texture);

// Create projection material
const material = mapper.createProjectionMaterial(texture, camera);
```

**Projection Shader**:
- Vertex shader: Calculates projected coordinates
- Fragment shader: Samples texture with perspective correction
- Automatic fade based on viewing angle
- Supports transparency

#### B. Camera Projection System

**Purpose**: Manage render targets, projection cameras, and texture projection

**Features**:
1. **Render Targets**
   - Create WebGL render targets
   - Custom size and format
   - Texture output

2. **Camera Registration**
   - Register cameras for projection
   - Associate projection mappers
   - Manage multiple cameras

3. **Render to Texture**
   - Render scene from camera perspective
   - Output to texture
   - Use for dynamic textures, mirrors, portals

4. **Projection Cameras**
   - Create specialized projection cameras
   - Custom FOV, aspect, near/far

5. **Texture Projection**
   - Project textures onto meshes
   - Dynamic UV calculation
   - Real-time updates

6. **Decal Projection**
   - Create decals (damage, details, etc.)
   - Position, rotation, scale control
   - Transparent overlay

7. **Environment Mapping**
   - Create cube maps from position
   - Real-time reflections
   - Dynamic environment capture

**Usage Examples**:

```typescript
import { cameraProjectionSystem } from './CameraProjectionSystem';

// Create render target
const renderTarget = cameraProjectionSystem.createRenderTarget(
  'cockpit_view',
  1024,
  1024
);

// Register camera
cameraProjectionSystem.registerCamera('main', camera);

// Render to texture
const texture = cameraProjectionSystem.renderToTexture(
  renderer,
  scene,
  camera,
  renderTarget
);

// Project texture onto mesh
cameraProjectionSystem.projectTextureOntoMesh(
  cockpitMesh,
  texture,
  camera,
  'main'
);

// Create decal
const decal = cameraProjectionSystem.createDecalProjection(
  new THREE.Vector3(0, 0, -2),
  new THREE.Euler(0, 0, 0),
  new THREE.Vector3(1, 1, 1),
  damageTexture
);

// Create environment map
const envMap = cameraProjectionSystem.createEnvironmentMap(
  renderer,
  scene,
  new THREE.Vector3(0, 0, 0),
  512
);
```

---

## 4. Integration & Workflow

### Complete PBR Workflow

1. **Create Materials**
```typescript
// Initialize manager
pbrMaterialManager.createPresets();

// Create custom material
const material = await pbrMaterialManager.createMaterial({
  name: 'custom_metal',
  albedoMap: '/textures/metal_albedo.png',
  normalMap: '/textures/metal_normal.png',
  metallicMap: '/textures/metal_metallic.png',
  roughnessMap: '/textures/metal_roughness.png',
  aoMap: '/textures/metal_ao.png',
  metalness: 1.0,
  roughness: 0.3
});
```

2. **Apply to Geometry**
```typescript
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
```

3. **Dynamic Updates**
```typescript
// Update material properties
pbrMaterialManager.updateMaterial('custom_metal', {
  roughness: 0.5,
  emissiveIntensity: 0.8
});
```

### Camera Projection Workflow

1. **Setup**
```typescript
// Create projection system
const projSystem = cameraProjectionSystem;

// Create render target
const rt = projSystem.createRenderTarget('view1', 2048, 2048);

// Register camera
projSystem.registerCamera('projCam', projectionCamera);
```

2. **Render to Texture**
```typescript
// Each frame
const texture = projSystem.renderToTexture(
  renderer,
  scene,
  projectionCamera,
  rt
);
```

3. **Project onto Geometry**
```typescript
// Project texture
projSystem.projectTextureOntoMesh(
  targetMesh,
  texture,
  projectionCamera,
  'projCam'
);
```

### Cockpit Enhancement Workflow

1. **Use PBR Materials**
```typescript
// Replace basic materials with PBR
const metalMaterial = pbrMaterialManager.getMaterial('cockpit_metal');
const glassMaterial = pbrMaterialManager.getMaterial('screen_glass');

dashboardMesh.material = metalMaterial;
screenMesh.material = glassMaterial;
```

2. **Add Projected Details**
```typescript
// Project wear/damage textures
const wearTexture = textureLoader.load('/textures/wear.png');
cameraProjectionSystem.projectTextureOntoMesh(
  cockpitMesh,
  wearTexture,
  camera
);
```

3. **Add Decals**
```typescript
// Add warning labels, damage, etc.
const label = cameraProjectionSystem.createDecalProjection(
  position,
  rotation,
  scale,
  labelTexture
);
cockpitGroup.add(label);
```

---

## 5. Performance Considerations

### PBR Materials
- **Texture Caching**: Textures loaded once, reused
- **Material Caching**: Materials created once, reused
- **Async Loading**: Non-blocking texture loads
- **Disposal**: Proper cleanup of resources

### Camera Projection
- **Render Target Reuse**: Don't create new targets each frame
- **Update Rate Control**: Limit projection updates (e.g., 30Hz)
- **Resolution Management**: Use appropriate texture sizes
- **Selective Projection**: Only project when needed

### Optimization Tips
```typescript
// Good: Reuse render target
const rt = projSystem.getRenderTarget('main');

// Good: Limit update rate
let lastUpdate = 0;
const updateInterval = 1000 / 30; // 30 Hz

function update(time) {
  if (time - lastUpdate > updateInterval) {
    projSystem.renderToTexture(renderer, scene, camera, rt);
    lastUpdate = time;
  }
}

// Good: Appropriate resolution
const rt = projSystem.createRenderTarget('view', 1024, 1024); // Not 4096!
```

---

## 6. Future Enhancements

### Planned Features
1. **Advanced PBR**
   - Subsurface scattering
   - Anisotropic reflections
   - Sheen for fabric
   - Iridescence

2. **Projection Enhancements**
   - Multi-camera projection blending
   - Projection masks
   - Animated projections
   - Projection fade zones

3. **Material System**
   - Material layering/blending
   - Procedural materials
   - Material animation
   - Material LOD

4. **Performance**
   - Texture atlasing
   - Material instancing
   - Projection culling
   - Adaptive quality

---

## 7. API Reference

### PBRMaterialManager

```typescript
class PBRMaterialManager {
  // Create material from config
  async createMaterial(config: PBRMaterialConfig): Promise<THREE.MeshPhysicalMaterial>
  
  // Get cached material
  getMaterial(name: string): THREE.MeshPhysicalMaterial | undefined
  
  // Update material properties
  updateMaterial(name: string, updates: Partial<PBRMaterialConfig>): void
  
  // Dispose material
  disposeMaterial(name: string): void
  
  // Dispose all
  disposeAll(): void
  
  // Create presets
  createPresets(): void
}
```

### CameraProjectionSystem

```typescript
class CameraProjectionSystem {
  // Create render target
  createRenderTarget(name: string, width?: number, height?: number): THREE.WebGLRenderTarget
  
  // Get render target
  getRenderTarget(name: string): THREE.WebGLRenderTarget | undefined
  
  // Register camera
  registerCamera(name: string, camera: THREE.Camera): void
  
  // Get projection mapper
  getProjectionMapper(name: string): UVProjectionMapper | undefined
  
  // Render to texture
  renderToTexture(renderer, scene, camera, renderTarget): THREE.Texture
  
  // Create projection camera
  createProjectionCamera(fov?, aspect?, near?, far?): THREE.PerspectiveCamera
  
  // Project texture onto mesh
  projectTextureOntoMesh(mesh, texture, camera, mapperName?): void
  
  // Create decal
  createDecalProjection(position, rotation, scale, texture): THREE.Mesh
  
  // Create environment map
  createEnvironmentMap(renderer, scene, position, size?): THREE.CubeTexture
  
  // Dispose
  dispose(): void
}
```

### UVProjectionMapper

```typescript
class UVProjectionMapper {
  // Calculate projection matrix
  calculateProjectionMatrix(camera: THREE.Camera): THREE.Matrix4
  
  // Project UVs onto mesh
  projectUVs(mesh: THREE.Mesh, camera: THREE.Camera, texture: THREE.Texture): void
  
  // Create projection material
  createProjectionMaterial(texture: THREE.Texture, camera: THREE.Camera): THREE.ShaderMaterial
}
```

---

## 8. Summary

The advanced rendering systems provide:

✅ **Professional PBR Workflow**
- Industry-standard material properties
- Full texture map support
- Clearcoat for glossy surfaces
- Material caching and management

✅ **Advanced Camera Projection**
- UV projection mapping
- Render to texture
- Decal system
- Environment mapping

✅ **3D Cockpit System**
- Real geometry with depth
- PBR materials
- Modular design
- Easy to extend

✅ **Performance Optimized**
- Resource caching
- Efficient updates
- Proper disposal
- Scalable architecture

These systems form the foundation for creating highly detailed, realistic 3D environments with professional-grade rendering quality!
