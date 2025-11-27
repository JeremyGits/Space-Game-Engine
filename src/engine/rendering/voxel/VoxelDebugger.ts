/**
 * Voxel Debug Visualizer
 * 
 * Provides debug visualization for the voxel rendering system.
 * Helps understand octree structure, clustering, LOD levels, and performance.
 */

import * as THREE from 'three';
import type { VoxelConfig } from './VoxelConfig';

export interface DebugVisualizationOptions {
  showOctree: boolean;
  showClusters: boolean;
  showLODLevels: boolean;
  showBounds: boolean;
  showNormals: boolean;
  showWireframe: boolean;
  showPerformanceOverlay: boolean;
}

export class VoxelDebugger {
  private scene: THREE.Scene | null = null;
  private debugGroup: THREE.Group;
  private enabled: boolean = false;
  private options: DebugVisualizationOptions;
  
  // Debug materials
  private octreeMaterial: THREE.LineBasicMaterial;
  private clusterMaterials: Map<number, THREE.MeshBasicMaterial>;
  private lodMaterials: THREE.MeshBasicMaterial[];
  private normalMaterial: THREE.LineBasicMaterial;
  
  constructor() {
    this.debugGroup = new THREE.Group();
    this.debugGroup.name = 'VoxelDebug';
    
    this.options = {
      showOctree: false,
      showClusters: false,
      showLODLevels: false,
      showBounds: false,
      showNormals: false,
      showWireframe: false,
      showPerformanceOverlay: false
    };
    
    // Initialize debug materials
    this.octreeMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3
    });
    
    this.clusterMaterials = new Map();
    
    // LOD level colors (green = high detail, red = low detail)
    this.lodMaterials = [
      new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true }), // LOD 0 - highest
      new THREE.MeshBasicMaterial({ color: 0x88ff00, wireframe: true }), // LOD 1
      new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true }), // LOD 2
      new THREE.MeshBasicMaterial({ color: 0xffaa00, wireframe: true }), // LOD 3
      new THREE.MeshBasicMaterial({ color: 0xff5500, wireframe: true }), // LOD 4
      new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })  // LOD 5 - lowest
    ];
    
    this.normalMaterial = new THREE.LineBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.6
    });
  }
  
  /**
   * Initialize debugger with scene
   */
  initialize(scene: THREE.Scene): void {
    this.scene = scene;
    this.scene.add(this.debugGroup);
    console.log('[VoxelDebugger] Initialized');
  }
  
  /**
   * Enable debug visualization
   */
  enable(options?: Partial<DebugVisualizationOptions>): void {
    this.enabled = true;
    if (options) {
      this.options = { ...this.options, ...options };
    }
    this.debugGroup.visible = true;
    console.log('[VoxelDebugger] Debug visualization enabled');
  }
  
  /**
   * Disable debug visualization
   */
  disable(): void {
    this.enabled = false;
    this.debugGroup.visible = false;
    console.log('[VoxelDebugger] Debug visualization disabled');
  }
  
  /**
   * Update debug visualization options
   */
  setOptions(options: Partial<DebugVisualizationOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * Clear all debug visualizations
   */
  clear(): void {
    while (this.debugGroup.children.length > 0) {
      const child = this.debugGroup.children[0];
      this.debugGroup.remove(child);
      
      // Dispose geometry and materials
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  }
  
  /**
   * Visualize octree structure
   */
  visualizeOctree(
    bounds: { min: THREE.Vector3; max: THREE.Vector3 },
    depth: number,
    maxDepth: number
  ): void {
    if (!this.enabled || !this.options.showOctree) return;
    
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    
    // Create box wireframe
    const min = bounds.min;
    const max = bounds.max;
    
    // Bottom face
    vertices.push(min.x, min.y, min.z, max.x, min.y, min.z);
    vertices.push(max.x, min.y, min.z, max.x, min.y, max.z);
    vertices.push(max.x, min.y, max.z, min.x, min.y, max.z);
    vertices.push(min.x, min.y, max.z, min.x, min.y, min.z);
    
    // Top face
    vertices.push(min.x, max.y, min.z, max.x, max.y, min.z);
    vertices.push(max.x, max.y, min.z, max.x, max.y, max.z);
    vertices.push(max.x, max.y, max.z, min.x, max.y, max.z);
    vertices.push(min.x, max.y, max.z, min.x, max.y, min.z);
    
    // Vertical edges
    vertices.push(min.x, min.y, min.z, min.x, max.y, min.z);
    vertices.push(max.x, min.y, min.z, max.x, max.y, min.z);
    vertices.push(max.x, min.y, max.z, max.x, max.y, max.z);
    vertices.push(min.x, min.y, max.z, min.x, max.y, max.z);
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    // Color based on depth
    const opacity = 1.0 - (depth / maxDepth) * 0.7;
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity
    });
    
    const lines = new THREE.LineSegments(geometry, material);
    lines.name = `OctreeNode_Depth${depth}`;
    this.debugGroup.add(lines);
  }
  
  /**
   * Visualize voxel cluster
   */
  visualizeCluster(
    clusterId: number,
    bounds: { min: THREE.Vector3; max: THREE.Vector3 },
    voxelCount: number
  ): void {
    if (!this.enabled || !this.options.showClusters) return;
    
    // Get or create material for this cluster
    if (!this.clusterMaterials.has(clusterId)) {
      const hue = (clusterId * 0.618033988749895) % 1.0; // Golden ratio for color distribution
      const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
      this.clusterMaterials.set(clusterId, new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      }));
    }
    
    const material = this.clusterMaterials.get(clusterId)!;
    
    // Create box for cluster bounds
    const size = new THREE.Vector3().subVectors(bounds.max, bounds.min);
    const center = new THREE.Vector3().addVectors(bounds.min, bounds.max).multiplyScalar(0.5);
    
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(center);
    mesh.name = `Cluster_${clusterId}_${voxelCount}voxels`;
    
    this.debugGroup.add(mesh);
  }
  
  /**
   * Visualize LOD level
   */
  visualizeLODLevel(
    lodLevel: number,
    bounds: { min: THREE.Vector3; max: THREE.Vector3 }
  ): void {
    if (!this.enabled || !this.options.showLODLevels) return;
    
    const material = this.lodMaterials[Math.min(lodLevel, this.lodMaterials.length - 1)];
    
    const size = new THREE.Vector3().subVectors(bounds.max, bounds.min);
    const center = new THREE.Vector3().addVectors(bounds.min, bounds.max).multiplyScalar(0.5);
    
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(center);
    mesh.name = `LOD_Level${lodLevel}`;
    
    this.debugGroup.add(mesh);
  }
  
  /**
   * Visualize bounding box
   */
  visualizeBounds(
    bounds: { min: THREE.Vector3; max: THREE.Vector3 },
    color: number = 0xffff00
  ): void {
    if (!this.enabled || !this.options.showBounds) return;
    
    const box = new THREE.Box3(bounds.min, bounds.max);
    const helper = new THREE.Box3Helper(box, color);
    helper.name = 'BoundsHelper';
    this.debugGroup.add(helper);
  }
  
  /**
   * Visualize normals
   */
  visualizeNormals(
    positions: Float32Array,
    normals: Float32Array,
    length: number = 0.1
  ): void {
    if (!this.enabled || !this.options.showNormals) return;
    
    const vertices: number[] = [];
    
    for (let i = 0; i < positions.length; i += 3) {
      const px = positions[i];
      const py = positions[i + 1];
      const pz = positions[i + 2];
      
      const nx = normals[i];
      const ny = normals[i + 1];
      const nz = normals[i + 2];
      
      // Start point
      vertices.push(px, py, pz);
      
      // End point
      vertices.push(
        px + nx * length,
        py + ny * length,
        pz + nz * length
      );
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    const lines = new THREE.LineSegments(geometry, this.normalMaterial);
    lines.name = 'NormalVectors';
    this.debugGroup.add(lines);
  }
  
  /**
   * Add text label at position
   */
  addLabel(text: string, position: THREE.Vector3, color: number = 0xffffff): void {
    if (!this.enabled) return;
    
    // Create sprite with text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = 'Bold 24px Arial';
    context.textAlign = 'center';
    context.fillText(text, 128, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(2, 0.5, 1);
    sprite.name = `Label_${text}`;
    
    this.debugGroup.add(sprite);
  }
  
  /**
   * Draw performance overlay
   */
  drawPerformanceOverlay(metrics: {
    voxels: number;
    triangles: number;
    fps: number;
    memory: number;
  }): void {
    if (!this.enabled || !this.options.showPerformanceOverlay) return;
    
    // This would typically be rendered as a 2D overlay
    // For now, we'll just log it
    console.log(`[VoxelDebug] Voxels: ${metrics.voxels}, Triangles: ${metrics.triangles}, FPS: ${metrics.fps.toFixed(1)}, Memory: ${(metrics.memory / 1024 / 1024).toFixed(1)}MB`);
  }
  
  /**
   * Visualize voxel at position
   */
  visualizeVoxel(
    position: THREE.Vector3,
    size: number,
    color: THREE.Color
  ): void {
    if (!this.enabled) return;
    
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      wireframe: this.options.showWireframe
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.name = 'DebugVoxel';
    
    this.debugGroup.add(mesh);
  }
  
  /**
   * Visualize ray for raycasting debug
   */
  visualizeRay(origin: THREE.Vector3, direction: THREE.Vector3, length: number = 100): void {
    if (!this.enabled) return;
    
    const end = new THREE.Vector3().copy(direction).multiplyScalar(length).add(origin);
    
    const geometry = new THREE.BufferGeometry().setFromPoints([origin, end]);
    const material = new THREE.LineBasicMaterial({ color: 0xff00ff });
    const line = new THREE.Line(geometry, material);
    line.name = 'DebugRay';
    
    this.debugGroup.add(line);
  }
  
  /**
   * Visualize point
   */
  visualizePoint(position: THREE.Vector3, color: number = 0xff0000, size: number = 0.1): void {
    if (!this.enabled) return;
    
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    sphere.name = 'DebugPoint';
    
    this.debugGroup.add(sphere);
  }
  
  /**
   * Update debug visualization (call each frame)
   */
  update(): void {
    if (!this.enabled) return;
    
    // Clear old debug objects if needed
    // (In a real implementation, you might want to keep some persistent debug objects)
  }
  
  /**
   * Dispose of all debug resources
   */
  dispose(): void {
    this.clear();
    
    // Dispose materials
    this.octreeMaterial.dispose();
    this.clusterMaterials.forEach(m => m.dispose());
    this.lodMaterials.forEach(m => m.dispose());
    this.normalMaterial.dispose();
    
    if (this.scene) {
      this.scene.remove(this.debugGroup);
    }
    
    console.log('[VoxelDebugger] Disposed');
  }
  
  /**
   * Get debug group for external manipulation
   */
  getDebugGroup(): THREE.Group {
    return this.debugGroup;
  }
  
  /**
   * Toggle specific debug option
   */
  toggle(option: keyof DebugVisualizationOptions): void {
    this.options[option] = !this.options[option];
    console.log(`[VoxelDebugger] ${option}: ${this.options[option]}`);
  }
  
  /**
   * Get current options
   */
  getOptions(): DebugVisualizationOptions {
    return { ...this.options };
  }
}

/**
 * Global voxel debugger instance
 */
export const voxelDebugger = new VoxelDebugger();
