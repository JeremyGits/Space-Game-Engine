/**
 * Color Extractor
 * 
 * Extracts color information from images for voxel generation.
 * Handles color sampling, palette generation, and color quantization.
 */

import * as THREE from 'three';

/**
 * Color extraction options
 */
export interface ColorExtractionOptions {
  /** Alpha threshold (pixels below this are transparent) */
  alphaThreshold?: number;
  
  /** Color quantization levels (0 = no quantization) */
  quantizationLevels?: number;
  
  /** Generate color palette */
  generatePalette?: boolean;
  
  /** Maximum palette size */
  maxPaletteSize?: number;
}

/**
 * Color palette entry
 */
export interface PaletteColor {
  color: THREE.Color;
  count: number;
  percentage: number;
}

/**
 * Color extractor class
 */
export class ColorExtractor {
  private options: Required<ColorExtractionOptions>;
  private palette: PaletteColor[] = [];
  
  constructor(options: ColorExtractionOptions = {}) {
    this.options = {
      alphaThreshold: options.alphaThreshold ?? 0.1,
      quantizationLevels: options.quantizationLevels ?? 0,
      generatePalette: options.generatePalette ?? false,
      maxPaletteSize: options.maxPaletteSize ?? 256
    };
  }
  
  /**
   * Extract colors from image data
   */
  extract(imageData: ImageData): {
    colors: THREE.Color[];
    alphas: Float32Array;
  } {
    const { width, height, data } = imageData;
    const pixelCount = width * height;
    
    const colors: THREE.Color[] = [];
    const alphas = new Float32Array(pixelCount);
    const colorMap = new Map<string, number>();
    
    for (let i = 0; i < pixelCount; i++) {
      const r = data[i * 4] / 255;
      const g = data[i * 4 + 1] / 255;
      const b = data[i * 4 + 2] / 255;
      const a = data[i * 4 + 3] / 255;
      
      // Apply quantization if enabled
      let finalR = r, finalG = g, finalB = b;
      
      if (this.options.quantizationLevels > 0) {
        const levels = this.options.quantizationLevels;
        finalR = Math.round(r * levels) / levels;
        finalG = Math.round(g * levels) / levels;
        finalB = Math.round(b * levels) / levels;
      }
      
      const color = new THREE.Color(finalR, finalG, finalB);
      colors.push(color);
      alphas[i] = a;
      
      // Track for palette
      if (this.options.generatePalette && a > this.options.alphaThreshold) {
        const key = color.getHexString();
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }
    }
    
    // Generate palette if requested
    if (this.options.generatePalette) {
      this.generateColorPalette(colorMap, pixelCount);
    }
    
    return { colors, alphas };
  }
  
  /**
   * Get color at specific pixel
   */
  getColorAt(imageData: ImageData, x: number, y: number): {
    color: THREE.Color;
    alpha: number;
  } {
    const idx = (y * imageData.width + x) * 4;
    const data = imageData.data;
    
    return {
      color: new THREE.Color(
        data[idx] / 255,
        data[idx + 1] / 255,
        data[idx + 2] / 255
      ),
      alpha: data[idx + 3] / 255
    };
  }
  
  /**
   * Sample color with bilinear interpolation
   */
  sampleColor(imageData: ImageData, u: number, v: number): {
    color: THREE.Color;
    alpha: number;
  } {
    const { width, height } = imageData;
    
    // Convert UV to pixel coordinates
    const x = u * (width - 1);
    const y = v * (height - 1);
    
    // Get integer and fractional parts
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);
    
    const fx = x - x0;
    const fy = y - y0;
    
    // Sample four corners
    const c00 = this.getColorAt(imageData, x0, y0);
    const c10 = this.getColorAt(imageData, x1, y0);
    const c01 = this.getColorAt(imageData, x0, y1);
    const c11 = this.getColorAt(imageData, x1, y1);
    
    // Bilinear interpolation
    const color = new THREE.Color();
    color.r = 
      c00.color.r * (1 - fx) * (1 - fy) +
      c10.color.r * fx * (1 - fy) +
      c01.color.r * (1 - fx) * fy +
      c11.color.r * fx * fy;
    
    color.g = 
      c00.color.g * (1 - fx) * (1 - fy) +
      c10.color.g * fx * (1 - fy) +
      c01.color.g * (1 - fx) * fy +
      c11.color.g * fx * fy;
    
    color.b = 
      c00.color.b * (1 - fx) * (1 - fy) +
      c10.color.b * fx * (1 - fy) +
      c01.color.b * (1 - fx) * fy +
      c11.color.b * fx * fy;
    
    const alpha = 
      c00.alpha * (1 - fx) * (1 - fy) +
      c10.alpha * fx * (1 - fy) +
      c01.alpha * (1 - fx) * fy +
      c11.alpha * fx * fy;
    
    return { color, alpha };
  }
  
  /**
   * Generate color palette
   */
  private generateColorPalette(colorMap: Map<string, number>, totalPixels: number): void {
    this.palette = [];
    
    // Convert to array and sort by frequency
    const entries = Array.from(colorMap.entries());
    entries.sort((a, b) => b[1] - a[1]);
    
    // Take top N colors
    const maxColors = Math.min(entries.length, this.options.maxPaletteSize);
    
    for (let i = 0; i < maxColors; i++) {
      const [hexString, count] = entries[i];
      this.palette.push({
        color: new THREE.Color('#' + hexString),
        count,
        percentage: (count / totalPixels) * 100
      });
    }
    
    console.log(`[ColorExtractor] Generated palette with ${this.palette.length} colors`);
  }
  
  /**
   * Get color palette
   */
  getPalette(): PaletteColor[] {
    return this.palette;
  }
  
  /**
   * Find nearest palette color
   */
  findNearestPaletteColor(color: THREE.Color): THREE.Color {
    if (this.palette.length === 0) {
      return color.clone();
    }
    
    let nearest = this.palette[0].color;
    let minDistance = Infinity;
    
    for (const entry of this.palette) {
      const distance = this.colorDistance(color, entry.color);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = entry.color;
      }
    }
    
    return nearest.clone();
  }
  
  /**
   * Calculate color distance (Euclidean in RGB space)
   */
  private colorDistance(c1: THREE.Color, c2: THREE.Color): number {
    const dr = c1.r - c2.r;
    const dg = c1.g - c2.g;
    const db = c1.b - c2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }
  
  /**
   * Get dominant colors
   */
  getDominantColors(count: number = 5): PaletteColor[] {
    return this.palette.slice(0, count);
  }
  
  /**
   * Get average color
   */
  getAverageColor(imageData: ImageData): THREE.Color {
    const { width, height, data } = imageData;
    let r = 0, g = 0, b = 0, count = 0;
    
    for (let i = 0; i < width * height; i++) {
      const alpha = data[i * 4 + 3] / 255;
      
      if (alpha > this.options.alphaThreshold) {
        r += data[i * 4] / 255;
        g += data[i * 4 + 1] / 255;
        b += data[i * 4 + 2] / 255;
        count++;
      }
    }
    
    if (count === 0) return new THREE.Color(0, 0, 0);
    
    return new THREE.Color(r / count, g / count, b / count);
  }
}
