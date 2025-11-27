/**
 * Image to 3D Test
 * Demonstrates converting any image to 3D using luminance-based displacement
 * Fun test with trumptest.png
 */

import { useEffect, useState, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

// Convert image to depth map based on luminance
function imageToDepthMap(imageUrl: string): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale depth based on luminance
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Luminance formula (brighter = higher)
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Enhance contrast for better depth
        const enhanced = Math.pow(luminance / 255, 0.8) * 255;
        
        data[i] = data[i + 1] = data[i + 2] = enhanced;
      }
      
      ctx.putImageData(imageData, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      resolve(texture);
    };
    img.src = imageUrl;
  });
}

export default function ImageTo3DTest() {
  const [depthMap, setDepthMap] = useState<THREE.Texture | null>(null);
  const colorTexture = useLoader(THREE.TextureLoader, '/trumptest.png');
  
  useEffect(() => {
    imageToDepthMap('/trumptest.png').then(depth => {
      setDepthMap(depth);
    });
  }, []);
  
  if (!depthMap) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
        </mesh>
        <ambientLight intensity={1} />
      </group>
    );
  }
  
  return (
    <group name="ImageTo3DTest">
      {/* Main 3D Image - High Detail */}
      <mesh position={[0, 0, -3]} castShadow receiveShadow>
        <planeGeometry args={[4, 4, 300, 300]} />
        <meshStandardMaterial
          map={colorTexture}
          displacementMap={depthMap}
          displacementScale={0.5}
          normalMap={depthMap}
          normalScale={[2, 2]}
          aoMap={depthMap}
          aoMapIntensity={1}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      {/* Side view to show depth */}
      <mesh position={[-3, 0, -3]} rotation={[0, Math.PI/2, 0]} castShadow receiveShadow>
        <planeGeometry args={[4, 4, 300, 300]} />
        <meshStandardMaterial
          map={colorTexture}
          displacementMap={depthMap}
          displacementScale={0.5}
          normalMap={depthMap}
          normalScale={[2, 2]}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      {/* Extreme displacement version */}
      <mesh position={[3, 0, -3]} rotation={[0, -Math.PI/4, 0]} castShadow receiveShadow>
        <planeGeometry args={[3, 3, 256, 256]} />
        <meshStandardMaterial
          map={colorTexture}
          displacementMap={depthMap}
          displacementScale={1.2}
          normalMap={depthMap}
          normalScale={[3, 3]}
          aoMap={depthMap}
          aoMapIntensity={1.5}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
      
      {/* Info labels */}
      <mesh position={[0, -2.3, -2.9]}>
        <boxGeometry args={[3.8, 0.15, 0.02]} />
        <meshStandardMaterial color="#111" emissive="#00ff00" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-3, -2.3, -2.9]}>
        <boxGeometry args={[3.8, 0.15, 0.02]} />
        <meshStandardMaterial color="#111" emissive="#00aaff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[3, -2.3, -2.9]}>
        <boxGeometry args={[2.8, 0.15, 0.02]} />
        <meshStandardMaterial color="#111" emissive="#ff00ff" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Floor */}
      <mesh position={[0, -2.5, -3]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial
          color="#222222"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Professional Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 10]} 
        intensity={2.5} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-8, 6, -8]} intensity={1.5} castShadow />
      <pointLight position={[0, 5, 0]} intensity={3} color="#ffffff" distance={20} castShadow />
      <pointLight position={[-5, 3, 0]} intensity={2} color="#ffffff" distance={15} />
      <pointLight position={[5, 3, 0]} intensity={2} color="#ffffff" distance={15} />
      <spotLight 
        position={[0, 8, -3]} 
        angle={0.7} 
        intensity={3} 
        penumbra={0.3} 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight position={[-4, 4, 2]} angle={0.5} intensity={2} penumbra={0.5} color="#aaccff" castShadow />
      <spotLight position={[4, 4, 2]} angle={0.5} intensity={2} penumbra={0.5} color="#ffccaa" />
      
      {/* Grid */}
      <gridHelper args={[12, 60, '#444444', '#222222']} position={[0, -2.5, -3]} />
    </group>
  );
}
