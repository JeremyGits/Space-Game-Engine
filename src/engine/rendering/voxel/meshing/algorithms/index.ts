/**
 * Meshing Algorithms - Export Module
 * 
 * Advanced mesh optimization algorithms for voxel rendering.
 */

// Greedy quad meshing
export { GreedyQuads, FaceDirection } from './GreedyQuads';
export type { QuadFace, GreedyMeshingOptions, GreedyMeshingResult } from './GreedyQuads';

// Face culling
export { CulledFaces } from './CulledFaces';
export type { VoxelFace, CullingOptions, CullingResult } from './CulledFaces';
export { FaceDirection as CullFaceDirection } from './CulledFaces';

// Shared vertices
export { SharedVertices } from './SharedVertices';
export type { SharedVertex, SharedVerticesOptions, SharedVerticesResult } from './SharedVertices';

// Index optimization
export { IndexOptimization } from './IndexOptimization';
export type { IndexOptimizationOptions, OptimizationResult } from './IndexOptimization';

// Triangle strip generation
export { StripGeneration } from './StripGeneration';
export type { TriangleStrip, StripGenerationOptions, StripGenerationResult } from './StripGeneration';
