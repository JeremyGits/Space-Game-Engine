import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo } from 'react';

/**
 * PBR Material Test Scene
 * Tests all PBR material properties and rendering
 */
export function PBRTestScene() {
  // Create test materials with different PBR properties
  const testMaterials = useMemo(() => {
    return {
      // High metalness, low roughness (shiny metal)
      shinyMetal: new THREE.MeshPhysicalMaterial({
        color: '#888888',
        metalness: 1.0,
        roughness: 0.1,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1
      }),
      
      // Medium metalness, medium roughness (brushed metal)
      brushedMetal: new THREE.MeshPhysicalMaterial({
        color: '#666666',
        metalness: 0.8,
        roughness: 0.4
      }),
      
      // Low metalness, high roughness (matte plastic)
      mattePlastic: new THREE.MeshPhysicalMaterial({
        color: '#ff6600',
        metalness: 0.0,
        roughness: 0.9
      }),
      
      // Glossy plastic with clearcoat
      glossyPlastic: new THREE.MeshPhysicalMaterial({
        color: '#0066ff',
        metalness: 0.1,
        roughness: 0.3,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
      }),
      
      // Emissive material
      emissive: new THREE.MeshPhysicalMaterial({
        color: '#00ff00',
        metalness: 0.5,
        roughness: 0.3,
        emissive: new THREE.Color('#00ff00'),
        emissiveIntensity: 2.0
      }),
      
      // Glass with high clearcoat
      glass: new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.9,
        thickness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0
      })
    };
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000' }}>
      {/* Test info HUD */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '20px',
        borderRadius: '8px',
        border: '2px solid #00ff00',
        maxWidth: '400px'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#00ff00' }}>
          🎨 PBR MATERIAL TEST SCENE
        </div>
        <div style={{ marginBottom: '10px', color: '#888', fontSize: '12px' }}>
          Testing MeshPhysicalMaterial with various PBR properties
        </div>
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #00ff00' }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Materials Being Tested:</div>
          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
            • Shiny Metal (metalness 1.0, roughness 0.1, clearcoat 0.5)<br/>
            • Brushed Metal (metalness 0.8, roughness 0.4)<br/>
            • Matte Plastic (metalness 0.0, roughness 0.9)<br/>
            • Glossy Plastic (clearcoat 1.0, roughness 0.3)<br/>
            • Emissive (emissiveIntensity 2.0)<br/>
            • Glass (transmission 0.9, clearcoat 1.0)
          </div>
        </div>
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #00ff00' }}>
          <div style={{ fontSize: '11px', color: '#888' }}>
            Use mouse to orbit camera and inspect materials
          </div>
        </div>
      </div>
      
      <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
        {/* Lighting setup for PBR */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <pointLight position={[-10, 5, -5]} intensity={0.5} color="#0088ff" />
        <pointLight position={[10, 5, -5]} intensity={0.5} color="#ff8800" />
        
        {/* Environment map for reflections */}
        <Environment preset="sunset" />
        
        {/* Test spheres in a grid */}
        <group>
          {/* Row 1: Metalness variations */}
          <mesh position={[-4, 2, 0]} material={testMaterials.shinyMetal}>
            <sphereGeometry args={[0.8, 64, 64]} />
          </mesh>
          
          <mesh position={[-2, 2, 0]} material={testMaterials.brushedMetal}>
            <sphereGeometry args={[0.8, 64, 64]} />
          </mesh>
          
          <mesh position={[0, 2, 0]} material={testMaterials.mattePlastic}>
            <sphereGeometry args={[0.8, 64, 64]} />
          </mesh>
          
          <mesh position={[2, 2, 0]} material={testMaterials.glossyPlastic}>
            <sphereGeometry args={[0.8, 64, 64]} />
          </mesh>
          
          <mesh position={[4, 2, 0]} material={testMaterials.emissive}>
            <sphereGeometry args={[0.8, 64, 64]} />
          </mesh>
          
          {/* Row 2: Different geometries */}
          <mesh position={[-4, 0, 0]} material={testMaterials.shinyMetal}>
            <boxGeometry args={[1.2, 1.2, 1.2]} />
          </mesh>
          
          <mesh position={[-2, 0, 0]} material={testMaterials.brushedMetal}>
            <cylinderGeometry args={[0.6, 0.6, 1.5, 32]} />
          </mesh>
          
          <mesh position={[0, 0, 0]} material={testMaterials.mattePlastic}>
            <torusGeometry args={[0.6, 0.3, 32, 64]} />
          </mesh>
          
          <mesh position={[2, 0, 0]} material={testMaterials.glossyPlastic}>
            <coneGeometry args={[0.7, 1.5, 32]} />
          </mesh>
          
          <mesh position={[4, 0, 0]} material={testMaterials.glass}>
            <sphereGeometry args={[0.8, 64, 64]} />
          </mesh>
          
          {/* Row 3: Complex shapes */}
          <mesh position={[-4, -2, 0]} material={testMaterials.shinyMetal}>
            <torusKnotGeometry args={[0.5, 0.2, 128, 32]} />
          </mesh>
          
          <mesh position={[-2, -2, 0]} material={testMaterials.brushedMetal}>
            <octahedronGeometry args={[0.8, 0]} />
          </mesh>
          
          <mesh position={[0, -2, 0]} material={testMaterials.mattePlastic}>
            <dodecahedronGeometry args={[0.8, 0]} />
          </mesh>
          
          <mesh position={[2, -2, 0]} material={testMaterials.glossyPlastic}>
            <icosahedronGeometry args={[0.8, 1]} />
          </mesh>
          
          <mesh position={[4, -2, 0]} material={testMaterials.emissive}>
            <torusGeometry args={[0.6, 0.25, 32, 64]} />
          </mesh>
        </group>
        
        {/* Ground plane with reflective material */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshPhysicalMaterial 
            color="#111111"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        
        {/* Orbit controls for inspection */}
        <OrbitControls 
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={20}
        />
        
        {/* Grid helper */}
        <gridHelper args={[20, 20, '#444444', '#222222']} position={[0, -3, 0]} />
      </Canvas>
    </div>
  );
}
