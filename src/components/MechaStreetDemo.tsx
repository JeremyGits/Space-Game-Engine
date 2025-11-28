/**
 * 🤖 MECHA STREET DEMO - ANIMATED GLB MODELS! 💡
 * 
 * Showcasing UE5-level rendering with ACTUAL GLB assets + ANIMATIONS!
 * Using Three.js AnimationMixer for professional skeletal animation
 */

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// REAL Mecha Robot from GLB with ANIMATIONS!
function RealMecha({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF('/models/robots/mecha/mecha.glb');
  const { scene, animations } = gltf;
  const { actions, names, mixer } = useAnimations(animations, groupRef);
  
  const [animationInfo, setAnimationInfo] = useState<string>('');
  
  useEffect(() => {
    console.log('🎭 Mecha Animations Available:', names);
    console.log('🎬 Animation Actions:', actions);
    
    if (names.length > 0) {
      setAnimationInfo(`Found ${names.length} animations: ${names.join(', ')}`);
      
      // Play first animation if available
      const firstAnimation = names[0];
      const action = actions[firstAnimation];
      
      if (action) {
        console.log(`▶️ Playing animation: ${firstAnimation}`);
        action.reset();
        action.play();
        action.setLoop(THREE.LoopRepeat, Infinity);
      }
    } else {
      setAnimationInfo('No animations found in GLB - using rotation fallback');
      console.log('⚠️ No animations in mecha.glb - model will rotate instead');
    }
  }, [actions, names]);
  
  // Fallback rotation if no animations
  useFrame((state) => {
    if (groupRef.current && names.length === 0) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });
  
  const clonedScene = scene.clone();
  clonedScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      
      if (child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        material.metalness = 0.8;
        material.roughness = 0.3;
        material.envMapIntensity = 1.5;
      }
    }
  });
  
  return (
    <>
      <group ref={groupRef} position={position}>
        <primitive object={clonedScene} scale={3.5} />
      </group>
      
      {/* Animation Info Display */}
      {animationInfo && (
        <mesh position={[position[0], position[1] + 20, position[2]]}>
          <planeGeometry args={[10, 2]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} />
        </mesh>
      )}
    </>
  );
}

// REAL Street Light from GLB - MUCH SMALLER!
function RealStreetLight({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF('/models/lights/street/lamp_post_light.glb');
  const lightRef = useRef<THREE.PointLight>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      const flicker = Math.sin(state.clock.elapsedTime * 10 + position[0]) * 0.08 + 0.92;
      lightRef.current.intensity = 5 * flicker;
    }
    
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1 + 0.9;
      glowRef.current.scale.setScalar(pulse);
    }
  });
  
  return (
    <group position={position}>
      <primitive object={scene.clone()} scale={0.05} castShadow receiveShadow />
      
      <pointLight
        ref={lightRef}
        position={[0, 1, 0]}
        intensity={5}
        distance={25}
        decay={2}
        color="#ffaa00"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color="#ffaa00"
          emissive="#ffaa00"
          emissiveIntensity={4}
          transparent
          opacity={0.95}
        />
      </mesh>
      
      <mesh ref={glowRef} position={[0, 1, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// Ground
function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </mesh>
      <gridHelper args={[60, 120, '#333333', '#666666']} position={[0, 0.01, 0]} />
    </>
  );
}

export default function MechaStreetDemo() {
  return (
    <group name="MechaStreetScene">
      <Ground />
      
      {/* REAL MECHA - Perfect height! */}
      <RealMecha position={[0, 16.45, 0]} />
      
      {/* REAL STREET LIGHTS - Much smaller! */}
      <RealStreetLight position={[-15, 0, -15]} />
      <RealStreetLight position={[15, 0, -15]} />
      <RealStreetLight position={[-15, 0, 15]} />
      <RealStreetLight position={[15, 0, 15]} />
      
      {/* BRIGHT LIGHTING */}
      <fog attach="fog" args={['#1a1a2e', 20, 60]} />
      <ambientLight intensity={1.2} color="#ffffff" />
      
      <directionalLight
        position={[15, 25, 15]}
        intensity={2.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0001}
      />
      
      <directionalLight position={[-15, 20, 10]} intensity={1.5} color="#aaccff" />
      <directionalLight position={[-10, 10, 20]} intensity={1.2} color="#6699ff" />
      <directionalLight position={[0, 30, 0]} intensity={1} color="#ffffff" />
    </group>
  );
}

// Preload GLB models
useGLTF.preload('/models/robots/mecha/mecha.glb');
useGLTF.preload('/models/lights/street/lamp_post_light.glb');
