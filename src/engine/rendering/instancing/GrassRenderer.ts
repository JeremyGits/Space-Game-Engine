/**
 * Grass Rendering System
 * 
 * Renders massive grass fields using GPU instancing.
 * Features:
 * - 100,000+ grass blades
 * - Wind animation
 * - Color variation
 * - LOD based on distance
 * - Poisson disk distribution
 */

import * as THREE from 'three';
import { InstancedRenderer, InstanceData } from './InstancedRenderer';

export interface GrassConfig {
  density: number;           // Blades per square meter
  areaSize: number;          // Size of grass area
  bladeHeight: number;       // Average blade height
  bladeWidth: number;        // Blade width
  colorVariation: number;    // 0-1, amount of color variation
  windStrength: number;      // Wind animation strength
  lodDistance: number;       // Distance for LOD transitions
}

export class GrassRenderer {
  private renderer: InstancedRenderer;
  private material: THREE.ShaderMaterial;
  private config: GrassConfig;
  private grassBlades: InstanceData[] = [];
  
  constructor(config: Partial<GrassConfig> = {}) {
    this.config = {
      density: 10,
      areaSize: 50,
      bladeHeight: 0.15,      // Much smaller - realistic grass height
      bladeWidth: 0.02,       // Thinner blades
      colorVariation: 0.2,
      windStrength: 0.3,
      lodDistance: 50,
      ...config
    };
    
    // Create grass blade geometry
    const geometry = this.createGrassBladeGeometry();
    
    // Create grass shader material
    this.material = this.createGrassMaterial();
    
    // Calculate instance count
    const instanceCount = Math.floor(
      this.config.density * this.config.areaSize * this.config.areaSize
    );
    
    // Create instanced renderer
    this.renderer = new InstancedRenderer({
      geometry,
      material: this.material,
      maxInstances: instanceCount,
      castShadow: true,
      receiveShadow: false
    });
    
    // Enable per-instance colors
    this.renderer.enableInstanceColors();
    
    // Generate grass positions
    this.generateGrassField();
  }
  
  /**
   * Create grass blade geometry
   */
  private createGrassBladeGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(
      this.config.bladeWidth,
      this.config.bladeHeight,
      1,
      4  // Segments for bending
    );
    
    // Adjust pivot to bottom
    geometry.translate(0, this.config.bladeHeight / 2, 0);
    
    return geometry;
  }
  
  /**
   * Create grass shader material with wind animation
   */
  private createGrassMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        windStrength: { value: this.config.windStrength },
        grassColorBase: { value: new THREE.Color(0.3, 0.6, 0.2) },
        grassColorTip: { value: new THREE.Color(0.4, 0.7, 0.3) }
      },
      vertexShader: `
        uniform float time;
        uniform float windStrength;
        
        attribute vec3 instanceColor;
        
        varying vec2 vUv;
        varying vec3 vColor;
        varying vec3 vNormal;
        
        void main() {
          vUv = uv;
          vColor = instanceColor;
          vNormal = normalize(normalMatrix * normal);
          
          // Get instance matrix
          vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
          
          // Wind animation - affects top of blade more
          float windEffect = uv.y; // 0 at bottom, 1 at top
          float windWave = sin(time * 2.0 + worldPosition.x * 0.5 + worldPosition.z * 0.3) * windStrength;
          float windWave2 = cos(time * 1.5 + worldPosition.x * 0.3 + worldPosition.z * 0.5) * windStrength * 0.5;
          
          worldPosition.x += windWave * windEffect;
          worldPosition.z += windWave2 * windEffect;
          
          // Slight bend based on height
          worldPosition.y -= windEffect * windEffect * 0.1;
          
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 grassColorBase;
        uniform vec3 grassColorTip;
        
        varying vec2 vUv;
        varying vec3 vColor;
        varying vec3 vNormal;
        
        void main() {
          // Gradient from base to tip
          vec3 grassColor = mix(grassColorBase, grassColorTip, vUv.y);
          
          // Apply instance color variation
          grassColor *= vColor;
          
          // Simple lighting
          vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
          float diffuse = max(dot(vNormal, lightDir), 0.3);
          
          // Ambient occlusion at base
          float ao = mix(0.6, 1.0, vUv.y);
          
          vec3 finalColor = grassColor * diffuse * ao;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
  }
  
  /**
   * Generate grass field using Poisson disk sampling
   * @param getTerrainHeight - Function to get terrain height at X,Z position
   */
  generateGrassField(getTerrainHeight?: (x: number, z: number) => number): void {
    const halfSize = this.config.areaSize / 2;
    const minDistance = 1.0 / Math.sqrt(this.config.density);
    
    // Use Poisson disk sampling for natural distribution
    const positions = this.poissonDiskSampling(
      -halfSize, halfSize,
      -halfSize, halfSize,
      minDistance
    );
    
    this.grassBlades = positions.map(pos => {
      // Get terrain height at this position
      const terrainHeight = getTerrainHeight ? getTerrainHeight(pos.x, pos.y) : 0;
      
      // Random rotation
      const rotation = new THREE.Euler(
        0,
        Math.random() * Math.PI * 2,
        0
      );
      
      // Random scale variation
      const scaleVariation = 0.7 + Math.random() * 0.6;
      const scale = new THREE.Vector3(
        scaleVariation,
        scaleVariation,
        scaleVariation
      );
      
      // Color variation
      const colorVar = 1.0 - this.config.colorVariation + Math.random() * this.config.colorVariation;
      const color = new THREE.Color(colorVar, colorVar, colorVar);
      
      return {
        position: new THREE.Vector3(pos.x, terrainHeight, pos.y),
        rotation,
        scale,
        color
      };
    });
    
    // Set all instances
    this.renderer.setInstances(this.grassBlades);
  }
  
  /**
   * Poisson disk sampling for natural distribution
   */
  private poissonDiskSampling(
    xMin: number, xMax: number,
    yMin: number, yMax: number,
    minDistance: number
  ): Array<{ x: number, y: number }> {
    const points: Array<{ x: number, y: number }> = [];
    const cellSize = minDistance / Math.SQRT2;
    const gridWidth = Math.ceil((xMax - xMin) / cellSize);
    const gridHeight = Math.ceil((yMax - yMin) / cellSize);
    const grid: (number | null)[][] = Array(gridWidth).fill(null).map(() => Array(gridHeight).fill(null));
    const active: Array<{ x: number, y: number }> = [];
    
    // Start with random point
    const firstPoint = {
      x: xMin + Math.random() * (xMax - xMin),
      y: yMin + Math.random() * (yMax - yMin)
    };
    points.push(firstPoint);
    active.push(firstPoint);
    
    const gridX = Math.floor((firstPoint.x - xMin) / cellSize);
    const gridY = Math.floor((firstPoint.y - yMin) / cellSize);
    grid[gridX][gridY] = 0;
    
    // Generate points
    while (active.length > 0 && points.length < 100000) {
      const randomIndex = Math.floor(Math.random() * active.length);
      const point = active[randomIndex];
      let found = false;
      
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = minDistance * (1 + Math.random());
        const newPoint = {
          x: point.x + Math.cos(angle) * radius,
          y: point.y + Math.sin(angle) * radius
        };
        
        if (newPoint.x < xMin || newPoint.x >= xMax || newPoint.y < yMin || newPoint.y >= yMax) {
          continue;
        }
        
        const gx = Math.floor((newPoint.x - xMin) / cellSize);
        const gy = Math.floor((newPoint.y - yMin) / cellSize);
        
        if (this.isValidPoint(newPoint, points, grid, gx, gy, gridWidth, gridHeight, minDistance, cellSize, xMin, yMin)) {
          points.push(newPoint);
          active.push(newPoint);
          grid[gx][gy] = points.length - 1;
          found = true;
          break;
        }
      }
      
      if (!found) {
        active.splice(randomIndex, 1);
      }
    }
    
    return points;
  }
  
  private isValidPoint(
    point: { x: number, y: number },
    points: Array<{ x: number, y: number }>,
    grid: (number | null)[][],
    gx: number, gy: number,
    gridWidth: number, gridHeight: number,
    minDistance: number,
    cellSize: number,
    xMin: number, yMin: number
  ): boolean {
    // Check neighboring cells
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const nx = gx + dx;
        const ny = gy + dy;
        
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
          const neighborIndex = grid[nx][ny];
          if (neighborIndex !== null) {
            const neighbor = points[neighborIndex];
            const dist = Math.sqrt(
              (point.x - neighbor.x) ** 2 +
              (point.y - neighbor.y) ** 2
            );
            if (dist < minDistance) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }
  
  /**
   * Update animation (call every frame)
   */
  update(deltaTime: number): void {
    this.material.uniforms.time.value += deltaTime;
  }
  
  /**
   * Update LOD based on camera distance
   */
  updateLOD(cameraPosition: THREE.Vector3): void {
    // Calculate distance to grass field center
    const distance = cameraPosition.distanceTo(new THREE.Vector3(0, 0, 0));
    
    // Reduce instance count based on distance
    let visibleCount = this.grassBlades.length;
    
    if (distance > this.config.lodDistance) {
      // Far away - show 25% of grass
      visibleCount = Math.floor(this.grassBlades.length * 0.25);
    } else if (distance > this.config.lodDistance * 0.5) {
      // Medium distance - show 50% of grass
      visibleCount = Math.floor(this.grassBlades.length * 0.5);
    }
    
    this.renderer.setCount(visibleCount);
  }
  
  /**
   * Get the Three.js mesh for adding to scene
   */
  getMesh(): THREE.InstancedMesh {
    return this.renderer.getMesh();
  }
  
  /**
   * Get grass blade count
   */
  getBladeCount(): number {
    return this.grassBlades.length;
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this.renderer.dispose();
    this.material.dispose();
  }
}
