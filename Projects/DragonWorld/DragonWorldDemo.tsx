/**
 * 🐉 DRAGON WORLD - 4K DRAGON + 8K PBR TEXTURES!
 * 
 * SHOWCASING MAXIMUM QUALITY ASSETS:
 * ========================================
 * 🐲 4K Dragon Model (206 MB GLB!)
 * 🌿 8K PBR Grass Textures (BaseColor, Normal, Roughness, AO, Displacement, etc.)
 * 🌍 Procedural terrain with height mapping
 * 🌳 GPU instancing (1,430 objects: trees, rocks, grass)
 * ☀️ Daytime lighting with 2K shadows
 * 🌫️ Atmospheric fog
 * 🎨 Full PBR material workflow
 * 🎭 Animated dragon with floating motion
 * 
 * This is AAA-quality asset rendering!
 */

import { useRef, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Load the MASSIVE 4K dragon model (206 MB!)
function Dragon4K({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Load the dragon model
  const { scene } = useGLTF('/Projects/DragonWorld/dragon1-4k.glb');
  
  // Gentle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.8;
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });
  
  useEffect(() => {
    if (scene) {
      // Traverse and enhance materials
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Enhance materials
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.envMapIntensity = 1.5;
                  mat.needsUpdate = true;
                }
              });
            } else if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.envMapIntensity = 1.5;
              child.material.needsUpdate = true;
            }
          }
        }
      });
    }
  }, [scene]);
  
  return (
    <group ref={groupRef} position={position}>
      <primitive object={scene} scale={2} />
      
      {/* Glowing eyes effect */}
      <pointLight position={[0, 2, 2]} intensity={3} distance={10} color="#ffaa00" />
      <pointLight position={[0, 2, 2]} intensity={2} distance={15} color="#ff6600" />
    </group>
  );
}

// Loading fallback
function DragonPlaceholder() {
  return (
    <group position={[0, 5, 0]}>
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial 
          color="#2a5a2a" 
          emissive="#1a3a1a"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0, 1, 2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffaa00" />
      </mesh>
    </group>
  );
}

// 8K PBR Grass Ground - FULL QUALITY!
function Grass8KPBR() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Load ALL 8K PBR textures!
  const [
    baseColor,
    normal,
    roughness,
    ao,
    displacement,
    bump
  ] = useTexture([
    '/Projects/DragonWorld/litteredgrassground8k/Littered_Grassy_Ground_vlqvdja_8K_BaseColor.jpg',
    '/Projects/DragonWorld/litteredgrassground8k/Littered_Grassy_Ground_vlqvdja_8K_Normal.jpg',
    '/Projects/DragonWorld/litteredgrassground8k/Littered_Grassy_Ground_vlqvdja_8K_Roughness.jpg',
    '/Projects/DragonWorld/litteredgrassground8k/Littered_Grassy_Ground_vlqvdja_8K_AO.jpg',
    '/Projects/DragonWorld/litteredgrassground8k/Littered_Grassy_Ground_vlqvdja_8K_Displacement.jpg',
    '/Projects/DragonWorld/litteredgrassground8k/Littered_Grassy_Ground_vlqvdja_8K_Bump.jpg'
  ]);
  
  // Set texture repeat for tiling
  useEffect(() => {
    const textures = [baseColor, normal, roughness, ao, displacement, bump];
    textures.forEach(texture => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(20, 20); // Tile 20x20 for large terrain
    });
  }, [baseColor, normal, roughness, ao, displacement, bump]);
  
  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
      const positions = geometry.attributes.position;
      
      // Generate subtle terrain variation
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        
        // Multi-octave noise
        let height = 0;
        height += Math.sin(x * 0.05) * Math.cos(y * 0.05) * 2;
        height += Math.sin(x * 0.1) * Math.cos(y * 0.1) * 1;
        height += Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.3;
        
        positions.setZ(i, height);
      }
      
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }, []);
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[300, 300, 200, 200]} />
      <meshStandardMaterial
        map={baseColor}
        normalMap={normal}
        normalScale={new THREE.Vector2(1, 1)}
        roughnessMap={roughness}
        aoMap={ao}
        aoMapIntensity={1.5}
        displacementMap={displacement}
        displacementScale={0.5}
        bumpMap={bump}
        bumpScale={0.3}
      />
    </mesh>
  );
}

// GPU Instanced Trees
function Trees() {
  const count = 80;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      const dummy = new THREE.Object3D();
      
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 40 + Math.random() * 100;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        dummy.position.set(x, 0, z);
        dummy.scale.set(
          1.5 + Math.random() * 1,
          3 + Math.random() * 3,
          1.5 + Math.random() * 1
        );
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

// GPU Instanced Rocks
function Rocks() {
  const count = 150;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      const dummy = new THREE.Object3D();
      
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 30 + Math.random() * 120;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        dummy.position.set(x, 0, z);
        dummy.scale.setScalar(0.8 + Math.random() * 2);
        dummy.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#666666" roughness={0.85} metalness={0.1} />
    </instancedMesh>
  );
}

// GPU Instanced Grass blades
function GrassField() {
  const count = 1200;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      const dummy = new THREE.Object3D();
      
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 60;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        dummy.position.set(x, 0, z);
        dummy.scale.set(0.15, 0.6 + Math.random() * 0.6, 0.15);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} receiveShadow>
      <boxGeometry args={[1, 1, 0.1]} />
      <meshStandardMaterial color="#4a7a3a" roughness={0.9} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

// Atmospheric effects
function Atmosphere() {
  return (
    <>
      <fog attach="fog" args={['#87CEEB', 80, 400]} />
      <color attach="background" args={['#87CEEB']} />
    </>
  );
}

// Daytime lighting
function DaytimeLighting() {
  return (
    <>
      {/* Sun */}
      <directionalLight
        position={[100, 80, 50]}
        intensity={2.5}
        color="#ffffee"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={300}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0001}
      />
      
      {/* Fill light */}
      <directionalLight position={[-60, 50, -40]} intensity={1.2} color="#aaccff" />
      
      {/* Ambient */}
      <ambientLight intensity={0.7} color="#e6f2ff" />
      <hemisphereLight args={['#87CEEB', '#5a8f3a', 1.2]} />
    </>
  );
}

export default function DragonWorldDemo() {
  return (
    <group name="DragonWorld">
      <Atmosphere />
      <DaytimeLighting />
      
      {/* THE MASSIVE 4K DRAGON MODEL! */}
      <Suspense fallback={<DragonPlaceholder />}>
        <Dragon4K position={[0, 8, 0]} />
      </Suspense>
      
      {/* 8K PBR GRASS TERRAIN! */}
      <Suspense fallback={null}>
        <Grass8KPBR />
      </Suspense>
      
      {/* GPU Instanced vegetation - 1,430 total objects! */}
      <Trees />
      <Rocks />
      <GrassField />
      
      {/* Reference grid */}
      <gridHelper args={[300, 150, '#4a7a3a', '#3a5a2a']} position={[0, 0.01, 0]} />
    </group>
  );
}

// Preload assets
useGLTF.preload('/Projects/DragonWorld/dragon1-4k.glb');
