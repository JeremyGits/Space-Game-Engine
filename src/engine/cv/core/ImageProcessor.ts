/**
 * Image Processor
 * Handles image loading, preprocessing, and conversion for CV operations
 */

export interface ProcessedImage {
  data: ImageData;
  width: number;
  height: number;
  channels: number;
  format: 'RGBA' | 'RGB' | 'GRAY';
}

export interface ImageProcessingOptions {
  maxSize?: number;
  grayscale?: boolean;
  normalize?: boolean;
  resize?: { width: number; height: number };
  crop?: { x: number; y: number; width: number; height: number };
}

/**
 * Load image from URL
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    
    img.src = url;
  });
}

/**
 * Convert image to ImageData
 */
export function imageToImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Process image with options
 */
export async function processImage(
  url: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    maxSize = 2048,
    grayscale = false,
    normalize = false,
    resize,
    crop,
  } = options;
  
  // Load image
  const img = await loadImage(url);
  
  // Create canvas for processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  
  // Determine final size
  let width = img.width;
  let height = img.height;
  
  // Apply max size constraint
  if (width > maxSize || height > maxSize) {
    const scale = Math.min(maxSize / width, maxSize / height);
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);
  }
  
  // Apply resize if specified
  if (resize) {
    width = resize.width;
    height = resize.height;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // Draw image
  if (crop) {
    ctx.drawImage(
      img,
      crop.x, crop.y, crop.width, crop.height,
      0, 0, width, height
    );
  } else {
    ctx.drawImage(img, 0, 0, width, height);
  }
  
  // Get image data
  let imageData = ctx.getImageData(0, 0, width, height);
  
  // Apply grayscale if needed
  if (grayscale) {
    imageData = convertToGrayscale(imageData);
  }
  
  // Apply normalization if needed
  if (normalize) {
    imageData = normalizeImageData(imageData);
  }
  
  return {
    data: imageData,
    width,
    height,
    channels: grayscale ? 1 : 4,
    format: grayscale ? 'GRAY' : 'RGBA',
  };
}

/**
 * Convert ImageData to grayscale
 */
export function convertToGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Luminance formula
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    // Alpha stays the same
  }
  
  return imageData;
}

/**
 * Normalize ImageData to 0-1 range
 */
export function normalizeImageData(imageData: ImageData): ImageData {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] / 255;
    data[i + 1] = data[i + 1] / 255;
    data[i + 2] = data[i + 2] / 255;
    // Alpha stays 0-255
  }
  
  return imageData;
}

/**
 * Resize image
 */
export async function resizeImage(
  url: string,
  width: number,
  height: number
): Promise<ProcessedImage> {
  return processImage(url, { resize: { width, height } });
}

/**
 * Crop image
 */
export async function cropImage(
  url: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<ProcessedImage> {
  return processImage(url, { crop: { x, y, width, height } });
}

/**
 * Convert image to grayscale
 */
export async function toGrayscale(url: string): Promise<ProcessedImage> {
  return processImage(url, { grayscale: true });
}

/**
 * Get image dimensions without loading full image
 */
export async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  const img = await loadImage(url);
  return {
    width: img.width,
    height: img.height,
  };
}

/**
 * Create canvas from ImageData
 */
export function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Convert canvas to data URL
 */
export function canvasToDataURL(canvas: HTMLCanvasElement, format: 'png' | 'jpeg' = 'png'): string {
  return canvas.toDataURL(`image/${format}`);
}

/**
 * Convert ImageData to data URL
 */
export function imageDataToDataURL(imageData: ImageData, format: 'png' | 'jpeg' = 'png'): string {
  const canvas = imageDataToCanvas(imageData);
  return canvasToDataURL(canvas, format);
}

/**
 * Extract color histogram from image
 */
export function extractColorHistogram(imageData: ImageData, bins: number = 256): {
  r: number[];
  g: number[];
  b: number[];
} {
  const data = imageData.data;
  const r = new Array(bins).fill(0);
  const g = new Array(bins).fill(0);
  const b = new Array(bins).fill(0);
  
  for (let i = 0; i < data.length; i += 4) {
    const rBin = Math.floor((data[i] / 255) * (bins - 1));
    const gBin = Math.floor((data[i + 1] / 255) * (bins - 1));
    const bBin = Math.floor((data[i + 2] / 255) * (bins - 1));
    
    r[rBin]++;
    g[gBin]++;
    b[bBin]++;
  }
  
  return { r, g, b };
}

/**
 * Calculate mean color
 */
export function calculateMeanColor(imageData: ImageData): [number, number, number] {
  const data = imageData.data;
  let r = 0, g = 0, b = 0;
  const pixelCount = data.length / 4;
  
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  
  return [
    r / pixelCount,
    g / pixelCount,
    b / pixelCount,
  ];
}

/**
 * Apply Gaussian blur
 */
export function applyGaussianBlur(imageData: ImageData, radius: number = 1): ImageData {
  // Simple box blur approximation
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new Uint8ClampedArray(data);
  
  const kernelSize = radius * 2 + 1;
  const kernelWeight = kernelSize * kernelSize;
  
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      
      // Apply kernel
      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
        }
      }
      
      const idx = (y * width + x) * 4;
      output[idx] = r / kernelWeight;
      output[idx + 1] = g / kernelWeight;
      output[idx + 2] = b / kernelWeight;
      output[idx + 3] = a / kernelWeight;
    }
  }
  
  return new ImageData(output, width, height);
}
