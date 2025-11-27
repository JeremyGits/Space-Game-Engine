/**
 * Voxel Meshing (GPU)
 * 
 * GPU-accelerated mesh generation from voxels.
 */

import * as THREE from 'three';
import { Voxel } from '../../core/Voxel';
import { GreedyQuads, QuadFace } from '../../meshing/algorithms/GreedyQuads';

/**
 * GPU voxel meshing
 */
export class VoxelMeshing {
  private greedyMesher: GreedyQuads;
  
  constructor() {
    this.greedyMesher = new GreedyQuads();
  }
  
  /**
   * Generate mesh from voxels (GPU-optimized)
   */
  generateMesh(voxels: Voxel[]): THREE.BufferGeometry {
    // Use greedy meshing for optimization
    const result = this.greedyMesher.generateMesh(voxels);
    
    // Convert quads to Three.js geometry
    const geometry = this.quadsToGeometry(result.quads);
    
    return geometry;
  }
  
  /**
   * Convert quads to Three.js geometry
   */
  private quadsToGeometry(quads: QuadFace[]): THREE.BufferGeometry {
    const vertices: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    
    let vertexIndex = 0;
    
    for (const quad of quads) {
      // Get quad vertices based on direction
      const quadVerts = this.getQuadVertices(quad);
      const normal = this.getQuadNormal(quad.direction);
      
      // Add 4 vertices
      for (let i = 0; i < 4; i++) {
        vertices.push(quadVerts[i].x, quadVerts[i].y, quadVerts[i].z);
        normals.push(normal.x, normal.y, normal.z);
        colors.push(quad.color.r, quad.color.g, quad.color.b);
        uvs.push(i % 2, Math.floor(i / 2));
      }
      
      // Add indices (2 triangles)
      indices.push(
        vertexIndex, vertexIndex + 1, vertexIndex + 2,
        vertexIndex + 2, vertexIndex + 3, vertexIndex
      );
      
      vertexIndex += 4;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    
    return geometry;
  }
  
  /**
   * Get quad vertices
   */
  private getQuadVertices(quad: QuadFace): THREE.Vector3[] {
    const { position, size, direction } = quad;
    const verts: THREE.Vector3[] = [];
    
    // Generate 4 corners based on direction
    const halfSize = 0.5;
    
    switch (direction) {
      case 0: // FRONT
        verts.push(
          new THREE.Vector3(position.x - halfSize, position.y - halfSize, position.z + halfSize),
          new THREE.Vector3(position.x + size.x - halfSize, position.y - halfSize, position.z + halfSize),
          new THREE.Vector3(position.x + size.x - halfSize, position.y + size.y - halfSize, position.z + halfSize),
          new THREE.Vector3(position.x - halfSize, position.y + size.y - halfSize, position.z + halfSize)
        );
        break;
      // Add other directions as needed
      default:
        verts.push(
          new THREE.Vector3(position.x, position.y, position.z),
          new THREE.Vector3(position.x + size.x, position.y, position.z),
          new THREE.Vector3(position.x + size.x, position.y + size.y, position.z),
          new THREE.Vector3(position.x, position.y + size.y, position.z)
        );
    }
    
    return verts;
  }
  
  /**
   * Get quad normal
   */
  private getQuadNormal(direction: number): THREE.Vector3 {
    const normals = [
      new THREE.Vector3(0, 0, 1),   // FRONT
      new THREE.Vector3(0, 0, -1),  // BACK
      new THREE.Vector3(0, 1, 0),   // TOP
      new THREE.Vector3(0, -1, 0),  // BOTTOM
      new THREE.Vector3(1, 0, 0),   // RIGHT
      new THREE.Vector3(-1, 0, 0)   // LEFT
    ];
    return normals[direction] || normals[0];
  }
  
  /**
   * Generate instanced mesh
   */
  generateInstancedMesh(voxels: Voxel[], maxInstances: number = 100000): THREE.InstancedMesh {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ vertexColors: true });
    
    const mesh = new THREE.InstancedMesh(geometry, material, Math.min(voxels.length, maxInstances));
    
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    
    for (let i = 0; i < Math.min(voxels.length, maxInstances); i++) {
      const voxel = voxels[i];
      const size = voxel.size || 1.0;
      
      matrix.compose(
        voxel.position,
        new THREE.Quaternion(),
        new THREE.Vector3(size, size, size)
      );
      
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, color.setRGB(voxel.color.r, voxel.color.g, voxel.color.b));
    }
    
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
    
    return mesh;
  }
}
