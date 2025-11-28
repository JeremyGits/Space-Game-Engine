/**
 * Color Feature Extraction
 * Extracts color-based features from images
 */

import type { ColorFeatures } from '../../../types/cv/FeatureTypes';

export class ColorFeatureExtractor {
  /**
   * Extract all color features from an image region
   */
  static extract(image: any, mask: any | null, cv: any): ColorFeatures {
    const histogram = this.calculateColorHistogram(image, mask, cv);
    const meanColor = this.calculateMeanColor(image, mask, cv);
    const stdDevColor = this.calculateStdDevColor(image, mask, meanColor, cv);
    const colorVariance = this.calculateColorVariance(stdDevColor);
    const hueHistogram = this.calculateHueHistogram(image, mask, cv);
    const { saturationMean, brightnessMean } = this.calculateHSVStats(image, mask, cv);
    const dominantColor = this.findDominantColor(histogram);
    
    return {
      dominantColor,
      colorHistogram: histogram,
      meanColor,
      stdDevColor,
      colorVariance,
      hueHistogram,
      saturationMean,
      brightnessMean,
    };
  }
  
  /**
   * Calculate RGB color histogram (8 bins per channel = 512 total bins)
   */
  private static calculateColorHistogram(image: any, mask: any | null, cv: any): number[] {
    const histSize = [8, 8, 8]; // 8 bins per channel
    const ranges = [0, 256, 0, 256, 0, 256];
    const channels = [0, 1, 2];
    
    const hist = new cv.Mat();
    const imageVec = new cv.MatVector();
    imageVec.push_back(image);
    
    cv.calcHist(
      imageVec,
      channels,
      mask || new cv.Mat(),
      hist,
      histSize,
      ranges
    );
    
    // Normalize histogram
    cv.normalize(hist, hist, 0, 1, cv.NORM_MINMAX);
    
    // Convert to array
    const histArray: number[] = [];
    for (let i = 0; i < hist.rows; i++) {
      histArray.push(hist.data32F[i]);
    }
    
    hist.delete();
    imageVec.delete();
    
    return histArray;
  }
  
  /**
   * Calculate mean color (average RGB)
   */
  private static calculateMeanColor(image: any, mask: any | null, cv: any): [number, number, number] {
    const mean = cv.mean(image, mask || new cv.Mat());
    return [mean[0], mean[1], mean[2]];
  }
  
  /**
   * Calculate standard deviation of colors
   */
  private static calculateStdDevColor(
    image: any,
    mask: any | null,
    meanColor: [number, number, number],
    cv: any
  ): [number, number, number] {
    const meanMat = new cv.Mat(image.rows, image.cols, image.type(), meanColor);
    const diff = new cv.Mat();
    const diffSquared = new cv.Mat();
    
    cv.subtract(image, meanMat, diff, mask || new cv.Mat());
    cv.multiply(diff, diff, diffSquared);
    
    const variance = cv.mean(diffSquared, mask || new cv.Mat());
    const stdDev: [number, number, number] = [
      Math.sqrt(variance[0]),
      Math.sqrt(variance[1]),
      Math.sqrt(variance[2]),
    ];
    
    meanMat.delete();
    diff.delete();
    diffSquared.delete();
    
    return stdDev;
  }
  
  /**
   * Calculate overall color variance
   */
  private static calculateColorVariance(stdDev: [number, number, number]): number {
    return (stdDev[0] + stdDev[1] + stdDev[2]) / 3;
  }
  
  /**
   * Calculate hue histogram (HSV color space)
   */
  private static calculateHueHistogram(image: any, mask: any | null, cv: any): number[] {
    const hsv = new cv.Mat();
    cv.cvtColor(image, hsv, cv.COLOR_RGB2HSV);
    
    const histSize = [18]; // 18 bins for hue (0-180 degrees)
    const ranges = [0, 180];
    const channels = [0]; // Hue channel
    
    const hist = new cv.Mat();
    const hsvVec = new cv.MatVector();
    hsvVec.push_back(hsv);
    
    cv.calcHist(
      hsvVec,
      channels,
      mask || new cv.Mat(),
      hist,
      histSize,
      ranges
    );
    
    cv.normalize(hist, hist, 0, 1, cv.NORM_MINMAX);
    
    const histArray: number[] = [];
    for (let i = 0; i < hist.rows; i++) {
      histArray.push(hist.data32F[i]);
    }
    
    hsv.delete();
    hist.delete();
    hsvVec.delete();
    
    return histArray;
  }
  
  /**
   * Calculate mean saturation and brightness (HSV)
   */
  private static calculateHSVStats(image: any, mask: any | null, cv: any): {
    saturationMean: number;
    brightnessMean: number;
  } {
    const hsv = new cv.Mat();
    cv.cvtColor(image, hsv, cv.COLOR_RGB2HSV);
    
    const mean = cv.mean(hsv, mask || new cv.Mat());
    
    hsv.delete();
    
    return {
      saturationMean: mean[1], // S channel
      brightnessMean: mean[2], // V channel
    };
  }
  
  /**
   * Find dominant color from histogram
   */
  private static findDominantColor(histogram: number[]): [number, number, number] {
    // Find peak in histogram
    let maxVal = 0;
    let maxIdx = 0;
    
    for (let i = 0; i < histogram.length; i++) {
      if (histogram[i] > maxVal) {
        maxVal = histogram[i];
        maxIdx = i;
      }
    }
    
    // Convert bin index back to RGB (8x8x8 bins)
    const r = ((maxIdx >> 6) & 0x7) * 32 + 16; // Red: bits 6-8
    const g = ((maxIdx >> 3) & 0x7) * 32 + 16; // Green: bits 3-5
    const b = (maxIdx & 0x7) * 32 + 16;        // Blue: bits 0-2
    
    return [r, g, b];
  }
  
  /**
   * Extract color features from canvas
   */
  static extractFromCanvas(canvas: HTMLCanvasElement, cv: any): ColorFeatures {
    const image = cv.imread(canvas);
    const features = this.extract(image, null, cv);
    image.delete();
    return features;
  }
  
  /**
   * Compare two color feature sets
   */
  static compare(features1: ColorFeatures, features2: ColorFeatures): number {
    // Compare histograms using correlation
    let correlation = 0;
    const len = Math.min(features1.colorHistogram.length, features2.colorHistogram.length);
    
    for (let i = 0; i < len; i++) {
      correlation += features1.colorHistogram[i] * features2.colorHistogram[i];
    }
    
    // Compare dominant colors
    const colorDist = this.colorDistance(features1.dominantColor, features2.dominantColor);
    const colorSimilarity = 1 - colorDist / 441.67; // Max distance in RGB space
    
    // Weighted combination
    return correlation * 0.7 + colorSimilarity * 0.3;
  }
  
  private static colorDistance(c1: [number, number, number], c2: [number, number, number]): number {
    const dr = c1[0] - c2[0];
    const dg = c1[1] - c2[1];
    const db = c1[2] - c2[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }
}
