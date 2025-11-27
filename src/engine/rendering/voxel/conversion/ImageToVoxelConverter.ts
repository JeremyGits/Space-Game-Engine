/**
 * Image to Voxel Converter
 * 
 * Main converter that orchestrates all extraction steps to convert
 * 2D images into 3D voxel geometry.
 * 
 * Pipeline:
 * 1. Load image → ImageData
 * 2. Extract depth map
 * 3. Extract colors
 * 4. Extract materials
 * 5. Calculate normals
 * 6. Generate voxels
 * 7. Build octree
 * 8. Optimize
 */

import * as THREE from 'three';
import { Voxel } from '../core/Voxel';
import { SparseVoxelOctree } from '../core/SparseVoxelOctree';
import { OctreeBuilder, BuildStrategy } from '../octree/OctreeBuilder';
import { OctreeOptimizer } from '../octree/OctreeOptimizer';
import { DepthMapExtractor, type DepthExtractionOptions } from './DepthMapExtractor';
import { ColorExtractor, type ColorExtractionOptions } from './ColorExtractor';
import { MaterialExtractor, type MaterialExtractionOptions } from './MaterialExtractor';
import { NormalExtractor, type NormalExtractionOptions } from './NormalExtractor';

/**
 * Conversion options
 */
export interface ConversionOptions {
  /** Voxel resolution (pixels per voxel) */
  resolution?: number;
  
  /** Depth scale (how much depth to extrude) */
  depthScale?: number;
  
  /** Depth extraction options */
  depthOptions?: DepthExtractionOptions;
  
  /** Color extraction options */
  colorOptions?: ColorExtractionOptions;
  
  /** Material extraction options */
  materialOptions?: MaterialExtractionOptions;
  
  /** Normal extraction options */
  normalOptions?: NormalExtractionOptions;
  
  /** Build octree */
  buildOctree?: boolean;
  
  /** Optimize octree */
  optimizeOctree?: boolean;
  
  /** Progress callback */
  onProgress?: (progress: number, stage: string) => void;
}

/**
 * Conversion result
 */
export interface ConversionResult {
  /** Generated voxels */
  voxels: Voxel[];
  
  /** Octree (if built) */
  octree?: SparseVoxelOctree;
  
  /** Depth map */
  depthMap: Float32Array;
  
  /** Normals */
  normals: THREE.Vector3[];
  
  /** Conversion statistics */
  stats: {
    voxelCount: number;
    imageSize: [number, number];
    conversionTime: number;
    memoryUsage: number;
  };
}

/**
 * Image to voxel converter class
 */
export class ImageToVoxelConverter {
  private depthExtractor: DepthMapExtractor;
  private colorExtractor: ColorExtractor;
  private materialExtractor: MaterialExtractor;
  private normalExtractor: NormalExtractor;
  
  constructor(
    depthOptions?: DepthExtractionOptions,
    colorOptions?: ColorExtractionOptions,
    materialOptions?: MaterialExtractionOptions,
    normalOptions?: NormalExtractionOptions
  ) {
    this.depthExtractor = new DepthMapExtractor(depthOptions);
    this.colorExtractor = new ColorExtractor(colorOptions);
    this.materialExtractor = new MaterialExtractor(materialOptions);
    this.normalExtractor = new NormalExtractor(normalOptions);
  }
  
  /**
   * Convert image to voxels
   */
  async convert(
    imageData: ImageData,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const startTime = performance.now();
    
    const {
      resolution = 1,
      depthScale = 1.0,
      buildOctree = true,
      optimizeOctree = true,
      onProgress
    } = options;
    
    const { width, height } = imageData;
    
    console.log(`[ImageToVoxelConverter] Converting ${width}x${height} image to voxels`);
    
    // Step 1: Extract depth map
    onProgress?.(0.1, 'Extracting depth map');
    const depthMap = this.depthExtractor.extract(imageData);
    
    // Step 2: Extract colors
    onProgress?.(0.3, 'Extracting colors');
    const { colors, alphas } = this.colorExtractor.extract(imageData);
    
    // Step 3: Extract materials
    onProgress?.(0.5, 'Extracting materials');
    const materials = this.materialExtractor.extract(imageData, depthMap);
    
    // Step 4: Calculate normals
    onProgress?.(0.6, 'Calculating normals');
    const normals = this.normalExtractor.extract(depthMap, width, height);
    
    // Step 5: Generate voxels
    onProgress?.(0.7, 'Generating voxels');
    const voxels = this.generateVoxels(
      width,
      height,
      depthMap,
      colors,
      alphas,
      materials,
      resolution,
      depthScale
    );
    
    console.log(`[ImageToVoxelConverter] Generated ${voxels.length} voxels`);
    
    // Step 6: Build octree (optional)
    let octree: SparseVoxelOctree | undefined;
    
    if (buildOctree) {
      onProgress?.(0.8, 'Building octree');
      octree = OctreeBuilder.fromVoxels(voxels, undefined, {
        strategy: BuildStrategy.SORTED,
        optimize: false
      });
      
      // Step 7: Optimize octree (optional)
      if (optimizeOctree && octree) {
        onProgress?.(0.9, 'Optimizing octree');
        OctreeOptimizer.optimize(octree.getRoot(), {
          removeEmptyNodes: true,
          mergeSparselyPopulatedNodes: true,
          collapseUniformNodes: true
        });
      }
    }
    
    onProgress?.(1.0, 'Complete');
    
    const conversionTime = performance.now() - startTime;
    const memoryUsage = voxels.reduce((sum, v) => sum + v.getMemorySize(), 0);
    
    console.log(`[ImageToVoxelConverter] Conversion complete in ${conversionTime.toFixed(2)}ms`);
    
    return {
      voxels,
      octree,
      depthMap,
      normals,
      stats: {
        voxelCount: voxels.length,
        imageSize: [width, height],
        conversionTime,
        memoryUsage
      }
    };
  }
  
  /**
   * Generate voxels from extracted data
   */
  private generateVoxels(
    width: number,
    height: number,
    depthMap: Float32Array,
    colors: THREE.Color[],
    alphas: Float32Array,
    materials: any[],
    resolution: number,
    depthScale: number
  ): Voxel[] {
    const voxels: Voxel[] = [];
    const alphaThreshold = 0.1;
    
    // Sample at resolution intervals
    for (let y = 0; y < height; y += resolution) {
      for (let x = 0; x < width; x += resolution) {
        const idx = y * width + x;
        const alpha = alphas[idx];
        
        // Skip transparent pixels
        if (alpha < alphaThreshold) continue;
        
        const depth = depthMap[idx];
        const color = colors[idx];
        const material = materials[idx];
        
        // Generate voxels along depth
        const maxDepth = Math.ceil(depth * depthScale * 10);
        
        for (let z = 0; z < maxDepth; z++) {
          const voxel = new Voxel(
            x / resolution,
            y / resolution,
            z,
            color,
            alpha,
            material
          );
          
          voxels.push(voxel);
        }
      }
    }
    
    return voxels;
  }
  
  /**
   * Convert image URL to voxels
   */
  async convertFromURL(
    url: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const imageData = await this.loadImageData(url);
    return this.convert(imageData, options);
  }
  
  /**
   * Load image data from URL
   */
  private async loadImageData(url: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });
  }
  
  /**
   * Convert with custom extractors
   */
  async convertWithExtractors(
    imageData: ImageData,
    depthExtractor: DepthMapExtractor,
    colorExtractor: ColorExtractor,
    materialExtractor: MaterialExtractor,
    normalExtractor: NormalExtractor,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    // Temporarily swap extractors
    const originalDepth = this.depthExtractor;
    const originalColor = this.colorExtractor;
    const originalMaterial = this.materialExtractor;
    const originalNormal = this.normalExtractor;
    
    this.depthExtractor = depthExtractor;
    this.colorExtractor = colorExtractor;
    this.materialExtractor = materialExtractor;
    this.normalExtractor = normalExtractor;
    
    const result = await this.convert(imageData, options);
    
    // Restore original extractors
    this.depthExtractor = originalDepth;
    this.colorExtractor = originalColor;
    this.materialExtractor = originalMaterial;
    this.normalExtractor = originalNormal;
    
    return result;
  }
}
