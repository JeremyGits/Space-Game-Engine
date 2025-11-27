/**
 * Gradient-Based Depth Extraction
 * 
 * Extracts depth using color gradients and transitions.
 * Good for smooth surfaces and organic shapes.
 * 
 * Algorithm:
 * - Calculate color gradients (dx, dy)
 * - Higher gradient = More depth variation
 * - Smooth transitions = Gradual depth changes
 */

/**
 * Gradient depth options
 */
export interface GradientDepthOptions {
  /** Gradient strength multiplier */
  strength?: number;
  
  /** Smoothing kernel size */
  smoothing?: number;
  
  /** Gradient threshold (ignore small gradients) */
  threshold?: number;
  
  /** Use magnitude or directional gradients */
  useMagnitude?: boolean;
}

/**
 * Gradient depth extractor
 */
export class GradientDepth {
  private options: Required<GradientDepthOptions>;
  
  constructor(options: GradientDepthOptions = {}) {
    this.options = {
      strength: options.strength ?? 1.0,
      smoothing: options.smoothing ?? 1,
      threshold: options.threshold ?? 0.01,
      useMagnitude: options.useMagnitude ?? true
    };
  }
  
  /**
   * Extract depth from gradients
   */
  extract(imageData: ImageData): Float32Array {
    const { width, height, data } = imageData;
    const depthMap = new Float32Array(width * height);
    
    // First, get luminance
    const luminance = this.getLuminance(imageData);
    
    // Calculate gradients
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Calculate gradients using central differences
        const dx = (luminance[idx + 1] - luminance[idx - 1]) / 2;
        const dy = (luminance[idx + width] - luminance[idx - width]) / 2;
        
        // Calculate gradient magnitude or use directional
        let gradient: number;
        
        if (this.options.useMagnitude) {
          gradient = Math.sqrt(dx * dx + dy * dy);
        } else {
          gradient = Math.abs(dx) + Math.abs(dy);
        }
        
        // Apply threshold
        if (gradient < this.options.threshold) {
          gradient = 0;
        }
        
        // Combine luminance with gradient
        // Higher gradient = more depth detail
        depthMap[idx] = luminance[idx] * (1 + gradient * this.options.strength);
      }
    }
    
    // Handle edges (copy from neighbors)
    this.fillEdges(depthMap, width, height);
    
    // Apply smoothing
    if (this.options.smoothing > 0) {
      return this.smooth(depthMap, width, height);
    }
    
    // Normalize
    return this.normalize(depthMap);
  }
  
  /**
   * Extract using Sobel operator (more accurate)
   */
  extractSobel(imageData: ImageData): Float32Array {
    const { width, height } = imageData;
    const luminance = this.getLuminance(imageData);
    const depthMap = new Float32Array(width * height);
    
    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        // Apply Sobel kernels
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            
            gx += luminance[idx] * sobelX[kernelIdx];
            gy += luminance[idx] * sobelY[kernelIdx];
          }
        }
        
        // Gradient magnitude
        const gradient = Math.sqrt(gx * gx + gy * gy) / 8; // Normalize by kernel sum
        
        const idx = y * width + x;
        depthMap[idx] = luminance[idx] * (1 + gradient * this.options.strength);
      }
    }
    
    this.fillEdges(depthMap, width, height);
    
    if (this.options.smoothing > 0) {
      return this.smooth(depthMap, width, height);
    }
    
    return this.normalize(depthMap);
  }
  
  /**
   * Extract using Scharr operator (better rotation invariance)
   */
  extractScharr(imageData: ImageData): Float32Array {
    const { width, height } = imageData;
    const luminance = this.getLuminance(imageData);
    const depthMap = new Float32Array(width * height);
    
    // Scharr kernels (better than Sobel for rotation)
    const scharrX = [-3, 0, 3, -10, 0, 10, -3, 0, 3];
    const scharrY = [-3, -10, -3, 0, 0, 0, 3, 10, 3];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            
            gx += luminance[idx] * scharrX[kernelIdx];
            gy += luminance[idx] * scharrY[kernelIdx];
          }
        }
        
        const gradient = Math.sqrt(gx * gx + gy * gy) / 32; // Normalize
        
        const idx = y * width + x;
        depthMap[idx] = luminance[idx] * (1 + gradient * this.options.strength);
      }
    }
    
    this.fillEdges(depthMap, width, height);
    
    if (this.options.smoothing > 0) {
      return this.smooth(depthMap, width, height);
    }
    
    return this.normalize(depthMap);
  }
  
  /**
   * Get luminance from image
   */
  private getLuminance(imageData: ImageData): Float32Array {
    const { width, height, data } = imageData;
    const luminance = new Float32Array(width * height);
    
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4] / 255;
      const g = data[i * 4 + 1] / 255;
      const b = data[i * 4 + 2] / 255;
      
      luminance[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    
    return luminance;
  }
  
  /**
   * Fill edge pixels
   */
  private fillEdges(depthMap: Float32Array, width: number, height: number): void {
    // Top and bottom rows
    for (let x = 0; x < width; x++) {
      depthMap[x] = depthMap[width + x];
      depthMap[(height - 1) * width + x] = depthMap[(height - 2) * width + x];
    }
    
    // Left and right columns
    for (let y = 0; y < height; y++) {
      depthMap[y * width] = depthMap[y * width + 1];
      depthMap[y * width + width - 1] = depthMap[y * width + width - 2];
    }
  }
  
  /**
   * Smooth depth map
   */
  private smooth(depthMap: Float32Array, width: number, height: number): Float32Array {
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
   * Normalize depth map to 0-1 range
   */
  private normalize(depthMap: Float32Array): Float32Array {
    let min = Infinity;
    let max = -Infinity;
    
    for (let i = 0; i < depthMap.length; i++) {
      min = Math.min(min, depthMap[i]);
      max = Math.max(max, depthMap[i]);
    }
    
    const range = max - min;
    const normalized = new Float32Array(depthMap.length);
    
    if (range > 0) {
      for (let i = 0; i < depthMap.length; i++) {
        normalized[i] = (depthMap[i] - min) / range;
      }
    }
    
    return normalized;
  }
}
