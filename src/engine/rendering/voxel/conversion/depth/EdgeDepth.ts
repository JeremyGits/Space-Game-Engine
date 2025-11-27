/**
 * Edge-Based Depth Extraction
 * 
 * Extracts depth using edge detection algorithms.
 * Excellent for hard surfaces and detailed geometry.
 * 
 * Algorithm:
 * - Detect edges using Canny/Sobel
 * - Edges = Depth boundaries (closer)
 * - Flat areas = Background (farther)
 */

/**
 * Edge depth options
 */
export interface EdgeDepthOptions {
  /** Edge detection threshold (0-1) */
  threshold?: number;
  
  /** Edge strength multiplier */
  edgeStrength?: number;
  
  /** Blur before edge detection */
  preBlur?: number;
  
  /** Fill non-edge areas with luminance */
  fillWithLuminance?: boolean;
}

/**
 * Edge depth extractor
 */
export class EdgeDepth {
  private options: Required<EdgeDepthOptions>;
  
  constructor(options: EdgeDepthOptions = {}) {
    this.options = {
      threshold: options.threshold ?? 0.1,
      edgeStrength: options.edgeStrength ?? 0.8,
      preBlur: options.preBlur ?? 1,
      fillWithLuminance: options.fillWithLuminance ?? true
    };
  }
  
  /**
   * Extract depth from edges
   */
  extract(imageData: ImageData): Float32Array {
    const { width, height } = imageData;
    
    // Get luminance
    let luminance = this.getLuminance(imageData);
    
    // Apply pre-blur if requested
    if (this.options.preBlur > 0) {
      luminance = this.blur(luminance, width, height, this.options.preBlur);
    }
    
    // Detect edges
    const edges = this.detectEdges(luminance, width, height);
    
    // Create depth map
    const depthMap = new Float32Array(width * height);
    
    for (let i = 0; i < width * height; i++) {
      if (edges[i] > this.options.threshold) {
        // Edge pixel = closer
        depthMap[i] = this.options.edgeStrength;
      } else if (this.options.fillWithLuminance) {
        // Non-edge = use luminance
        depthMap[i] = luminance[i] * (1 - this.options.edgeStrength);
      } else {
        // Non-edge = far
        depthMap[i] = 0.2;
      }
    }
    
    return depthMap;
  }
  
  /**
   * Extract using Canny edge detection
   */
  extractCanny(imageData: ImageData): Float32Array {
    const { width, height } = imageData;
    let luminance = this.getLuminance(imageData);
    
    // Step 1: Gaussian blur
    luminance = this.gaussianBlur(luminance, width, height);
    
    // Step 2: Calculate gradients
    const { magnitude, direction } = this.calculateGradients(luminance, width, height);
    
    // Step 3: Non-maximum suppression
    const suppressed = this.nonMaximumSuppression(magnitude, direction, width, height);
    
    // Step 4: Double threshold
    const edges = this.doubleThreshold(suppressed, this.options.threshold, this.options.threshold * 2);
    
    // Step 5: Edge tracking by hysteresis
    const final = this.hysteresis(edges, width, height);
    
    // Create depth map
    const depthMap = new Float32Array(width * height);
    
    for (let i = 0; i < width * height; i++) {
      if (final[i] > 0) {
        depthMap[i] = this.options.edgeStrength;
      } else if (this.options.fillWithLuminance) {
        depthMap[i] = luminance[i] * (1 - this.options.edgeStrength);
      } else {
        depthMap[i] = 0.2;
      }
    }
    
    return depthMap;
  }
  
  /**
   * Get luminance
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
   * Detect edges using Sobel
   */
  private detectEdges(luminance: Float32Array, width: number, height: number): Float32Array {
    const edges = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        // Sobel kernels
        const gx = 
          -luminance[(y - 1) * width + (x - 1)] + luminance[(y - 1) * width + (x + 1)] +
          -2 * luminance[y * width + (x - 1)] + 2 * luminance[y * width + (x + 1)] +
          -luminance[(y + 1) * width + (x - 1)] + luminance[(y + 1) * width + (x + 1)];
        
        const gy =
          -luminance[(y - 1) * width + (x - 1)] - 2 * luminance[(y - 1) * width + x] - luminance[(y - 1) * width + (x + 1)] +
          luminance[(y + 1) * width + (x - 1)] + 2 * luminance[(y + 1) * width + x] + luminance[(y + 1) * width + (x + 1)];
        
        edges[y * width + x] = Math.sqrt(gx * gx + gy * gy) / 8;
      }
    }
    
    return edges;
  }
  
  /**
   * Gaussian blur
   */
  private gaussianBlur(data: Float32Array, width: number, height: number): Float32Array {
    // Simple 3x3 Gaussian kernel
    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    const kernelSum = 16;
    
    const blurred = new Float32Array(data.length);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kernelIdx];
          }
        }
        
        blurred[y * width + x] = sum / kernelSum;
      }
    }
    
    return blurred;
  }
  
  /**
   * Calculate gradients
   */
  private calculateGradients(
    luminance: Float32Array,
    width: number,
    height: number
  ): { magnitude: Float32Array; direction: Float32Array } {
    const magnitude = new Float32Array(width * height);
    const direction = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const gx = luminance[y * width + (x + 1)] - luminance[y * width + (x - 1)];
        const gy = luminance[(y + 1) * width + x] - luminance[(y - 1) * width + x];
        
        const idx = y * width + x;
        magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
        direction[idx] = Math.atan2(gy, gx);
      }
    }
    
    return { magnitude, direction };
  }
  
  /**
   * Non-maximum suppression
   */
  private nonMaximumSuppression(
    magnitude: Float32Array,
    direction: Float32Array,
    width: number,
    height: number
  ): Float32Array {
    const suppressed = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const angle = direction[idx];
        const mag = magnitude[idx];
        
        // Quantize angle to 0, 45, 90, 135 degrees
        const quantized = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        
        // Check neighbors along gradient direction
        let neighbor1 = 0, neighbor2 = 0;
        
        if (Math.abs(quantized) < Math.PI / 8) {
          // Horizontal
          neighbor1 = magnitude[idx - 1];
          neighbor2 = magnitude[idx + 1];
        } else if (Math.abs(quantized - Math.PI / 2) < Math.PI / 8) {
          // Vertical
          neighbor1 = magnitude[idx - width];
          neighbor2 = magnitude[idx + width];
        }
        
        // Suppress if not local maximum
        if (mag >= neighbor1 && mag >= neighbor2) {
          suppressed[idx] = mag;
        }
      }
    }
    
    return suppressed;
  }
  
  /**
   * Double threshold
   */
  private doubleThreshold(
    magnitude: Float32Array,
    lowThreshold: number,
    highThreshold: number
  ): Float32Array {
    const result = new Float32Array(magnitude.length);
    
    for (let i = 0; i < magnitude.length; i++) {
      if (magnitude[i] >= highThreshold) {
        result[i] = 1.0; // Strong edge
      } else if (magnitude[i] >= lowThreshold) {
        result[i] = 0.5; // Weak edge
      }
    }
    
    return result;
  }
  
  /**
   * Edge tracking by hysteresis
   */
  private hysteresis(edges: Float32Array, width: number, height: number): Float32Array {
    const result = new Float32Array(edges.length);
    
    // Copy strong edges
    for (let i = 0; i < edges.length; i++) {
      if (edges[i] === 1.0) {
        result[i] = 1.0;
      }
    }
    
    // Connect weak edges to strong edges
    let changed = true;
    while (changed) {
      changed = false;
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          
          if (edges[idx] === 0.5 && result[idx] === 0) {
            // Check if connected to strong edge
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (result[(y + dy) * width + (x + dx)] === 1.0) {
                  result[idx] = 1.0;
                  changed = true;
                  break;
                }
              }
              if (changed) break;
            }
          }
        }
      }
    }
    
    return result;
  }
  
  /**
   * Box blur
   */
  private blur(data: Float32Array, width: number, height: number, radius: number): Float32Array {
    const blurred = new Float32Array(data.length);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              sum += data[ny * width + nx];
              count++;
            }
          }
        }
        
        blurred[y * width + x] = sum / count;
      }
    }
    
    return blurred;
  }
}
