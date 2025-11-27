/**
 * Index Buffer
 * 
 * Manages triangle indices for voxel meshes.
 * Supports both 16-bit and 32-bit indices.
 * 
 * Features:
 * - Automatic 16/32-bit selection
 * - Dynamic growth
 * - Triangle/strip/fan primitives
 * - Degenerate triangle handling
 */

/**
 * Index buffer type
 */
export enum IndexBufferType {
  UINT16 = 'uint16',
  UINT32 = 'uint32'
}

/**
 * Primitive type
 */
export enum PrimitiveType {
  TRIANGLES = 'triangles',
  TRIANGLE_STRIP = 'triangle_strip',
  TRIANGLE_FAN = 'triangle_fan'
}

/**
 * Index buffer options
 */
export interface IndexBufferOptions {
  /** Initial capacity */
  capacity?: number;
  
  /** Force 32-bit indices */
  force32Bit?: boolean;
  
  /** Primitive type */
  primitiveType?: PrimitiveType;
  
  /** Dynamic buffer (can grow) */
  dynamic?: boolean;
}

/**
 * Index buffer class
 */
export class IndexBuffer {
  private indices: Uint16Array | Uint32Array;
  private count: number = 0;
  private capacity: number;
  private type: IndexBufferType;
  private primitiveType: PrimitiveType;
  private dynamic: boolean;
  
  constructor(options: IndexBufferOptions = {}) {
    this.capacity = options.capacity ?? 3000;
    this.primitiveType = options.primitiveType ?? PrimitiveType.TRIANGLES;
    this.dynamic = options.dynamic ?? true;
    
    // Determine index type
    this.type = options.force32Bit ? IndexBufferType.UINT32 : IndexBufferType.UINT16;
    
    // Allocate buffer
    this.indices = this.type === IndexBufferType.UINT32
      ? new Uint32Array(this.capacity)
      : new Uint16Array(this.capacity);
  }
  
  /**
   * Add triangle
   */
  addTriangle(i0: number, i1: number, i2: number): void {
    // Check if need to upgrade to 32-bit
    if (this.type === IndexBufferType.UINT16) {
      const maxIndex = Math.max(i0, i1, i2);
      if (maxIndex > 65535) {
        this.upgradeTo32Bit();
      }
    }
    
    // Grow if needed
    if (this.count + 3 > this.capacity) {
      if (this.dynamic) {
        this.grow();
      } else {
        throw new Error('Index buffer full');
      }
    }
    
    this.indices[this.count++] = i0;
    this.indices[this.count++] = i1;
    this.indices[this.count++] = i2;
  }
  
  /**
   * Add quad (as two triangles)
   */
  addQuad(i0: number, i1: number, i2: number, i3: number): void {
    this.addTriangle(i0, i1, i2);
    this.addTriangle(i0, i2, i3);
  }
  
  /**
   * Add indices from array
   */
  addIndices(indices: number[]): void {
    for (const index of indices) {
      // Check if need to upgrade to 32-bit
      if (this.type === IndexBufferType.UINT16 && index > 65535) {
        this.upgradeTo32Bit();
      }
      
      // Grow if needed
      if (this.count >= this.capacity) {
        if (this.dynamic) {
          this.grow();
        } else {
          throw new Error('Index buffer full');
        }
      }
      
      this.indices[this.count++] = index;
    }
  }
  
  /**
   * Get index at position
   */
  getIndex(position: number): number {
    if (position >= this.count) {
      throw new Error(`Index position ${position} out of range`);
    }
    return this.indices[position];
  }
  
  /**
   * Get all indices
   */
  getIndices(): Uint16Array | Uint32Array {
    return this.indices.slice(0, this.count);
  }
  
  /**
   * Get indices as array
   */
  toArray(): number[] {
    return Array.from(this.indices.slice(0, this.count));
  }
  
  /**
   * Clear buffer
   */
  clear(): void {
    this.count = 0;
  }
  
  /**
   * Get index count
   */
  getCount(): number {
    return this.count;
  }
  
  /**
   * Get triangle count
   */
  getTriangleCount(): number {
    switch (this.primitiveType) {
      case PrimitiveType.TRIANGLES:
        return Math.floor(this.count / 3);
      case PrimitiveType.TRIANGLE_STRIP:
      case PrimitiveType.TRIANGLE_FAN:
        return Math.max(0, this.count - 2);
    }
  }
  
  /**
   * Get buffer type
   */
  getType(): IndexBufferType {
    return this.type;
  }
  
  /**
   * Get primitive type
   */
  getPrimitiveType(): PrimitiveType {
    return this.primitiveType;
  }
  
  /**
   * Upgrade to 32-bit indices
   */
  private upgradeTo32Bit(): void {
    if (this.type === IndexBufferType.UINT32) return;
    
    const newIndices = new Uint32Array(this.capacity);
    newIndices.set(this.indices);
    this.indices = newIndices;
    this.type = IndexBufferType.UINT32;
  }
  
  /**
   * Grow buffer capacity
   */
  private grow(): void {
    const newCapacity = this.capacity * 2;
    
    const newIndices = this.type === IndexBufferType.UINT32
      ? new Uint32Array(newCapacity)
      : new Uint16Array(newCapacity);
    
    newIndices.set(this.indices);
    this.indices = newIndices;
    this.capacity = newCapacity;
  }
  
  /**
   * Reverse winding order
   */
  reverseWinding(): void {
    if (this.primitiveType !== PrimitiveType.TRIANGLES) {
      throw new Error('Can only reverse winding for triangle lists');
    }
    
    for (let i = 0; i < this.count; i += 3) {
      const temp = this.indices[i + 1];
      this.indices[i + 1] = this.indices[i + 2];
      this.indices[i + 2] = temp;
    }
  }
  
  /**
   * Remove degenerate triangles
   */
  removeDegenerates(): number {
    if (this.primitiveType !== PrimitiveType.TRIANGLES) {
      return 0;
    }
    
    let writePos = 0;
    let removed = 0;
    
    for (let i = 0; i < this.count; i += 3) {
      const i0 = this.indices[i];
      const i1 = this.indices[i + 1];
      const i2 = this.indices[i + 2];
      
      // Skip degenerate triangles
      if (i0 === i1 || i1 === i2 || i2 === i0) {
        removed++;
        continue;
      }
      
      // Keep triangle
      if (writePos !== i) {
        this.indices[writePos] = i0;
        this.indices[writePos + 1] = i1;
        this.indices[writePos + 2] = i2;
      }
      writePos += 3;
    }
    
    this.count = writePos;
    return removed;
  }
  
  /**
   * Get memory usage in bytes
   */
  getMemoryUsage(): number {
    return this.indices.byteLength;
  }
  
  /**
   * Clone buffer
   */
  clone(): IndexBuffer {
    const cloned = new IndexBuffer({
      capacity: this.capacity,
      force32Bit: this.type === IndexBufferType.UINT32,
      primitiveType: this.primitiveType,
      dynamic: this.dynamic
    });
    
    cloned.indices.set(this.indices);
    cloned.count = this.count;
    
    return cloned;
  }
}
