/**
 * Texture Atlas
 * 
 * Packs multiple textures into a single atlas for efficient rendering.
 * Reduces texture switches and improves GPU performance.
 * 
 * Features:
 * - Automatic packing
 * - Dynamic updates
 * - Mipmap support
 * - UV coordinate mapping
 */

import * as THREE from 'three';

/**
 * Texture atlas entry
 */
export interface TextureAtlasEntry {
  /** Texture ID */
  id: number;
  
  /** Original texture */
  texture: THREE.Texture;
  
  /** Atlas coordinates (normalized 0-1) */
  coords: {
    u: number;
    v: number;
    width: number;
    height: number;
  };
  
  /** Pixel coordinates */
  pixelCoords: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Texture atlas options
 */
export interface TextureAtlasOptions {
  /** Atlas size (power of 2) */
  size?: number;
  
  /** Enable mipmaps */
  mipmaps?: boolean;
  
  /** Texture format */
  format?: THREE.PixelFormat;
  
  /** Padding between textures */
  padding?: number;
}

/**
 * Texture atlas class
 */
export class TextureAtlas {
  private textures: Map<number, TextureAtlasEntry> = new Map();
  private nextId: number = 0;
  private size: number;
  private padding: number;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private atlas: THREE.CanvasTexture;
  private dirty: boolean = false;
  
  // Packing state
  private currentX: number = 0;
  private currentY: number = 0;
  private rowHeight: number = 0;
  
  constructor(options: TextureAtlasOptions = {}) {
    this.size = options.size ?? 2048;
    this.padding = options.padding ?? 2;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.context = this.canvas.getContext('2d')!;
    
    // Create atlas texture
    this.atlas = new THREE.CanvasTexture(this.canvas);
    this.atlas.generateMipmaps = options.mipmaps ?? true;
    this.atlas.minFilter = THREE.LinearMipmapLinearFilter;
    this.atlas.magFilter = THREE.LinearFilter;
    this.atlas.format = options.format ?? THREE.RGBAFormat;
    this.atlas.wrapS = THREE.ClampToEdgeWrapping;
    this.atlas.wrapT = THREE.ClampToEdgeWrapping;
  }
  
  /**
   * Add texture to atlas
   */
  async addTexture(texture: THREE.Texture): Promise<number> {
    const id = this.nextId++;
    
    // Load texture image
    const image = await this.loadTextureImage(texture);
    const width = image.width;
    const height = image.height;
    
    // Find position in atlas
    const position = this.findPosition(width, height);
    if (!position) {
      throw new Error('Texture atlas full - cannot fit texture');
    }
    
    // Draw to atlas
    this.context.drawImage(
      image,
      position.x,
      position.y,
      width,
      height
    );
    
    // Calculate normalized coordinates
    const coords = {
      u: position.x / this.size,
      v: position.y / this.size,
      width: width / this.size,
      height: height / this.size
    };
    
    this.textures.set(id, {
      id,
      texture,
      coords,
      pixelCoords: {
        x: position.x,
        y: position.y,
        width,
        height
      }
    });
    
    this.dirty = true;
    return id;
  }
  
  /**
   * Load texture image
   */
  private async loadTextureImage(texture: THREE.Texture): Promise<HTMLImageElement | HTMLCanvasElement> {
    if (texture.image) {
      return texture.image as HTMLImageElement | HTMLCanvasElement;
    }
    
    // Wait for texture to load
    return new Promise<HTMLImageElement | HTMLCanvasElement>((resolve, reject) => {
      const checkImage = () => {
        if (texture.image) {
          resolve(texture.image as HTMLImageElement | HTMLCanvasElement);
        } else {
          setTimeout(checkImage, 10);
        }
      };
      checkImage();
      
      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Texture load timeout')), 5000);
    });
  }
  
  /**
   * Find position for texture in atlas
   */
  private findPosition(width: number, height: number): { x: number; y: number } | null {
    // Try current row
    if (this.currentX + width + this.padding <= this.size) {
      const position = { x: this.currentX, y: this.currentY };
      this.currentX += width + this.padding;
      this.rowHeight = Math.max(this.rowHeight, height);
      return position;
    }
    
    // Move to next row
    this.currentX = 0;
    this.currentY += this.rowHeight + this.padding;
    this.rowHeight = 0;
    
    // Check if fits in new row
    if (this.currentY + height + this.padding <= this.size &&
        this.currentX + width + this.padding <= this.size) {
      const position = { x: this.currentX, y: this.currentY };
      this.currentX += width + this.padding;
      this.rowHeight = height;
      return position;
    }
    
    // Atlas full
    return null;
  }
  
  /**
   * Get texture coordinates
   */
  getTextureCoords(id: number): { u: number; v: number; width: number; height: number } | null {
    const entry = this.textures.get(id);
    return entry ? entry.coords : null;
  }
  
  /**
   * Map UV coordinates to atlas
   */
  mapUV(id: number, u: number, v: number): THREE.Vector2 | null {
    const entry = this.textures.get(id);
    if (!entry) return null;
    
    const mappedU = entry.coords.u + u * entry.coords.width;
    const mappedV = entry.coords.v + v * entry.coords.height;
    
    return new THREE.Vector2(mappedU, mappedV);
  }
  
  /**
   * Get atlas texture
   */
  getAtlas(): THREE.CanvasTexture {
    if (this.dirty) {
      this.atlas.needsUpdate = true;
      this.dirty = false;
    }
    return this.atlas;
  }
  
  /**
   * Get texture count
   */
  getTextureCount(): number {
    return this.textures.size;
  }
  
  /**
   * Get capacity
   */
  getCapacity(): number {
    return Math.floor(this.size / this.padding) ** 2;
  }
  
  /**
   * Clear atlas
   */
  clear(): void {
    this.textures.clear();
    this.nextId = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.rowHeight = 0;
    this.context.clearRect(0, 0, this.size, this.size);
    this.dirty = true;
  }
  
  /**
   * Dispose atlas
   */
  dispose(): void {
    this.clear();
    this.atlas.dispose();
  }
}
