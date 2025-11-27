/**
 * Luminance-Based Depth Extraction
 * 
 * Extracts depth from image luminance (brightness).
 * Simple, fast, and effective for most images.
 * 
 * Algorithm:
 * - Brighter pixels = Closer (higher depth)
 * - Darker pixels = Farther (lower depth)
 */

/**
 * Luminance depth options
 */
export interface LuminanceDepthOptions {
  /** Gamma correction (default: 0.6) */
  gamma?: number;
  
  /** Contrast multiplier (default: 1.0) */
  contrast?: number;
  
  /** Brightness offset (default: 0.0) */
  brightness?: number;
  
  /** Invert (dark = near) */
  invert?: boolean;
}

/**
 * Luminance depth extractor
 */
export class LuminanceDepth {
  private options: Required<LuminanceDepthOptions>;
  
  constructor(options: LuminanceDepthOptions = {}) {
    this.options = {
      gamma: options.gamma ?? 0.6,
      contrast: options.contrast ?? 1.0,
      brightness: options.brightness ?? 0.0,
      invert: options.invert ?? false
    };
  }
  
  /**
   * Extract depth from image data
   */
  extract(imageData: ImageData): Float32Array {
    const { width, height, data } = imageData;
    const depthMap = new Float32Array(width * height);
    
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      
      // Calculate luminance (ITU-R BT.709)
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      
      // Normalize to 0-1
      let depth = luminance / 255;
      
      // Apply gamma correction
      depth = Math.pow(depth, this.options.gamma);
      
      // Apply brightness
      depth = depth + this.options.brightness;
      
      // Apply contrast
      depth = (depth - 0.5) * this.options.contrast + 0.5;
      
      // Clamp
      depth = Math.max(0, Math.min(1, depth));
      
      // Invert if requested
      if (this.options.invert) {
        depth = 1 - depth;
      }
      
      depthMap[i] = depth;
    }
    
    return depthMap;
  }
  
  /**
   * Extract with custom luminance weights
   */
  extractCustom(
    imageData: ImageData,
    rWeight: number = 0.299,
    gWeight: number = 0.587,
    bWeight: number = 0.114
  ): Float32Array {
    const { width, height, data } = imageData;
    const depthMap = new Float32Array(width * height);
    
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      
      const luminance = rWeight * r + gWeight * g + bWeight * b;
      let depth = luminance / 255;
      
      depth = Math.pow(depth, this.options.gamma);
      depth = (depth - 0.5) * this.options.contrast + 0.5;
      depth = Math.max(0, Math.min(1, depth));
      
      if (this.options.invert) {
        depth = 1 - depth;
      }
      
      depthMap[i] = depth;
    }
    
    return depthMap;
  }
  
  /**
   * Extract with perceptual luminance (human eye sensitivity)
   */
  extractPerceptual(imageData: ImageData): Float32Array {
    // Human eye is more sensitive to green
    return this.extractCustom(imageData, 0.2126, 0.7152, 0.0722);
  }
  
  /**
   * Extract with equal weights
   */
  extractAverage(imageData: ImageData): Float32Array {
    return this.extractCustom(imageData, 0.333, 0.333, 0.334);
  }
}
