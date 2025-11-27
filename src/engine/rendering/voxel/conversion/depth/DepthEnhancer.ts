/**
 * Depth Enhancer
 * 
 * Post-processes depth maps to improve quality.
 * Applies various enhancement techniques.
 * 
 * Features:
 * - Bilateral filtering (edge-preserving smoothing)
 * - Contrast enhancement
 * - Depth completion (fill holes)
 * - Multi-scale refinement
 */

/**
 * Enhancement options
 */
export interface DepthEnhancementOptions {
  /** Apply bilateral filtering */
  bilateralFilter?: boolean;
  
  /** Bilateral filter strength */
  bilateralStrength?: number;
  
  /** Enhance contrast */
  enhanceContrast?: boolean;
  
  /** Contrast amount */
  contrastAmount?: number;
  
  /** Fill holes/gaps */
  fillHoles?: boolean;
  
  /** Sharpen depth boundaries */
  sharpen?: boolean;
  
  /** Sharpen amount */
  sharpenAmount?: number;
}

/**
 * Depth enhancer class
 */
export class DepthEnhancer {
  private options: Required<DepthEnhancementOptions>;
  
  constructor(options: DepthEnhancementOptions = {}) {
    this.options = {
      bilateralFilter: options.bilateralFilter ?? true,
      bilateralStrength: options.bilateralStrength ?? 0.5,
      enhanceContrast: options.enhanceContrast ?? true,
      contrastAmount: options.contrastAmount ?? 1.5,
      fillHoles: options.fillHoles ?? true,
      sharpen: options.sharpen ?? false,
      sharpenAmount: options.sharpenAmount ?? 0.5
    };
  }
  
  /**
   * Enhance depth map
   */
  enhance(depthMap: Float32Array, width: number, height: number): Float32Array {
    let enhanced = new Float32Array(depthMap);
    
    // Step 1: Fill holes
    if (this.options.fillHoles) {
      enhanced = this.fillHoles(enhanced, width, height);
    }
    
    // Step 2: Bilateral filtering (edge-preserving smoothing)
    if (this.options.bilateralFilter) {
      enhanced = this.bilateralFilter(enhanced, width, height);
    }
    
    // Step 3: Enhance contrast
    if (this.options.enhanceContrast) {
      enhanced = this.enhanceContrast(enhanced);
    }
    
    // Step 4: Sharpen
    if (this.options.sharpen) {
      enhanced = this.sharpen(enhanced, width, height);
    }
    
    return enhanced;
  }
  
  /**
   * Bilateral filter (edge-preserving smoothing)
   */
  private bilateralFilter(depthMap: Float32Array, width: number, height: number): Float32Array {
    const filtered = new Float32Array(depthMap.length);
    const radius = 2;
    const sigmaSpace = 2.0;
    const sigmaRange = 0.1;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const centerIdx = y * width + x;
        const centerDepth = depthMap[centerIdx];
        
        let sum = 0;
        let weightSum = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const idx = ny * width + nx;
              const depth = depthMap[idx];
              
              // Spatial weight (Gaussian)
              const spatialDist = dx * dx + dy * dy;
              const spatialWeight = Math.exp(-spatialDist / (2 * sigmaSpace * sigmaSpace));
              
              // Range weight (depth similarity)
              const rangeDist = (depth - centerDepth) * (depth - centerDepth);
              const rangeWeight = Math.exp(-rangeDist / (2 * sigmaRange * sigmaRange));
              
              const weight = spatialWeight * rangeWeight;
              
              sum += depth * weight;
              weightSum += weight;
            }
          }
        }
        
        filtered[centerIdx] = weightSum > 0 ? sum / weightSum : centerDepth;
      }
    }
    
    return filtered;
  }
  
  /**
   * Enhance contrast
   */
  private enhanceContrast(depthMap: Float32Array): Float32Array {
    const enhanced = new Float32Array(depthMap.length);
    const amount = this.options.contrastAmount;
    
    for (let i = 0; i < depthMap.length; i++) {
      // Apply S-curve for contrast
      const normalized = depthMap[i];
      const contrasted = ((normalized - 0.5) * amount + 0.5);
      enhanced[i] = Math.max(0, Math.min(1, contrasted));
    }
    
    return enhanced;
  }
  
  /**
   * Fill holes in depth map
   */
  private fillHoles(depthMap: Float32Array, width: number, height: number): Float32Array {
    const filled = new Float32Array(depthMap);
    const maxIterations = 5;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let changed = false;
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          
          // If this is a hole (zero or very low depth)
          if (filled[idx] < 0.01) {
            // Fill with average of valid neighbors
            let sum = 0;
            let count = 0;
            
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nIdx = (y + dy) * width + (x + dx);
                if (filled[nIdx] > 0.01) {
                  sum += filled[nIdx];
                  count++;
                }
              }
            }
            
            if (count > 0) {
              filled[idx] = sum / count;
              changed = true;
            }
          }
        }
      }
      
      if (!changed) break;
    }
    
    return filled;
  }
  
  /**
   * Sharpen depth map
   */
  private sharpen(depthMap: Float32Array, width: number, height: number): Float32Array {
    const sharpened = new Float32Array(depthMap.length);
    const amount = this.options.sharpenAmount;
    
    // Unsharp mask kernel
    const kernel = [
      0, -amount, 0,
      -amount, 1 + 4 * amount, -amount,
      0, -amount, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        
        sum += depthMap[(y - 1) * width + x] * kernel[1];
        sum += depthMap[y * width + (x - 1)] * kernel[3];
        sum += depthMap[y * width + x] * kernel[4];
        sum += depthMap[y * width + (x + 1)] * kernel[5];
        sum += depthMap[(y + 1) * width + x] * kernel[7];
        
        sharpened[y * width + x] = Math.max(0, Math.min(1, sum));
      }
    }
    
    // Copy edges
    for (let x = 0; x < width; x++) {
      sharpened[x] = depthMap[x];
      sharpened[(height - 1) * width + x] = depthMap[(height - 1) * width + x];
    }
    
    for (let y = 0; y < height; y++) {
      sharpened[y * width] = depthMap[y * width];
      sharpened[y * width + width - 1] = depthMap[y * width + width - 1];
    }
    
    return sharpened;
  }
  
  /**
   * Apply guided filter (edge-aware smoothing)
   */
  guidedFilter(
    depthMap: Float32Array,
    guide: Float32Array,
    width: number,
    height: number,
    radius: number = 4,
    epsilon: number = 0.01
  ): Float32Array {
    // Simplified guided filter
    const filtered = new Float32Array(depthMap.length);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        let sumDepth = 0;
        let sumGuide = 0;
        let sumGuideDepth = 0;
        let sumGuideSquared = 0;
        let count = 0;
        
        // Calculate local statistics
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              const d = depthMap[nIdx];
              const g = guide[nIdx];
              
              sumDepth += d;
              sumGuide += g;
              sumGuideDepth += g * d;
              sumGuideSquared += g * g;
              count++;
            }
          }
        }
        
        // Calculate filter coefficients
        const meanDepth = sumDepth / count;
        const meanGuide = sumGuide / count;
        const meanGuideDepth = sumGuideDepth / count;
        const meanGuideSquared = sumGuideSquared / count;
        
        const varGuide = meanGuideSquared - meanGuide * meanGuide;
        const covGuideDepth = meanGuideDepth - meanGuide * meanDepth;
        
        const a = covGuideDepth / (varGuide + epsilon);
        const b = meanDepth - a * meanGuide;
        
        filtered[idx] = a * guide[idx] + b;
      }
    }
    
    return filtered;
  }
  
  /**
   * Normalize depth map to 0-1 range
   */
  normalize(depthMap: Float32Array): Float32Array {
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
