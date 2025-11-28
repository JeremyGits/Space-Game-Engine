/**
 * OpenCV.js Loader
 * Handles loading and initialization of OpenCV.js library
 */

export interface OpenCVLoadOptions {
  wasmPath?: string;
  simdEnabled?: boolean;
  threadsEnabled?: boolean;
  timeout?: number;
}

export interface OpenCVLoadResult {
  success: boolean;
  cv: any;
  loadTime: number;
  error?: string;
}

/**
 * Load OpenCV.js library
 */
export async function loadOpenCV(options: OpenCVLoadOptions = {}): Promise<OpenCVLoadResult> {
  const startTime = performance.now();
  
  const {
    wasmPath = 'https://docs.opencv.org/4.8.0/opencv.js',
    simdEnabled = true,
    threadsEnabled = false,
    timeout = 30000,
  } = options;
  
  return new Promise((resolve) => {
    // Check if already loaded
    if ((window as any).cv && (window as any).cv.Mat) {
      const loadTime = performance.now() - startTime;
      console.log('✅ OpenCV.js already loaded');
      resolve({
        success: true,
        cv: (window as any).cv,
        loadTime,
      });
      return;
    }
    
    console.log('📦 Loading OpenCV.js from:', wasmPath);
    
    // Create script element
    const script = document.createElement('script');
    script.src = wasmPath;
    script.async = true;
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      const loadTime = performance.now() - startTime;
      console.error('❌ OpenCV.js loading timeout');
      resolve({
        success: false,
        cv: null,
        loadTime,
        error: 'Loading timeout exceeded',
      });
    }, timeout);
    
    // Handle successful load
    script.onload = () => {
      console.log('📦 OpenCV.js script loaded, waiting for initialization...');
      
      // Wait for cv to be ready
      const checkInterval = setInterval(() => {
        if ((window as any).cv && (window as any).cv.Mat) {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          
          const cv = (window as any).cv;
          const loadTime = performance.now() - startTime;
          
          console.log('✅ OpenCV.js initialized successfully');
          console.log(`   Version: ${cv.getBuildInformation ? 'Available' : 'Unknown'}`);
          console.log(`   SIMD: ${simdEnabled ? 'Enabled' : 'Disabled'}`);
          console.log(`   Threads: ${threadsEnabled ? 'Enabled' : 'Disabled'}`);
          console.log(`   Load time: ${loadTime.toFixed(2)}ms`);
          
          resolve({
            success: true,
            cv,
            loadTime,
          });
        }
      }, 100);
    };
    
    // Handle load error
    script.onerror = (error) => {
      clearTimeout(timeoutId);
      const loadTime = performance.now() - startTime;
      console.error('❌ Failed to load OpenCV.js:', error);
      resolve({
        success: false,
        cv: null,
        loadTime,
        error: 'Script loading failed',
      });
    };
    
    // Check if script already exists
    const existingScript = document.querySelector(`script[src="${wasmPath}"]`);
    if (existingScript) {
      console.log('📦 OpenCV.js script already in DOM, waiting for initialization...');
      // Wait for it to initialize
      const checkInterval = setInterval(() => {
        if ((window as any).cv && (window as any).cv.Mat) {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          const cv = (window as any).cv;
          const loadTime = performance.now() - startTime;
          console.log('✅ OpenCV.js initialized from existing script');
          resolve({
            success: true,
            cv,
            loadTime,
          });
        }
      }, 100);
      return;
    }
    
    // Add script to document
    document.body.appendChild(script);
  });
}

/**
 * Check if OpenCV.js is available
 */
export function isOpenCVAvailable(): boolean {
  return !!(window as any).cv && !!(window as any).cv.Mat;
}

/**
 * Get OpenCV.js instance
 */
export function getOpenCV(): any {
  if (!isOpenCVAvailable()) {
    throw new Error('OpenCV.js not loaded. Call loadOpenCV() first.');
  }
  return (window as any).cv;
}

/**
 * Get OpenCV.js version info
 */
export function getOpenCVVersion(): string {
  if (!isOpenCVAvailable()) {
    return 'Not loaded';
  }
  
  const cv = (window as any).cv;
  if (cv.getBuildInformation) {
    return cv.getBuildInformation();
  }
  
  return 'Version info not available';
}

/**
 * Preload OpenCV.js (call early in app lifecycle)
 */
export async function preloadOpenCV(options?: OpenCVLoadOptions): Promise<boolean> {
  console.log('🚀 Preloading OpenCV.js...');
  const result = await loadOpenCV(options);
  return result.success;
}
