/**
 * Culling Types
 * 
 * Type definitions for frustum culling and occlusion culling
 */

import { ISceneNode } from './NodeTypes';
import { Vector3 } from '../../utils/math/Vector3';

/**
 * Culling result
 */
export enum CullingResult {
  /** Object is fully inside frustum */
  INSIDE = 'inside',
  
  /** Object is partially inside frustum */
  INTERSECTING = 'intersecting',
  
  /** Object is fully outside frustum */
  OUTSIDE = 'outside'
}

/**
 * Culling test result
 */
export interface CullingTestResult {
  /** Test result */
  result: CullingResult;
  
  /** Tested node */
  node: ISceneNode;
  
  /** Distance to camera */
  distance: number;
  
  /** Is visible */
  visible: boolean;
  
  /** Culling reason (if not visible) */
  cullingReason?: CullingReason;
}

/**
 * Culling reason
 */
export enum CullingReason {
  /** Outside frustum */
  FRUSTUM = 'frustum',
  
  /** Occluded by other objects */
  OCCLUDED = 'occluded',
  
  /** Beyond max distance */
  DISTANCE = 'distance',
  
  /** Layer mask mismatch */
  LAYER = 'layer',
  
  /** Manually culled */
  MANUAL = 'manual'
}

/**
 * Frustum planes
 */
export interface FrustumPlanes {
  /** Left plane */
  left: Plane;
  
  /** Right plane */
  right: Plane;
  
  /** Top plane */
  top: Plane;
  
  /** Bottom plane */
  bottom: Plane;
  
  /** Near plane */
  near: Plane;
  
  /** Far plane */
  far: Plane;
}

/**
 * Plane definition
 */
export interface Plane {
  /** Plane normal */
  normal: Vector3;
  
  /** Distance from origin */
  distance: number;
}

/**
 * Bounding volume
 */
export interface BoundingVolume {
  /** Volume type */
  type: 'sphere' | 'aabb' | 'obb';
  
  /** Center point */
  center: Vector3;
  
  /** Extents/radius */
  extents: Vector3 | number;
  
  /** Is dirty */
  dirty: boolean;
}

/**
 * LOD (Level of Detail) configuration
 */
export interface LODConfiguration {
  /** LOD levels */
  levels: LODLevel[];
  
  /** LOD bias */
  bias: number;
  
  /** Hysteresis factor (prevents flickering) */
  hysteresis: number;
  
  /** Enable smooth transitions */
  smoothTransitions: boolean;
}

/**
 * LOD level
 */
export interface LODLevel {
  /** Distance threshold */
  distance: number;
  
  /** Object/mesh for this LOD */
  object: any;
  
  /** Screen coverage threshold (0-1) */
  screenCoverage?: number;
  
  /** Triangle budget */
  triangleBudget?: number;
}

/**
 * Occlusion query
 */
export interface OcclusionQuery {
  /** Query ID */
  id: string;
  
  /** Tested node */
  node: ISceneNode;
  
  /** Query result (pixels visible) */
  result: number;
  
  /** Is occluded */
  occluded: boolean;
  
  /** Query status */
  status: 'pending' | 'available' | 'failed';
  
  /** Frame number when query was issued */
  frameNumber: number;
}

/**
 * Culling statistics
 */
export interface CullingStatistics {
  /** Total objects tested */
  totalTested: number;
  
  /** Objects passed (visible) */
  passed: number;
  
  /** Objects culled */
  culled: number;
  
  /** Culled by frustum */
  culledByFrustum: number;
  
  /** Culled by occlusion */
  culledByOcclusion: number;
  
  /** Culled by distance */
  culledByDistance: number;
  
  /** Culled by layer */
  culledByLayer: number;
  
  /** Culling time (milliseconds) */
  cullingTime: number;
  
  /** Frame number */
  frameNumber: number;
}

/**
 * Culling configuration
 */
export interface CullingConfig {
  /** Enable frustum culling */
  frustumCulling?: boolean;
  
  /** Enable occlusion culling */
  occlusionCulling?: boolean;
  
  /** Enable distance culling */
  distanceCulling?: boolean;
  
  /** Maximum render distance */
  maxRenderDistance?: number;
  
  /** Enable LOD */
  enableLOD?: boolean;
  
  /** LOD bias */
  lodBias?: number;
  
  /** Occlusion query delay (frames) */
  occlusionQueryDelay?: number;
  
  /** Enable culling statistics */
  enableStatistics?: boolean;
}

/**
 * Spatial partitioning type
 */
export enum SpatialPartitioningType {
  /** No partitioning */
  NONE = 'none',
  
  /** Octree */
  OCTREE = 'octree',
  
  /** Quadtree */
  QUADTREE = 'quadtree',
  
  /** BVH (Bounding Volume Hierarchy) */
  BVH = 'bvh',
  
  /** Grid */
  GRID = 'grid'
}

/**
 * Spatial partition node
 */
export interface SpatialPartitionNode {
  /** Node bounds */
  bounds: BoundingVolume;
  
  /** Contained objects */
  objects: ISceneNode[];
  
  /** Child nodes */
  children: SpatialPartitionNode[];
  
  /** Depth in tree */
  depth: number;
  
  /** Is leaf node */
  isLeaf: boolean;
}

/**
 * Default culling configuration
 */
export const DEFAULT_CULLING_CONFIG: Required<CullingConfig> = {
  frustumCulling: true,
  occlusionCulling: false,
  distanceCulling: true,
  maxRenderDistance: 1000,
  enableLOD: true,
  lodBias: 1.0,
  occlusionQueryDelay: 2,
  enableStatistics: true
};
