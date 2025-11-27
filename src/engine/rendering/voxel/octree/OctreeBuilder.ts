/**
 * Octree Builder
 * 
 * Provides various algorithms for building sparse voxel octrees from different sources.
 * Optimized for performance and memory efficiency.
 */

import * as THREE from 'three';
import { Voxel } from '../core/Voxel';
import { SparseVoxelOctree, type SparseVoxelOctreeConfig } from '../core/SparseVoxelOctree';
import { VoxelGrid } from '../core/VoxelGrid';

/**
 * Build strategy for octree construction
 */
export enum BuildStrategy {
  /** Insert voxels one by one (simple, slower) */
  INCREMENTAL = 'incremental',
  
  /** Sort voxels spatially before insertion (faster) */
  SORTED = 'sorted',
  
  /** Build bottom-up from voxels (fastest for large datasets) */
  BOTTOM_UP = 'bottom-up',
  
  /** Build from dense grid (optimized for grid data) */
  FROM_GRID = 'from-grid'
}

/**
 * Build options
 */
export interface OctreeBuildOptions {
  /** Build strategy to use */
  strategy?: BuildStrategy;
  
  /** Whether to optimize after building */
  optimize?: boolean;
  
  /** Progress callback (0-1) */
  onProgress?: (progress: number) => void;
  
  /** Batch size for incremental builds */
  batchSize?: number;
}

/**
 * Octree builder class
 */
export class OctreeBuilder {
  /**
   * Build octree from voxel array
   */
  static fromVoxels(
    voxels: Voxel[],
    config?: Partial<SparseVoxelOctreeConfig>,
    options: OctreeBuildOptions = {}
  ): SparseVoxelOctree {
    const strategy = options.strategy ?? BuildStrategy.SORTED;
    
    console.log(`[OctreeBuilder] Building octree from ${voxels.length} voxels using ${strategy} strategy`);
    const startTime = performance.now();
    
    let octree: SparseVoxelOctree;
    
    switch (strategy) {
      case BuildStrategy.INCREMENTAL:
        octree = this.buildIncremental(voxels, config, options);
        break;
      
      case BuildStrategy.SORTED:
        octree = this.buildSorted(voxels, config, options);
        break;
      
      case BuildStrategy.BOTTOM_UP:
        octree = this.buildBottomUp(voxels, config, options);
        break;
      
      case BuildStrategy.FROM_GRID:
        octree = this.buildFromGrid(voxels, config, options);
        break;
      
      default:
        octree = this.buildSorted(voxels, config, options);
    }
    
    // Optimize if requested
    if (options.optimize) {
      octree.optimize();
    }
    
    const buildTime = performance.now() - startTime;
    console.log(`[OctreeBuilder] Built octree in ${buildTime.toFixed(2)}ms`);
    
    return octree;
  }
  
  /**
   * Build octree incrementally (simple insertion)
   */
  private static buildIncremental(
    voxels: Voxel[],
    config?: Partial<SparseVoxelOctreeConfig>,
    options: OctreeBuildOptions = {}
  ): SparseVoxelOctree {
    const octree = new SparseVoxelOctree(config);
    const batchSize = options.batchSize ?? 1000;
    
    for (let i = 0; i < voxels.length; i++) {
      octree.insert(voxels[i]);
      
      // Report progress
      if (options.onProgress && i % batchSize === 0) {
        options.onProgress(i / voxels.length);
      }
    }
    
    if (options.onProgress) {
      options.onProgress(1.0);
    }
    
    return octree;
  }
  
  /**
   * Build octree with spatial sorting (faster)
   */
  private static buildSorted(
    voxels: Voxel[],
    config?: Partial<SparseVoxelOctreeConfig>,
    options: OctreeBuildOptions = {}
  ): SparseVoxelOctree {
    // Sort voxels by Morton code (Z-order curve) for better spatial locality
    const sortedVoxels = this.sortByMortonCode(voxels);
    
    const octree = new SparseVoxelOctree(config);
    const batchSize = options.batchSize ?? 1000;
    
    for (let i = 0; i < sortedVoxels.length; i++) {
      octree.insert(sortedVoxels[i]);
      
      if (options.onProgress && i % batchSize === 0) {
        options.onProgress(i / sortedVoxels.length);
      }
    }
    
    if (options.onProgress) {
      options.onProgress(1.0);
    }
    
    return octree;
  }
  
  /**
   * Build octree bottom-up (fastest for large datasets)
   */
  private static buildBottomUp(
    voxels: Voxel[],
    config?: Partial<SparseVoxelOctreeConfig>,
    options: OctreeBuildOptions = {}
  ): SparseVoxelOctree {
    // For now, use sorted strategy
    // TODO: Implement true bottom-up construction
    return this.buildSorted(voxels, config, options);
  }
  
  /**
   * Build octree from dense grid
   */
  private static buildFromGrid(
    voxels: Voxel[],
    config?: Partial<SparseVoxelOctreeConfig>,
    options: OctreeBuildOptions = {}
  ): SparseVoxelOctree {
    // Create grid first, then convert
    const grid = VoxelGrid.fromVoxels(voxels);
    const octree = SparseVoxelOctree.fromVoxels(grid.getAllVoxels(), config);
    
    if (options.onProgress) {
      options.onProgress(1.0);
    }
    
    return octree;
  }
  
  /**
   * Sort voxels by Morton code (Z-order curve)
   */
  private static sortByMortonCode(voxels: Voxel[]): Voxel[] {
    return voxels.slice().sort((a, b) => {
      const codeA = this.calculateMortonCode(a.position);
      const codeB = this.calculateMortonCode(b.position);
      return codeA - codeB;
    });
  }
  
  /**
   * Calculate Morton code (Z-order) for a position
   */
  private static calculateMortonCode(position: THREE.Vector3): number {
    const x = Math.floor(position.x) & 0x3FF; // 10 bits
    const y = Math.floor(position.y) & 0x3FF;
    const z = Math.floor(position.z) & 0x3FF;
    
    return this.interleaveBits(x, y, z);
  }
  
  /**
   * Interleave bits for Morton code
   */
  private static interleaveBits(x: number, y: number, z: number): number {
    let result = 0;
    
    for (let i = 0; i < 10; i++) {
      result |= ((x & (1 << i)) << (2 * i)) |
                ((y & (1 << i)) << (2 * i + 1)) |
                ((z & (1 << i)) << (2 * i + 2));
    }
    
    return result;
  }
  
  /**
   * Build octree from image with depth map
   */
  static fromImage(
    imageData: ImageData,
    depthMap: Float32Array,
    config?: Partial<SparseVoxelOctreeConfig>,
    options: OctreeBuildOptions = {}
  ): SparseVoxelOctree {
    console.log(`[OctreeBuilder] Building octree from ${imageData.width}x${imageData.height} image`);
    
    const voxels: Voxel[] = [];
    const { width, height } = imageData;
    const data = imageData.data;
    
    // Convert image pixels to voxels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const depth = depthMap[y * width + x];
        
        // Skip transparent pixels
        const alpha = data[i + 3] / 255;
        if (alpha < 0.01) continue;
        
        // Create voxel
        const color = new THREE.Color(
          data[i] / 255,
          data[i + 1] / 255,
          data[i + 2] / 255
        );
        
        const voxel = new Voxel(x, y, depth * 100, color, alpha);
        voxels.push(voxel);
      }
      
      // Report progress
      if (options.onProgress && y % 10 === 0) {
        options.onProgress(y / height);
      }
    }
    
    console.log(`[OctreeBuilder] Created ${voxels.length} voxels from image`);
    
    // Build octree from voxels
    return this.fromVoxels(voxels, config, options);
  }
  
  /**
   * Build octree from point cloud
   */
  static fromPointCloud(
    points: THREE.Vector3[],
    colors?: THREE.Color[],
    config?: Partial<SparseVoxelOctreeConfig>,
    options: OctreeBuildOptions = {}
  ): SparseVoxelOctree {
    console.log(`[OctreeBuilder] Building octree from ${points.length} points`);
    
    const voxels: Voxel[] = [];
    const defaultColor = new THREE.Color(0xffffff);
    
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const color = colors?.[i] ?? defaultColor;
      
      const voxel = new Voxel(
        Math.floor(point.x),
        Math.floor(point.y),
        Math.floor(point.z),
        color
      );
      
      voxels.push(voxel);
      
      if (options.onProgress && i % 1000 === 0) {
        options.onProgress(i / points.length);
      }
    }
    
    return this.fromVoxels(voxels, config, options);
  }
  
  /**
   * Build octree from mesh
   */
  static fromMesh(
    geometry: THREE.BufferGeometry,
    voxelSize: number = 1.0,
    config?: Partial<SparseVoxelOctreeConfig>,
    options: OctreeBuildOptions = {}
  ): SparseVoxelOctree {
    console.log('[OctreeBuilder] Building octree from mesh');
    
    // Get vertices
    const positions = geometry.attributes.position;
    const colors = geometry.attributes.color;
    
    const voxels: Voxel[] = [];
    const voxelMap = new Map<string, Voxel>();
    
    // Voxelize vertices
    for (let i = 0; i < positions.count; i++) {
      const x = Math.floor(positions.getX(i) / voxelSize);
      const y = Math.floor(positions.getY(i) / voxelSize);
      const z = Math.floor(positions.getZ(i) / voxelSize);
      
      const key = `${x},${y},${z}`;
      
      if (!voxelMap.has(key)) {
        const color = colors
          ? new THREE.Color(colors.getX(i), colors.getY(i), colors.getZ(i))
          : new THREE.Color(0xffffff);
        
        const voxel = new Voxel(x, y, z, color);
        voxelMap.set(key, voxel);
        voxels.push(voxel);
      }
      
      if (options.onProgress && i % 1000 === 0) {
        options.onProgress(i / positions.count);
      }
    }
    
    console.log(`[OctreeBuilder] Created ${voxels.length} voxels from mesh`);
    
    return this.fromVoxels(voxels, config, options);
  }
  
  /**
   * Merge multiple octrees into one
   */
  static merge(
    octrees: SparseVoxelOctree[],
    config?: Partial<SparseVoxelOctreeConfig>,
    options: OctreeBuildOptions = {}
  ): SparseVoxelOctree {
    console.log(`[OctreeBuilder] Merging ${octrees.length} octrees`);
    
    // Collect all voxels
    const allVoxels: Voxel[] = [];
    
    for (let i = 0; i < octrees.length; i++) {
      const voxels = octrees[i].getAllVoxels();
      allVoxels.push(...voxels);
      
      if (options.onProgress) {
        options.onProgress(i / octrees.length);
      }
    }
    
    console.log(`[OctreeBuilder] Collected ${allVoxels.length} voxels`);
    
    // Build new octree
    return this.fromVoxels(allVoxels, config, options);
  }
}
