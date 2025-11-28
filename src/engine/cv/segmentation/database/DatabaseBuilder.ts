/**
 * Component Database Builder
 * Builds component signature database from training data
 * Supports incremental updates and versioning
 */

import type {
  ComponentDatabase,
  ComponentSignature,
  ComponentType,
  SegmentedRegion
} from '../../../../types/cv/SegmentationTypes';
import { SignatureExtractor } from './SignatureExtractor';

export interface TrainingExample {
  region: SegmentedRegion;
  type: ComponentType;
  label: string;
}

export class DatabaseBuilder {
  private signatures: ComponentSignature[] = [];
  private extractor: SignatureExtractor;
  private version: string = '1.0.0';
  
  constructor() {
    this.extractor = new SignatureExtractor();
  }
  
  /**
   * Add training example
   */
  addExample(example: TrainingExample): void {
    const signature = this.extractor.extract(
      example.region,
      example.type,
      example.label
    );
    
    this.signatures.push(signature);
  }
  
  /**
   * Add multiple examples
   */
  addExamples(examples: TrainingExample[]): void {
    for (const example of examples) {
      this.addExample(example);
    }
    
    console.log(`📚 Added ${examples.length} training examples`);
  }
  
  /**
   * Build database
   */
  build(): ComponentDatabase {
    const categories = this.extractCategories();
    
    return {
      version: this.version,
      signatures: this.signatures,
      metadata: {
        totalComponents: this.signatures.length,
        lastUpdated: new Date().toISOString(),
        categories,
        averageAccuracy: 0.85, // Placeholder
      },
    };
  }
  
  /**
   * Extract unique categories
   */
  private extractCategories(): string[] {
    const categories = new Set<string>();
    
    for (const sig of this.signatures) {
      categories.add(sig.type);
    }
    
    return Array.from(categories);
  }
  
  /**
   * Merge with existing database
   */
  merge(existingDatabase: ComponentDatabase): ComponentDatabase {
    const merged = [...existingDatabase.signatures, ...this.signatures];
    
    // Remove duplicates based on ID
    const unique = merged.filter((sig, index, self) =>
      index === self.findIndex(s => s.id === sig.id)
    );
    
    return {
      version: this.version,
      signatures: unique,
      metadata: {
        totalComponents: unique.length,
        lastUpdated: new Date().toISOString(),
        categories: this.extractCategoriesFromSignatures(unique),
        averageAccuracy: existingDatabase.metadata.averageAccuracy,
      },
    };
  }
  
  /**
   * Extract categories from signatures
   */
  private extractCategoriesFromSignatures(signatures: ComponentSignature[]): string[] {
    const categories = new Set<string>();
    
    for (const sig of signatures) {
      categories.add(sig.type);
    }
    
    return Array.from(categories);
  }
  
  /**
   * Export database as JSON
   */
  exportJSON(): string {
    const database = this.build();
    return JSON.stringify(database, null, 2);
  }
  
  /**
   * Import database from JSON
   */
  importJSON(json: string): ComponentDatabase {
    return JSON.parse(json) as ComponentDatabase;
  }
  
  /**
   * Save database to file
   */
  async saveToFile(filename: string): Promise<void> {
    const json = this.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log(`💾 Database saved to ${filename}`);
  }
  
  /**
   * Load database from file
   */
  async loadFromFile(file: File): Promise<ComponentDatabase> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          const database = this.importJSON(json);
          resolve(database);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
  
  /**
   * Get statistics
   */
  getStats(): {
    totalSignatures: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    
    for (const sig of this.signatures) {
      byType[sig.type] = (byType[sig.type] || 0) + 1;
    }
    
    return {
      totalSignatures: this.signatures.length,
      byType,
    };
  }
  
  /**
   * Clear all signatures
   */
  clear(): void {
    this.signatures = [];
  }
  
  /**
   * Set version
   */
  setVersion(version: string): void {
    this.version = version;
  }
}
