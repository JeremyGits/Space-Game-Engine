/**
 * Vertex Buffer
 * 
 * Manages vertex data for voxel meshes.
 * Provides efficient storage and access to vertex attributes.
 * 
 * Attributes:
 * - Position (x, y, z)
 * - Normal (nx, ny, nz)
 * - Color (r, g, b)
 * - UV (u, v)
 * - Tangent (optional)
 * - Material ID (optional)
 */

import * as THREE from 'three';

/**
 * Vertex attribute data
 */
export interface VertexAttributes {
  /** Positions */
  positions: Float32Array;
  
  /** Normals */
  normals: Float32Array;
  
  /** Colors */
  colors: Float32Array;
  
  /** UVs */
  uvs: Float32Array;
  
  /** Tangents (optional) */
  tangents?: Float32Array;
  
  /** Material IDs (optional) */
  materialIds?: Uint16Array;
}

/**
 * Vertex buffer options
 */
export interface VertexBufferOptions {
  /** Initial capacity */
  capacity?: number;
  
  /** Include tangents */
  includeTangents?: boolean;
  
  /** Include material IDs */
  includeMaterialIds?: boolean;
  
  /** Dynamic buffer (can grow) */
  dynamic?: boolean;
}

/**
 * Vertex buffer class
 */
export class VertexBuffer {
  private positions: Float32Array;
  private normals: Float32Array;
  private colors: Float32Array;
  private uvs: Float32Array;
  private tangents?: Float32Array;
  private materialIds?: Uint16Array;
  
  private count: number = 0;
  private capacity: number;
  private options: Required<Omit<VertexBufferOptions, 'capacity'>>;
  
  constructor(options: VertexBufferOptions = {}) {
    this.capacity = options.capacity ?? 1000;
    this.options = {
      includeTangents: options.includeTangents ?? false,
      includeMaterialIds: options.includeMaterialIds ?? false,
      dynamic: options.dynamic ?? true
    };
    
    // Allocate buffers
    this.positions = new Float32Array(this.capacity * 3);
    this.normals = new Float32Array(this.capacity * 3);
    this.colors = new Float32Array(this.capacity * 3);
    this.uvs = new Float32Array(this.capacity * 2);
    
    if (this.options.includeTangents) {
      this.tangents = new Float32Array(this.capacity * 4);
    }
    
    if (this.options.includeMaterialIds) {
      this.materialIds = new Uint16Array(this.capacity);
    }
  }
  
  /**
   * Add vertex
   */
  addVertex(
    position: THREE.Vector3,
    normal: THREE.Vector3,
    color: THREE.Color,
    uv: THREE.Vector2,
    tangent?: THREE.Vector4,
    materialId?: number
  ): number {
    // Grow if needed
    if (this.count >= this.capacity) {
      if (this.options.dynamic) {
        this.grow();
      } else {
        throw new Error('Vertex buffer full');
      }
    }
    
    const index = this.count;
    
    // Set position
    this.positions[index * 3] = position.x;
    this.positions[index * 3 + 1] = position.y;
    this.positions[index * 3 + 2] = position.z;
    
    // Set normal
    this.normals[index * 3] = normal.x;
    this.normals[index * 3 + 1] = normal.y;
    this.normals[index * 3 + 2] = normal.z;
    
    // Set color
    this.colors[index * 3] = color.r;
    this.colors[index * 3 + 1] = color.g;
    this.colors[index * 3 + 2] = color.b;
    
    // Set UV
    this.uvs[index * 2] = uv.x;
    this.uvs[index * 2 + 1] = uv.y;
    
    // Set tangent if included
    if (this.tangents && tangent) {
      this.tangents[index * 4] = tangent.x;
      this.tangents[index * 4 + 1] = tangent.y;
      this.tangents[index * 4 + 2] = tangent.z;
      this.tangents[index * 4 + 3] = tangent.w;
    }
    
    // Set material ID if included
    if (this.materialIds && materialId !== undefined) {
      this.materialIds[index] = materialId;
    }
    
    this.count++;
    return index;
  }
  
  /**
   * Get vertex
   */
  getVertex(index: number): {
    position: THREE.Vector3;
    normal: THREE.Vector3;
    color: THREE.Color;
    uv: THREE.Vector2;
    tangent?: THREE.Vector4;
    materialId?: number;
  } {
    if (index >= this.count) {
      throw new Error(`Vertex index ${index} out of range`);
    }
    
    const result = {
      position: new THREE.Vector3(
        this.positions[index * 3],
        this.positions[index * 3 + 1],
        this.positions[index * 3 + 2]
      ),
      normal: new THREE.Vector3(
        this.normals[index * 3],
        this.normals[index * 3 + 1],
        this.normals[index * 3 + 2]
      ),
      color: new THREE.Color(
        this.colors[index * 3],
        this.colors[index * 3 + 1],
        this.colors[index * 3 + 2]
      ),
      uv: new THREE.Vector2(
        this.uvs[index * 2],
        this.uvs[index * 2 + 1]
      ),
      tangent: undefined as THREE.Vector4 | undefined,
      materialId: undefined as number | undefined
    };
    
    if (this.tangents) {
      result.tangent = new THREE.Vector4(
        this.tangents[index * 4],
        this.tangents[index * 4 + 1],
        this.tangents[index * 4 + 2],
        this.tangents[index * 4 + 3]
      );
    }
    
    if (this.materialIds) {
      result.materialId = this.materialIds[index];
    }
    
    return result;
  }
  
  /**
   * Get all attributes
   */
  getAttributes(): VertexAttributes {
    return {
      positions: this.positions.slice(0, this.count * 3),
      normals: this.normals.slice(0, this.count * 3),
      colors: this.colors.slice(0, this.count * 3),
      uvs: this.uvs.slice(0, this.count * 2),
      tangents: this.tangents ? this.tangents.slice(0, this.count * 4) : undefined,
      materialIds: this.materialIds ? this.materialIds.slice(0, this.count) : undefined
    };
  }
  
  /**
   * Clear buffer
   */
  clear(): void {
    this.count = 0;
  }
  
  /**
   * Get vertex count
   */
  getCount(): number {
    return this.count;
  }
  
  /**
   * Get capacity
   */
  getCapacity(): number {
    return this.capacity;
  }
  
  /**
   * Grow buffer capacity
   */
  private grow(): void {
    const newCapacity = this.capacity * 2;
    
    // Reallocate positions
    const newPositions = new Float32Array(newCapacity * 3);
    newPositions.set(this.positions);
    this.positions = newPositions;
    
    // Reallocate normals
    const newNormals = new Float32Array(newCapacity * 3);
    newNormals.set(this.normals);
    this.normals = newNormals;
    
    // Reallocate colors
    const newColors = new Float32Array(newCapacity * 3);
    newColors.set(this.colors);
    this.colors = newColors;
    
    // Reallocate UVs
    const newUvs = new Float32Array(newCapacity * 2);
    newUvs.set(this.uvs);
    this.uvs = newUvs;
    
    // Reallocate tangents if included
    if (this.tangents) {
      const newTangents = new Float32Array(newCapacity * 4);
      newTangents.set(this.tangents);
      this.tangents = newTangents;
    }
    
    // Reallocate material IDs if included
    if (this.materialIds) {
      const newMaterialIds = new Uint16Array(newCapacity);
      newMaterialIds.set(this.materialIds);
      this.materialIds = newMaterialIds;
    }
    
    this.capacity = newCapacity;
  }
  
  /**
   * Create Three.js BufferGeometry
   */
  toBufferGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    const attrs = this.getAttributes();
    
    geometry.setAttribute('position', new THREE.BufferAttribute(attrs.positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(attrs.normals, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(attrs.colors, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(attrs.uvs, 2));
    
    if (attrs.tangents) {
      geometry.setAttribute('tangent', new THREE.BufferAttribute(attrs.tangents, 4));
    }
    
    if (attrs.materialIds) {
      geometry.setAttribute('materialId', new THREE.BufferAttribute(attrs.materialIds, 1));
    }
    
    return geometry;
  }
}
