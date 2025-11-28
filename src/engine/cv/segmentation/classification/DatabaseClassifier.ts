/**
 * Database-Based Component Classifier
 * Matches regions against known component signatures
 * Fast lookup using pre-built component database
 */

import type {
  ClassificationResult,
  ClassifiedComponent,
  ComponentSignature,
  ComponentDatabase,
  SegmentedRegion
} from '../../../../types/cv/SegmentationTypes';

export interface DatabaseClassifierConfig {
  database?: ComponentDatabase | null;
  similarityThreshold?: number;    // Minimum similarity (default: 0.7)
  maxCandidates?: number;          // Max candidates to consider (default: 5)
  useColorHistogram?: boolean;     // Use color matching (default: true)
  useShapeDescriptor?: boolean;    // Use shape matching (default: true)
  useTextureDescriptor?: boolean;  // Use texture matching (default: false)
}

export class DatabaseClassifier {
  private config: {
    database: ComponentDatabase | null;
    similarityThreshold: number;
    maxCandidates: number;
    useColorHistogram: boolean;
    useShapeDescriptor: boolean;
    useTextureDescriptor: boolean;
  };
  private database: ComponentDatabase | null;
  
  constructor(config: DatabaseClassifierConfig = {}) {
    this.config = {
      database: config.database ?? null,
      similarityThreshold: config.similarityThreshold ?? 0.7,
      maxCandidates: config.maxCandidates ?? 5,
      useColorHistogram: config.useColorHistogram ?? true,
      useShapeDescriptor: config.useShapeDescriptor ?? true,
      useTextureDescriptor: config.useTextureDescriptor ?? false,
    };
    
    this.database = config.database ?? null;
  }
  
  /**
   * Classify regions using database lookup
   */
  classify(regions: SegmentedRegion[]): ClassificationResult {
    const startTime = performance.now();
    
    if (!this.database) {
      throw new Error('Component database not loaded');
    }
    
    const components: ClassifiedComponent[] = [];
    
    for (const region of regions) {
      const classification = this.classifyRegion(region);
      if (classification) {
        components.push(classification);
      }
    }
    
    const processingTime = performance.now() - startTime;
    const avgConfidence = components.length > 0
      ? components.reduce((sum, c) => sum + c.confidence, 0) / components.length
      : 0;
    
    return {
      components,
      totalComponents: components.length,
      averageConfidence: avgConfidence,
      processingTime,
      method: 'database',
    };
  }
  
  /**
   * Classify single region
   */
  private classifyRegion(region: SegmentedRegion): ClassifiedComponent | null {
    if (!this.database) return null;
    
    // Extract features from region
    const features = this.extractFeatures(region);
    
    // Find best matching signatures
    const matches = this.findMatches(features);
    
    if (matches.length === 0) {
      return null;
    }
    
    // Use best match
    const bestMatch = matches[0];
    
    if (bestMatch.similarity < this.config.similarityThreshold) {
      return null;
    }
    
    return {
      id: region.id,
      type: bestMatch.signature.type,
      region,
      confidence: bestMatch.similarity,
      depth: 0,
      geometry: {
        type: 'box',
        parameters: {},
        scale: [1, 1, 1],
      },
      material: {
        baseColor: region.color,
        metalness: 0.5,
        roughness: 0.5,
        emissive: false,
        transparent: false,
      },
      metadata: {
        label: bestMatch.signature.id,
        function: `Database match: ${bestMatch.signature.type}`,
        interactable: ['button', 'knob', 'lever', 'switch'].includes(bestMatch.signature.type),
        priority: 5,
        tags: [bestMatch.signature.type, 'database-match'],
      },
    };
  }
  
  /**
   * Extract features from region
   */
  private extractFeatures(region: SegmentedRegion): any {
    return {
      area: region.area,
      aspectRatio: region.bounds.width / region.bounds.height,
      solidity: region.properties.solidity,
      isConvex: region.properties.isConvex,
      edgeDensity: region.properties.edgeDensity,
      colorMean: region.properties.meanColor,
      colorVariance: region.properties.colorVariance,
    };
  }
  
  /**
   * Find matching signatures
   */
  private findMatches(features: any): Array<{ signature: ComponentSignature; similarity: number }> {
    if (!this.database) return [];
    
    const matches: Array<{ signature: ComponentSignature; similarity: number }> = [];
    
    for (const signature of this.database.signatures) {
      const similarity = this.calculateSimilarity(features, signature);
      
      if (similarity > 0) {
        matches.push({ signature, similarity });
      }
    }
    
    // Sort by similarity (descending)
    matches.sort((a, b) => b.similarity - a.similarity);
    
    // Return top candidates
    return matches.slice(0, this.config.maxCandidates);
  }
  
  /**
   * Calculate similarity between features and signature
   */
  private calculateSimilarity(features: any, signature: ComponentSignature): number {
    let totalWeight = 0;
    let totalSimilarity = 0;
    
    // Size similarity
    const sizeInRange = features.area >= signature.sizeRange[0] && 
                       features.area <= signature.sizeRange[1];
    if (sizeInRange) {
      totalSimilarity += 0.3;
    }
    totalWeight += 0.3;
    
    // Aspect ratio similarity
    const aspectInRange = features.aspectRatio >= signature.aspectRatioRange[0] &&
                         features.aspectRatio <= signature.aspectRatioRange[1];
    if (aspectInRange) {
      totalSimilarity += 0.2;
    }
    totalWeight += 0.2;
    
    // Shape descriptor similarity (if enabled)
    if (this.config.useShapeDescriptor && signature.shapeDescriptor.length > 0) {
      const shapeSim = this.compareDescriptors(
        [features.solidity, features.edgeDensity],
        signature.shapeDescriptor.slice(0, 2)
      );
      totalSimilarity += shapeSim * 0.3;
      totalWeight += 0.3;
    }
    
    // Color histogram similarity (if enabled)
    if (this.config.useColorHistogram && signature.colorHistogram.length > 0) {
      const colorSim = this.compareColorHistograms(features.colorMean, signature.colorHistogram);
      totalSimilarity += colorSim * 0.2;
      totalWeight += 0.2;
    }
    
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
      sum += 1 - diff; // Inverse distance
    }
    
    return Math.max(0, sum / desc1.length);
  }
  
  /**
   * Compare color histograms
   */
  private compareColorHistograms(color: any, histogram: number[]): number {
    // Simplified color comparison
    // Full implementation would use actual histogram comparison
    return 0.5;
  }
  
  /**
   * Load component database
   */
  loadDatabase(database: ComponentDatabase): void {
    this.database = database;
    console.log(`📚 Loaded component database: ${database.signatures.length} signatures`);
  }
  
  /**
   * Get database info
   */
  getDatabaseInfo(): any {
    if (!this.database) {
      return { loaded: false };
    }
    
    return {
      loaded: true,
      version: this.database.version,
      totalSignatures: this.database.signatures.length,
      categories: this.database.metadata.categories,
      averageAccuracy: this.database.metadata.averageAccuracy,
    };
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<DatabaseClassifierConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
