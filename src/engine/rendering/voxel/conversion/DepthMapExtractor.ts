/**
 * Depth Map Extractor
 * 
 * Extracts depth information from images using various techniques.
 * Converts 2D images into depth maps for 3D voxel reconstruction.
 * 
 * Techniques:
 * - Luminance-based depth
 * - Edge-based depth
 * - Gradient-based depth
 * - Multi-scale depth
 */

/**
 * Depth extraction method
 */
export enum DepthExtractionMethod {
  /** Use luminance as depth */
  LUMINANCE = 'luminance',
  
  /** Use edge detection for depth */
  EDGE_BASED = 'edge-based',
  
  /** Use gradient magnitude */
  GRADIENT = 'gradient',
  
  /** Combine multiple methods */
  MULTI_SCALE = 'multi-scale'
}

/**
 * Depth extraction options
 */
export interface DepthExtractionOptions {
  /** Extraction method */
  method?: DepthExtractionMethod;
  
  /** Depth range (min, max) */
  depthRange?: [number, number];
  
  /** Invert depth (dark = near, light = far) */
  invertDepth?: boolean;
  
  /** Contrast enhancement */
  contrastBoost?: number;
  
  /** Smoothing iterations */
  smoothing?: number;
  
  /** Edge detection threshold */
  edgeThreshold?: number;
}

/**
 * Depth map extractor class
 */
export class DepthMapExtractor {
  private options: Required<DepthExtractionOptions>;
  
  constructor(options: DepthExtractionOptions = {}) {
    this.options = {
      method: options.method ?? DepthExtractionMethod.LUMINANCE,
      depthRange: options.depthRange ?? [0, 1],
      invertDepth: options.invertDepth ?? false,
      contrastBoost: options.contrastBoost ?? 1.5,
      smoothing: options.smoothing ?? 1,
      edgeThreshold: options.edgeThreshold ?? 0.1
    };
  }
  
  /**
   * Extract depth map from image data
   */
  extract(imageData: ImageData): Float32Array {
    console.log(`[DepthMapExtractor] Extracting depth using ${this.options.method} method`);
    
    let depthMap: Float32Array;
    
    switch (this.options.method) {
      case DepthExtractionMethod.LUMINANCE:
        depthMap = this.extractLuminance(imageData);
        break;
      case DepthExtractionMethod.EDGE_BASED:
        depthMap = this.extractEdgeBased(imageData);
        break;
      case DepthExtractionMethod.GRADIENT:
        depthMap = this.extractGradient(imageData);
        break;
      case DepthExtractionMethod.MULTI_SCALE:
        depthMap = this.extractMultiScale(imageData);
        break;
      default:
        depthMap = this.extractLuminance(imageData);
    }
    
    // Apply post-processing
    if (this.options.smoothing > 0) {
      depthMap = this.smoothDepthMap(depthMap, imageData.width, imageData.height);
    }
    
    if (this.options.contrastBoost !== 1.0) {
      depthMap = this.enhanceContrast(depthMap);
    }
    
    if (this.options.invertDepth) {
      depthMap = this.invertDepthMap(depthMap);
    }
    
    // Normalize to depth range
    depthMap = this.normalizeDepthMap(depthMap);
    
    return depthMap;
  }
  
  /**
   * Extract depth from luminance
   */
  private extractLuminance(imageData: ImageData): Float32Array {
    const { width, height, data } = imageData;
    const depthMap = new Float32Array(width * height);
    
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      
      // Calculate luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      depthMap[i] = luminance / 255;
    }
    
    return depthMap;
  }
  
  /**
   * Extract depth using edge detection
   */
  private extractEdgeBased(imageData: ImageData): Float32Array {
    const { width, height } = imageData;
    const luminance = this.extractLuminance(imageData);
    const depthMap = new Float32Array(width * height);
    
    // Sobel edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Sobel kernels
        const gx = 
          -luminance[(y - 1) * width + (x - 1)] + luminance[(y - 1) * width + (x + 1)] +
          -2 * luminance[y * width + (x - 1)] + 2 * luminance[y * width + (x + 1)] +
          -luminance[(y + 1) * width + (x - 1)] + luminance[(y + 1) * width + (x + 1)];
        
        const gy =
          -luminance[(y - 1) * width + (x - 1)] - 2 * luminance[(y - 1) * width + x] - luminance[(y - 1) * width + (x + 1)] +
          luminance[(y + 1) * width + (x - 1)] + 2 * luminance[(y + 1) * width + x] + luminance[(y + 1) * width + (x + 1)];
        
        // Edge magnitude
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        // Edges are closer (higher depth)
        depthMap[idx] = magnitude > this.options.edgeThreshold ? 0.8 : luminance[idx];
      }
    }
    
    return depthMap;
  }
  
  /**
   * Extract depth using gradient
   */
  private extractGradient(imageData: ImageData): Float32Array {
    const { width, height } = imageData;
    const luminance = this.extractLuminance(imageData);
    const depthMap = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Calculate gradient
        const dx = luminance[idx + 1] - luminance[idx - 1];
        const dy = luminance[idx + width] - luminance[idx - width];
        const gradient = Math.sqrt(dx * dx + dy * dy);
        
        // Higher gradient = more depth variation
        depthMap[idx] = luminance[idx] * (1 + gradient * 0.5);
      }
    }
    
    return depthMap;
  }
  
  /**
   * Extract depth using multiple scales
   */
  private extractMultiScale(imageData: ImageData): Float32Array {
    const luminance = this.extractLuminance(imageData);
    const edges = this.extractEdgeBased(imageData);
    const gradient = this.extractGradient(imageData);
    
    const depthMap = new Float32Array(luminance.length);
    
    // Combine methods with weights
    for (let i = 0; i < depthMap.length; i++) {
      depthMap[i] = 
        luminance[i] * 0.5 +
        edges[i] * 0.3 +
        gradient[i] * 0.2;
    }
    
    return depthMap;
  }
  
  /**
   * Smooth depth map using box blur
   */
  private smoothDepthMap(depthMap: Float32Array, width: number, height: number): Float32Array {
    const smoothed = new Float32Array(depthMap.length);
    const radius = this.options.smoothing;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += depthMap[ny * width + nx];
              count++;
            }
          }
        }
        
        smoothed[y * width + x] = sum / count;
      }
    }
    
    return smoothed;
  }
  
  /**
   * Enhance contrast
   */
  private enhanceContrast(depthMap: Float32Array): Float32Array {
    const enhanced = new Float32Array(depthMap.length);
    const boost = this.options.contrastBoost;
    
    for (let i = 0; i < depthMap.length; i++) {
      // Apply contrast curve
      const normalized = depthMap[i];
      const contrasted = ((normalized - 0.5) * boost + 0.5);
      enhanced[i] = Math.max(0, Math.min(1, contrasted));
    }
    
    return enhanced;
  }
  
  /**
   * Invert depth map
   */
  private invertDepthMap(depthMap: Float32Array): Float32Array {
    const inverted = new Float32Array(depthMap.length);
    
    for (let i = 0; i < depthMap.length; i++) {
      inverted[i] = 1 - depthMap[i];
    }
    
    return inverted;
  }
  
  /**
   * Normalize depth map to specified range
   */
  private normalizeDepthMap(depthMap: Float32Array): Float32Array {
    const [minDepth, maxDepth] = this.options.depthRange;
    const normalized = new Float32Array(depthMap.length);
    
    // Find current min/max
    let min = Infinity;
    let max = -Infinity;
    
    for (let i = 0; i < depthMap.length; i++) {
      min = Math.min(min, depthMap[i]);
      max = Math.max(max, depthMap[i]);
    }
    
    // Normalize to target range
    const range = max - min;
    const targetRange = maxDepth - minDepth;
    
    for (let i = 0; i < depthMap.length; i++) {
      if (range > 0) {
        normalized[i] = ((depthMap[i] - min) / range) * targetRange + minDepth;
      } else {
        normalized[i] = minDepth;
      }
    }
    
    return normalized;
  }
  
  /**
   * Get depth value at specific pixel
   */
  getDepthAt(depthMap: Float32Array, x: number, y: number, width: number): number {
    return depthMap[y * width + x];
  }
}
