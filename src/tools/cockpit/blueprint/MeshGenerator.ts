/**
 * Mesh Generator - Creates 3D meshes from blueprint components
 */

import * as THREE from 'three';
import { CockpitComponent, MaterialConfig } from './BlueprintTypes';
import { UVMapper } from './UVMapper';

export class MeshGenerator {
  /**
   * Create a mesh from a blueprint component
   */
  static createMeshFromComponent(
    component: CockpitComponent,
    texture: THREE.Texture
  ): THREE.Mesh {
    // Create geometry based on component type
    const geometry = this.createGeometry(component);
    
    // Create material
    const material = this.createMaterial(component.material, texture);
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    
    // Apply transform
    const [x, y, z] = component.transform.position;
    mesh.position.set(x, y, z);
    
    const [rx, ry, rz] = component.transform.rotation;
    mesh.rotation.set(rx, ry, rz);
    
    const [sx, sy, sz] = component.transform.scale;
    mesh.scale.set(sx, sy, sz);
    
    // Set name for debugging
    mesh.name = component.name;
    
    // Set shadow properties
    mesh.receiveShadow = component.material.receiveShadows ?? true;
    mesh.castShadow = component.material.castShadows ?? true;
    
    return mesh;
  }
  
  /**
   * Create geometry based on component specification
   */
  private static createGeometry(component: CockpitComponent): THREE.BufferGeometry {
    const { geometry, geometryParams, uvRegion } = component;
    
    switch (geometry) {
      case 'plane': {
        const segments = geometryParams?.segments || [1, 1];
        return UVMapper.createUVMappedPlane(
          1, 1, // Will be scaled by transform
          uvRegion,
          { width: segments[0], height: segments[1] }
        );
      }
      
      case 'box': {
        const segments = geometryParams?.segments || [1, 1, 1];
        return UVMapper.createUVMappedBox(
          1, 1, 1, // Will be scaled by transform
          uvRegion,
          { width: segments[0], height: segments[1], depth: segments[2] }
        );
      }
      
      case 'cylinder': {
        const params = geometryParams || {};
        const geo = new THREE.CylinderGeometry(
          params.radiusTop || 0.5,
          params.radiusBottom || 0.5,
          params.height || 1,
          params.radialSegments || 16,
          params.heightSegments || 1
        );
        UVMapper.applyUVRegionToCylinder(geo, uvRegion);
        return geo;
      }
      
      case 'sphere': {
        const params = geometryParams || {};
        return new THREE.SphereGeometry(
          params.radius || 0.5,
          params.widthSegments || 16,
          params.heightSegments || 16
        );
      }
      
      default:
        // Default to plane
        return UVMapper.createUVMappedPlane(1, 1, uvRegion);
    }
  }
  
  /**
   * Create material from material configuration
   */
  private static createMaterial(
    config: MaterialConfig,
    texture: THREE.Texture
  ): THREE.Material {
    // Brighten the base color for better visibility
    const baseColor = config.color ? new THREE.Color(config.color) : new THREE.Color('#ffffff');
    baseColor.multiplyScalar(1.5); // Brighten by 50%
    
    // Base material properties - adjusted for better lighting
    const baseProps = {
      map: texture,
      color: baseColor,
      metalness: Math.max(0.1, config.metalness * 0.5), // Reduce metalness for better diffuse
      roughness: Math.max(0.3, config.roughness), // Increase roughness for better light scattering
      clearcoat: config.clearcoat || 0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 2.5, // Increase environment reflection
      toneMapped: true
    };
    
    // Add emissive if specified - boost intensity
    if (config.emissive && config.emissive > 0) {
      Object.assign(baseProps, {
        emissive: new THREE.Color(config.emissiveColor || '#00ff00'),
        emissiveIntensity: config.emissive * 2.0, // Double emissive intensity
        emissiveMap: texture
      });
    }
    
    // Create MeshPhysicalMaterial for PBR
    const material = new THREE.MeshPhysicalMaterial(baseProps);
    
    // Set texture properties
    texture.anisotropy = 16;
    texture.colorSpace = THREE.SRGBColorSpace;
    
    return material;
  }
  
  /**
   * Create all meshes from a blueprint
   */
  static createMeshesFromBlueprint(
    components: CockpitComponent[],
    texture: THREE.Texture
  ): THREE.Mesh[] {
    return components.map(component => 
      this.createMeshFromComponent(component, texture)
    );
  }
  
  /**
   * Create a layered group from blueprint
   */
  static createLayeredGroup(
    components: CockpitComponent[],
    texture: THREE.Texture
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = 'Cockpit';
    
    // Sort components by layer
    const sortedComponents = [...components].sort((a, b) => a.layer - b.layer);
    
    // Create meshes
    sortedComponents.forEach(component => {
      const mesh = this.createMeshFromComponent(component, texture);
      group.add(mesh);
    });
    
    return group;
  }
}
