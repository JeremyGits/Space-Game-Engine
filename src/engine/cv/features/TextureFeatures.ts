/**
 * Texture Feature Extraction
 * Extracts texture-based features using GLCM (Gray-Level Co-occurrence Matrix)
 * and other texture analysis methods
 */

import type { TextureFeatures } from '../../../types/cv/FeatureTypes';

export class TextureFeatureExtractor {
  /**
   * Extract all texture features from an image region
   */
  static extract(image: any, mask: any | null, cv: any): TextureFeatures {
    // Convert to grayscale for texture analysis
    const gray = new cv.Mat();
    if (image.channels() === 1) {
      gray.copyTo(image);
    } else {
      cv.cvtColor(image, gray, cv.COLOR_RGB2GRAY);
    }
    
    // Calculate GLCM and derive features
    const glcmMatrix = this.calculateGLCM(gray, cv);
    const glcmFeatures = this.extractGLCMFeatures(glcmMatrix);
    
    // Calculate LBP (Local Binary Pattern) histogram
    const lbpHistogram = this.calculateLBP(gray, cv);
    
    // Calculate Gabor filter responses (simplified)
    const gaborResponses = this.calculateGaborResponses(gray, cv);
    
    gray.delete();
    
    return {
      contrast: glcmFeatures.contrast,
      homogeneity: glcmFeatures.homogeneity,
      energy: glcmFeatures.energy,
      correlation: glcmFeatures.correlation,
      entropy: glcmFeatures.entropy,
      glcmMatrix,
      lbpHistogram,
      gaborResponses,
    };
  }
  
  /**
   * Calculate Gray-Level Co-occurrence Matrix (GLCM)
   * Simplified version for web performance
   */
  private static calculateGLCM(gray: any, cv: any): number[][] {
    const levels = 8; // Reduce gray levels for performance (256 → 8)
    const glcm: number[][] = Array(levels).fill(0).map(() => Array(levels).fill(0));
    
    // Quantize image to fewer gray levels
    const quantized = new cv.Mat();
    gray.convertTo(quantized, cv.CV_8U, levels / 256);
    
    const data = quantized.data;
    const width = quantized.cols;
    const height = quantized.rows;
    
    // Calculate co-occurrence for horizontal pairs (offset = [1, 0])
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width - 1; x++) {
        const idx = y * width + x;
        const i = Math.min(data[idx], levels - 1);
        const j = Math.min(data[idx + 1], levels - 1);
        glcm[i][j]++;
      }
    }
    
    // Normalize GLCM
    let total = 0;
    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        total += glcm[i][j];
      }
    }
    
    if (total > 0) {
      for (let i = 0; i < levels; i++) {
        for (let j = 0; j < levels; j++) {
          glcm[i][j] /= total;
        }
      }
    }
    
    quantized.delete();
    return glcm;
  }
  
  /**
   * Extract Haralick features from GLCM
   */
  private static extractGLCMFeatures(glcm: number[][]): {
    contrast: number;
    homogeneity: number;
    energy: number;
    correlation: number;
    entropy: number;
  } {
    const levels = glcm.length;
    let contrast = 0;
    let homogeneity = 0;
    let energy = 0;
    let entropy = 0;
    
    // Calculate means for correlation
    let meanI = 0;
    let meanJ = 0;
    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        meanI += i * glcm[i][j];
        meanJ += j * glcm[i][j];
      }
    }
    
    // Calculate standard deviations
    let stdI = 0;
    let stdJ = 0;
    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        stdI += glcm[i][j] * Math.pow(i - meanI, 2);
        stdJ += glcm[i][j] * Math.pow(j - meanJ, 2);
      }
    }
    stdI = Math.sqrt(stdI);
    stdJ = Math.sqrt(stdJ);
    
    // Calculate features
    let correlation = 0;
    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        const p = glcm[i][j];
        
        // Contrast: sum of (i-j)² * p(i,j)
        contrast += Math.pow(i - j, 2) * p;
        
        // Homogeneity (Inverse Difference Moment): sum of p(i,j) / (1 + |i-j|)
        homogeneity += p / (1 + Math.abs(i - j));
        
        // Energy (Angular Second Moment): sum of p(i,j)²
        energy += p * p;
        
        // Entropy: -sum of p(i,j) * log(p(i,j))
        if (p > 0) {
          entropy -= p * Math.log(p);
        }
        
        // Correlation
        if (stdI > 0 && stdJ > 0) {
          correlation += ((i - meanI) * (j - meanJ) * p) / (stdI * stdJ);
        }
      }
    }
    
    return {
      contrast,
      homogeneity,
      energy,
      correlation,
      entropy,
    };
  }
  
  /**
   * Calculate Local Binary Pattern (LBP) histogram
   * Simplified uniform LBP for performance
   */
  private static calculateLBP(gray: any, cv: any): number[] {
    const histogram = new Array(256).fill(0);
    const data = gray.data;
    const width = gray.cols;
    const height = gray.rows;
    
    // Calculate LBP for each pixel (excluding borders)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const center = data[y * width + x];
        let lbp = 0;
        
        // 8 neighbors in clockwise order
        const neighbors = [
          data[(y - 1) * width + (x - 1)], // Top-left
          data[(y - 1) * width + x],       // Top
          data[(y - 1) * width + (x + 1)], // Top-right
          data[y * width + (x + 1)],       // Right
          data[(y + 1) * width + (x + 1)], // Bottom-right
          data[(y + 1) * width + x],       // Bottom
          data[(y + 1) * width + (x - 1)], // Bottom-left
          data[y * width + (x - 1)],       // Left
        ];
        
        // Build LBP code
        for (let i = 0; i < 8; i++) {
          if (neighbors[i] >= center) {
            lbp |= (1 << i);
          }
        }
        
        histogram[lbp]++;
      }
    }
    
    // Normalize histogram
    const total = (width - 2) * (height - 2);
    if (total > 0) {
      for (let i = 0; i < 256; i++) {
        histogram[i] /= total;
      }
    }
    
    return histogram;
  }
  
  /**
   * Calculate Gabor filter responses (simplified)
   * Uses 4 orientations for performance
   */
  private static calculateGaborResponses(gray: any, cv: any): number[] {
    const responses: number[] = [];
    const orientations = [0, 45, 90, 135]; // 4 orientations in degrees
    
    for (const angle of orientations) {
      const response = this.applyGaborFilter(gray, angle, cv);
      responses.push(response);
    }
    
    return responses;
  }
  
  /**
   * Apply simplified Gabor filter at given orientation
   */
  private static applyGaborFilter(gray: any, angleDeg: number, cv: any): number {
    // Simplified Gabor using Sobel derivatives
    const dx = new cv.Mat();
    const dy = new cv.Mat();
    
    cv.Sobel(gray, dx, cv.CV_32F, 1, 0, 3);
    cv.Sobel(gray, dy, cv.CV_32F, 0, 1, 3);
    
    // Calculate oriented response
    const angleRad = (angleDeg * Math.PI) / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    
    const oriented = new cv.Mat();
    cv.addWeighted(dx, cosA, dy, sinA, 0, oriented);
    
    // Calculate mean absolute response
    const abs = new cv.Mat();
    cv.convertScaleAbs(oriented, abs);
    const mean = cv.mean(abs);
    const response = mean[0];
    
    dx.delete();
    dy.delete();
    oriented.delete();
    abs.delete();
    
    return response;
  }
  
  /**
   * Extract color features from canvas
   */
  static extractFromCanvas(canvas: HTMLCanvasElement, cv: any): TextureFeatures {
    const image = cv.imread(canvas);
    const features = this.extract(image, null, cv);
    image.delete();
    return features;
  }
  
  /**
   * Compare two texture feature sets
   */
  static compare(features1: TextureFeatures, features2: TextureFeatures): number {
    // Compare GLCM features
    const contrastSim = 1 - Math.abs(features1.contrast - features2.contrast) / Math.max(features1.contrast, features2.contrast, 1);
    const homogeneitySim = 1 - Math.abs(features1.homogeneity - features2.homogeneity);
    const energySim = 1 - Math.abs(features1.energy - features2.energy);
    const correlationSim = 1 - Math.abs(features1.correlation - features2.correlation) / 2;
    const entropySim = 1 - Math.abs(features1.entropy - features2.entropy) / Math.max(features1.entropy, features2.entropy, 1);
    
    // Compare LBP histograms using correlation
    let lbpCorrelation = 0;
    const len = Math.min(features1.lbpHistogram.length, features2.lbpHistogram.length);
    for (let i = 0; i < len; i++) {
      lbpCorrelation += features1.lbpHistogram[i] * features2.lbpHistogram[i];
    }
    
    // Weighted combination
    return (
      contrastSim * 0.15 +
      homogeneitySim * 0.15 +
      energySim * 0.15 +
      correlationSim * 0.15 +
      entropySim * 0.15 +
      lbpCorrelation * 0.25
    );
  }
}
