/**
 * Main Feature Extractor
 * Orchestrates extraction of all feature types
 */

import type {
  ImageFeatures,
  FeatureExtractionConfig,
  FeatureExtractionResult,
  StatisticalFeatures,
} from '../../../types/cv/FeatureTypes';
import { ShapeFeatureExtractor } from './ShapeFeatures';
import { ColorFeatureExtractor } from './ColorFeatures';
import { TextureFeatureExtractor } from './TextureFeatures';
import { GeometricFeatureExtractor } from './GeometricFeatures';

export class FeatureExtractor {
  private config: FeatureExtractionConfig;
  
  constructor(config: Partial<FeatureExtractionConfig> = {}) {
    this.config = {
      extractShape: true,
      extractColor: true,
      extractTexture: true,
      extractGeometric: true,
      extractStatistical: true,
      normalizeFeatures: true,
      featureReduction: false,
      ...config,
    };
  }
  
  /**
   * Extract all features from an image region
   */
  async extract(
    image: any,
    contour: any | null,
    mask: any | null,
    cv: any
  ): Promise<FeatureExtractionResult> {
    const startTime = performance.now();
    
    const features: ImageFeatures = {
      shape: this.config.extractShape && contour
        ? ShapeFeatureExtractor.extractFromContour(contour, cv)
        : this.getDefaultShapeFeatures(),
      
      color: this.config.extractColor
        ? ColorFeatureExtractor.extract(image, mask, cv)
        : this.getDefaultColorFeatures(),
      
      texture: this.config.extractTexture
        ? TextureFeatureExtractor.extract(image, mask, cv)
        : this.getDefaultTextureFeatures(),
      
      geometric: this.config.extractGeometric && contour
        ? GeometricFeatureExtractor.extractFromContour(contour, cv)
        : this.getDefaultGeometricFeatures(),
      
      statistical: this.config.extractStatistical
        ? this.extractStatisticalFeatures(image, mask, cv)
        : this.getDefaultStatisticalFeatures(),
    };
    
    const processingTime = performance.now() - startTime;
    
    return {
      features,
      keypoints: [], // Can be extended with ORB/SIFT keypoints
      descriptors: [],
      processingTime,
      method: 'comprehensive',
    };
  }
  
  /**
   * Extract features from canvas element
   */
  async extractFromCanvas(
    canvas: HTMLCanvasElement,
    cv: any
  ): Promise<FeatureExtractionResult> {
    const image = cv.imread(canvas);
    
    // Find contour for shape/geometric features
    const gray = new cv.Mat();
    const binary = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    
    cv.cvtColor(image, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, binary, 127, 255, cv.THRESH_BINARY);
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    const contour = contours.size() > 0 ? contours.get(0) : null;
    const result = await this.extract(image, contour, null, cv);
    
    // Cleanup
    image.delete();
    gray.delete();
    binary.delete();
    if (contour) contour.delete();
    contours.delete();
    hierarchy.delete();
    
    return result;
  }
  
  /**
   * Extract statistical features from image
   */
  private extractStatisticalFeatures(image: any, mask: any | null, cv: any): StatisticalFeatures {
    // Convert to grayscale for statistical analysis
    const gray = new cv.Mat();
    if (image.channels() === 1) {
      image.copyTo(gray);
    } else {
      cv.cvtColor(image, gray, cv.COLOR_RGB2GRAY);
    }
    
    // Calculate mean and std dev
    const meanStdDev = new cv.Mat();
    cv.meanStdDev(gray, meanStdDev, new cv.Mat(), mask || new cv.Mat());
    const mean = meanStdDev.data64F[0];
    const stdDev = meanStdDev.data64F[1];
    
    // Calculate min/max
    const minMax = cv.minMaxLoc(gray, mask || new cv.Mat());
    const min = minMax.minVal;
    const max = minMax.maxVal;
    const range = max - min;
    
    // Calculate histogram for median and mode
    const hist = new cv.Mat();
    const histSize = [256];
    const ranges = [0, 256];
    const channels = [0];
    const grayVec = new cv.MatVector();
    grayVec.push_back(gray);
    
    cv.calcHist(grayVec, channels, mask || new cv.Mat(), hist, histSize, ranges);
    
    const { median, mode } = this.calculateMedianMode(hist);
    const { skewness, kurtosis } = this.calculateMoments(gray, mean, stdDev, cv);
    
    // Cleanup
    gray.delete();
    meanStdDev.delete();
    hist.delete();
    grayVec.delete();
    
    return {
      mean,
      median,
      mode,
      stdDev,
      variance: stdDev * stdDev,
      skewness,
      kurtosis,
      min,
      max,
      range,
    };
  }
  
  /**
   * Calculate median and mode from histogram
   */
  private calculateMedianMode(hist: any): { median: number; mode: number } {
    const histData = hist.data32F;
    let total = 0;
    let maxCount = 0;
    let mode = 0;
    
    // Find total and mode
    for (let i = 0; i < 256; i++) {
      total += histData[i];
      if (histData[i] > maxCount) {
        maxCount = histData[i];
        mode = i;
      }
    }
    
    // Find median
    let cumulative = 0;
    let median = 0;
    const halfTotal = total / 2;
    
    for (let i = 0; i < 256; i++) {
      cumulative += histData[i];
      if (cumulative >= halfTotal) {
        median = i;
        break;
      }
    }
    
    return { median, mode };
  }
  
  /**
   * Calculate skewness and kurtosis
   */
  private calculateMoments(gray: any, mean: number, stdDev: number, cv: any): {
    skewness: number;
    kurtosis: number;
  } {
    if (stdDev === 0) {
      return { skewness: 0, kurtosis: 0 };
    }
    
    const data = gray.data;
    const n = data.length;
    
    let m3 = 0; // Third moment
    let m4 = 0; // Fourth moment
    
    for (let i = 0; i < n; i++) {
      const deviation = (data[i] - mean) / stdDev;
      m3 += Math.pow(deviation, 3);
      m4 += Math.pow(deviation, 4);
    }
    
    const skewness = m3 / n;
    const kurtosis = m4 / n - 3; // Excess kurtosis
    
    return { skewness, kurtosis };
  }
  
  /**
   * Create feature vector from ImageFeatures
   */
  createFeatureVector(features: ImageFeatures): number[] {
    const vector: number[] = [];
    
    // Shape features (7 values)
    if (this.config.extractShape) {
      vector.push(
        features.shape.circularity,
        features.shape.rectangularity,
        features.shape.convexity,
        features.shape.symmetry,
        features.shape.compactness,
        features.shape.elongation,
        features.shape.eccentricity
      );
    }
    
    // Color features (dominant color + stats)
    if (this.config.extractColor) {
      vector.push(
        ...features.color.dominantColor.map(v => v / 255),
        ...features.color.meanColor.map(v => v / 255),
        features.color.colorVariance / 255,
        features.color.saturationMean / 255,
        features.color.brightnessMean / 255
      );
    }
    
    // Texture features (GLCM features)
    if (this.config.extractTexture) {
      vector.push(
        features.texture.contrast,
        features.texture.homogeneity,
        features.texture.energy,
        features.texture.correlation,
        features.texture.entropy
      );
    }
    
    // Geometric features
    if (this.config.extractGeometric) {
      vector.push(
        features.geometric.boundingBox.aspectRatio,
        features.geometric.orientation / 180, // Normalize to 0-1
        ...Object.values(features.geometric.moments) // Hu moments
      );
    }
    
    // Statistical features
    if (this.config.extractStatistical) {
      vector.push(
        features.statistical.mean / 255,
        features.statistical.stdDev / 255,
        features.statistical.skewness,
        features.statistical.kurtosis
      );
    }
    
    // Normalize if requested
    if (this.config.normalizeFeatures) {
      return this.normalizeVector(vector);
    }
    
    return vector;
  }
  
  /**
   * Normalize feature vector to unit length
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) return vector;
    return vector.map(v => v / magnitude);
  }
  
  /**
   * Compare two feature sets
   */
  compare(features1: ImageFeatures, features2: ImageFeatures): number {
    let totalSimilarity = 0;
    let count = 0;
    
    if (this.config.extractShape) {
      totalSimilarity += this.compareShapeFeatures(features1.shape, features2.shape);
      count++;
    }
    
    if (this.config.extractColor) {
      totalSimilarity += ColorFeatureExtractor.compare(features1.color, features2.color);
      count++;
    }
    
    if (this.config.extractTexture) {
      totalSimilarity += TextureFeatureExtractor.compare(features1.texture, features2.texture);
      count++;
    }
    
    if (this.config.extractGeometric) {
      totalSimilarity += GeometricFeatureExtractor.compare(features1.geometric, features2.geometric);
      count++;
    }
    
    return count > 0 ? totalSimilarity / count : 0;
  }
  
  /**
   * Compare shape features
   */
  private compareShapeFeatures(shape1: any, shape2: any): number {
    const features = ['circularity', 'rectangularity', 'convexity', 'symmetry', 'elongation'];
    let similarity = 0;
    
    for (const feature of features) {
      const diff = Math.abs(shape1[feature] - shape2[feature]);
      similarity += 1 - diff;
    }
    
    return similarity / features.length;
  }
  
  // Default feature getters
  private getDefaultShapeFeatures() {
    return {
      circularity: 0,
      rectangularity: 0,
      convexity: 0,
      symmetry: 0,
      compactness: 0,
      elongation: 1,
      eccentricity: 0,
    };
  }
  
  private getDefaultColorFeatures() {
    return {
      dominantColor: [0, 0, 0] as [number, number, number],
      colorHistogram: [],
      meanColor: [0, 0, 0] as [number, number, number],
      stdDevColor: [0, 0, 0] as [number, number, number],
      colorVariance: 0,
      hueHistogram: [],
      saturationMean: 0,
      brightnessMean: 0,
    };
  }
  
  private getDefaultTextureFeatures() {
    return {
      contrast: 0,
      homogeneity: 0,
      energy: 0,
      correlation: 0,
      entropy: 0,
      glcmMatrix: [],
      lbpHistogram: [],
      gaborResponses: [],
    };
  }
  
  private getDefaultGeometricFeatures() {
    return {
      area: 0,
      perimeter: 0,
      boundingBox: { width: 0, height: 0, aspectRatio: 1 },
      centroid: { x: 0, y: 0 },
      orientation: 0,
      majorAxisLength: 0,
      minorAxisLength: 0,
      moments: {
        hu1: 0, hu2: 0, hu3: 0, hu4: 0, hu5: 0, hu6: 0, hu7: 0,
      },
    };
  }
  
  private getDefaultStatisticalFeatures(): StatisticalFeatures {
    return {
      mean: 0,
      median: 0,
      mode: 0,
      stdDev: 0,
      variance: 0,
      skewness: 0,
      kurtosis: 0,
      min: 0,
      max: 0,
      range: 0,
    };
  }
}
