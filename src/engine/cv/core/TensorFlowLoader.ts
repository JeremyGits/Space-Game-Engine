/**
 * TensorFlow.js Loader
 * Handles loading and initialization of TensorFlow.js library
 */

export interface TensorFlowLoadOptions {
  backend?: 'webgl' | 'wasm' | 'cpu';
  modelPath?: string;
  timeout?: number;
}

export interface TensorFlowLoadResult {
  success: boolean;
  tf: any;
  backend: string;
  loadTime: number;
  error?: string;
}

/**
 * Load TensorFlow.js library
 */
export async function loadTensorFlow(options: TensorFlowLoadOptions = {}): Promise<TensorFlowLoadResult> {
  const startTime = performance.now();
  
  const {
    backend = 'webgl',
    timeout = 30000,
  } = options;
  
  try {
    console.log('📦 Loading TensorFlow.js...');
    
    // Dynamic import with timeout
    const loadPromise = import('@tensorflow/tfjs');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TensorFlow.js loading timeout')), timeout);
    });
    
    const tf = await Promise.race([loadPromise, timeoutPromise]) as any;
    
    // Set backend
    console.log(`🔧 Setting TensorFlow.js backend to: ${backend}`);
    await tf.setBackend(backend);
    await tf.ready();
    
    const actualBackend = tf.getBackend();
    const loadTime = performance.now() - startTime;
    
    console.log('✅ TensorFlow.js loaded successfully');
    console.log(`   Backend: ${actualBackend}`);
    console.log(`   Version: ${tf.version?.tfjs || 'Unknown'}`);
    console.log(`   Load time: ${loadTime.toFixed(2)}ms`);
    
    return {
      success: true,
      tf,
      backend: actualBackend,
      loadTime,
    };
    
  } catch (error) {
    const loadTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('❌ Failed to load TensorFlow.js:', errorMessage);
    
    return {
      success: false,
      tf: null,
      backend: 'none',
      loadTime,
      error: errorMessage,
    };
  }
}

/**
 * Check if TensorFlow.js is available
 */
export function isTensorFlowAvailable(): boolean {
  try {
    // Check if tf is in window (if loaded via script tag)
    if ((window as any).tf) {
      return true;
    }
    
    // Try to access via import (if already imported)
    return false; // Will be true after dynamic import
  } catch {
    return false;
  }
}

/**
 * Get TensorFlow.js instance
 */
export function getTensorFlow(): any {
  const tf = (window as any).tf;
  if (!tf) {
    throw new Error('TensorFlow.js not loaded. Call loadTensorFlow() first.');
  }
  return tf;
}

/**
 * Get TensorFlow.js backend info
 */
export function getTensorFlowBackendInfo(): {
  backend: string;
  available: boolean;
  features: string[];
} {
  try {
    const tf = getTensorFlow();
    const backend = tf.getBackend();
    
    return {
      backend,
      available: true,
      features: [
        tf.ENV?.getBool('WEBGL_VERSION') ? 'WebGL' : '',
        tf.ENV?.getBool('HAS_WEBGL') ? 'GPU' : '',
        tf.ENV?.getBool('WEBGL_RENDER_FLOAT32_CAPABLE') ? 'Float32' : '',
      ].filter(Boolean),
    };
  } catch {
    return {
      backend: 'none',
      available: false,
      features: [],
    };
  }
}

/**
 * Preload TensorFlow.js (call early in app lifecycle)
 */
export async function preloadTensorFlow(options?: TensorFlowLoadOptions): Promise<boolean> {
  console.log('🚀 Preloading TensorFlow.js...');
  const result = await loadTensorFlow(options);
  return result.success;
}

/**
 * Load a TensorFlow.js model
 */
export async function loadTFModel(modelPath: string): Promise<any> {
  try {
    const tf = getTensorFlow();
    console.log(`📦 Loading TensorFlow model from: ${modelPath}`);
    
    const model = await tf.loadLayersModel(modelPath);
    console.log('✅ Model loaded successfully');
    
    return model;
  } catch (error) {
    console.error('❌ Failed to load model:', error);
    throw error;
  }
}

/**
 * Dispose of TensorFlow.js resources
 */
export function disposeTensorFlow(): void {
  try {
    const tf = getTensorFlow();
    
    // Dispose all tensors
    const numTensors = tf.memory().numTensors;
    if (numTensors > 0) {
      console.log(`🗑️ Disposing ${numTensors} TensorFlow tensors`);
      tf.disposeVariables();
    }
    
    console.log('✅ TensorFlow.js resources disposed');
  } catch (error) {
    console.warn('⚠️ Error disposing TensorFlow.js:', error);
  }
}
