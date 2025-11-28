/**
 * Component Classifier - Main Classification Interface
 * Unified interface for all classification methods
 * Automatically selects best approach based on available resources
 */

import type {
  ClassificationResult,
  SegmentedRegion,
  ComponentDatabase
} from '../../../../types/cv/SegmentationTypes';
import { RuleBasedClassifier } from './RuleBasedClassifier';
import { DatabaseClassifier } from './DatabaseClassifier';
import { MLClassifier } from './MLClassifier';
import { HybridClassifier } from './HybridClassifier';

export type ClassifierType = 'rules' | 'database' | 'ml' | 'hybrid';

export interface ComponentClassifierConfig {
  preferredMethod?: ClassifierType;
  autoSelect?: boolean;           // Auto-select best method (default: true)
  confidenceThreshold?: number;
}

export class ComponentClassifier {
  private config: Required<ComponentClassifierConfig>;
  private ruleClassifier: RuleBasedClassifier;
  private databaseClassifier: DatabaseClassifier;
  private mlClassifier: MLClassifier;
  private hybridClassifier: HybridClassifier;
  private activeMethod: ClassifierType;
  
  constructor(config: ComponentClassifierConfig = {}) {
    this.config = {
      preferredMethod: config.preferredMethod ?? 'hybrid',
      autoSelect: config.autoSelect ?? true,
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
    };
    
    this.ruleClassifier = new RuleBasedClassifier();
    this.databaseClassifier = new DatabaseClassifier();
    this.mlClassifier = new MLClassifier();
    this.hybridClassifier = new HybridClassifier();
    
    this.activeMethod = this.config.preferredMethod;
  }
  
  /**
   * Classify regions
   */
  async classify(regions: SegmentedRegion[]): Promise<ClassificationResult> {
    if (this.config.autoSelect) {
      return this.classifyAuto(regions);
    }
    
    return this.classifyWithMethod(regions, this.activeMethod);
  }
  
  /**
   * Classify with automatic method selection
   */
  private async classifyAuto(regions: SegmentedRegion[]): Promise<ClassificationResult> {
    // Check what's available
    const hasDatabase = this.databaseClassifier.getDatabaseInfo().loaded;
    const hasML = this.mlClassifier.isReady();
    
    // Select best available method
    if (hasML && hasDatabase) {
      return this.hybridClassifier.classify(regions);
    } else if (hasDatabase) {
      return this.databaseClassifier.classify(regions);
    } else if (hasML) {
      return await this.mlClassifier.classify(regions);
    } else {
      return this.ruleClassifier.classify(regions);
    }
  }
  
  /**
   * Classify with specific method
   */
  async classifyWithMethod(
    regions: SegmentedRegion[],
    method: ClassifierType
  ): Promise<ClassificationResult> {
    switch (method) {
      case 'rules':
        return this.ruleClassifier.classify(regions);
      
      case 'database':
        return this.databaseClassifier.classify(regions);
      
      case 'ml':
        return await this.mlClassifier.classify(regions);
      
      case 'hybrid':
        return await this.hybridClassifier.classify(regions);
      
      default:
        throw new Error(`Unknown classifier type: ${method}`);
    }
  }
  
  /**
   * Load component database
   */
  loadDatabase(database: ComponentDatabase): void {
    this.databaseClassifier.loadDatabase(database);
    this.hybridClassifier.getDatabaseClassifier().loadDatabase(database);
    console.log('✅ Component database loaded for classification');
  }
  
  /**
   * Initialize ML model
   */
  async initializeML(): Promise<void> {
    await this.mlClassifier.initialize();
    await this.hybridClassifier.getMLClassifier().initialize();
    console.log('✅ ML classifier initialized');
  }
  
  /**
   * Set active classification method
   */
  setMethod(method: ClassifierType): void {
    this.activeMethod = method;
  }
  
  /**
   * Get active method
   */
  getMethod(): ClassifierType {
    return this.activeMethod;
  }
  
  /**
   * Get specific classifier
   */
  getClassifier(type: ClassifierType): any {
    switch (type) {
      case 'rules': return this.ruleClassifier;
      case 'database': return this.databaseClassifier;
      case 'ml': return this.mlClassifier;
      case 'hybrid': return this.hybridClassifier;
      default: throw new Error(`Unknown classifier type: ${type}`);
    }
  }
  
  /**
   * Get system status
   */
  getStatus(): {
    activeMethod: ClassifierType;
    databaseLoaded: boolean;
    mlReady: boolean;
    autoSelect: boolean;
  } {
    return {
      activeMethod: this.activeMethod,
      databaseLoaded: this.databaseClassifier.getDatabaseInfo().loaded,
      mlReady: this.mlClassifier.isReady(),
      autoSelect: this.config.autoSelect,
    };
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this.mlClassifier.dispose();
    this.hybridClassifier.getMLClassifier().dispose();
    console.log('🗑️ Component classifier disposed');
  }
}
