/**
 * Blueprint-Based Cockpit
 * Renders a cockpit from a blueprint JSON file with proper UV mapping
 */

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { BlueprintLoader } from '../../tools/cockpit/blueprint/BlueprintLoader';
import { MeshGenerator } from '../../tools/cockpit/blueprint/MeshGenerator';
import { CockpitBlueprint } from '../../tools/cockpit/blueprint/BlueprintTypes';
import { environmentMapGenerator } from '../../engine/rendering/environment/EnvironmentMapGenerator';

interface BlueprintCockpitProps {
  blueprintPath: string;
}

export default function BlueprintCockpit({ blueprintPath }: BlueprintCockpitProps) {
  const { scene, gl } = useThree();
  const cockpitGroupRef = useRef<THREE.Group>(null);
  const [blueprint, setBlueprint] = useState<CockpitBlueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const envProbeCreated = useRef(false);
  const lightsRef = useRef<THREE.Group>(null);
  
  // Load blueprint
  useEffect(() => {
    BlueprintLoader.loadBlueprint(blueprintPath)
      .then(bp => {
        setBlueprint(bp);
        setLoading(false);
        console.log(`✓ Blueprint loaded: ${bp.name}`);
        console.log(`  Components: ${bp.components.length}`);
        console.log(`  Layers: ${bp.layers.length}`);
      })
      .catch(error => {
        console.error('Failed to load blueprint:', error);
        setLoading(false);
      });
  }, [blueprintPath]);
  
  // Load texture from blueprint
  const texture = useTexture(
    blueprint?.sourceImage || '/cockpit-scaled-orig.png'
  );
  
  // Initialize environment mapping
  useEffect(() => {
    if (!envProbeCreated.current && blueprint) {
      environmentMapGenerator.createProbe({
        name: 'blueprint_cockpit_env',
        position: new THREE.Vector3(0, 0, 0),
        size: 256,
        near: 0.1,
        far: 100,
        updateRate: 10
      });
      
      envProbeCreated.current = true;
    }
  }, [blueprint]);
  
  // Update environment map
  useFrame(() => {
    if (envProbeCreated.current) {
      environmentMapGenerator.updateProbes(gl, scene, Date.now());
    }
  });
  
  // Generate cockpit meshes from blueprint
  useEffect(() => {
    if (!blueprint || !texture || !cockpitGroupRef.current) return;
    
    // Clear existing meshes
    while (cockpitGroupRef.current.children.length > 0) {
      cockpitGroupRef.current.remove(cockpitGroupRef.current.children[0]);
    }
    
    // Get environment map
    const probe = environmentMapGenerator.getProbe('blueprint_cockpit_env');
    
    // Create meshes for each layer
    blueprint.layers.forEach(layer => {
      const layerGroup = new THREE.Group();
      layerGroup.name = layer.name;
      layerGroup.position.z = layer.zOffset;
      
      // Get components for this layer
      const layerComponents = blueprint.components.filter(c => 
        layer.componentIds.includes(c.id)
      );
      
      // Create meshes
      layerComponents.forEach(component => {
        const mesh = MeshGenerator.createMeshFromComponent(component, texture);
        
        // Apply environment map to material
        if (probe && mesh.material instanceof THREE.MeshPhysicalMaterial) {
          mesh.material.envMap = probe.envMap;
          mesh.material.needsUpdate = true;
        }
        
        layerGroup.add(mesh);
      });
      
      cockpitGroupRef.current!.add(layerGroup);
    });
    
    console.log(`✓ Generated ${blueprint.components.length} cockpit components`);
    
  }, [blueprint, texture]);
  
  if (loading) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#ff00ff" wireframe />
        </mesh>
      </group>
    );
  }
  
  if (!blueprint) {
    return null;
  }
  
  return (
    <>
      {/* Enhanced Cockpit Lighting */}
      <group ref={lightsRef}>
        {/* Ambient light for overall illumination */}
        <ambientLight intensity={0.4} color="#ffffff" />
        
        {/* Key light from above */}
        <directionalLight 
          position={[0, 5, 2]} 
          intensity={1.2} 
          color="#ffffff"
          castShadow
        />
        
        {/* Fill light from below (simulating instrument glow) */}
        <pointLight 
          position={[0, -0.5, 0]} 
          intensity={0.8} 
          color="#00ff88"
          distance={3}
        />
        
        {/* Left panel light */}
        <pointLight 
          position={[-1, 0, -0.3]} 
          intensity={0.5} 
          color="#00ffaa"
          distance={2}
        />
        
        {/* Right panel light */}
        <pointLight 
          position={[1, 0, -0.3]} 
          intensity={0.5} 
          color="#00ffaa"
          distance={2}
        />
        
        {/* MFD backlights */}
        <pointLight 
          position={[-0.7, -0.4, -0.4]} 
          intensity={0.6} 
          color="#00ff00"
          distance={1}
        />
        <pointLight 
          position={[0, -0.4, -0.4]} 
          intensity={0.6} 
          color="#00ff00"
          distance={1}
        />
        <pointLight 
          position={[0.7, -0.4, -0.4]} 
          intensity={0.6} 
          color="#00ff00"
          distance={1}
        />
      </group>
      
      <group ref={cockpitGroupRef} name="BlueprintCockpit" />
    </>
  );
}
