/**
 * Hybrid Component Classifier
 * Combines rule-based, database, and ML approaches
 * Best accuracy with fallback strategies
 */

import type {
  ClassificationResult,
  ClassifiedComponent,
  SegmentedRegion
} from '../../../../types/cv/SegmentationTypes';
import { RuleBasedClassifier } from './RuleBasedClassifier';
import { DatabaseClassifier } from './DatabaseClassifier';
import { MLClassifier } from './MLClassifier';

export interface HybridClassifierConfig {
  primaryMethod?: 'rules' | 'database' | 'ml';
  fallbackMethods?: Array<'rules' | 'database' | 'ml'>;
  confidenceThreshold?: number;
  combineResults?: boolean;        // Combine results from multiple methods
  votingStrategy?: 'majority' | 'weighted' | 'confidence';
}

export class HybridClassifier {
  private config: Required<HybridClassifierConfig>;
  private ruleClassifier: RuleBasedClassifier;
  private databaseClassifier: DatabaseClassifier;
  private mlClassifier: MLClassifier;
  
  constructor(config: HybridClassifierConfig = {}) {
    this.config = {
      primaryMethod: config.primaryMethod ?? 'rules',
      fallbackMethods: config.fallbackMethods ?? ['database', 'ml'],
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
      combineResults: config.combineResults ?? false,
      votingStrategy: config.votingStrategy ?? 'confidence',
    };
    
    this.ruleClassifier = new RuleBasedClassifier();
    this.databaseClassifier = new DatabaseClassifier();
    this.mlClassifier = new MLClassifier();
  }
  
  /**
   * Classify using hybrid approach
   */
  async classify(regions: SegmentedRegion[]): Promise<ClassificationResult> {
    const startTime = performance.now();
    
    if (this.config.combineResults) {
      return this.classifyWithVoting(regions, startTime);
    } else {
      return this.classifyWithFallback(regions, startTime);
    }
  }
  
  /**
   * Classify with fallback strategy
   */
  private async classifyWithFallback(
    regions: SegmentedRegion[],
    startTime: number
  ): Promise<ClassificationResult> {
    const methods = [this.config.primaryMethod, ...this.config.fallbackMethods];
    
    for (const method of methods) {
      try {
        const result = await this.classifyWithMethod(regions, method);
        
        // Check if result meets confidence threshold
        if (result.averageConfidence >= this.config.confidenceThreshold) {
          result.processingTime = performance.now() - startTime;
          return result;
        }
        
      } catch (error) {
        console.warn(`Classification failed with ${method}:`, error);
        continue;
      }
    }
    
    // All methods failed or low confidence
    return {
      components: [],
      totalComponents: 0,
      averageConfidence: 0,
      processingTime: performance.now() - startTime,
      method: 'hybrid',
    };
  }
  
  /**
   * Classify with voting strategy
   */
  private async classifyWithVoting(
    regions: SegmentedRegion[],
    startTime: number
  ): Promise<ClassificationResult> {
    const results: ClassificationResult[] = [];
    
    // Get results from all methods
    try {
      results.push(this.ruleClassifier.classify(regions));
    } catch (e) {
      console.warn('Rule classification failed:', e);
    }
    
    try {
      results.push(this.databaseClassifier.classify(regions));
    } catch (e) {
      console.warn('Database classification failed:', e);
    }
    
    try {
      const mlResult = await this.mlClassifier.classify(regions);
      results.push(mlResult);
    } catch (e) {
      console.warn('ML classification failed:', e);
    }
    
    // Combine results using voting
    const combined = this.combineResults(results, regions);
    combined.processingTime = performance.now() - startTime;
    
    return combined;
  }
  
  /**
   * Classify with specific method
   */
  private async classifyWithMethod(
    regions: SegmentedRegion[],
    method: 'rules' | 'database' | 'ml'
  ): Promise<ClassificationResult> {
    switch (method) {
      case 'rules':
        return this.ruleClassifier.classify(regions);
      
      case 'database':
        return this.databaseClassifier.classify(regions);
      
      case 'ml':
        return await this.mlClassifier.classify(regions);
      
      default:
        throw new Error(`Unknown classification method: ${method}`);
    }
  }
  
  /**
   * Combine results from multiple classifiers
   */
  private combineResults(
    results: ClassificationResult[],
    regions: SegmentedRegion[]
  ): ClassificationResult {
    const combinedComponents: ClassifiedComponent[] = [];
    
    // For each region, vote on classification
    for (const region of regions) {
      const votes: Map<string, { count: number; totalConfidence: number; components: ClassifiedComponent[] }> = new Map();
      
      // Collect votes from all results
      for (const result of results) {
        const component = result.components.find(c => c.region.id === region.id);
        if (component) {
          const key = component.type;
          const existing = votes.get(key) || { count: 0, totalConfidence: 0, components: [] };
          existing.count++;
          existing.totalConfidence += component.confidence;
          existing.components.push(component);
          votes.set(key, existing);
        }
      }
      
      // Select winner based on voting strategy
      if (votes.size > 0) {
        const winner = this.selectWinner(votes);
        if (winner) {
          combinedComponents.push(winner);
        }
      }
    }
    
    const avgConfidence = combinedComponents.length > 0
      ? combinedComponents.reduce((sum, c) => sum + c.confidence, 0) / combinedComponents.length
      : 0;
    
    return {
      components: combinedComponents,
      totalComponents: combinedComponents.length,
      averageConfidence: avgConfidence,
      processingTime: 0, // Will be set by caller
      method: 'hybrid',
    };
  }
  
  /**
   * Select winner from votes
   */
  private selectWinner(
    votes: Map<string, { count: number; totalConfidence: number; components: ClassifiedComponent[] }>
  ): ClassifiedComponent | null {
    let bestKey: string | null = null;
    let bestScore = 0;
    
    for (const [key, vote] of votes.entries()) {
      let score = 0;
      
      switch (this.config.votingStrategy) {
        case 'majority':
          score = vote.count;
          break;
        
        case 'weighted':
          score = vote.count * (vote.totalConfidence / vote.count);
          break;
        
        case 'confidence':
          score = vote.totalConfidence / vote.count;
          break;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }
    
    if (!bestKey) return null;
    
    const winningVote = votes.get(bestKey)!;
    const avgConfidence = winningVote.totalConfidence / winningVote.count;
    
    // Return component with highest confidence from winning type
    return winningVote.components.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );
  }
  
  /**
   * Get rule classifier
   */
  getRuleClassifier(): RuleBasedClassifier {
    return this.ruleClassifier;
  }
  
  /**
   * Get database classifier
   */
  getDatabaseClassifier(): DatabaseClassifier {
    return this.databaseClassifier;
  }
  
  /**
   * Get ML classifier
   */
  getMLClassifier(): MLClassifier {
    return this.mlClassifier;
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<HybridClassifierConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
