/**
 * Bicubic Sampler
 * 
 * Bicubic interpolation for high-quality sampling.
 * Smoother than bilinear, better for upscaling.
 * 
 * Algorithm:
 * - Sample 16 nearest pixels (4x4 grid)
 * - Apply cubic interpolation
 * - Result: Very smooth transitions
 */

import * as THREE from 'three';

/**
 * Bicubic sampler options
 */
export interface BicubicSamplerOptions {
  /** Wrap mode */
  wrapMode?: 'clamp' | 'repeat' | 'mirror';
  
  /** Interpolation parameter (-0.5 to -1.0, default: -0.5) */
  a?: number;
}

/**
 * Bicubic sampler class
 */
export class BicubicSampler {
  private options: Required<BicubicSamplerOptions>;
  
  constructor(options: BicubicSamplerOptions = {}) {
    this.options = {
      wrapMode: options.wrapMode ?? 'clamp',
      a: options.a ?? -0.5 // Catmull-Rom spline
    };
  }
  
  /**
   * Sample color with bicubic interpolation
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
    const fx = x - x0;
    const fy = y - y0;
    
    // Sample 4x4 grid of pixels
    const pixels: { r: number; g: number; b: number }[][] = [];
    
    for (let dy = -1; dy <= 2; dy++) {
      const row: { r: number; g: number; b: number }[] = [];
      for (let dx = -1; dx <= 2; dx++) {
        const [wx, wy] = this.wrapCoordinates(x0 + dx, y0 + dy, width, height);
        row.push(this.getPixel(data, wx, wy, width));
      }
      pixels.push(row);
    }
    
    // Interpolate horizontally for each row
    const rows: { r: number; g: number; b: number }[] = [];
    for (let i = 0; i < 4; i++) {
      rows.push({
        r: this.cubicInterpolate(pixels[i][0].r, pixels[i][1].r, pixels[i][2].r, pixels[i][3].r, fx),
        g: this.cubicInterpolate(pixels[i][0].g, pixels[i][1].g, pixels[i][2].g, pixels[i][3].g, fx),
        b: this.cubicInterpolate(pixels[i][0].b, pixels[i][1].b, pixels[i][2].b, pixels[i][3].b, fx)
      });
    }
    
    // Interpolate vertically
    const r = this.cubicInterpolate(rows[0].r, rows[1].r, rows[2].r, rows[3].r, fy);
    const g = this.cubicInterpolate(rows[0].g, rows[1].g, rows[2].g, rows[3].g, fy);
    const b = this.cubicInterpolate(rows[0].b, rows[1].b, rows[2].b, rows[3].b, fy);
    
    return new THREE.Color(
      Math.max(0, Math.min(1, r)),
      Math.max(0, Math.min(1, g)),
      Math.max(0, Math.min(1, b))
    );
  }
  
  /**
   * Sample depth with bicubic interpolation
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
    const fx = x - x0;
    const fy = y - y0;
    
    // Sample 4x4 grid
    const values: number[][] = [];
    
    for (let dy = -1; dy <= 2; dy++) {
      const row: number[] = [];
      for (let dx = -1; dx <= 2; dx++) {
        const [wx, wy] = this.wrapCoordinates(x0 + dx, y0 + dy, width, height);
        row.push(depthMap[wy * width + wx]);
      }
      values.push(row);
    }
    
    // Interpolate horizontally
    const rows: number[] = [];
    for (let i = 0; i < 4; i++) {
      rows.push(this.cubicInterpolate(values[i][0], values[i][1], values[i][2], values[i][3], fx));
    }
    
    // Interpolate vertically
    return this.cubicInterpolate(rows[0], rows[1], rows[2], rows[3], fy);
  }
  
  /**
   * Sample normalized coordinates
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
   * Cubic interpolation (Catmull-Rom or Mitchell-Netravali)
   */
  private cubicInterpolate(p0: number, p1: number, p2: number, p3: number, t: number): number {
    const a = this.options.a;
    
    // Cubic polynomial coefficients
    const c0 = p1;
    const c1 = a * (p2 - p0);
    const c2 = 2 * a * p0 - (3 + a) * p1 + (3 - 2 * a) * p2 - a * p3;
    const c3 = -a * p0 + (2 + a) * p1 - (2 - a) * p2 + a * p3;
    
    // Evaluate polynomial
    return c0 + c1 * t + c2 * t * t + c3 * t * t * t;
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

/**
 * Cubic interpolation variants:
 * 
 * Catmull-Rom (a = -0.5):
 * - Passes through control points
 * - Good for general use
 * - Standard choice
 * 
 * Mitchell-Netravali (a = -1.0):
 * - Sharper results
 * - Better for upscaling
 * - Less ringing artifacts
 * 
 * B-Spline (a = 0.0):
 * - Smoothest results
 * - Doesn't pass through points
 * - Good for blurring
 */
