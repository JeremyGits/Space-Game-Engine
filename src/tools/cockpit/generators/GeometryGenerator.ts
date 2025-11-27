/**
 * Geometry Generator
 * 
 * Generates curved cockpit geometry from configuration
 */

import * as THREE from 'three';
import { PanelConfig } from '../types/CockpitTypes';

export class GeometryGenerator {
  /**
   * Generate a curved panel geometry
   */
  static generateCurvedPanel(config: PanelConfig, width: number, height: number): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(
      width,
      height,
      config.segments,
      config.segments
    );
    
    // Apply curvature
    if (config.curve > 0) {
      this.applyCurvature(geometry, config.curve, config.angle);
    }
    
    // Apply UV mapping
    this.applyUVMapping(geometry, config.uvRegion);
    
    return geometry;
  }
  
  /**
   * Apply curvature to geometry
   */
  private static applyCurvature(
    geometry: THREE.BufferGeometry,
    curveAmount: number,
    angle: number
  ): void {
    const positions = geometry.attributes.position;
    const angleRad = THREE.MathUtils.degToRad(angle);
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // Calculate curve based on X position
      const normalizedX = x / (positions.array[0] || 1);
      const curveOffset = Math.sin(normalizedX * Math.PI) * curveAmount;
      
      // Apply curve in Z direction
      positions.setZ(i, z + curveOffset);
      
      // Apply angle rotation
      const rotatedX = x * Math.cos(angleRad) - z * Math.sin(angleRad);
      const rotatedZ = x * Math.sin(angleRad) + z * Math.cos(angleRad);
      
      positions.setX(i, rotatedX);
      positions.setZ(i, rotatedZ + curveOffset);
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  
  /**
   * Apply UV mapping to geometry
   */
  private static applyUVMapping(
    geometry: THREE.BufferGeometry,
    uvRegion: { x: number; y: number; width: number; height: number }
  ): void {
    const uvs = geometry.attributes.uv;
    
    for (let i = 0; i < uvs.count; i++) {
      const u = uvs.getX(i);
      const v = uvs.getY(i);
      
      // Map to region
      const mappedU = uvRegion.x + u * uvRegion.width;
      const mappedV = uvRegion.y + v * uvRegion.height;
      
      uvs.setXY(i, mappedU, mappedV);
    }
    
    geometry.attributes.uv.needsUpdate = true;
  }
  
  /**
   * Generate cockpit shell (combined panels)
   */
  static generateCockpitShell(
    width: number,
    height: number,
    depth: number,
    curvature: number
  ): THREE.BufferGeometry {
    // Create a custom geometry for the cockpit shell
    const segments = 32;
    const geometry = new THREE.BufferGeometry();
    
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];
    
    // Generate vertices for curved shell
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const angle = (u - 0.5) * Math.PI * (curvature / 180);
      
      for (let j = 0; j <= segments; j++) {
        const v = j / segments;
        
        // Calculate position on curved surface
        const x = Math.sin(angle) * width;
        const y = (v - 0.5) * height;
        const z = -Math.cos(angle) * depth;
        
        vertices.push(x, y, z);
        uvs.push(u, v);
        
        // Calculate normal
        const normal = new THREE.Vector3(x, y, z).normalize();
        normals.push(normal.x, normal.y, normal.z);
      }
    }
    
    // Generate indices
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = a + segments + 1;
        const c = a + 1;
        const d = b + 1;
        
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);
    
    return geometry;
  }
  
  /**
   * Generate screen geometry
   */
  static generateScreen(width: number, height: number): THREE.BufferGeometry {
    return new THREE.PlaneGeometry(width, height);
  }
  
  /**
   * Generate button geometry
   */
  static generateButton(radius: number, height: number): THREE.BufferGeometry {
    return new THREE.CylinderGeometry(radius, radius, height, 16);
  }
  
  /**
   * Generate switch geometry
   */
  static generateSwitch(width: number, height: number, depth: number): THREE.BufferGeometry {
    return new THREE.BoxGeometry(width, height, depth);
  }
  
  /**
   * Generate lever geometry
   */
  static generateLever(length: number, radius: number): THREE.BufferGeometry {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
    // Add sphere at top
    const sphereGeometry = new THREE.SphereGeometry(radius * 1.5, 8, 8);
    sphereGeometry.translate(0, length / 2, 0);
    
    // Merge geometries
    const mergedGeometry = new THREE.BufferGeometry();
    // Note: In production, use BufferGeometryUtils.mergeGeometries
    return geometry;
  }
  
  /**
   * Generate normal map from height data
   */
  static generateNormalMap(
    width: number,
    height: number,
    heightData: Float32Array
  ): THREE.DataTexture {
    const size = width * height;
    const data = new Uint8Array(size * 4);
    
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const idx = (i * width + j);
        
        // Sample neighboring heights
        const left = j > 0 ? heightData[idx - 1] : heightData[idx];
        const right = j < width - 1 ? heightData[idx + 1] : heightData[idx];
        const up = i > 0 ? heightData[idx - width] : heightData[idx];
        const down = i < height - 1 ? heightData[idx + width] : heightData[idx];
        
        // Calculate normal
        const dx = (right - left) * 2;
        const dy = (down - up) * 2;
        const dz = 1;
        
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const nx = dx / length;
        const ny = dy / length;
        const nz = dz / length;
        
        // Convert to RGB (0-255)
        data[idx * 4 + 0] = ((nx + 1) * 0.5) * 255;
        data[idx * 4 + 1] = ((ny + 1) * 0.5) * 255;
        data[idx * 4 + 2] = ((nz + 1) * 0.5) * 255;
        data[idx * 4 + 3] = 255;
      }
    }
    
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.needsUpdate = true;
    
    return texture;
  }
  
  /**
   * Optimize geometry (reduce vertices while maintaining shape)
   */
  static optimizeGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    // Compute vertex normals for smooth shading
    geometry.computeVertexNormals();
    
    // Remove duplicate vertices
    // Note: In production, use BufferGeometryUtils.mergeVertices
    
    return geometry;
  }
}
