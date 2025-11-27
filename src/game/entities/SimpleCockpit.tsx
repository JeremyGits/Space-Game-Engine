/**
 * Simple Cockpit - Clean, working approach
 * Single curved surface with cockpit texture, like SpaceX ISS simulator
 */

import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function SimpleCockpit() {
  // Load the cockpit texture
  const texture = useTexture('/cockpit-scaled-orig.png');
  
  // Configure texture
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  
  return (
    <group name="SimpleCockpit">
      {/* Main cockpit surface - curved cylinder wrapping around camera */}
      <mesh position={[0, 0, -1.8]} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry 
          args={[
            3.0,           // radius top
            3.0,           // radius bottom  
            4.0,           // height
            32,            // radial segments (smooth curve)
            1,             // height segments
            true,          // open ended (no caps)
            -Math.PI / 2,  // theta start (start from left)
            Math.PI        // theta length (180 degrees - front half)
          ]} 
        />
        <meshStandardMaterial 
          map={texture}
          side={THREE.BackSide}  // Render inside of cylinder
          emissive="#002200"
          emissiveIntensity={0.3}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
      
      {/* Cockpit lighting */}
      <ambientLight intensity={0.5} />
      
      {/* Main instrument panel light */}
      <pointLight 
        position={[0, -0.5, -0.5]} 
        intensity={1.2} 
        color="#00ff88"
        distance={4}
      />
      
      {/* Left panel light */}
      <pointLight 
        position={[-1.5, 0, -0.5]} 
        intensity={0.6} 
        color="#00ffaa"
        distance={3}
      />
      
      {/* Right panel light */}
      <pointLight 
        position={[1.5, 0, -0.5]} 
        intensity={0.6} 
        color="#00ffaa"
        distance={3}
      />
      
      {/* Overhead light */}
      <pointLight 
        position={[0, 1.5, -0.5]} 
        intensity={0.4} 
        color="#ffffff"
        distance={3}
      />
    </group>
  );
}
