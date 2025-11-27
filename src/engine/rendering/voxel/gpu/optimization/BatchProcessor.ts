/**
 * Batch Processor
 * 
 * Processes voxels in batches for optimal GPU performance.
 */

import { Voxel } from '../../core/Voxel';

/**
 * Batch configuration
 */
export interface BatchConfig {
  /** Batch size */
  batchSize: number;
  
  /** Enable parallel processing */
  parallel: boolean;
  
  /** Processing priority */
  priority: 'high' | 'normal' | 'low';
}

/**
 * Batch processor
 */
export class BatchProcessor {
  private config: BatchConfig;
  private queue: Voxel[][] = [];
  
  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      batchSize: config.batchSize ?? 1000,
      parallel: config.parallel ?? true,
      priority: config.priority ?? 'normal'
    };
  }
  
  /**
   * Create batches from voxels
   */
  createBatches(voxels: Voxel[]): Voxel[][] {
    const batches: Voxel[][] = [];
    
    for (let i = 0; i < voxels.length; i += this.config.batchSize) {
      const batch = voxels.slice(i, i + this.config.batchSize);
      batches.push(batch);
    }
    
    return batches;
  }
  
  /**
   * Process batches
   */
  async processBatches<T>(
    batches: Voxel[][],
    processor: (batch: Voxel[]) => T | Promise<T>
  ): Promise<T[]> {
    if (this.config.parallel) {
      return Promise.all(batches.map(batch => processor(batch)));
    } else {
      const results: T[] = [];
      for (const batch of batches) {
        results.push(await processor(batch));
      }
      return results;
    }
  }
  
  /**
   * Queue batch for processing
   */
  queueBatch(batch: Voxel[]): void {
    this.queue.push(batch);
  }
  
  /**
   * Process queue
   */
  async processQueue<T>(processor: (batch: Voxel[]) => T | Promise<T>): Promise<T[]> {
    const results = await this.processBatches(this.queue, processor);
    this.queue = [];
    return results;
  }
  
  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }
  
  /**
   * Clear queue
   */
  clearQueue(): void {
    this.queue = [];
  }
}
