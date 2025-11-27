/**
 * Material Atlas
 * 
 * Manages a collection of materials in an atlas for efficient rendering.
 * Reduces draw calls by batching materials together.
 * 
 * Features:
 * - Material packing
 * - Atlas lookup
 * - Dynamic updates
 * - LOD support
 */

import * as THREE from 'three';
import { VoxelMaterial, VoxelMaterialProperties } from './VoxelMaterial';

/**
 * Material atlas entry
 */
export interface MaterialAtlasEntry {
  /** Material ID */
  id: number;
  
  /** Material */
  material: VoxelMaterial;
  
  /** Atlas coordinates (normalized 0-1) */
  coords: {
    u: number;
    v: number;
    width: number;
    height: number;
  };
  
  /** Usage count */
  usageCount: number;
}

/**
 * Material atlas options
 */
export interface MaterialAtlasOptions {
  /** Atlas size (power of 2) */
  size?: number;
  
  /** Material slot size */
  slotSize?: number;
  
  /** Enable mipmaps */
  mipmaps?: boolean;
  
  /** Minification filter */
  minFilter?: THREE.MinificationTextureFilter;
  
  /** Magnification filter */
  magFilter?: THREE.MagnificationTextureFilter;
}

/**
 * Material atlas class
 */
export class MaterialAtlas {
  private materials: Map<number, MaterialAtlasEntry> = new Map();
  private nextId: number = 0;
  private size: number;
  private slotSize: number;
  private slotsPerRow: number;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private dirty: boolean = false;
  
  constructor(options: MaterialAtlasOptions = {}) {
    this.size = options.size ?? 2048;
    this.slotSize = options.slotSize ?? 64;
    this.slotsPerRow = Math.floor(this.size / this.slotSize);
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.context = this.canvas.getContext('2d')!;
    
    // Create texture
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = options.mipmaps ?? true;
    this.texture.minFilter = options.minFilter ?? THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = options.magFilter ?? THREE.LinearFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
  }
  
  /**
   * Add material to atlas
   */
  addMaterial(properties: VoxelMaterialProperties): number {
    const id = this.nextId++;
    
    // Calculate atlas position
    const slotIndex = this.materials.size;
    const row = Math.floor(slotIndex / this.slotsPerRow);
    const col = slotIndex % this.slotsPerRow;
    
    if (row >= this.slotsPerRow) {
      throw new Error('Material atlas full');
    }
    
    const coords = {
      u: col / this.slotsPerRow,
      v: row / this.slotsPerRow,
      width: 1 / this.slotsPerRow,
      height: 1 / this.slotsPerRow
    };
    
    const material = new VoxelMaterial(properties);
    
    this.materials.set(id, {
      id,
      material,
      coords,
      usageCount: 0
    });
    
    // Draw material to atlas
    this.drawMaterialToAtlas(id, col, row);
    this.dirty = true;
    
    return id;
  }
  
  /**
   * Get material by ID
   */
  getMaterial(id: number): VoxelMaterial | null {
    const entry = this.materials.get(id);
    return entry ? entry.material : null;
  }
  
  /**
   * Get material coordinates
   */
  getMaterialCoords(id: number): { u: number; v: number; width: number; height: number } | null {
    const entry = this.materials.get(id);
    return entry ? entry.coords : null;
  }
  
  /**
   * Remove material
   */
  removeMaterial(id: number): boolean {
    const entry = this.materials.get(id);
    if (!entry) return false;
    
    entry.material.dispose();
    this.materials.delete(id);
    this.dirty = true;
    
    return true;
  }
  
  /**
   * Update material
   */
  updateMaterial(id: number, properties: Partial<VoxelMaterialProperties>): boolean {
    const entry = this.materials.get(id);
    if (!entry) return false;
    
    entry.material.updateProperties(properties);
    
    // Redraw to atlas
    const slotIndex = Array.from(this.materials.keys()).indexOf(id);
    const row = Math.floor(slotIndex / this.slotsPerRow);
    const col = slotIndex % this.slotsPerRow;
    this.drawMaterialToAtlas(id, col, row);
    this.dirty = true;
    
    return true;
  }
  
  /**
   * Draw material to atlas
   */
  private drawMaterialToAtlas(id: number, col: number, row: number): void {
    const entry = this.materials.get(id);
    if (!entry) return;
    
    const x = col * this.slotSize;
    const y = row * this.slotSize;
    
    // Draw material color
    const props = entry.material.getProperties();
    this.context.fillStyle = `rgb(${props.color.r * 255}, ${props.color.g * 255}, ${props.color.b * 255})`;
    this.context.fillRect(x, y, this.slotSize, this.slotSize);
    
    // Draw border for debugging
    this.context.strokeStyle = '#000000';
    this.context.lineWidth = 1;
    this.context.strokeRect(x, y, this.slotSize, this.slotSize);
  }
  
  /**
   * Get atlas texture
   */
  getTexture(): THREE.CanvasTexture {
    if (this.dirty) {
      this.texture.needsUpdate = true;
      this.dirty = false;
    }
    return this.texture;
  }
  
  /**
   * Get material count
   */
  getMaterialCount(): number {
    return this.materials.size;
  }
  
  /**
   * Get capacity
   */
  getCapacity(): number {
    return this.slotsPerRow * this.slotsPerRow;
  }
  
  /**
   * Increment usage count
   */
  incrementUsage(id: number): void {
    const entry = this.materials.get(id);
    if (entry) {
      entry.usageCount++;
    }
  }
  
  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalMaterials: number;
    totalUsage: number;
    averageUsage: number;
    mostUsed: number | null;
  } {
    let totalUsage = 0;
    let mostUsed: number | null = null;
    let maxUsage = 0;
    
    for (const [id, entry] of this.materials) {
      totalUsage += entry.usageCount;
      if (entry.usageCount > maxUsage) {
        maxUsage = entry.usageCount;
        mostUsed = id;
      }
    }
    
    return {
      totalMaterials: this.materials.size,
      totalUsage,
      averageUsage: this.materials.size > 0 ? totalUsage / this.materials.size : 0,
      mostUsed
    };
  }
  
  /**
   * Clear atlas
   */
  clear(): void {
    for (const entry of this.materials.values()) {
      entry.material.dispose();
    }
    this.materials.clear();
    this.nextId = 0;
    this.context.clearRect(0, 0, this.size, this.size);
    this.dirty = true;
  }
  
  /**
   * Dispose atlas
   */
  dispose(): void {
    this.clear();
    this.texture.dispose();
  }
}
