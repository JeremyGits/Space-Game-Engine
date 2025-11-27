/**
 * Voxel Pipeline
 * 
 * Complete rendering pipeline from image to GPU.
 */

import * as THREE from 'three';
import { ImageToVoxelConverter } from '../conversion/ImageToVoxelConverter';
import { VoxelClusterer } from '../clustering/VoxelClusterer';
import { GreedyQuads } from '../meshing/algorithms/GreedyQuads';
import { InstancedVoxelRenderer } from '../gpu/optimization/InstancedVoxelRenderer';
import { Voxel } from '../core/Voxel';

export interface PipelineConfig {
  resolution: number;
  depthMethod: string;
  samplingMethod: string;
  clusteringAlgorithm: string;
  fillGaps: boolean;
  maxVoxels: number;
}

export class VoxelPipeline {
  private converter: ImageToVoxelConverter;
  private clusterer: VoxelClusterer;
  private mesher: GreedyQuads;
  private renderer: InstancedVoxelRenderer;
  
  constructor(maxVoxels: number = 100000) {
    this.converter = new ImageToVoxelConverter();
    this.clusterer = new VoxelClusterer();
    this.mesher = new GreedyQuads();
    this.renderer = new InstancedVoxelRenderer(maxVoxels);
  }
  
  async process(imageUrl: string, config: Partial<PipelineConfig> = {}): Promise<THREE.InstancedMesh> {
    const fullConfig: PipelineConfig = {
      resolution: config.resolution ?? 256,
      depthMethod: config.depthMethod ?? 'gradient',
      samplingMethod: config.samplingMethod ?? 'bicubic',
      clusteringAlgorithm: config.clusteringAlgorithm ?? 'spatial',
      fillGaps: config.fillGaps ?? true,
      maxVoxels: config.maxVoxels ?? 100000
    };
    
    // Stage 1: Convert image to voxels
    const voxels = await this.converter.convert(imageUrl, {
      resolution: fullConfig.resolution,
      depthMethod: fullConfig.depthMethod as any,
      samplingMethod: fullConfig.samplingMethod as any
    });
    
    // Stage 2: Cluster and fill gaps
    const clustered = this.clusterer.cluster(voxels, {
      algorithm: fullConfig.clusteringAlgorithm as any,
      fillGaps: fullConfig.fillGaps,
      gapFillMethod: 'triangle'
    });
    
    // Stage 3: Generate mesh
    const meshResult = this.mesher.generateMesh(clustered.voxels);
    
    // Stage 4: Upload to GPU
    this.renderer.initialize();
    this.renderer.update(clustered.voxels.slice(0, fullConfig.maxVoxels));
    
    return this.renderer.getMesh()!;
  }
  
  dispose(): void {
    this.renderer.dispose();
  }
}
