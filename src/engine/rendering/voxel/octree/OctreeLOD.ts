/**
 * Octree LOD (Level of Detail)
 * 
 * Manages adaptive level of detail for voxel octrees.
 * Provides distance-based LOD selection and smooth transitions.
 */

import * as THREE from 'three';
import { OctreeNode } from '../core/OctreeNode';
import { Voxel } from '../core/Voxel';
import { OctreeTraversal } from './OctreeTraversal';

/**
 * LOD level configuration
 */
export interface LODLevel {
  /** Minimum distance for this LOD level */
  minDistance: number;
  
  /** Maximum distance for this LOD level */
  maxDistance: number;
  
  /** Target octree depth for this LOD */
  targetDepth: number;
  
  /** Voxel detail multiplier (1.0 = full detail, 0.5 = half detail) */
  detailMultiplier: number;
}

/**
 * LOD configuration
 */
export interface LODConfig {
  /** LOD levels (sorted by distance) */
  levels: LODLevel[];
  
  /** Enable smooth transitions between LOD levels */
  smoothTransitions?: boolean;
  
  /** Transition distance (blend zone between LOD levels) */
  transitionDistance?: number;
  
  /** Hysteresis to prevent LOD popping */
  hysteresis?: number;
}

/**
 * LOD selection result
 */
export interface LODSelection {
  /** Selected LOD level */
  level: number;
  
  /** Blend factor for transitions (0-1) */
  blendFactor: number;
  
  /** Target depth for this LOD */
  targetDepth: number;
  
  /** Detail multiplier */
  detailMultiplier: number;
}

/**
 * Octree LOD manager class
 */
export class OctreeLOD {
  private config: LODConfig;
  private currentLODMap: Map<OctreeNode, number> = new Map();
  
  constructor(config: LODConfig) {
    this.config = config;
    
    // Sort levels by distance
    this.config.levels.sort((a, b) => a.minDistance - b.minDistance);
  }
  
  /**
   * Select LOD level for a node based on distance
   */
  selectLOD(
    node: OctreeNode,
    cameraPosition: THREE.Vector3
  ): LODSelection {
    // Calculate distance from camera to node
    const closestPoint = node.bounds.clampPoint(cameraPosition, new THREE.Vector3());
    const distance = cameraPosition.distanceTo(closestPoint);
    
    // Find appropriate LOD level
    let selectedLevel = this.config.levels.length - 1; // Default to lowest detail
    let blendFactor = 0;
    
    for (let i = 0; i < this.config.levels.length; i++) {
      const level = this.config.levels[i];
      
      if (distance >= level.minDistance && distance < level.maxDistance) {
        selectedLevel = i;
        
        // Calculate blend factor for smooth transitions
        if (this.config.smoothTransitions) {
          const transitionDist = this.config.transitionDistance ?? 10;
          const distFromMax = level.maxDistance - distance;
          blendFactor = Math.max(0, Math.min(1, distFromMax / transitionDist));
        }
        
        break;
      }
    }
    
    const level = this.config.levels[selectedLevel];
    
    return {
      level: selectedLevel,
      blendFactor,
      targetDepth: level.targetDepth,
      detailMultiplier: level.detailMultiplier
    };
  }
  
  /**
   * Get voxels at appropriate LOD for rendering
   */
  getVoxelsForLOD(
    root: OctreeNode,
    cameraPosition: THREE.Vector3,
    frustum?: THREE.Frustum
  ): Voxel[] {
    const voxels: Voxel[] = [];
    
    OctreeTraversal.traverseDepthFirstPre(root, (node) => {
      // Frustum cull if provided
      if (frustum && !frustum.intersectsBox(node.bounds)) {
        return false;
      }
      
      // Select LOD for this node
      const lod = this.selectLOD(node, cameraPosition);
      
      // If we're at or past target depth, collect voxels
      if (node.level >= lod.targetDepth) {
        if (node.isLeaf && node.voxels) {
          // Apply detail multiplier (sample voxels)
          const sampleRate = Math.max(1, Math.floor(1 / lod.detailMultiplier));
          for (let i = 0; i < node.voxels.length; i += sampleRate) {
            if (node.voxels[i].active) {
              voxels.push(node.voxels[i]);
            }
          }
        }
        return false; // Don't go deeper
      }
      
      return true; // Continue to children
    });
    
    return voxels;
  }
  
  /**
   * Get nodes at appropriate LOD level
   */
  getNodesForLOD(
    root: OctreeNode,
    cameraPosition: THREE.Vector3
  ): Map<number, OctreeNode[]> {
    const lodNodes = new Map<number, OctreeNode[]>();
    
    // Initialize maps for each LOD level
    for (let i = 0; i < this.config.levels.length; i++) {
      lodNodes.set(i, []);
    }
    
    OctreeTraversal.traverseDepthFirstPre(root, (node) => {
      const lod = this.selectLOD(node, cameraPosition);
      
      const nodes = lodNodes.get(lod.level) || [];
      nodes.push(node);
      lodNodes.set(lod.level, nodes);
      
      return true;
    });
    
    return lodNodes;
  }
  
  /**
   * Update LOD for all nodes
   */
  updateLOD(root: OctreeNode, cameraPosition: THREE.Vector3): void {
    this.currentLODMap.clear();
    
    OctreeTraversal.traverseDepthFirstPre(root, (node) => {
      const lod = this.selectLOD(node, cameraPosition);
      this.currentLODMap.set(node, lod.level);
      return true;
    });
  }
  
  /**
   * Get current LOD level for a node
   */
  getCurrentLOD(node: OctreeNode): number | undefined {
    return this.currentLODMap.get(node);
  }
  
  /**
   * Create default LOD configuration
   */
  static createDefaultConfig(): LODConfig {
    return {
      levels: [
        {
          minDistance: 0,
          maxDistance: 50,
          targetDepth: 8,
          detailMultiplier: 1.0 // Full detail
        },
        {
          minDistance: 50,
          maxDistance: 100,
          targetDepth: 6,
          detailMultiplier: 0.75
        },
        {
          minDistance: 100,
          maxDistance: 200,
          targetDepth: 4,
          detailMultiplier: 0.5
        },
        {
          minDistance: 200,
          maxDistance: 500,
          targetDepth: 2,
          detailMultiplier: 0.25
        },
        {
          minDistance: 500,
          maxDistance: Infinity,
          targetDepth: 1,
          detailMultiplier: 0.1 // Minimal detail
        }
      ],
      smoothTransitions: true,
      transitionDistance: 10,
      hysteresis: 5
    };
  }
  
  /**
   * Create aggressive LOD configuration (more culling)
   */
  static createAggressiveConfig(): LODConfig {
    return {
      levels: [
        {
          minDistance: 0,
          maxDistance: 25,
          targetDepth: 8,
          detailMultiplier: 1.0
        },
        {
          minDistance: 25,
          maxDistance: 50,
          targetDepth: 5,
          detailMultiplier: 0.5
        },
        {
          minDistance: 50,
          maxDistance: 100,
          targetDepth: 3,
          detailMultiplier: 0.25
        },
        {
          minDistance: 100,
          maxDistance: Infinity,
          targetDepth: 1,
          detailMultiplier: 0.1
        }
      ],
      smoothTransitions: true,
      transitionDistance: 5,
      hysteresis: 2
    };
  }
  
  /**
   * Create quality LOD configuration (less culling, more detail)
   */
  static createQualityConfig(): LODConfig {
    return {
      levels: [
        {
          minDistance: 0,
          maxDistance: 100,
          targetDepth: 8,
          detailMultiplier: 1.0
        },
        {
          minDistance: 100,
          maxDistance: 250,
          targetDepth: 7,
          detailMultiplier: 0.9
        },
        {
          minDistance: 250,
          maxDistance: 500,
          targetDepth: 5,
          detailMultiplier: 0.7
        },
        {
          minDistance: 500,
          maxDistance: Infinity,
          targetDepth: 3,
          detailMultiplier: 0.4
        }
      ],
      smoothTransitions: true,
      transitionDistance: 20,
      hysteresis: 10
    };
  }
  
  /**
   * Calculate LOD statistics
   */
  static calculateLODStats(
    root: OctreeNode,
    cameraPosition: THREE.Vector3,
    config: LODConfig
  ): Map<number, { nodes: number; voxels: number }> {
    const stats = new Map<number, { nodes: number; voxels: number }>();
    const lod = new OctreeLOD(config);
    
    // Initialize stats for each level
    for (let i = 0; i < config.levels.length; i++) {
      stats.set(i, { nodes: 0, voxels: 0 });
    }
    
    OctreeTraversal.traverseDepthFirstPre(root, (node) => {
      const selection = lod.selectLOD(node, cameraPosition);
      const levelStats = stats.get(selection.level)!;
      
      levelStats.nodes++;
      if (node.isLeaf && node.voxels) {
        levelStats.voxels += node.voxels.length;
      }
      
      return true;
    });
    
    return stats;
  }
}
