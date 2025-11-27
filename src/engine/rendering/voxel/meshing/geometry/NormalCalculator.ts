/**
 * Normal Calculator
 * 
 * Calculates surface normals for voxel meshes.
 * Supports multiple normal calculation methods.
 * 
 * Methods:
 * - Flat normals (per-face)
 * - Smooth normals (averaged)
 * - Weighted normals (by area/angle)
 * - Custom normals
 */

import * as THREE from 'three';

/**
 * Normal calculation method
 */
export enum NormalMethod {
  FLAT = 'flat',
  SMOOTH = 'smooth',
  WEIGHTED_AREA = 'weighted_area',
  WEIGHTED_ANGLE = 'weighted_angle'
}

/**
 * Normal calculation options
 */
export interface NormalCalculationOptions {
  /** Calculation method */
  method?: NormalMethod;
  
  /** Smoothing angle threshold (degrees) */
  smoothingAngle?: number;
  
  /** Normalize normals */
  normalize?: boolean;
}

/**
 * Normal calculator class
 */
export class NormalCalculator {
  private options: Required<NormalCalculationOptions>;
  
  constructor(options: NormalCalculationOptions = {}) {
    this.options = {
      method: options.method ?? NormalMethod.SMOOTH,
      smoothingAngle: options.smoothingAngle ?? 60,
      normalize: options.normalize ?? true
    };
  }
  
  /**
   * Calculate normals for indexed geometry
   */
  calculateNormals(
    positions: Float32Array,
    indices: Uint16Array | Uint32Array
  ): Float32Array {
    const vertexCount = positions.length / 3;
    const normals = new Float32Array(vertexCount * 3);
    
    switch (this.options.method) {
      case NormalMethod.FLAT:
        return this.calculateFlatNormals(positions, indices, normals);
      
      case NormalMethod.SMOOTH:
        return this.calculateSmoothNormals(positions, indices, normals);
      
      case NormalMethod.WEIGHTED_AREA:
        return this.calculateWeightedNormals(positions, indices, normals, true, false);
      
      case NormalMethod.WEIGHTED_ANGLE:
        return this.calculateWeightedNormals(positions, indices, normals, false, true);
    }
  }
  
  /**
   * Calculate flat normals (one normal per triangle)
   */
  private calculateFlatNormals(
    positions: Float32Array,
    indices: Uint16Array | Uint32Array,
    normals: Float32Array
  ): Float32Array {
    const triangleCount = indices.length / 3;
    
    for (let i = 0; i < triangleCount; i++) {
      const i0 = indices[i * 3];
      const i1 = indices[i * 3 + 1];
      const i2 = indices[i * 3 + 2];
      
      // Get triangle vertices
      const v0 = new THREE.Vector3(
        positions[i0 * 3],
        positions[i0 * 3 + 1],
        positions[i0 * 3 + 2]
      );
      
      const v1 = new THREE.Vector3(
        positions[i1 * 3],
        positions[i1 * 3 + 1],
        positions[i1 * 3 + 2]
      );
      
      const v2 = new THREE.Vector3(
        positions[i2 * 3],
        positions[i2 * 3 + 1],
        positions[i2 * 3 + 2]
      );
      
      // Calculate face normal
      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2);
      
      if (this.options.normalize) {
        normal.normalize();
      }
      
      // Set same normal for all three vertices
      normals[i0 * 3] = normal.x;
      normals[i0 * 3 + 1] = normal.y;
      normals[i0 * 3 + 2] = normal.z;
      
      normals[i1 * 3] = normal.x;
      normals[i1 * 3 + 1] = normal.y;
      normals[i1 * 3 + 2] = normal.z;
      
      normals[i2 * 3] = normal.x;
      normals[i2 * 3 + 1] = normal.y;
      normals[i2 * 3 + 2] = normal.z;
    }
    
    return normals;
  }
  
  /**
   * Calculate smooth normals (averaged across shared vertices)
   */
  private calculateSmoothNormals(
    positions: Float32Array,
    indices: Uint16Array | Uint32Array,
    normals: Float32Array
  ): Float32Array {
    const triangleCount = indices.length / 3;
    const vertexCount = positions.length / 3;
    
    // Accumulate face normals
    const accumulated = new Float32Array(vertexCount * 3);
    
    for (let i = 0; i < triangleCount; i++) {
      const i0 = indices[i * 3];
      const i1 = indices[i * 3 + 1];
      const i2 = indices[i * 3 + 2];
      
      // Get triangle vertices
      const v0 = new THREE.Vector3(
        positions[i0 * 3],
        positions[i0 * 3 + 1],
        positions[i0 * 3 + 2]
      );
      
      const v1 = new THREE.Vector3(
        positions[i1 * 3],
        positions[i1 * 3 + 1],
        positions[i1 * 3 + 2]
      );
      
      const v2 = new THREE.Vector3(
        positions[i2 * 3],
        positions[i2 * 3 + 1],
        positions[i2 * 3 + 2]
      );
      
      // Calculate face normal
      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2);
      
      // Accumulate to vertices
      accumulated[i0 * 3] += faceNormal.x;
      accumulated[i0 * 3 + 1] += faceNormal.y;
      accumulated[i0 * 3 + 2] += faceNormal.z;
      
      accumulated[i1 * 3] += faceNormal.x;
      accumulated[i1 * 3 + 1] += faceNormal.y;
      accumulated[i1 * 3 + 2] += faceNormal.z;
      
      accumulated[i2 * 3] += faceNormal.x;
      accumulated[i2 * 3 + 1] += faceNormal.y;
      accumulated[i2 * 3 + 2] += faceNormal.z;
    }
    
    // Normalize accumulated normals
    for (let i = 0; i < vertexCount; i++) {
      const normal = new THREE.Vector3(
        accumulated[i * 3],
        accumulated[i * 3 + 1],
        accumulated[i * 3 + 2]
      );
      
      if (this.options.normalize) {
        normal.normalize();
      }
      
      normals[i * 3] = normal.x;
      normals[i * 3 + 1] = normal.y;
      normals[i * 3 + 2] = normal.z;
    }
    
    return normals;
  }
  
  /**
   * Calculate weighted normals
   */
  private calculateWeightedNormals(
    positions: Float32Array,
    indices: Uint16Array | Uint32Array,
    normals: Float32Array,
    weightByArea: boolean,
    weightByAngle: boolean
  ): Float32Array {
    const triangleCount = indices.length / 3;
    const vertexCount = positions.length / 3;
    
    // Accumulate weighted normals
    const accumulated = new Float32Array(vertexCount * 3);
    
    for (let i = 0; i < triangleCount; i++) {
      const i0 = indices[i * 3];
      const i1 = indices[i * 3 + 1];
      const i2 = indices[i * 3 + 2];
      
      // Get triangle vertices
      const v0 = new THREE.Vector3(
        positions[i0 * 3],
        positions[i0 * 3 + 1],
        positions[i0 * 3 + 2]
      );
      
      const v1 = new THREE.Vector3(
        positions[i1 * 3],
        positions[i1 * 3 + 1],
        positions[i1 * 3 + 2]
      );
      
      const v2 = new THREE.Vector3(
        positions[i2 * 3],
        positions[i2 * 3 + 1],
        positions[i2 * 3 + 2]
      );
      
      // Calculate edges
      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      
      // Calculate face normal
      const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2);
      
      // Calculate weight
      let weight = 1.0;
      
      if (weightByArea) {
        // Weight by triangle area
        weight = faceNormal.length() / 2;
      }
      
      if (weightByAngle) {
        // Weight by angle at each vertex
        const angle0 = edge1.angleTo(edge2);
        const angle1 = new THREE.Vector3().subVectors(v0, v1).angleTo(new THREE.Vector3().subVectors(v2, v1));
        const angle2 = new THREE.Vector3().subVectors(v0, v2).angleTo(new THREE.Vector3().subVectors(v1, v2));
        
        // Apply angle weights
        const weighted0 = faceNormal.clone().multiplyScalar(angle0);
        const weighted1 = faceNormal.clone().multiplyScalar(angle1);
        const weighted2 = faceNormal.clone().multiplyScalar(angle2);
        
        accumulated[i0 * 3] += weighted0.x;
        accumulated[i0 * 3 + 1] += weighted0.y;
        accumulated[i0 * 3 + 2] += weighted0.z;
        
        accumulated[i1 * 3] += weighted1.x;
        accumulated[i1 * 3 + 1] += weighted1.y;
        accumulated[i1 * 3 + 2] += weighted1.z;
        
        accumulated[i2 * 3] += weighted2.x;
        accumulated[i2 * 3 + 1] += weighted2.y;
        accumulated[i2 * 3 + 2] += weighted2.z;
        
        continue;
      }
      
      // Apply uniform weight
      const weighted = faceNormal.multiplyScalar(weight);
      
      accumulated[i0 * 3] += weighted.x;
      accumulated[i0 * 3 + 1] += weighted.y;
      accumulated[i0 * 3 + 2] += weighted.z;
      
      accumulated[i1 * 3] += weighted.x;
      accumulated[i1 * 3 + 1] += weighted.y;
      accumulated[i1 * 3 + 2] += weighted.z;
      
      accumulated[i2 * 3] += weighted.x;
      accumulated[i2 * 3 + 1] += weighted.y;
      accumulated[i2 * 3 + 2] += weighted.z;
    }
    
    // Normalize accumulated normals
    for (let i = 0; i < vertexCount; i++) {
      const normal = new THREE.Vector3(
        accumulated[i * 3],
        accumulated[i * 3 + 1],
        accumulated[i * 3 + 2]
      );
      
      if (this.options.normalize) {
        normal.normalize();
      }
      
      normals[i * 3] = normal.x;
      normals[i * 3 + 1] = normal.y;
      normals[i * 3 + 2] = normal.z;
    }
    
    return normals;
  }
  
  /**
   * Calculate tangents for normal mapping
   */
  calculateTangents(
    positions: Float32Array,
    normals: Float32Array,
    uvs: Float32Array,
    indices: Uint16Array | Uint32Array
  ): Float32Array {
    const vertexCount = positions.length / 3;
    const tangents = new Float32Array(vertexCount * 4);
    const triangleCount = indices.length / 3;
    
    // Temporary arrays for accumulation
    const tan1 = new Float32Array(vertexCount * 3);
    const tan2 = new Float32Array(vertexCount * 3);
    
    // Calculate tangents per triangle
    for (let i = 0; i < triangleCount; i++) {
      const i0 = indices[i * 3];
      const i1 = indices[i * 3 + 1];
      const i2 = indices[i * 3 + 2];
      
      // Get positions
      const v0 = new THREE.Vector3(positions[i0 * 3], positions[i0 * 3 + 1], positions[i0 * 3 + 2]);
      const v1 = new THREE.Vector3(positions[i1 * 3], positions[i1 * 3 + 1], positions[i1 * 3 + 2]);
      const v2 = new THREE.Vector3(positions[i2 * 3], positions[i2 * 3 + 1], positions[i2 * 3 + 2]);
      
      // Get UVs
      const uv0 = new THREE.Vector2(uvs[i0 * 2], uvs[i0 * 2 + 1]);
      const uv1 = new THREE.Vector2(uvs[i1 * 2], uvs[i1 * 2 + 1]);
      const uv2 = new THREE.Vector2(uvs[i2 * 2], uvs[i2 * 2 + 1]);
      
      // Calculate edges
      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      
      const deltaUV1 = new THREE.Vector2().subVectors(uv1, uv0);
      const deltaUV2 = new THREE.Vector2().subVectors(uv2, uv0);
      
      // Calculate tangent and bitangent
      const f = 1.0 / (deltaUV1.x * deltaUV2.y - deltaUV2.x * deltaUV1.y);
      
      const tangent = new THREE.Vector3(
        f * (deltaUV2.y * edge1.x - deltaUV1.y * edge2.x),
        f * (deltaUV2.y * edge1.y - deltaUV1.y * edge2.y),
        f * (deltaUV2.y * edge1.z - deltaUV1.y * edge2.z)
      );
      
      const bitangent = new THREE.Vector3(
        f * (-deltaUV2.x * edge1.x + deltaUV1.x * edge2.x),
        f * (-deltaUV2.x * edge1.y + deltaUV1.x * edge2.y),
        f * (-deltaUV2.x * edge1.z + deltaUV1.x * edge2.z)
      );
      
      // Accumulate
      tan1[i0 * 3] += tangent.x;
      tan1[i0 * 3 + 1] += tangent.y;
      tan1[i0 * 3 + 2] += tangent.z;
      
      tan1[i1 * 3] += tangent.x;
      tan1[i1 * 3 + 1] += tangent.y;
      tan1[i1 * 3 + 2] += tangent.z;
      
      tan1[i2 * 3] += tangent.x;
      tan1[i2 * 3 + 1] += tangent.y;
      tan1[i2 * 3 + 2] += tangent.z;
      
      tan2[i0 * 3] += bitangent.x;
      tan2[i0 * 3 + 1] += bitangent.y;
      tan2[i0 * 3 + 2] += bitangent.z;
      
      tan2[i1 * 3] += bitangent.x;
      tan2[i1 * 3 + 1] += bitangent.y;
      tan2[i1 * 3 + 2] += bitangent.z;
      
      tan2[i2 * 3] += bitangent.x;
      tan2[i2 * 3 + 1] += bitangent.y;
      tan2[i2 * 3 + 2] += bitangent.z;
    }
    
    // Orthogonalize and store
    for (let i = 0; i < vertexCount; i++) {
      const n = new THREE.Vector3(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
      const t = new THREE.Vector3(tan1[i * 3], tan1[i * 3 + 1], tan1[i * 3 + 2]);
      const b = new THREE.Vector3(tan2[i * 3], tan2[i * 3 + 1], tan2[i * 3 + 2]);
      
      // Gram-Schmidt orthogonalize
      const tangent = new THREE.Vector3().subVectors(t, n.clone().multiplyScalar(n.dot(t))).normalize();
      
      // Calculate handedness
      const handedness = n.clone().cross(t).dot(b) < 0 ? -1 : 1;
      
      tangents[i * 4] = tangent.x;
      tangents[i * 4 + 1] = tangent.y;
      tangents[i * 4 + 2] = tangent.z;
      tangents[i * 4 + 3] = handedness;
    }
    
    return tangents;
  }
  
  /**
   * Flip normals
   */
  flipNormals(normals: Float32Array): Float32Array {
    const flipped = new Float32Array(normals.length);
    
    for (let i = 0; i < normals.length; i++) {
      flipped[i] = -normals[i];
    }
    
    return flipped;
  }
  
  /**
   * Ensure normals are normalized
   */
  normalizeNormals(normals: Float32Array): Float32Array {
    const vertexCount = normals.length / 3;
    
    for (let i = 0; i < vertexCount; i++) {
      const normal = new THREE.Vector3(
        normals[i * 3],
        normals[i * 3 + 1],
        normals[i * 3 + 2]
      );
      
      normal.normalize();
      
      normals[i * 3] = normal.x;
      normals[i * 3 + 1] = normal.y;
      normals[i * 3 + 2] = normal.z;
    }
    
    return normals;
  }
}
