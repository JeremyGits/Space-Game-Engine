/**
 * Async Compute
 * 
 * Asynchronous GPU compute operations.
 * Enables non-blocking voxel processing.
 */

import { Voxel } from '../../core/Voxel';

/**
 * Compute task
 */
export interface ComputeTask<T> {
  /** Task ID */
  id: string;
  
  /** Task function */
  execute: () => T | Promise<T>;
  
  /** Priority */
  priority: number;
  
  /** Status */
  status: 'pending' | 'running' | 'complete' | 'error';
  
  /** Result */
  result?: T;
  
  /** Error */
  error?: Error;
}

/**
 * Async compute manager
 */
export class AsyncCompute {
  private tasks: Map<string, ComputeTask<any>> = new Map();
  private running: boolean = false;
  
  /**
   * Schedule task
   */
  schedule<T>(
    id: string,
    execute: () => T | Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: ComputeTask<T> = {
        id,
        execute,
        priority,
        status: 'pending'
      };
      
      this.tasks.set(id, task);
      
      // Start processing if not already running
      if (!this.running) {
        this.processQueue().then(() => {
          if (task.status === 'complete' && task.result !== undefined) {
            resolve(task.result);
          } else if (task.status === 'error' && task.error) {
            reject(task.error);
          }
        });
      }
    });
  }
  
  /**
   * Process task queue
   */
  private async processQueue(): Promise<void> {
    this.running = true;
    
    // Sort by priority
    const sortedTasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'pending')
      .sort((a, b) => b.priority - a.priority);
    
    // Process each task
    for (const task of sortedTasks) {
      task.status = 'running';
      
      try {
        task.result = await task.execute();
        task.status = 'complete';
      } catch (error) {
        task.error = error as Error;
        task.status = 'error';
      }
    }
    
    this.running = false;
  }
  
  /**
   * Get task status
   */
  getTaskStatus(id: string): ComputeTask<any> | undefined {
    return this.tasks.get(id);
  }
  
  /**
   * Cancel task
   */
  cancelTask(id: string): void {
    const task = this.tasks.get(id);
    if (task && task.status === 'pending') {
      this.tasks.delete(id);
    }
  }
  
  /**
   * Clear completed tasks
   */
  clearCompleted(): void {
    for (const [id, task] of this.tasks) {
      if (task.status === 'complete' || task.status === 'error') {
        this.tasks.delete(id);
      }
    }
  }
  
  /**
   * Get queue length
   */
  getQueueLength(): number {
    return Array.from(this.tasks.values()).filter(t => t.status === 'pending').length;
  }
}
