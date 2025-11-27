/**
 * Quad Mesh
 * 
 * Represents a mesh composed of quads (4-sided polygons).
 * Optimized for voxel rendering with greedy meshing.
 * 
 * Features:
 * - Quad-based geometry
 * - Automatic triangulation
 * - Efficient storage
 * - Three.js integration
 */

import * as THREE from 'three';
import { VertexBuffer } from './VertexBuffer';
import { IndexBuffer } from './IndexBuffer';
import { NormalCalculator, NormalMethod } from './NormalCalculator';

/**
 * Quad data
 */
export interface Quad {
  /** Quad vertices (4 corners) */
  vertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
  
  /** Quad normal */
  normal: THREE.Vector3;
  
  /** Quad color */
  color: THREE.Color;
  
  /** UV coordinates */
  uvs: [THREE.Vector2, THREE.Vector2, THREE.Vector2, THREE.Vector2];
}

/**
 * Quad mesh options
 */
export interface QuadMeshOptions {
  /** Initial capacity */
  capacity?: number;
  
  /** Calculate normals automatically */
  autoNormals?: boolean;
  
  /** Normal calculation method */
  normalMethod?: NormalMethod;
  
  /** Include tangents */
  includeTangents?: boolean;
}

/**
 * Quad mesh class
 */
export class QuadMesh {
  private vertexBuffer: VertexBuffer;
  private indexBuffer: IndexBuffer;
  private normalCalculator: NormalCalculator;
  private quads: Quad[] = [];
  private options: Required<QuadMeshOptions>;
  
  constructor(options: QuadMeshOptions = {}) {
    this.options = {
      capacity: options.capacity ?? 1000,
      autoNormals: options.autoNormals ?? true,
      normalMethod: options.normalMethod ?? NormalMethod.FLAT,
      includeTangents: options.includeTangents ?? false
    };
    
    this.vertexBuffer = new VertexBuffer({
      capacity: this.options.capacity * 4, // 4 vertices per quad
      includeTangents: this.options.includeTangents
    });
    
    this.indexBuffer = new IndexBuffer({
      capacity: this.options.capacity * 6 // 6 indices per quad (2 triangles)
    });
    
    this.normalCalculator = new NormalCalculator({
      method: this.options.normalMethod
    });
  }
  
  /**
   * Add quad
   */
  addQuad(quad: Quad): void {
    this.quads.push(quad);
    
    // Add vertices
    const vertexIndices: number[] = [];
    
    for (let i = 0; i < 4; i++) {
      const index = this.vertexBuffer.addVertex(
        quad.vertices[i],
        quad.normal,
        quad.color,
        quad.uvs[i]
      );
      vertexIndices.push(index);
    }
    
    // Add indices (two triangles)
    this.indexBuffer.addQuad(
      vertexIndices[0],
      vertexIndices[1],
      vertexIndices[2],
      vertexIndices[3]
    );
  }
  
  /**
   * Add quad from corners
   */
  addQuadFromCorners(
    v0: THREE.Vector3,
    v1: THREE.Vector3,
    v2: THREE.Vector3,
    v3: THREE.Vector3,
    color: THREE.Color
  ): void {
    // Calculate normal
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v3, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    
    // Default UVs
    const uvs: [THREE.Vector2, THREE.Vector2, THREE.Vector2, THREE.Vector2] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(1, 0),
      new THREE.Vector2(1, 1),
      new THREE.Vector2(0, 1)
    ];
    
    this.addQuad({
      vertices: [v0, v1, v2, v3],
      normal,
      color,
      uvs
    });
  }
  
  /**
   * Build final mesh
   */
  build(): THREE.BufferGeometry {
    const geometry = this.vertexBuffer.toBufferGeometry();
    geometry.setIndex(Array.from(this.indexBuffer.getIndices()));
    
    // Recalculate normals if requested
    if (this.options.autoNormals) {
      const attrs = this.vertexBuffer.getAttributes();
      const indices = this.indexBuffer.getIndices();
      const normals = this.normalCalculator.calculateNormals(attrs.positions, indices);
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      
      // Calculate tangents if requested
      if (this.options.includeTangents) {
        const tangents = this.normalCalculator.calculateTangents(
          attrs.positions,
          normals,
          attrs.uvs,
          indices
        );
        geometry.setAttribute('tangent', new THREE.BufferAttribute(tangents, 4));
      }
    }
    
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    
    return geometry;
  }
  
  /**
   * Get quad count
   */
  getQuadCount(): number {
    return this.quads.length;
  }
  
  /**
   * Get triangle count
   */
  getTriangleCount(): number {
    return this.quads.length * 2;
  }
  
  /**
   * Get vertex count
   */
  getVertexCount(): number {
    return this.vertexBuffer.getCount();
  }
  
  /**
   * Clear mesh
   */
  clear(): void {
    this.quads = [];
    this.vertexBuffer.clear();
    this.indexBuffer.clear();
  }
  
  /**
   * Get memory usage
   */
  getMemoryUsage(): number {
    return this.indexBuffer.getMemoryUsage() + 
           (this.vertexBuffer.getCount() * 11 * 4); // 11 floats per vertex
  }
}
