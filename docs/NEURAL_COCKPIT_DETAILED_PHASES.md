# 🧠 Neural Cockpit Reconstruction - Detailed Phase Breakdown

Complete implementation roadmap with specific requirements, files, and steps for each phase.

---

## 📋 Phase 1: Core Infrastructure & Types

**Goal:** Set up type system and data structures

### Requirements:
- TypeScript type definitions
- Data structures for components, annotations, depth maps
- Validation utilities

### Files to Create:

#### 1. `src/tools/cockpit/neural/types/NeuralTypes.ts`
```typescript
// Component types
export type ComponentType = 
  | 'button' 
  | 'knob' 
  | 'screen' 
  | 'panel' 
  | 'lever' 
  | 'switch' 
  | 'gauge'
  | 'seat'
  | 'window';

// Bounds in image space
export interface ImageBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// RGB color
export interface RGBColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

// Component annotation (user-created)
export interface ComponentAnnotation {
  id: string;
  type: ComponentType;
  bounds: ImageBounds;
  label?: string; // Optional user label
}

// Recognized component (with extracted data)
export interface RecognizedComponent extends ComponentAnnotation {
  depth: number; // 0.0 (far) to 1.0 (near)
  color: RGBColor;
  confidence: number; // 0.0 to 1.0
}

// Depth map data
export interface DepthMap {
  data: Float32Array;
  width: number;
  height: number;
  minDepth: number;
  maxDepth: number;
}

// Color map data
export interface ColorMap {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

// Complete annotation project
export interface AnnotationProject {
  id: string;
  name: string;
  originalImage: string; // URL or path
  grayscaleImage: string; // URL or path
  annotations: ComponentAnnotation[];
  metadata: {
    imageWidth: number;
    imageHeight: number;
    created: string;
    modified: string;
    version: string;
  };
}

// Geometry template for component types
export interface GeometryTemplate {
  shape: 'cylinder' | 'box' | 'sphere' | 'custom';
  params: Record<string, number>;
  material: 'plastic' | 'metal' | 'glass' | 'rubber';
  emissive?: boolean;
}

// 3D position in world space
export interface WorldPosition {
  x: number;
  y: number;
  z: number;
}

// Generated 3D component
export interface Generated3DComponent {
  id: string;
  type: ComponentType;
  position: WorldPosition;
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: RGBColor;
  geometry: GeometryTemplate;
}
```

#### 2. `src/tools/cockpit/neural/types/index.ts`
```typescript
export * from './NeuralTypes';
```

### Tasks:
- [ ] Create types directory structure
- [ ] Define all TypeScript interfaces
- [ ] Export types from index
- [ ] Document each type with JSDoc comments

### Dependencies:
- None (pure TypeScript)

### Estimated Time: 1-2 hours

---

## 📋 Phase 2: Image Processing Utilities

**Goal:** Load images, extract depth and color data

### Requirements:
- Load images in browser
- Convert grayscale to depth map
- Extract colors from regions
- Canvas-based image processing

### Files to Create:

#### 1. `src/tools/cockpit/neural/utils/ImageLoader.ts`
```typescript
export class ImageLoader {
  /**
   * Load image from URL
   */
  static async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Get image data from HTMLImageElement
   */
  static getImageData(image: HTMLImageElement): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}
```

#### 2. `src/tools/cockpit/neural/utils/DepthMapper.ts`
```typescript
import { DepthMap } from '../types';

export class DepthMapper {
  /**
   * Convert grayscale image to depth map
   * White = far (0.0), Black = near (1.0)
   */
  static createDepthMap(grayscaleImage: HTMLImageElement): DepthMap {
    const canvas = document.createElement('canvas');
    canvas.width = grayscaleImage.width;
    canvas.height = grayscaleImage.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(grayscaleImage, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const depthData = new Float32Array(canvas.width * canvas.height);
    
    let minDepth = 1.0;
    let maxDepth = 0.0;
    
    // Convert grayscale to depth
    for (let i = 0; i < imageData.data.length; i += 4) {
      const gray = imageData.data[i]; // R channel (grayscale)
      const depth = 1.0 - (gray / 255.0); // Invert: darker = closer
      depthData[i / 4] = depth;
      
      minDepth = Math.min(minDepth, depth);
      maxDepth = Math.max(maxDepth, depth);
    }
    
    return {
      data: depthData,
      width: canvas.width,
      height: canvas.height,
      minDepth,
      maxDepth
    };
  }

  /**
   * Get depth at specific pixel
   */
  static getDepthAt(
    x: number, 
    y: number, 
    depthMap: DepthMap
  ): number {
    const index = Math.floor(y) * depthMap.width + Math.floor(x);
    return depthMap.data[index] || 0;
  }

  /**
   * Get average depth for a region
   */
  static getRegionDepth(
    bounds: ImageBounds,
    depthMap: DepthMap
  ): number {
    let sum = 0;
    let count = 0;
    
    const startX = Math.max(0, Math.floor(bounds.x));
    const endX = Math.min(depthMap.width, Math.ceil(bounds.x + bounds.width));
    const startY = Math.max(0, Math.floor(bounds.y));
    const endY = Math.min(depthMap.height, Math.ceil(bounds.y + bounds.height));
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const index = y * depthMap.width + x;
        sum += depthMap.data[index];
        count++;
      }
    }
    
    return count > 0 ? sum / count : 0;
  }
}
```

#### 3. `src/tools/cockpit/neural/utils/ColorExtractor.ts`
```typescript
import { RGBColor, ImageBounds, ColorMap } from '../types';

export class ColorExtractor {
  /**
   * Create color map from image
   */
  static createColorMap(image: HTMLImageElement): ColorMap {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    return {
      data: imageData.data,
      width: canvas.width,
      height: canvas.height
    };
  }

  /**
   * Get color at specific pixel
   */
  static getColorAt(
    x: number,
    y: number,
    colorMap: ColorMap
  ): RGBColor {
    const index = (Math.floor(y) * colorMap.width + Math.floor(x)) * 4;
    return {
      r: colorMap.data[index],
      g: colorMap.data[index + 1],
      b: colorMap.data[index + 2]
    };
  }

  /**
   * Get average color for a region
   */
  static getRegionColor(
    bounds: ImageBounds,
    colorMap: ColorMap
  ): RGBColor {
    let sumR = 0, sumG = 0, sumB = 0;
    let count = 0;
    
    const startX = Math.max(0, Math.floor(bounds.x));
    const endX = Math.min(colorMap.width, Math.ceil(bounds.x + bounds.width));
    const startY = Math.max(0, Math.floor(bounds.y));
    const endY = Math.min(colorMap.height, Math.ceil(bounds.y + bounds.height));
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const index = (y * colorMap.width + x) * 4;
        sumR += colorMap.data[index];
        sumG += colorMap.data[index + 1];
        sumB += colorMap.data[index + 2];
        count++;
      }
    }
    
    return count > 0 ? {
      r: Math.round(sumR / count),
      g: Math.round(sumG / count),
      b: Math.round(sumB / count)
    } : { r: 128, g: 128, b: 128 };
  }
}
```

#### 4. `src/tools/cockpit/neural/utils/index.ts`
```typescript
export * from './ImageLoader';
export * from './DepthMapper';
export * from './ColorExtractor';
```

### Tasks:
- [ ] Create ImageLoader class
- [ ] Create DepthMapper class
- [ ] Create ColorExtractor class
- [ ] Add error handling
- [ ] Add validation
- [ ] Write unit tests

### Dependencies:
- Phase 1 types
- Browser Canvas API

### Estimated Time: 3-4 hours

---

## 📋 Phase 3: Component Recognition System

**Goal:** Recognize and classify components from annotations

### Requirements:
- Component geometry templates
- Material definitions
- Recognition patterns

### Files to Create:

#### 1. `src/tools/cockpit/neural/recognition/ComponentTemplates.ts`
```typescript
import { GeometryTemplate, ComponentType } from '../types';

export const COMPONENT_TEMPLATES: Record<ComponentType, GeometryTemplate> = {
  button: {
    shape: 'cylinder',
    params: {
      radiusTop: 0.02,
      radiusBottom: 0.02,
      height: 0.015,
      radialSegments: 16
    },
    material: 'plastic'
  },
  
  knob: {
    shape: 'cylinder',
    params: {
      radiusTop: 0.025,
      radiusBottom: 0.02,
      height: 0.03,
      radialSegments: 16
    },
    material: 'metal'
  },
  
  screen: {
    shape: 'box',
    params: {
      width: 1.0,
      height: 1.0,
      depth: 0.05
    },
    material: 'glass',
    emissive: true
  },
  
  panel: {
    shape: 'box',
    params: {
      width: 1.0,
      height: 1.0,
      depth: 0.1
    },
    material: 'metal'
  },
  
  lever: {
    shape: 'custom',
    params: {},
    material: 'metal'
  },
  
  switch: {
    shape: 'box',
    params: {
      width: 0.03,
      height: 0.05,
      depth: 0.02
    },
    material: 'plastic'
  },
  
  gauge: {
    shape: 'cylinder',
    params: {
      radiusTop: 0.04,
      radiusBottom: 0.04,
      height: 0.01,
      radialSegments: 32
    },
    material: 'glass',
    emissive: true
  },
  
  seat: {
    shape: 'custom',
    params: {},
    material: 'rubber'
  },
  
  window: {
    shape: 'box',
    params: {
      width: 1.0,
      height: 1.0,
      depth: 0.02
    },
    material: 'glass'
  }
};
```

#### 2. `src/tools/cockpit/neural/recognition/ComponentRecognizer.ts`
```typescript
import { 
  ComponentAnnotation, 
  RecognizedComponent, 
  DepthMap, 
  ColorMap 
} from '../types';
import { DepthMapper } from '../utils/DepthMapper';
import { ColorExtractor } from '../utils/ColorExtractor';

export class ComponentRecognizer {
  /**
   * Recognize component from annotation + image data
   */
  static recognizeComponent(
    annotation: ComponentAnnotation,
    depthMap: DepthMap,
    colorMap: ColorMap
  ): RecognizedComponent {
    // Extract depth for this region
    const depth = DepthMapper.getRegionDepth(annotation.bounds, depthMap);
    
    // Extract color for this region
    const color = ColorExtractor.getRegionColor(annotation.bounds, colorMap);
    
    // Calculate confidence (always 1.0 for manual annotations)
    const confidence = 1.0;
    
    return {
      ...annotation,
      depth,
      color,
      confidence
    };
  }

  /**
   * Recognize all components in a project
   */
  static recognizeAll(
    annotations: ComponentAnnotation[],
    depthMap: DepthMap,
    colorMap: ColorMap
  ): RecognizedComponent[] {
    return annotations.map(annotation => 
      this.recognizeComponent(annotation, depthMap, colorMap)
    );
  }
}
```

#### 3. `src/tools/cockpit/neural/recognition/index.ts`
```typescript
export * from './ComponentTemplates';
export * from './ComponentRecognizer';
```

### Tasks:
- [ ] Define geometry templates for all component types
- [ ] Create ComponentRecognizer class
- [ ] Add validation for recognized components
- [ ] Add confidence scoring
- [ ] Document recognition patterns

### Dependencies:
- Phase 1 types
- Phase 2 utilities

### Estimated Time: 2-3 hours

---

## 📋 Phase 4: 3D Component Generator

**Goal:** Generate Three.js meshes from recognized components

### Requirements:
- Three.js geometry creation
- Material creation with extracted colors
- Position/scale calculation
- 2D → 3D coordinate conversion

### Files to Create:

#### 1. `src/tools/cockpit/neural/generator/CoordinateConverter.ts`
```typescript
import { ImageBounds, WorldPosition } from '../types';

export class CoordinateConverter {
  /**
   * Convert 2D image coordinates + depth to 3D world position
   */
  static imageToWorld(
    imageX: number,
    imageY: number,
    depth: number,
    imageWidth: number,
    imageHeight: number,
    cockpitScale: { width: number; height: number; depth: number }
  ): WorldPosition {
    // Normalize to -1 to 1
    const normalizedX = (imageX / imageWidth) * 2 - 1;
    const normalizedY = -((imageY / imageHeight) * 2 - 1); // Flip Y
    
    // Apply cockpit scale
    const x = normalizedX * (cockpitScale.width / 2);
    const y = normalizedY * (cockpitScale.height / 2);
    
    // Z based on depth (closer = more negative)
    const z = -cockpitScale.depth * (1 - depth);
    
    return { x, y, z };
  }

  /**
   * Calculate scale from image bounds
   */
  static calculateScale(
    bounds: ImageBounds,
    imageWidth: number,
    imageHeight: number,
    cockpitScale: { width: number; height: number }
  ): { x: number; y: number; z: number } {
    const scaleX = (bounds.width / imageWidth) * cockpitScale.width;
    const scaleY = (bounds.height / imageHeight) * cockpitScale.height;
    const scaleZ = 1.0; // Default Z scale
    
    return { x: scaleX, y: scaleY, z: scaleZ };
  }
}
```

#### 2. `src/tools/cockpit/neural/generator/GeometryGenerator.ts`
```typescript
import * as THREE from 'three';
import { GeometryTemplate } from '../types';

export class GeometryGenerator {
  /**
   * Create Three.js geometry from template
   */
  static createGeometry(template: GeometryTemplate): THREE.BufferGeometry {
    switch (template.shape) {
      case 'cylinder':
        return new THREE.CylinderGeometry(
          template.params.radiusTop || 0.5,
          template.params.radiusBottom || 0.5,
          template.params.height || 1.0,
          template.params.radialSegments || 16
        );
      
      case 'box':
        return new THREE.BoxGeometry(
          template.params.width || 1.0,
          template.params.height || 1.0,
          template.params.depth || 1.0
        );
      
      case 'sphere':
        return new THREE.SphereGeometry(
          template.params.radius || 0.5,
          template.params.widthSegments || 16,
          template.params.heightSegments || 16
        );
      
      case 'custom':
        // For custom shapes, return a placeholder box
        return new THREE.BoxGeometry(0.1, 0.1, 0.1);
      
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }
}
```

#### 3. `src/tools/cockpit/neural/generator/MaterialGenerator.ts`
```typescript
import * as THREE from 'three';
import { RGBColor, GeometryTemplate } from '../types';

export class MaterialGenerator {
  /**
   * Create Three.js material from template and color
   */
  static createMaterial(
    template: GeometryTemplate,
    color: RGBColor
  ): THREE.Material {
    const threeColor = new THREE.Color(
      color.r / 255,
      color.g / 255,
      color.b / 255
    );
    
    const materialProps = this.getMaterialProperties(template.material);
    
    return new THREE.MeshPhysicalMaterial({
      color: threeColor,
      ...materialProps,
      emissive: template.emissive ? threeColor : new THREE.Color(0, 0, 0),
      emissiveIntensity: template.emissive ? 0.5 : 0
    });
  }

  /**
   * Get material properties based on material type
   */
  private static getMaterialProperties(materialType: string) {
    switch (materialType) {
      case 'metal':
        return {
          metalness: 0.9,
          roughness: 0.2,
          clearcoat: 0.5,
          clearcoatRoughness: 0.1
        };
      
      case 'plastic':
        return {
          metalness: 0.0,
          roughness: 0.6,
          clearcoat: 0.3,
          clearcoatRoughness: 0.4
        };
      
      case 'glass':
        return {
          metalness: 0.0,
          roughness: 0.1,
          transmission: 0.9,
          thickness: 0.5,
          ior: 1.5
        };
      
      case 'rubber':
        return {
          metalness: 0.0,
          roughness: 0.9,
          clearcoat: 0.0
        };
      
      default:
        return {
          metalness: 0.5,
          roughness: 0.5
        };
    }
  }
}
```

#### 4. `src/tools/cockpit/neural/generator/ComponentGenerator.ts`
```typescript
import * as THREE from 'three';
import { RecognizedComponent, Generated3DComponent } from '../types';
import { COMPONENT_TEMPLATES } from '../recognition/ComponentTemplates';
import { GeometryGenerator } from './GeometryGenerator';
import { MaterialGenerator } from './MaterialGenerator';
import { CoordinateConverter } from './CoordinateConverter';

export class ComponentGenerator {
  /**
   * Generate 3D mesh from recognized component
   */
  static generateMesh(
    component: RecognizedComponent,
    imageWidth: number,
    imageHeight: number,
    cockpitScale = { width: 3.0, height: 2.4, depth: 1.0 }
  ): THREE.Mesh {
    // Get template for this component type
    const template = COMPONENT_TEMPLATES[component.type];
    
    // Create geometry
    const geometry = GeometryGenerator.createGeometry(template);
    
    // Create material with extracted color
    const material = MaterialGenerator.createMaterial(template, component.color);
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    
    // Calculate position (center of bounds + depth)
    const centerX = component.bounds.x + component.bounds.width / 2;
    const centerY = component.bounds.y + component.bounds.height / 2;
    const position = CoordinateConverter.imageToWorld(
      centerX,
      centerY,
      component.depth,
      imageWidth,
      imageHeight,
      cockpitScale
    );
    mesh.position.set(position.x, position.y, position.z);
    
    // Calculate scale
    const scale = CoordinateConverter.calculateScale(
      component.bounds,
      imageWidth,
      imageHeight,
      cockpitScale
    );
    mesh.scale.set(scale.x, scale.y, scale.z);
    
    // Set name for debugging
    mesh.name = `${component.type}_${component.id}`;
    
    return mesh;
  }

  /**
   * Generate all meshes for a cockpit
   */
  static generateCockpit(
    components: RecognizedComponent[],
    imageWidth: number,
    imageHeight: number
  ): THREE.Group {
    const cockpitGroup = new THREE.Group();
    cockpitGroup.name = 'NeuralCockpit';
    
    for (const component of components) {
      const mesh = this.generateMesh(component, imageWidth, imageHeight);
      cockpitGroup.add(mesh);
    }
    
    return cockpitGroup;
  }
}
```

#### 5. `src/tools/cockpit/neural/generator/index.ts`
```typescript
export * from './CoordinateConverter';
export * from './GeometryGenerator';
export * from './MaterialGenerator';
export * from './ComponentGenerator';
```

### Tasks:
- [ ] Create coordinate conversion system
- [ ] Create geometry generator
- [ ] Create material generator with PBR properties
- [ ] Create component generator
- [ ] Add scale calculation
- [ ] Test with sample data

### Dependencies:
- Phase 1 types
- Phase 3 recognition
- Three.js

### Estimated Time: 4-5 hours

---

## 📋 Phase 5: Annotation Tool UI

**Goal:** Web-based interface for marking components

### Requirements:
- React component
- Canvas-based drawing
- Click and drag to create bounds
- Component type selection
- Real-time preview
- Export/import JSON

### Files to Create:

#### 1. `src/tools/cockpit/neural/ui/AnnotationTool.tsx`
```typescript
import React, { useState, useRef, useEffect } from 'react';
import { ComponentAnnotation, ComponentType, AnnotationProject } from '../types';

interface AnnotationToolProps {
  originalImageUrl: string;
  grayscaleImageUrl: string;
  onSave: (project: AnnotationProject) => void;
}

export function AnnotationTool({ 
  originalImageUrl, 
  grayscaleImageUrl, 
  onSave 
}: AnnotationToolProps) {
  const [annotations, setAnnotations] = useState<ComponentAnnotation[]>([]);
  const [selectedType, setSelectedType] = useState<ComponentType>('button');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'original' | 'grayscale'>('original');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  // Load images
  useEffect(() => {
    const img = new Image();
    img.src = viewMode === 'original' ? originalImageUrl : grayscaleImageUrl;
    img.onload = () => setImage(img);
  }, [originalImageUrl, grayscaleImageUrl, viewMode]);
  
  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Set canvas size to match image
    canvas.width = image.width;
    canvas.height = image.height;
    
    // Draw image
    ctx.drawImage(image, 0, 0);
    
    // Draw existing annotations
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    annotations.forEach(ann => {
      ctx.strokeRect(ann.bounds.x, ann.bounds.y, ann.bounds.width, ann.bounds.height);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
      ctx.fillRect(ann.bounds.x, ann.bounds.y, ann.bounds.width, ann.bounds.height);
      
      // Draw label
      ctx.fillStyle = '#00ff00';
      ctx.font = '14px monospace';
      ctx.fillText(ann.type, ann.bounds.x + 5, ann.bounds.y + 20);
    });
    
    // Draw current bounds being drawn
    if (currentBounds) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        currentBounds.x,
        currentBounds.y,
        currentBounds.width,
        currentBounds.height
      );
    }
  }, [image, annotations, currentBounds]);
  
  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setIsDrawing(true);
    setCurrentBounds({ x, y, width: 0, height: 0 });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentBounds) return;
    
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    setCurrentBounds({
      ...currentBounds,
      width: x - currentBounds.x,
      height: y - currentBounds.y
    });
  };
  
  const handleMouseUp = () => {
    if (!isDrawing || !currentBounds) return;
    
    // Add annotation
    const newAnnotation: ComponentAnnotation = {
      id: `component_${Date.now()}`,
      type: selectedType,
      bounds: {
        x: Math.min(currentBounds.x, currentBounds.x + currentBounds.width),
        y: Math.min(currentBounds.y, currentBounds.y + currentBounds.height),
        width: Math.abs(currentBounds.width),
        height: Math.abs(currentBounds.height)
      }
    };
    
    setAnnotations([...annotations, newAnnotation]);
    setIsDrawing(false);
    setCurrentBounds(null);
  };
  
  const handleSave = () => {
    const project: AnnotationProject = {
      id: `project_${Date.now()}`,
      name: 'Fighter Cockpit',
      originalImage: originalImageUrl,
      grayscaleImage: grayscaleImageUrl,
      annotations,
      metadata: {
        imageWidth: image?.width || 0,
        imageHeight: image?.height || 0,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    onSave(project);
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Cockpit Annotation Tool</h2>
      
      {/* Controls */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          Component Type:
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value as ComponentType)}
          >
            <option value="button">Button</option>
            <option value="knob">Knob</option>
            <option value="screen">Screen</option>
            <option value="panel">Panel</option>
            <option value="lever">Lever</option>
            <option value="switch">Switch</option>
            <option value="gauge">Gauge</option>
          </select>
        </label>
        
        <label style={{ marginLeft: '20px' }}>
          View:
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value as any)}
          >
            <option value="original">Original</option>
            <option value="grayscale">Grayscale (Depth)</option>
          </select>
        </label>
        
        <button onClick={handleSave} style={{ marginLeft: '20px' }}>
          Save Annotations
        </button>
        
        <button 
          onClick={()
