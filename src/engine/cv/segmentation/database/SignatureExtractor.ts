/**
 * Component Signature Extractor
 * Extracts feature signatures from component regions
 * Creates unique fingerprints for component matching
 */

import type { SegmentedRegion, ComponentSignature, ComponentType } from '../../../../types/cv/SegmentationTypes';

export class SignatureExtractor {
  /**
   * Extract signature from region
   */
  extract(region: SegmentedRegion, type: ComponentType, id: string): ComponentSignature {
    return {
      id,
      type,
      shapeDescriptor: this.extractShapeDescriptor(region),
      colorHistogram: this.extractColorHistogram(region),
      textureDescriptor: this.extractTextureDescriptor(region),
      sizeRange: this.calculateSizeRange(region),
      aspectRatioRange: this.calculateAspectRatioRange(region),
      circularityRange: this.calculateCircularityRange(region),
      examples: [],
    };
  }
  
  /**
   * Extract shape descriptor (geometric features)
   */
  private extractShapeDescriptor(region: SegmentedRegion): number[] {
    return [
      region.properties.solidity,
      region.properties.edgeDensity,
      region.properties.isConvex ? 1 : 0,
      region.area / (region.bounds.width * region.bounds.height), // Fill ratio
      region.bounds.width / region.bounds.height, // Aspect ratio
    ];
  }
  
  /**
   * Extract color histogram (simplified)
   */
  private extractColorHistogram(region: SegmentedRegion): number[] {
    const color = region.properties.meanColor;
    return [
      color.r / 255,
      color.g / 255,
      color.b / 255,
      region.properties.colorVariance,
    ];
  }
  
  /**
   * Extract texture descriptor
   */
  private extractTextureDescriptor(region: SegmentedRegion): number[] {
    return [
      region.properties.textureComplexity,
      region.properties.edgeDensity,
    ];
  }
  
  /**
   * Calculate size range with tolerance
   */
  private calculateSizeRange(region: SegmentedRegion): [number, number] {
    const tolerance = 0.3; // 30% tolerance
    const min = region.area * (1 - tolerance);
    const max = region.area * (1 + tolerance);
    return [min, max];
  }
  
  /**
   * Calculate aspect ratio range
   */
  private calculateAspectRatioRange(region: SegmentedRegion): [number, number] {
    const aspectRatio = region.bounds.width / region.bounds.height;
    const tolerance = 0.2;
    return [
      aspectRatio * (1 - tolerance),
      aspectRatio * (1 + tolerance),
    ];
  }
  
  /**
   * Calculate circularity range
   */
  private calculateCircularityRange(region: SegmentedRegion): [number, number] {
    // Circularity = 4π * area / perimeter²
    // Approximation using solidity
    const circularity = region.properties.solidity;
    const tolerance = 0.15;
    return [
      Math.max(0, circularity - tolerance),
      Math.min(1, circularity + tolerance),
    ];
  }
  
  /**
   * Compare two signatures
   */
  compareSimilarity(sig1: ComponentSignature, sig2: ComponentSignature): number {
    let totalSimilarity = 0;
    let totalWeight = 0;
    
    // Shape descriptor similarity
    const shapeSim = this.compareDescriptors(sig1.shapeDescriptor, sig2.shapeDescriptor);
    totalSimilarity += shapeSim * 0.4;
    totalWeight += 0.4;
    
    // Color histogram similarity
    const colorSim = this.compareDescriptors(sig1.colorHistogram, sig2.colorHistogram);
    totalSimilarity += colorSim * 0.3;
    totalWeight += 0.3;
    
    // Size range overlap
    const sizeOverlap = this.calculateRangeOverlap(sig1.sizeRange, sig2.sizeRange);
    totalSimilarity += sizeOverlap * 0.2;
    totalWeight += 0.2;
    
    // Aspect ratio overlap
    const aspectOverlap = this.calculateRangeOverlap(sig1.aspectRatioRange, sig2.aspectRatioRange);
    totalSimilarity += aspectOverlap * 0.1;
    totalWeight += 0.1;
    
    return totalWeight > 0 ? totalSimilarity / totalWeight : 0;
  }
  
  /**
   * Compare descriptor vectors
   */
  private compareDescriptors(desc1: number[], desc2: number[]): number {
    if (desc1.length !== desc2.length) return 0;
    
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
      const diff = Math.abs(desc1[i] - desc2[i]);
      sum += Math.max(0, 1 - diff);
    }
    
    return sum / desc1.length;
  }
  
  /**
   * Calculate range overlap
   */
  private calculateRangeOverlap(range1: [number, number], range2: [number, number]): number {
    const [min1, max1] = range1;
    const [min2, max2] = range2;
    
    const overlapStart = Math.max(min1, min2);
    const overlapEnd = Math.min(max1, max2);
    
    if (overlapStart >= overlapEnd) return 0;
    
    const overlapSize = overlapEnd - overlapStart;
    const range1Size = max1 - min1;
    const range2Size = max2 - min2;
    const avgSize = (range1Size + range2Size) / 2;
    
    return overlapSize / avgSize;
  }
}
