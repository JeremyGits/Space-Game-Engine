/**
 * 🐉 DRAGON WORLD - 4K DRAGON DEMO
 * Simplified version for testing - will add 8K textures after dragon loads
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// 4K Dragon
function Dragon4K({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF('/Projects/DragonWorld/dragon1-4k.glb');
  const { scene, animations } = gltf;
  const { actions, names } = useAnimations(animations, groupRef);
  
  useEffect(() => {
    console.log('🐉 Dragon Loaded!', names.length, 'animations');
    
    if (names.length > 0 && actions[names[0]]) {
      actions[names[0]]?.reset().play();
    }
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, animations, actions, names]);
  
  useFrame((state) => {
    if (groupRef.current && names.length === 0) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.8;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });
  
  return (
    <group ref={groupRef} position={position}>
      <primitive object={scene.clone()} scale={2} />
      <pointLight position={[0, 2, 2]} intensity={3} distance={10} color="#ffaa00" />
    </group>
  );
}

// Simple terrain (no 8K textures yet)
function SimpleTerrain() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
      const positions = geometry.attributes.position;
      
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        
        let height = 0;
        height += Math.sin(x * 0.05) * Math.cos(y * 0.05) * 3;
        height += Math.sin(x * 0.1) * Math.cos(y * 0.1) * 1.5;
        
        positions.setZ(i, height);
      }
      
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }, []);
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[300, 300, 100, 100]} />
      <meshStandardMaterial color="#3a5a2a" roughness={0.9} />
    </mesh>
  );
}

// Trees
function Trees() {
  const count = 50;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      const dummy = new THREE.Object3D();
      
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 40 + Math.random() * 80;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        dummy.position.set(x, 0, z);
        dummy.scale.set(1.5, 3 + Math.random() * 2, 1.5);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <cylinderGeometry args={[0.8, 1.2, 10, 8]} />
      <meshStandardMaterial color="#3d2817" roughness={0.95} />
    </instancedMesh>
  );
}

export default function DragonOpenWorldDemo() {
  return (
    <group name="DragonWorld">
      {/* Sky */}
      <fog attach="fog" args={['#87CEEB', 80, 400]} />
      <color attach="background" args={['#87CEEB']} />
      
      {/* Lighting */}
      <directionalLight
        position={[100, 80, 50]}
        intensity={2.5}
        color="#ffffee"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={300}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
      />
      <directionalLight position={[-60, 50, -40]} intensity={1.2} color="#aaccff" />
      <ambientLight intensity={0.7} color="#e6f2ff" />
      <hemisphereLight args={['#87CEEB', '#5a8f3a', 1.2]} />
      
      {/* Dragon */}
      <Dragon4K position={[0, 8, 0]} />
      
      {/* Terrain */}
      <SimpleTerrain />
      
      {/* Trees */}
      <Trees />
      
      {/* Grid */}
      <gridHelper args={[300, 150, '#4a7a3a', '#3a5a2a']} position={[0, 0.01, 0]} />
    </group>
  );
}

// Preload
useGLTF.preload('/Projects/DragonWorld/dragon1-4k.glb');
