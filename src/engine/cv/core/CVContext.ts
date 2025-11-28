/**
 * CV Context
 * Manages the computer vision processing context and state
 */

export interface CVContextState {
  opencvReady: boolean;
  tensorflowReady: boolean;
  processing: boolean;
  lastError: string | null;
  activeOperations: number;
}

export interface CVContextMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
}

/**
 * CV Context - Manages CV processing state
 */
export class CVContext {
  private state: CVContextState;
  private metrics: CVContextMetrics;
  private operationStartTimes: Map<string, number>;
  
  constructor() {
    this.state = {
      opencvReady: false,
      tensorflowReady: false,
      processing: false,
      lastError: null,
      activeOperations: 0,
    };
    
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
    };
    
    this.operationStartTimes = new Map();
  }
  
  /**
   * Mark OpenCV as ready
   */
  setOpenCVReady(ready: boolean): void {
    this.state.opencvReady = ready;
    console.log(`🔧 OpenCV status: ${ready ? 'Ready' : 'Not Ready'}`);
  }
  
  /**
   * Mark TensorFlow as ready
   */
  setTensorFlowReady(ready: boolean): void {
    this.state.tensorflowReady = ready;
    console.log(`🔧 TensorFlow status: ${ready ? 'Ready' : 'Not Ready'}`);
  }
  
  /**
   * Check if CV is ready for processing
   */
  isReady(): boolean {
    return this.state.opencvReady || this.state.tensorflowReady;
  }
  
  /**
   * Start an operation
   */
  startOperation(operationId: string): void {
    this.state.activeOperations++;
    this.state.processing = true;
    this.operationStartTimes.set(operationId, performance.now());
    this.metrics.totalOperations++;
  }
  
  /**
   * End an operation successfully
   */
  endOperation(operationId: string): void {
    this.state.activeOperations = Math.max(0, this.state.activeOperations - 1);
    
    if (this.state.activeOperations === 0) {
      this.state.processing = false;
    }
    
    // Calculate processing time
    const startTime = this.operationStartTimes.get(operationId);
    if (startTime) {
      const processingTime = performance.now() - startTime;
      this.metrics.totalProcessingTime += processingTime;
      this.metrics.successfulOperations++;
      
      // Update average
      this.metrics.averageProcessingTime = 
        this.metrics.totalProcessingTime / this.metrics.successfulOperations;
      
      this.operationStartTimes.delete(operationId);
    }
  }
  
  /**
   * End an operation with error
   */
  endOperationWithError(operationId: string, error: string): void {
    this.state.activeOperations = Math.max(0, this.state.activeOperations - 1);
    
    if (this.state.activeOperations === 0) {
      this.state.processing = false;
    }
    
    this.state.lastError = error;
    this.metrics.failedOperations++;
    this.operationStartTimes.delete(operationId);
    
    console.error(`❌ CV Operation failed (${operationId}):`, error);
  }
  
  /**
   * Get current state
   */
  getState(): CVContextState {
    return { ...this.state };
  }
  
  /**
   * Get metrics
   */
  getMetrics(): CVContextMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
    };
    console.log('🔄 CV metrics reset');
  }
  
  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.metrics.totalOperations === 0) return 0;
    return this.metrics.successfulOperations / this.metrics.totalOperations;
  }
  
  /**
   * Get failure rate
   */
  getFailureRate(): number {
    if (this.metrics.totalOperations === 0) return 0;
    return this.metrics.failedOperations / this.metrics.totalOperations;
  }
  
  /**
   * Check if currently processing
   */
  isProcessing(): boolean {
    return this.state.processing;
  }
  
  /**
   * Get active operation count
   */
  getActiveOperationCount(): number {
    return this.state.activeOperations;
  }
  
  /**
   * Clear last error
   */
  clearError(): void {
    this.state.lastError = null;
  }
  
  /**
   * Get diagnostic info
   */
  getDiagnostics(): {
    state: CVContextState;
    metrics: CVContextMetrics;
    successRate: number;
    failureRate: number;
  } {
    return {
      state: this.getState(),
      metrics: this.getMetrics(),
      successRate: this.getSuccessRate(),
      failureRate: this.getFailureRate(),
    };
  }
}

// Singleton instance
let contextInstance: CVContext | null = null;

/**
 * Get the global CV context
 */
export function getCVContext(): CVContext {
  if (!contextInstance) {
    contextInstance = new CVContext();
  }
  return contextInstance;
}

/**
 * Reset the global CV context
 */
export function resetCVContext(): void {
  contextInstance = new CVContext();
}
