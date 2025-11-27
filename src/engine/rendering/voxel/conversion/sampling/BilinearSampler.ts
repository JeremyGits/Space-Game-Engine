/**
 * Bilinear Sampler
 * 
 * Bilinear interpolation for smooth sampling between pixels.
 * Standard technique for texture filtering.
 * 
 * Algorithm:
 * - Sample 4 nearest pixels
 * - Interpolate horizontally
 * - Interpolate vertically
 * - Result: Smooth transitions
 */

import * as THREE from 'three';

/**
 * Bilinear sampler options
 */
export interface BilinearSamplerOptions {
  /** Wrap mode */
  wrapMode?: 'clamp' | 'repeat' | 'mirror';
  
  /** Handle alpha channel */
  handleAlpha?: boolean;
}

/**
 * Bilinear sampler class
 */
export class BilinearSampler {
  private options: Required<BilinearSamplerOptions>;
  
  constructor(options: BilinearSamplerOptions = {}) {
    this.options = {
      wrapMode: options.wrapMode ?? 'clamp',
      handleAlpha: options.handleAlpha ?? true
    };
  }
  
  /**
   * Sample color with bilinear interpolation
   */
  sampleColor(
    imageData: ImageData,
    x: number,
    y: number
  ): THREE.Color {
    const { width, height, data } = imageData;
    
    // Get integer and fractional parts
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    
    const fx = x - x0;
    const fy = y - y0;
    
    // Wrap coordinates
    const [wx0, wy0] = this.wrapCoordinates(x0, y0, width, height);
    const [wx1, wy1] = this.wrapCoordinates(x1, y1, width, height);
    
    // Sample 4 pixels
    const c00 = this.getPixel(data, wx0, wy0, width);
    const c10 = this.getPixel(data, wx1, wy0, width);
    const c01 = this.getPixel(data, wx0, wy1, width);
    const c11 = this.getPixel(data, wx1, wy1, width);
    
    // Interpolate horizontally
    const c0 = this.lerp(c00, c10, fx);
    const c1 = this.lerp(c01, c11, fx);
    
    // Interpolate vertically
    const final = this.lerp(c0, c1, fy);
    
    return new THREE.Color(final.r, final.g, final.b);
  }
  
  /**
   * Sample with alpha channel
   */
  sampleColorAlpha(
    imageData: ImageData,
    x: number,
    y: number
  ): { color: THREE.Color; alpha: number } {
    const { width, height, data } = imageData;
    
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    
    const fx = x - x0;
    const fy = y - y0;
    
    const [wx0, wy0] = this.wrapCoordinates(x0, y0, width, height);
    const [wx1, wy1] = this.wrapCoordinates(x1, y1, width, height);
    
    // Sample 4 pixels with alpha
    const p00 = this.getPixelAlpha(data, wx0, wy0, width);
    const p10 = this.getPixelAlpha(data, wx1, wy0, width);
    const p01 = this.getPixelAlpha(data, wx0, wy1, width);
    const p11 = this.getPixelAlpha(data, wx1, wy1, width);
    
    // Interpolate colors
    const c0 = this.lerp(p00.color, p10.color, fx);
    const c1 = this.lerp(p01.color, p11.color, fx);
    const color = this.lerp(c0, c1, fy);
    
    // Interpolate alpha
    const a0 = p00.alpha * (1 - fx) + p10.alpha * fx;
    const a1 = p01.alpha * (1 - fx) + p11.alpha * fx;
    const alpha = a0 * (1 - fy) + a1 * fy;
    
    return {
      color: new THREE.Color(color.r, color.g, color.b),
      alpha
    };
  }
  
  /**
   * Sample depth with bilinear interpolation
   */
  sampleDepth(
    depthMap: Float32Array,
    x: number,
    y: number,
    width: number,
    height: number
  ): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    
    const fx = x - x0;
    const fy = y - y0;
    
    const [wx0, wy0] = this.wrapCoordinates(x0, y0, width, height);
    const [wx1, wy1] = this.wrapCoordinates(x1, y1, width, height);
    
    // Sample 4 depth values
    const d00 = depthMap[wy0 * width + wx0];
    const d10 = depthMap[wy0 * width + wx1];
    const d01 = depthMap[wy1 * width + wx0];
    const d11 = depthMap[wy1 * width + wx1];
    
    // Bilinear interpolation
    const d0 = d00 * (1 - fx) + d10 * fx;
    const d1 = d01 * (1 - fx) + d11 * fx;
    
    return d0 * (1 - fy) + d1 * fy;
  }
  
  /**
   * Sample normalized coordinates (0-1)
   */
  sampleNormalized(
    imageData: ImageData,
    u: number,
    v: number
  ): THREE.Color {
    const x = u * (imageData.width - 1);
    const y = v * (imageData.height - 1);
    return this.sampleColor(imageData, x, y);
  }
  
  /**
   * Sample with custom interpolation function
   */
  sampleCustom(
    imageData: ImageData,
    x: number,
    y: number,
    interpolationFunc: (a: number, b: number, t: number) => number
  ): THREE.Color {
    const { width, height, data } = imageData;
    
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    
    const fx = x - x0;
    const fy = y - y0;
    
    const [wx0, wy0] = this.wrapCoordinates(x0, y0, width, height);
    const [wx1, wy1] = this.wrapCoordinates(x1, y1, width, height);
    
    const c00 = this.getPixel(data, wx0, wy0, width);
    const c10 = this.getPixel(data, wx1, wy0, width);
    const c01 = this.getPixel(data, wx0, wy1, width);
    const c11 = this.getPixel(data, wx1, wy1, width);
    
    // Custom interpolation
    const r0 = interpolationFunc(c00.r, c10.r, fx);
    const r1 = interpolationFunc(c01.r, c11.r, fx);
    const r = interpolationFunc(r0, r1, fy);
    
    const g0 = interpolationFunc(c00.g, c10.g, fx);
    const g1 = interpolationFunc(c01.g, c11.g, fx);
    const g = interpolationFunc(g0, g1, fy);
    
    const b0 = interpolationFunc(c00.b, c10.b, fx);
    const b1 = interpolationFunc(c01.b, c11.b, fx);
    const b = interpolationFunc(b0, b1, fy);
    
    return new THREE.Color(r, g, b);
  }
  
  /**
   * Get pixel color
   */
  private getPixel(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number
  ): { r: number; g: number; b: number } {
    const idx = (y * width + x) * 4;
    return {
      r: data[idx] / 255,
      g: data[idx + 1] / 255,
      b: data[idx + 2] / 255
    };
  }
  
  /**
   * Get pixel with alpha
   */
  private getPixelAlpha(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number
  ): { color: { r: number; g: number; b: number }; alpha: number } {
    const idx = (y * width + x) * 4;
    return {
      color: {
        r: data[idx] / 255,
        g: data[idx + 1] / 255,
        b: data[idx + 2] / 255
      },
      alpha: data[idx + 3] / 255
    };
  }
  
  /**
   * Linear interpolation
   */
  private lerp(
    a: { r: number; g: number; b: number },
    b: { r: number; g: number; b: number },
    t: number
  ): { r: number; g: number; b: number } {
    return {
      r: a.r * (1 - t) + b.r * t,
      g: a.g * (1 - t) + b.g * t,
      b: a.b * (1 - t) + b.b * t
    };
  }
  
  /**
   * Wrap coordinates
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
}
