/**
 * Component Database - Main Database Manager
 * Manages component signatures and provides fast lookup
 * Integrates signature extraction, similarity search, and database building
 */

import type {
  ComponentDatabase as IComponentDatabase,
  ComponentSignature,
  SegmentedRegion,
  ComponentType
} from '../../../../types/cv/SegmentationTypes';
import { SignatureExtractor } from './SignatureExtractor';
import { SimilaritySearch } from './SimilaritySearch';
import { DatabaseBuilder, type TrainingExample } from './DatabaseBuilder';

export class ComponentDatabase {
  private database: IComponentDatabase | null = null;
  private extractor: SignatureExtractor;
  private search: SimilaritySearch;
  private builder: DatabaseBuilder;
  
  constructor() {
    this.extractor = new SignatureExtractor();
    this.search = new SimilaritySearch();
    this.builder = new DatabaseBuilder();
  }
  
  /**
   * Load database
   */
  load(database: IComponentDatabase): void {
    this.database = database;
    this.search.buildIndex(database.signatures);
    console.log(`📚 Loaded component database v${database.version}`);
    console.log(`   ${database.signatures.length} signatures`);
    console.log(`   Categories: ${database.metadata.categories.join(', ')}`);
  }
  
  /**
   * Load from JSON string
   */
  loadFromJSON(json: string): void {
    const database = JSON.parse(json) as IComponentDatabase;
    this.load(database);
  }
  
  /**
   * Load from URL
   */
  async loadFromURL(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const database = await response.json() as IComponentDatabase;
      this.load(database);
    } catch (error) {
      console.error('Failed to load database from URL:', error);
      throw error;
    }
  }
  
  /**
   * Find similar components
   */
  findSimilar(
    region: SegmentedRegion,
    k: number = 5
  ): Array<{ signature: ComponentSignature; similarity: number }> {
    if (!this.database) {
      throw new Error('Database not loaded');
    }
    
    // Extract features from region
    const features = [
      region.properties.solidity,
      region.properties.edgeDensity,
      region.properties.isConvex ? 1 : 0,
      region.area / (region.bounds.width * region.bounds.height),
      region.bounds.width / region.bounds.height,
    ];
    
    // Find nearest neighbors
    const nearest = this.search.findNearest(features, k);
    
    // Convert distance to similarity (0-1)
    return nearest.map(result => ({
      signature: result.signature,
      similarity: 1 / (1 + result.distance), // Convert distance to similarity
    }));
  }
  
  /**
   * Find by type
   */
  findByType(type: ComponentType): ComponentSignature[] {
    if (!this.database) return [];
    
    return this.database.signatures.filter(sig => sig.type === type);
  }
  
  /**
   * Find by ID
   */
  findById(id: string): ComponentSignature | null {
    if (!this.database) return null;
    
    return this.database.signatures.find(sig => sig.id === id) || null;
  }
  
  /**
   * Add training examples and rebuild
   */
  addTrainingData(examples: TrainingExample[]): void {
    this.builder.addExamples(examples);
    
    if (this.database) {
      const newDatabase = this.builder.merge(this.database);
      this.load(newDatabase);
    } else {
      const newDatabase = this.builder.build();
      this.load(newDatabase);
    }
  }
  
  /**
   * Export current database
   */
  export(): IComponentDatabase | null {
    return this.database;
  }
  
  /**
   * Export as JSON
   */
  exportJSON(): string {
    if (!this.database) {
      throw new Error('No database to export');
    }
    
    return JSON.stringify(this.database, null, 2);
  }
  
  /**
   * Save to file
   */
  async saveToFile(filename: string = 'component-database.json'): Promise<void> {
    await this.builder.saveToFile(filename);
  }
  
  /**
   * Get database info
   */
  getInfo(): any {
    if (!this.database) {
      return {
        loaded: false,
        version: null,
        totalSignatures: 0,
        categories: [],
      };
    }
    
    return {
      loaded: true,
      version: this.database.version,
      totalSignatures: this.database.signatures.length,
      categories: this.database.metadata.categories,
      averageAccuracy: this.database.metadata.averageAccuracy,
      lastUpdated: this.database.metadata.lastUpdated,
      searchIndexed: this.search.getStats().indexed,
    };
  }
  
  /**
   * Get statistics
   */
  getStats(): {
    totalSignatures: number;
    byType: Record<string, number>;
    searchStats: any;
  } {
    if (!this.database) {
      return {
        totalSignatures: 0,
        byType: {},
        searchStats: this.search.getStats(),
      };
    }
    
    const byType: Record<string, number> = {};
    
    for (const sig of this.database.signatures) {
      byType[sig.type] = (byType[sig.type] || 0) + 1;
    }
    
    return {
      totalSignatures: this.database.signatures.length,
      byType,
      searchStats: this.search.getStats(),
    };
  }
  
  /**
   * Check if database is loaded
   */
  isLoaded(): boolean {
    return this.database !== null;
  }
  
  /**
   * Clear database
   */
  clear(): void {
    this.database = null;
    this.search.clear();
    this.builder.clear();
    console.log('🗑️ Component database cleared');
  }
}
