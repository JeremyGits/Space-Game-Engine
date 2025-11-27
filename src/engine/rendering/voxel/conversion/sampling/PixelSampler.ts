/**
 * Pixel Sampler
 * 
 * Basic pixel sampling with nearest-neighbor lookup.
 * Fast and simple, no interpolation.
 * 
 * Use for:
 * - Pixel-perfect sampling
 * - Fast lookups
 * - Retro/pixelated effects
 */

import * as THREE from 'three';

/**
 * Pixel sampler options
 */
export interface PixelSamplerOptions {
  /** Wrap mode for out-of-bounds coordinates */
  wrapMode?: 'clamp' | 'repeat' | 'mirror';
  
  /** Handle alpha channel */
  handleAlpha?: boolean;
}

/**
 * Pixel sampler class
 */
export class PixelSampler {
  private options: Required<PixelSamplerOptions>;
  
  constructor(options: PixelSamplerOptions = {}) {
    this.options = {
      wrapMode: options.wrapMode ?? 'clamp',
      handleAlpha: options.handleAlpha ?? true
    };
  }
  
  /**
   * Sample color at pixel coordinates
   */
  sampleColor(
    imageData: ImageData,
    x: number,
    y: number
  ): THREE.Color {
    const { width, height, data } = imageData;
    
    // Apply wrap mode
    const [wx, wy] = this.wrapCoordinates(x, y, width, height);
    
    // Get pixel index
    const idx = (Math.floor(wy) * width + Math.floor(wx)) * 4;
    
    // Extract RGB
    const r = data[idx] / 255;
    const g = data[idx + 1] / 255;
    const b = data[idx + 2] / 255;
    
    return new THREE.Color(r, g, b);
  }
  
  /**
   * Sample color with alpha
   */
  sampleColorAlpha(
    imageData: ImageData,
    x: number,
    y: number
  ): { color: THREE.Color; alpha: number } {
    const { width, height, data } = imageData;
    
    const [wx, wy] = this.wrapCoordinates(x, y, width, height);
    const idx = (Math.floor(wy) * width + Math.floor(wx)) * 4;
    
    const r = data[idx] / 255;
    const g = data[idx + 1] / 255;
    const b = data[idx + 2] / 255;
    const a = data[idx + 3] / 255;
    
    return {
      color: new THREE.Color(r, g, b),
      alpha: a
    };
  }
  
  /**
   * Sample depth value
   */
  sampleDepth(
    depthMap: Float32Array,
    x: number,
    y: number,
    width: number,
    height: number
  ): number {
    const [wx, wy] = this.wrapCoordinates(x, y, width, height);
    const idx = Math.floor(wy) * width + Math.floor(wx);
    return depthMap[idx];
  }
  
  /**
   * Sample normalized coordinates (0-1)
   */
  sampleNormalized(
    imageData: ImageData,
    u: number,
    v: number
  ): THREE.Color {
    const x = u * imageData.width;
    const y = v * imageData.height;
    return this.sampleColor(imageData, x, y);
  }
  
  /**
   * Sample multiple pixels in a region
   */
  sampleRegion(
    imageData: ImageData,
    x: number,
    y: number,
    width: number,
    height: number
  ): THREE.Color[] {
    const colors: THREE.Color[] = [];
    
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        colors.push(this.sampleColor(imageData, x + dx, y + dy));
      }
    }
    
    return colors;
  }
  
  /**
   * Get average color in region
   */
  sampleRegionAverage(
    imageData: ImageData,
    x: number,
    y: number,
    width: number,
    height: number
  ): THREE.Color {
    let r = 0, g = 0, b = 0;
    let count = 0;
    
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const color = this.sampleColor(imageData, x + dx, y + dy);
        r += color.r;
        g += color.g;
        b += color.b;
        count++;
      }
    }
    
    return new THREE.Color(r / count, g / count, b / count);
  }
  
  /**
   * Wrap coordinates based on wrap mode
   */
  private wrapCoordinates(
    x: number,
    y: number,
    width: number,
    height: number
  ): [number, number] {
    switch (this.options.wrapMode) {
      case 'clamp':
        return [
          Math.max(0, Math.min(width - 1, x)),
          Math.max(0, Math.min(height - 1, y))
        ];
      
      case 'repeat':
        return [
          ((x % width) + width) % width,
          ((y % height) + height) % height
        ];
      
      case 'mirror':
        const mx = Math.floor(x / width);
        const my = Math.floor(y / height);
        return [
          mx % 2 === 0 ? x % width : width - 1 - (x % width),
          my % 2 === 0 ? y % height : height - 1 - (y % height)
        ];
      
      default:
        return [x, y];
    }
  }
  
  /**
   * Check if coordinates are in bounds
   */
  isInBounds(x: number, y: number, width: number, height: number): boolean {
    return x >= 0 && x < width && y >= 0 && y < height;
  }
}
