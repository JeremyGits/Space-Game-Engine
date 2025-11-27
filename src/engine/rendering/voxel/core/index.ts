/**
 * Voxel Core - Data Structures Export
 * 
 * Core voxel data structures for the hybrid voxel-triangle rendering system.
 */

// Voxel data structure
export { Voxel, VoxelUtils } from './Voxel';
export type { VoxelMaterial } from './Voxel';

// Octree structures
export { OctreeNode } from './OctreeNode';
export { SparseVoxelOctree } from './SparseVoxelOctree';
export type { SparseVoxelOctreeConfig } from './SparseVoxelOctree';

// Dense grid (reference implementation)
export { VoxelGrid } from './VoxelGrid';

// Utilities
export { VoxelBounds } from './VoxelBounds';
export { VoxelQuery } from './VoxelQuery';
export type { VoxelQueryResult, VoxelRaycastResult } from './VoxelQuery';
