# 🎨 Voxel Detail Extraction for AI-Generated Panels

## 🎯 Concept

Extract depth/detail information from AI-generated panel images and convert to voxel geometry for true 3D embossing, engraving, and surface details!

## 🔬 How It Works

### Pipeline:
```
AI Image → Depth Map → Height Map → Voxel Grid → 3D Mesh
```

### Process:
1. **Generate AI Image** - Panel with embossed/engraved details
2. **Extract Depth** - Convert to grayscale depth map
3. **Create Voxels** - Build 3D voxel grid from depth
4. **Generate Mesh** - Convert voxels to optimized 3D geometry
5. **Apply Texture** - Map original image as texture

## 📊 Technical Approaches

### Approach 1: Displacement Mapping (Easiest)
**Use existing Three.js displacement maps**

```typescript
// Generate depth map from image
const depthMap = extractDepthFromImage(panelImage);

// Apply to geometry
<mesh>
  <planeGeometry args={[2, 3, 256, 256]} /> {/* High subdivision */}
  <meshStandardMaterial
    map={colorTexture}
    displacementMap={depthMap}
    displacementScale={0.1}  // Depth of embossing
    metalness={0.8}
    roughness={0.3}
  />
</mesh>
```

**Pros:**
- ✅ Built into Three.js
- ✅ Fast and efficient
- ✅ Real-time capable
- ✅ Easy to implement

**Cons:**
- ❌ Limited to height-based displacement
- ❌ Requires high poly geometry
- ❌ Can't do undercuts

---

### Approach 2: Normal Mapping (Performance)
**Use normal maps for detail illusion**

```typescript
// Generate normal map from depth
const normalMap = depthToNormalMap(depthMap);

<mesh>
  <planeGeometry args={[2, 3, 64, 64]} /> {/* Lower poly */}
  <meshStandardMaterial
    map={colorTexture}
    normalMap={normalMap}
    normalScale={[1, 1]}
    metalness={0.8}
    roughness={0.3}
  />
</mesh>
```

**Pros:**
- ✅ Very performant
- ✅ Low poly count
- ✅ Looks great with lighting
- ✅ Standard technique

**Cons:**
- ❌ Illusion only (not true geometry)
- ❌ Silhouette stays flat

---

### Approach 3: True Voxel Conversion (Most Detailed)
**Convert depth map to actual voxel geometry**

```typescript
import { VoxelMesh } from './VoxelMesh';

// Convert image to voxel grid
const voxelGrid = imageToVoxels(panelImage, {
  resolution: 128,        // Voxel grid size
  depthLevels: 32,       // Z-axis depth
  threshold: 0.5,        // Detail threshold
  smoothing: true        // Smooth voxels
});

// Generate mesh from voxels
const mesh = VoxelMesh.fromGrid(voxelGrid, {
  optimize: true,        // Merge faces
  generateUVs: true,     // For texturing
  smoothNormals: true    // Smooth shading
});

<primitive object={mesh} />
```

**Pros:**
- ✅ True 3D geometry
- ✅ Accurate depth representation
- ✅ Can handle complex details
- ✅ Supports undercuts

**Cons:**
- ❌ Higher poly count
- ❌ More processing time
- ❌ Requires optimization

---

### Approach 4: Hybrid (Best of Both)
**Combine techniques for optimal result**

```typescript
// Use displacement for large features
// Use normal maps for fine details
<mesh>
  <planeGeometry args={[2, 3, 128, 128]} />
  <meshStandardMaterial
    map={colorTexture}
    displacementMap={coarseDepthMap}
    displacementScale={0.15}
    normalMap={fineNormalMap}
    normalScale={[2, 2]}
    metalness={0.8}
    roughness={0.3}
  />
</mesh>
```

**Pros:**
- ✅ Best visual quality
- ✅ Balanced performance
- ✅ True geometry + detail illusion
- ✅ Flexible

---

## 🛠️ Implementation

### Step 1: Depth Map Extraction

```typescript
// utils/depthExtraction.ts
export function extractDepthFromImage(
  imageUrl: string,
  options: {
    method: 'luminance' | 'ai' | 'manual';
    invert?: boolean;
    contrast?: number;
  }
): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Convert to grayscale depth
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        
        // Luminance formula
        let depth = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Apply contrast
        if (options.contrast) {
          depth = ((depth / 255 - 0.5) * options.contrast + 0.5) * 255;
        }
        
        // Invert if needed
        if (options.invert) {
          depth = 255 - depth;
        }
        
        // Set all channels to depth value
        imageData.data[i] = depth;
        imageData.data[i + 1] = depth;
        imageData.data[i + 2] = depth;
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Create texture
      const texture = new THREE.CanvasTexture(canvas);
      resolve(texture);
    };
    img.src = imageUrl;
  });
}
```

### Step 2: Voxel Grid Generation

```typescript
// utils/voxelGenerator.ts
export class VoxelGrid {
  private grid: Uint8Array;
  private width: number;
  private height: number;
  private depth: number;
  
  constructor(width: number, height: number, depth: number) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.grid = new Uint8Array(width * height * depth);
  }
  
  setVoxel(x: number, y: number, z: number, value: number) {
    const index = x + y * this.width + z * this.width * this.height;
    this.grid[index] = value;
  }
  
  getVoxel(x: number, y: number, z: number): number {
    const index = x + y * this.width + z * this.width * this.height;
    return this.grid[index];
  }
  
  static fromDepthMap(
    depthTexture: THREE.Texture,
    resolution: number,
    depthLevels: number
  ): VoxelGrid {
    const grid = new VoxelGrid(resolution, resolution, depthLevels);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Get image data from texture
    canvas.width = resolution;
    canvas.height = resolution;
    ctx.drawImage(depthTexture.image, 0, 0, resolution, resolution);
    const imageData = ctx.getImageData(0, 0, resolution, resolution);
    
    // Convert to voxels
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        const pixelIndex = (y * resolution + x) * 4;
        const depth = imageData.data[pixelIndex] / 255; // 0-1
        
        // Fill voxels up to depth
        const voxelDepth = Math.floor(depth * depthLevels);
        for (let z = 0; z < voxelDepth; z++) {
          grid.setVoxel(x, y, z, 255);
        }
      }
    }
    
    return grid;
  }
  
  toMesh(voxelSize: number = 0.01): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    
    // Generate mesh from voxels (greedy meshing algorithm)
    // ... implementation details ...
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    
    const material = new THREE.MeshStandardMaterial({
      metalness: 0.8,
      roughness: 0.3
    });
    
    return new THREE.Mesh(geometry, material);
  }
}
```

### Step 3: Panel Component with Voxel Detail

```typescript
// components/VoxelPanel.tsx
import { useEffect, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { extractDepthFromImage } from '../utils/depthExtraction';
import { VoxelGrid } from '../utils/voxelGenerator';

interface VoxelPanelProps {
  imageUrl: string;
  position: [number, number, number];
  size: [number, number];
  detailLevel: 'low' | 'medium' | 'high';
  method: 'displacement' | 'normal' | 'voxel' | 'hybrid';
}

export function VoxelPanel({ 
  imageUrl, 
  position, 
  size, 
  detailLevel,
  method 
}: VoxelPanelProps) {
  const [depthMap, setDepthMap] = useState<THREE.Texture | null>(null);
  const [voxelMesh, setVoxelMesh] = useState<THREE.Mesh | null>(null);
  const colorTexture = useLoader(THREE.TextureLoader, imageUrl);
  
  useEffect(() => {
    // Extract depth map
    extractDepthFromImage(imageUrl, {
      method: 'luminance',
      invert: false,
      contrast: 1.5
    }).then(depth => {
      setDepthMap(depth);
      
      // Generate voxel mesh if needed
      if (method === 'voxel' || method === 'hybrid') {
        const resolution = detailLevel === 'high' ? 256 : 
                          detailLevel === 'medium' ? 128 : 64;
        const grid = VoxelGrid.fromDepthMap(depth, resolution, 32);
        const mesh = grid.toMesh(0.01);
        setVoxelMesh(mesh);
      }
    });
  }, [imageUrl, method, detailLevel]);
  
  // Render based on method
  if (method === 'voxel' && voxelMesh) {
    return <primitive object={voxelMesh} position={position} />;
  }
  
  if (method === 'displacement' && depthMap) {
    const subdivisions = detailLevel === 'high' ? 256 : 
                        detailLevel === 'medium' ? 128 : 64;
    return (
      <mesh position={position}>
        <planeGeometry args={[size[0], size[1], subdivisions, subdivisions]} />
        <meshStandardMaterial
          map={colorTexture}
          displacementMap={depthMap}
          displacementScale={0.1}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
    );
  }
  
  // Default: normal mapping
  return (
    <mesh position={position}>
      <planeGeometry args={[size[0], size[1], 64, 64]} />
      <meshStandardMaterial
        map={colorTexture}
        normalMap={depthMap}
        metalness={0.8}
        roughness={0.3}
      />
    </mesh>
  );
}
```

---

## 🎨 AI Image Generation for Voxels

### Enhanced Prompts for Depth:

```
Futuristic spacecraft wall panel with DEEP EMBOSSED details, raised rivets and bolts protruding from surface, RECESSED panel lines carved into metal, engraved warning text, 3D relief details, strong depth variation, high contrast lighting showing depth, metallic gray, sci-fi industrial, isolated on black background, orthographic front view, 2048x2048, emphasize depth and relief, game asset quality

IMPORTANT: Include strong shadows and highlights to show depth clearly
```

### Depth Map Pair Generation:

```
Generate TWO images:
1. COLOR: Full color panel with details
2. DEPTH: Grayscale depth map where:
   - WHITE = raised/embossed areas (rivets, text, edges)
   - BLACK = recessed areas (panel lines, engravings)
   - GRAY = flat surface
```

---

## 📊 Performance Comparison

| Method | Poly Count | Memory | Quality | Performance |
|--------|-----------|---------|---------|-------------|
| Normal Map | Low (4K) | Low | Good | Excellent |
| Displacement | High (65K) | Medium | Very Good | Good |
| Voxel | Very High (100K+) | High | Excellent | Fair |
| Hybrid | Medium (16K) | Medium | Excellent | Very Good |

---

## 🚀 Recommended Approach

**For Your Pipeline:**

1. **Start with Displacement Mapping**
   - Easy to implement
   - Good results
   - Works with current system

2. **Add Normal Maps for Details**
   - Performance boost
   - Fine detail enhancement
   - Standard technique

3. **Voxels for Hero Assets**
   - Use for important panels
   - Close-up inspection
   - Maximum detail

4. **Hybrid for Production**
   - Best balance
   - Scalable
   - Professional quality

---

## 💡 Next Steps

1. Implement depth extraction utility
2. Add displacement mapping to panels
3. Test with AI-generated images
4. Optimize voxel generation
5. Create detail level system
6. Build asset pipeline

**This enables true 3D detail from AI images!** 🎨✨
