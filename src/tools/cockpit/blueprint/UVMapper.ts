/**
 * UV Mapper - Maps texture regions to 3D geometry
 * Handles proper UV coordinate assignment for blueprint-based cockpits
 */

import * as THREE from 'three';
import { UVRegion } from './BlueprintTypes';

export class UVMapper {
  /**
   * Apply UV region to a plane geometry
   * Maps a specific region of the texture to the plane
   */
  static applyUVRegionToPlane(
    geometry: THREE.PlaneGeometry,
    uvRegion: UVRegion
  ): void {
    const uvAttribute = geometry.attributes.uv;
    
    if (!uvAttribute) {
      console.error('Geometry has no UV attribute');
      return;
    }
    
    // Get UV array
    const uvArray = uvAttribute.array as Float32Array;
    
    // For a plane, we have 4 vertices with UVs:
    // 0: bottom-left
    // 1: bottom-right
    // 2: top-left
    // 3: top-right
    
    // Map to our UV region
    const { x, y, width, height } = uvRegion;
    
    // Bottom-left (0)
    uvArray[0] = x;
    uvArray[1] = y + height;
    
    // Bottom-right (1)
    uvArray[2] = x + width;
    uvArray[3] = y + height;
    
    // Top-left (2)
    uvArray[4] = x;
    uvArray[5] = y;
    
    // Top-right (3)
    uvArray[6] = x + width;
    uvArray[7] = y;
    
    uvAttribute.needsUpdate = true;
  }
  
  /**
   * Apply UV region to a box geometry
   * Maps the region to the front face, other faces get default UVs
   */
  static applyUVRegionToBox(
    geometry: THREE.BoxGeometry,
    uvRegion: UVRegion,
    face: 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right' = 'front'
  ): void {
    const uvAttribute = geometry.attributes.uv;
    
    if (!uvAttribute) {
      console.error('Geometry has no UV attribute');
      return;
    }
    
    const uvArray = uvAttribute.array as Float32Array;
    const { x, y, width, height } = uvRegion;
    
    // Box has 6 faces, each with 4 vertices (24 vertices total, 48 UV values)
    // Face order: right, left, top, bottom, front, back
    
    let faceIndex = 0;
    switch (face) {
      case 'right': faceIndex = 0; break;
      case 'left': faceIndex = 1; break;
      case 'top': faceIndex = 2; break;
      case 'bottom': faceIndex = 3; break;
      case 'front': faceIndex = 4; break;
      case 'back': faceIndex = 5; break;
    }
    
    // Each face has 4 vertices, so 8 UV values
    const startIndex = faceIndex * 8;
    
    // Apply UV region to the specified face
    // Bottom-left
    uvArray[startIndex + 0] = x;
    uvArray[startIndex + 1] = y + height;
    
    // Bottom-right
    uvArray[startIndex + 2] = x + width;
    uvArray[startIndex + 3] = y + height;
    
    // Top-left
    uvArray[startIndex + 4] = x;
    uvArray[startIndex + 5] = y;
    
    // Top-right
    uvArray[startIndex + 6] = x + width;
    uvArray[startIndex + 7] = y;
    
    uvAttribute.needsUpdate = true;
  }
  
  /**
   * Apply UV region to a cylinder geometry
   * Maps the region to the cylindrical surface
   */
  static applyUVRegionToCylinder(
    geometry: THREE.CylinderGeometry,
    uvRegion: UVRegion
  ): void {
    const uvAttribute = geometry.attributes.uv;
    
    if (!uvAttribute) {
      console.error('Geometry has no UV attribute');
      return;
    }
    
    const uvArray = uvAttribute.array as Float32Array;
    const { x, y, width, height } = uvRegion;
    
    // For cylinder, we'll map the UV region to the side surface
    // This is more complex as it wraps around
    
    for (let i = 0; i < uvArray.length; i += 2) {
      const u = uvArray[i];
      const v = uvArray[i + 1];
      
      // Map to our region
      uvArray[i] = x + (u * width);
      uvArray[i + 1] = y + (v * height);
    }
    
    uvAttribute.needsUpdate = true;
  }
  
  /**
   * Create a plane with specific UV region
   */
  static createUVMappedPlane(
    width: number,
    height: number,
    uvRegion: UVRegion,
    segments: { width: number; height: number } = { width: 1, height: 1 }
  ): THREE.PlaneGeometry {
    const geometry = new THREE.PlaneGeometry(
      width,
      height,
      segments.width,
      segments.height
    );
    
    this.applyUVRegionToPlane(geometry, uvRegion);
    
    return geometry;
  }
  
  /**
   * Create a box with specific UV region on front face
   */
  static createUVMappedBox(
    width: number,
    height: number,
    depth: number,
    uvRegion: UVRegion,
    segments: { width: number; height: number; depth: number } = { width: 1, height: 1, depth: 1 }
  ): THREE.BoxGeometry {
    const geometry = new THREE.BoxGeometry(
      width,
      height,
      depth,
      segments.width,
      segments.height,
      segments.depth
    );
    
    this.applyUVRegionToBox(geometry, uvRegion, 'front');
    
    return geometry;
  }
  
  /**
   * Convert pixel coordinates to normalized UV coordinates
   */
  static pixelToUV(
    pixelX: number,
    pixelY: number,
    imageWidth: number,
    imageHeight: number
  ): { u: number; v: number } {
    return {
      u: pixelX / imageWidth,
      v: pixelY / imageHeight
    };
  }
  
  /**
   * Convert normalized UV coordinates to pixel coordinates
   */
  static uvToPixel(
    u: number,
    v: number,
    imageWidth: number,
    imageHeight: number
  ): { x: number; y: number } {
    return {
      x: u * imageWidth,
      y: v * imageHeight
    };
  }
  
  /**
   * Create UV region from pixel coordinates
   */
  static createUVRegionFromPixels(
    x: number,
    y: number,
    width: number,
    height: number,
    imageWidth: number,
    imageHeight: number
  ): UVRegion {
    return {
      x: x / imageWidth,
      y: y / imageHeight,
      width: width / imageWidth,
      height: height / imageHeight
    };
  }
  
  /**
   * Validate UV region (ensure it's within 0-1 bounds)
   */
  static validateUVRegion(uvRegion: UVRegion): boolean {
    const { x, y, width, height } = uvRegion;
    
    if (x < 0 || x > 1) return false;
    if (y < 0 || y > 1) return false;
    if (width <= 0 || width > 1) return false;
    if (height <= 0 || height > 1) return false;
    if (x + width > 1) return false;
    if (y + height > 1) return false;
    
    return true;
  }
  
  /**
   * Clamp UV region to valid bounds
   */
  static clampUVRegion(uvRegion: UVRegion): UVRegion {
    return {
      x: Math.max(0, Math.min(1, uvRegion.x)),
      y: Math.max(0, Math.min(1, uvRegion.y)),
      width: Math.max(0, Math.min(1 - uvRegion.x, uvRegion.width)),
      height: Math.max(0, Math.min(1 - uvRegion.y, uvRegion.height))
    };
  }
}
