import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SpaceStationProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function SpaceStation({ 
  position = [0, 0, -50], 
  rotation = [0, 0, 0],
  scale = 1 
}: SpaceStationProps) {
  const stationRef = useRef<THREE.Group>(null);

  // Slow rotation
  useFrame((_, delta) => {
    if (stationRef.current) {
      stationRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={stationRef} position={position} rotation={rotation} scale={scale}>
      {/* Main station body - cylinder */}
      <mesh>
        <cylinderGeometry args={[3, 3, 8, 16]} />
        <meshStandardMaterial 
          color="#888888" 
          metalness={0.8} 
          roughness={0.3}
        />
      </mesh>

      {/* Docking port - front */}
      <mesh position={[0, 0, 5]}>
        <cylinderGeometry args={[1.5, 1.5, 2, 8]} />
        <meshStandardMaterial 
          color="#666666" 
          metalness={0.7} 
          roughness={0.4}
        />
      </mesh>

      {/* Docking ring */}
      <mesh position={[0, 0, 6]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.1, 8, 16]} />
        <meshStandardMaterial 
          color="#ffaa00" 
          emissive="#ffaa00"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Solar panels */}
      <group>
        {/* Left panel */}
        <mesh position={[-5, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[4, 0.1, 6]} />
          <meshStandardMaterial 
            color="#1a3a5a" 
            metalness={0.9} 
            roughness={0.1}
          />
        </mesh>

        {/* Right panel */}
        <mesh position={[5, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[4, 0.1, 6]} />
          <meshStandardMaterial 
            color="#1a3a5a" 
            metalness={0.9} 
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Communication dish */}
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <coneGeometry args={[1, 2, 16]} />
        <meshStandardMaterial 
          color="#cccccc" 
          metalness={0.6} 
          roughness={0.4}
        />
      </mesh>

      {/* Lights - indicate docking port */}
      <pointLight position={[0, 0, 7]} intensity={2} distance={20} color="#00ff00" />
      <pointLight position={[0, 2, 5]} intensity={1} distance={15} color="#ffffff" />
      <pointLight position={[0, -2, 5]} intensity={1} distance={15} color="#ffffff" />
    </group>
  );
}
