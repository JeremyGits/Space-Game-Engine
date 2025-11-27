import { useEffect, useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { environmentMapGenerator } from '../../engine/rendering/environment/EnvironmentMapGenerator';

/**
 * Textured 3D Cockpit with Real PBR Maps
 * Uses the generated PBR textures for realistic materials
 */
export default function TexturedCockpit3D() {
  const { scene, gl } = useThree();
  const cockpitGroupRef = useRef<THREE.Group>(null);
  const envProbeCreated = useRef(false);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  
  // Load all PBR textures
  const textures = useTexture({
    albedo: '/textures/cockpit/cockpit_albedo.png',
    normal: '/textures/cockpit/cockpit_normal.png',
    roughness: '/textures/cockpit/cockpit_roughness.png',
    metallic: '/textures/cockpit/cockpit_metallic.png',
    ao: '/textures/cockpit/cockpit_ao.png',
    emissive: '/textures/cockpit/cockpit_emissive.png'
  });
  
  // Initialize environment mapping
  useEffect(() => {
    if (!envProbeCreated.current) {
      environmentMapGenerator.createProbe({
        name: 'cockpit_env',
        position: new THREE.Vector3(0, 0, 0),
        size: 256,
        near: 0.1,
        far: 100,
        updateRate: 10
      });
      
      envProbeCreated.current = true;
    }
    
    setTexturesLoaded(true);
  }, []);
  
  // Update environment map
  useFrame(() => {
    if (envProbeCreated.current) {
      environmentMapGenerator.updateProbes(gl, scene, Date.now());
    }
  });
  
  // Create PBR material with all texture maps - ENHANCED
  const cockpitMaterial = useMemo(() => {
    if (!texturesLoaded) return null;
    
    const probe = environmentMapGenerator.getProbe('cockpit_env');
    
    // Set proper color spaces
    textures.albedo.colorSpace = THREE.SRGBColorSpace;
    textures.normal.colorSpace = THREE.LinearSRGBColorSpace;
    textures.roughness.colorSpace = THREE.LinearSRGBColorSpace;
    textures.metallic.colorSpace = THREE.LinearSRGBColorSpace;
    textures.ao.colorSpace = THREE.LinearSRGBColorSpace;
    textures.emissive.colorSpace = THREE.SRGBColorSpace;
    
    // Enable anisotropic filtering for sharper textures
    textures.albedo.anisotropy = 16;
    textures.normal.anisotropy = 16;
    textures.roughness.anisotropy = 16;
    textures.metallic.anisotropy = 16;
    textures.ao.anisotropy = 16;
    
    const material = new THREE.MeshPhysicalMaterial({
      // Albedo - base color
      map: textures.albedo,
      color: '#ffffff',
      
      // Normal mapping for surface detail - INCREASED
      normalMap: textures.normal,
      normalScale: new THREE.Vector2(3.0, 3.0), // Increased from 1.5 to 3.0
      
      // Roughness for shininess variation
      roughnessMap: textures.roughness,
      roughness: 0.15, // Slightly shinier
      
      // Metallic for metal vs non-metal
      metalnessMap: textures.metallic,
      metalness: 1.0, // Full metallic
      
      // AO for shadows in crevices - INCREASED
      aoMap: textures.ao,
      aoMapIntensity: 2.0, // Increased from 1.0 to 2.0
      
      // Emissive for glowing screens - INCREASED
      emissiveMap: textures.emissive,
      emissive: new THREE.Color('#00ff00'),
      emissiveIntensity: 1.5, // Increased from 0.5 to 1.5
      
      // Clearcoat for glossy finish - INCREASED
      clearcoat: 1.0, // Increased from 0.5 to 1.0
      clearcoatRoughness: 0.05, // Decreased for shinier clearcoat
      
      // Environment mapping for reflections - INCREASED
      envMapIntensity: 3.0, // Increased from 2.0 to 3.0
      
      // Additional PBR properties
      reflectivity: 1.0,
      ior: 1.5, // Index of refraction
      transmission: 0, // No transparency
      thickness: 0.5,
      
      // Enable tone mapping
      toneMapped: true
    });
    
    // Apply environment map
    if (probe) {
      material.envMap = probe.envMap;
      material.needsUpdate = true;
    }
    
    return material;
  }, [texturesLoaded, textures]);
  
  if (!cockpitMaterial) {
    return null; // Loading textures
  }
  
  return (
    <group ref={cockpitGroupRef}>
      {/* Main cockpit backdrop - larger and curved */}
      <mesh position={[0, 0, -1.0]} material={cockpitMaterial}>
        <planeGeometry args={[4.0, 3.5, 32, 32]} />
      </mesh>
      
      {/* Dashboard - angled toward player */}
      <mesh 
        position={[0, -0.9, -0.3]} 
        rotation={[-0.3, 0, 0]}
        material={cockpitMaterial}
      >
        <boxGeometry args={[2.5, 0.4, 0.2, 4, 4, 4]} />
      </mesh>
      
      {/* Left side panel - angled inward */}
      <mesh 
        position={[-1.5, 0, -0.5]} 
        rotation={[0, 0.4, 0]}
        material={cockpitMaterial}
      >
        <boxGeometry args={[0.4, 2.0, 0.15, 4, 8, 4]} />
      </mesh>
      
      {/* Right side panel - angled inward */}
      <mesh 
        position={[1.5, 0, -0.5]} 
        rotation={[0, -0.4, 0]}
        material={cockpitMaterial}
      >
        <boxGeometry args={[0.4, 2.0, 0.15, 4, 8, 4]} />
      </mesh>
      
      {/* Overhead panel - angled down */}
      <mesh 
        position={[0, 1.2, -0.6]} 
        rotation={[0.2, 0, 0]}
        material={cockpitMaterial}
      >
        <boxGeometry args={[2.0, 0.3, 0.15, 8, 4, 4]} />
      </mesh>
      
      {/* Center console - detailed */}
      <mesh 
        position={[0, -1.0, 0.2]} 
        rotation={[-0.2, 0, 0]}
        material={cockpitMaterial}
      >
        <boxGeometry args={[0.6, 0.4, 0.8, 4, 4, 4]} />
      </mesh>
      
      {/* Left MFD housing */}
      <mesh 
        position={[-0.8, -0.3, -0.4]} 
        material={cockpitMaterial}
      >
        <boxGeometry args={[0.5, 0.5, 0.1, 4, 4, 4]} />
      </mesh>
      
      {/* Center MFD housing */}
      <mesh 
        position={[0, -0.3, -0.4]} 
        material={cockpitMaterial}
      >
        <boxGeometry args={[0.5, 0.5, 0.1, 4, 4, 4]} />
      </mesh>
      
      {/* Right MFD housing */}
      <mesh 
        position={[0.8, -0.3, -0.4]} 
        material={cockpitMaterial}
      >
        <boxGeometry args={[0.5, 0.5, 0.1, 4, 4, 4]} />
      </mesh>
      
      {/* Additional detail elements for depth */}
      <mesh position={[-0.3, -0.7, -0.2]} material={cockpitMaterial}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
      </mesh>
      
      <mesh position={[0.3, -0.7, -0.2]} material={cockpitMaterial}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
      </mesh>
    </group>
  );
}
