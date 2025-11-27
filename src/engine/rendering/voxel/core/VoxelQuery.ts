/**
 * Voxel Query
 * 
 * Provides efficient spatial query operations for voxel data.
 * Supports various query types: box, sphere, frustum, ray, nearest neighbor.
 */

import * as THREE from 'three';
import { Voxel } from './Voxel';

/**
 * Query result with distance information
 */
export interface VoxelQueryResult {
  voxel: Voxel;
  distance: number;
  distanceSquared: number;
}

/**
 * Ray intersection result
 */
export interface VoxelRaycastResult {
  voxel: Voxel;
  point: THREE.Vector3;
  distance: number;
  normal: THREE.Vector3;
}

/**
 * Voxel query utility class
 */
export class VoxelQuery {
  /**
   * Query voxels within a bounding box
   */
  static queryBox(voxels: Voxel[], box: THREE.Box3): Voxel[] {
    return voxels.filter(voxel => box.containsPoint(voxel.position));
  }
  
  /**
   * Query voxels within a sphere
   */
  static querySphere(voxels: Voxel[], center: THREE.Vector3, radius: number): VoxelQueryResult[] {
    const results: VoxelQueryResult[] = [];
    const radiusSquared = radius * radius;
    
    for (const voxel of voxels) {
      const distSquared = voxel.position.distanceToSquared(center);
      
      if (distSquared <= radiusSquared) {
        results.push({
          voxel,
          distance: Math.sqrt(distSquared),
          distanceSquared: distSquared
        });
      }
    }
    
    // Sort by distance
    results.sort((a, b) => a.distanceSquared - b.distanceSquared);
    
    return results;
  }
  
  /**
   * Query voxels within a frustum
   */
  static queryFrustum(voxels: Voxel[], frustum: THREE.Frustum): Voxel[] {
    return voxels.filter(voxel => frustum.containsPoint(voxel.position));
  }
  
  /**
   * Find nearest voxel to a point
   */
  static findNearest(voxels: Voxel[], point: THREE.Vector3): VoxelQueryResult | null {
    if (voxels.length === 0) return null;
    
    let nearest: VoxelQueryResult | null = null;
    let minDistSquared = Infinity;
    
    for (const voxel of voxels) {
      const distSquared = voxel.position.distanceToSquared(point);
      
      if (distSquared < minDistSquared) {
        minDistSquared = distSquared;
        nearest = {
          voxel,
          distance: Math.sqrt(distSquared),
          distanceSquared: distSquared
        };
      }
    }
    
    return nearest;
  }
  
  /**
   * Find K nearest voxels to a point
   */
  static findKNearest(voxels: Voxel[], point: THREE.Vector3, k: number): VoxelQueryResult[] {
    if (voxels.length === 0 || k <= 0) return [];
    
    const results: VoxelQueryResult[] = voxels.map(voxel => {
      const distSquared = voxel.position.distanceToSquared(point);
      return {
        voxel,
        distance: Math.sqrt(distSquared),
        distanceSquared: distSquared
      };
    });
    
    // Sort by distance and take first k
    results.sort((a, b) => a.distanceSquared - b.distanceSquared);
    return results.slice(0, k);
  }
  
  /**
   * Raycast against voxels
   */
  static raycast(
    voxels: Voxel[],
    ray: THREE.Ray,
    maxDistance: number = Infinity
  ): VoxelRaycastResult | null {
    let closestResult: VoxelRaycastResult | null = null;
    let closestDistance = maxDistance;
    
    for (const voxel of voxels) {
      const voxelBox = voxel.getBounds();
      const intersection = ray.intersectBox(voxelBox, new THREE.Vector3());
      
      if (intersection) {
        const distance = ray.origin.distanceTo(intersection);
        
        if (distance < closestDistance) {
          // Calculate normal based on which face was hit
          const normal = this.calculateBoxNormal(intersection, voxelBox);
          
          closestDistance = distance;
          closestResult = {
            voxel,
            point: intersection,
            distance,
            normal
          };
        }
      }
    }
    
    return closestResult;
  }
  
  /**
   * Raycast and return all intersections
   */
  static raycastAll(
    voxels: Voxel[],
    ray: THREE.Ray,
    maxDistance: number = Infinity
  ): VoxelRaycastResult[] {
    const results: VoxelRaycastResult[] = [];
    
    for (const voxel of voxels) {
      const voxelBox = voxel.getBounds();
      const intersection = ray.intersectBox(voxelBox, new THREE.Vector3());
      
      if (intersection) {
        const distance = ray.origin.distanceTo(intersection);
        
        if (distance <= maxDistance) {
          const normal = this.calculateBoxNormal(intersection, voxelBox);
          
          results.push({
            voxel,
            point: intersection,
            distance,
            normal
          });
        }
      }
    }
    
    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);
    
    return results;
  }
  
  /**
   * Find voxels within a distance range
   */
  static queryDistanceRange(
    voxels: Voxel[],
    point: THREE.Vector3,
    minDistance: number,
    maxDistance: number
  ): VoxelQueryResult[] {
    const results: VoxelQueryResult[] = [];
    const minDistSquared = minDistance * minDistance;
    const maxDistSquared = maxDistance * maxDistance;
    
    for (const voxel of voxels) {
      const distSquared = voxel.position.distanceToSquared(point);
      
      if (distSquared >= minDistSquared && distSquared <= maxDistSquared) {
        results.push({
          voxel,
          distance: Math.sqrt(distSquared),
          distanceSquared: distSquared
        });
      }
    }
    
    results.sort((a, b) => a.distanceSquared - b.distanceSquared);
    return results;
  }
  
  /**
   * Find voxels matching a color (with threshold)
   */
  static queryByColor(
    voxels: Voxel[],
    targetColor: THREE.Color,
    threshold: number = 0.1
  ): Voxel[] {
    return voxels.filter(voxel => {
      const dr = voxel.color.r - targetColor.r;
      const dg = voxel.color.g - targetColor.g;
      const db = voxel.color.b - targetColor.b;
      const colorDist = Math.sqrt(dr * dr + dg * dg + db * db);
      return colorDist <= threshold;
    });
  }
  
  /**
   * Find voxels matching material properties
   */
  static queryByMaterial(
    voxels: Voxel[],
    metalness?: number,
    roughness?: number,
    threshold: number = 0.1
  ): Voxel[] {
    return voxels.filter(voxel => {
      if (metalness !== undefined) {
        if (Math.abs(voxel.material.metalness - metalness) > threshold) {
          return false;
        }
      }
      
      if (roughness !== undefined) {
        if (Math.abs(voxel.material.roughness - roughness) > threshold) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Find neighbors of a voxel (within distance)
   */
  static findNeighbors(
    voxels: Voxel[],
    targetVoxel: Voxel,
    maxDistance: number
  ): VoxelQueryResult[] {
    const results: VoxelQueryResult[] = [];
    const maxDistSquared = maxDistance * maxDistance;
    
    for (const voxel of voxels) {
      if (voxel === targetVoxel) continue;
      
      const distSquared = voxel.position.distanceToSquared(targetVoxel.position);
      
      if (distSquared <= maxDistSquared) {
        results.push({
          voxel,
          distance: Math.sqrt(distSquared),
          distanceSquared: distSquared
        });
      }
    }
    
    results.sort((a, b) => a.distanceSquared - b.distanceSquared);
    return results;
  }
  
  /**
   * Find similar voxels (color + material similarity)
   */
  static findSimilar(
    voxels: Voxel[],
    targetVoxel: Voxel,
    colorThreshold: number = 0.1,
    materialThreshold: number = 0.1
  ): Voxel[] {
    return voxels.filter(voxel => 
      voxel !== targetVoxel && voxel.isSimilarTo(targetVoxel, colorThreshold, materialThreshold)
    );
  }
  
  /**
   * Calculate box normal from intersection point
   */
  private static calculateBoxNormal(point: THREE.Vector3, box: THREE.Box3): THREE.Vector3 {
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const halfSize = size.multiplyScalar(0.5);
    
    // Calculate distance to each face
    const distances = [
      Math.abs(point.x - (center.x + halfSize.x)), // Right
      Math.abs(point.x - (center.x - halfSize.x)), // Left
      Math.abs(point.y - (center.y + halfSize.y)), // Top
      Math.abs(point.y - (center.y - halfSize.y)), // Bottom
      Math.abs(point.z - (center.z + halfSize.z)), // Front
      Math.abs(point.z - (center.z - halfSize.z))  // Back
    ];
    
    // Find closest face
    const minDist = Math.min(...distances);
    const faceIndex = distances.indexOf(minDist);
    
    // Return normal for that face
    const normals = [
      new THREE.Vector3(1, 0, 0),   // Right
      new THREE.Vector3(-1, 0, 0),  // Left
      new THREE.Vector3(0, 1, 0),   // Top
      new THREE.Vector3(0, -1, 0),  // Bottom
      new THREE.Vector3(0, 0, 1),   // Front
      new THREE.Vector3(0, 0, -1)   // Back
    ];
    
    return normals[faceIndex];
  }
  
  /**
   * Filter voxels by custom predicate
   */
  static filter(voxels: Voxel[], predicate: (voxel: Voxel) => boolean): Voxel[] {
    return voxels.filter(predicate);
  }
  
  /**
   * Group voxels by a key function
   */
  static groupBy<K>(voxels: Voxel[], keyFn: (voxel: Voxel) => K): Map<K, Voxel[]> {
    const groups = new Map<K, Voxel[]>();
    
    for (const voxel of voxels) {
      const key = keyFn(voxel);
      const group = groups.get(key) || [];
      group.push(voxel);
      groups.set(key, group);
    }
    
    return groups;
  }
  
  /**
   * Get voxels on the surface (have at least one empty neighbor)
   */
  static getSurfaceVoxels(voxels: Voxel[]): Voxel[] {
    // Create a set of occupied positions for fast lookup
    const occupiedSet = new Set<string>();
    for (const voxel of voxels) {
      const key = `${voxel.position.x},${voxel.position.y},${voxel.position.z}`;
      occupiedSet.add(key);
    }
    
    // Find voxels with at least one empty neighbor
    return voxels.filter(voxel => {
      const neighbors = [
        [voxel.position.x + 1, voxel.position.y, voxel.position.z],
        [voxel.position.x - 1, voxel.position.y, voxel.position.z],
        [voxel.position.x, voxel.position.y + 1, voxel.position.z],
        [voxel.position.x, voxel.position.y - 1, voxel.position.z],
        [voxel.position.x, voxel.position.y, voxel.position.z + 1],
        [voxel.position.x, voxel.position.y, voxel.position.z - 1]
      ];
      
      // Check if any neighbor is empty
      for (const [x, y, z] of neighbors) {
        const key = `${x},${y},${z}`;
        if (!occupiedSet.has(key)) {
          return true; // This is a surface voxel
        }
      }
      
      return false; // All neighbors occupied, this is internal
    });
  }
  
  /**
   * Get voxels on a specific plane
   */
  static queryPlane(
    voxels: Voxel[],
    plane: THREE.Plane,
    thickness: number = 0.5
  ): Voxel[] {
    return voxels.filter(voxel => {
      const distance = Math.abs(plane.distanceToPoint(voxel.position));
      return distance <= thickness;
    });
  }
  
  /**
   * Sample voxels at regular intervals
   */
  static sample(voxels: Voxel[], interval: number): Voxel[] {
    return voxels.filter((_, index) => index % interval === 0);
  }
  
  /**
   * Get voxels in a grid region
   */
  static queryGridRegion(
    voxels: Voxel[],
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number
  ): Voxel[] {
    return voxels.filter(voxel => {
      const p = voxel.position;
      return p.x >= minX && p.x <= maxX &&
             p.y >= minY && p.y <= maxY &&
             p.z >= minZ && p.z <= maxZ;
    });
  }
}
