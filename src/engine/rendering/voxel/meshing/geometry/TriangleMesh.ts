/**
 * Triangle Mesh
 * 
 * Represents a mesh composed of triangles.
 * Standard mesh format for voxel rendering.
 * 
 * Features:
 * - Triangle-based geometry
 * - Indexed rendering
 * - Efficient storage
 * - Three.js integration
 */

import * as THREE from 'three';
import { VertexBuffer } from './VertexBuffer';
import { IndexBuffer } from './IndexBuffer';
import { NormalCalculator, NormalMethod } from './NormalCalculator';

/**
 * Triangle data
 */
export interface Triangle {
  /** Triangle vertices (3 corners) */
  vertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
  
  /** Triangle normal */
  normal: THREE.Vector3;
  
  /** Triangle color */
  color: THREE.Color;
  
  /** UV coordinates */
  uvs: [THREE.Vector2, THREE.Vector2, THREE.Vector2];
}

/**
 * Triangle mesh options
 */
export interface TriangleMeshOptions {
  /** Initial capacity */
  capacity?: number;
  
  /** Calculate normals automatically */
  autoNormals?: boolean;
  
  /** Normal calculation method */
  normalMethod?: NormalMethod;
  
  /** Include tangents */
  includeTangents?: boolean;
  
  /** Use 32-bit indices */
  use32BitIndices?: boolean;
}

/**
 * Triangle mesh class
 */
export class TriangleMesh {
  private vertexBuffer: VertexBuffer;
  private indexBuffer: IndexBuffer;
  private normalCalculator: NormalCalculator;
  private triangles: Triangle[] = [];
  private options: Required<TriangleMeshOptions>;
  
  constructor(options: TriangleMeshOptions = {}) {
    this.options = {
      capacity: options.capacity ?? 1000,
      autoNormals: options.autoNormals ?? true,
      normalMethod: options.normalMethod ?? NormalMethod.SMOOTH,
      includeTangents: options.includeTangents ?? false,
      use32BitIndices: options.use32BitIndices ?? false
    };
    
    this.vertexBuffer = new VertexBuffer({
      capacity: this.options.capacity * 3, // 3 vertices per triangle
      includeTangents: this.options.includeTangents
    });
    
    this.indexBuffer = new IndexBuffer({
      capacity: this.options.capacity * 3, // 3 indices per triangle
      force32Bit: this.options.use32BitIndices
    });
    
    this.normalCalculator = new NormalCalculator({
      method: this.options.normalMethod
    });
  }
  
  /**
   * Add triangle
   */
  addTriangle(triangle: Triangle): void {
    this.triangles.push(triangle);
    
    // Add vertices
    const vertexIndices: number[] = [];
    
    for (let i = 0; i < 3; i++) {
      const index = this.vertexBuffer.addVertex(
        triangle.vertices[i],
        triangle.normal,
        triangle.color,
        triangle.uvs[i]
      );
      vertexIndices.push(index);
    }
    
    // Add indices
    this.indexBuffer.addTriangle(
      vertexIndices[0],
      vertexIndices[1],
      vertexIndices[2]
    );
  }
  
  /**
   * Add triangle from vertices
   */
  addTriangleFromVertices(
    v0: THREE.Vector3,
    v1: THREE.Vector3,
    v2: THREE.Vector3,
    color: THREE.Color
  ): void {
    // Calculate normal
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    
    // Default UVs
    const uvs: [THREE.Vector2, THREE.Vector2, THREE.Vector2] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(1, 0),
      new THREE.Vector2(0, 1)
    ];
    
    this.addTriangle({
      vertices: [v0, v1, v2],
      normal,
      color,
      uvs
    });
  }
  
  /**
   * Add quad as two triangles
   */
  addQuad(
    v0: THREE.Vector3,
    v1: THREE.Vector3,
    v2: THREE.Vector3,
    v3: THREE.Vector3,
    color: THREE.Color
  ): void {
    // Triangle 1: v0, v1, v2
    this.addTriangleFromVertices(v0, v1, v2, color);
    
    // Triangle 2: v0, v2, v3
    this.addTriangleFromVertices(v0, v2, v3, color);
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
   * Get triangle count
   */
  getTriangleCount(): number {
    return this.triangles.length;
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
    this.triangles = [];
    this.vertexBuffer.clear();
    this.indexBuffer.clear();
  }
  
  /**
   * Merge with another triangle mesh
   */
  merge(other: TriangleMesh): void {
    const offset = this.vertexBuffer.getCount();
    
    // Copy vertices
    for (const triangle of other.triangles) {
      this.addTriangle(triangle);
    }
  }
  
  /**
   * Get memory usage
   */
  getMemoryUsage(): number {
    return this.indexBuffer.getMemoryUsage() + 
           (this.vertexBuffer.getCount() * 11 * 4); // 11 floats per vertex
  }
  
  /**
   * Optimize mesh
   */
  optimize(): void {
    // Remove degenerate triangles
    this.indexBuffer.removeDegenerates();
  }
  
  /**
   * Clone mesh
   */
  clone(): TriangleMesh {
    const cloned = new TriangleMesh(this.options);
    
    for (const triangle of this.triangles) {
      cloned.addTriangle({
        vertices: [
          triangle.vertices[0].clone(),
          triangle.vertices[1].clone(),
          triangle.vertices[2].clone()
        ],
        normal: triangle.normal.clone(),
        color: triangle.color.clone(),
        uvs: [
          triangle.uvs[0].clone(),
          triangle.uvs[1].clone(),
          triangle.uvs[2].clone()
        ]
      });
    }
    
    return cloned;
  }
}
