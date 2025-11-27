/**
 * 🇺🇸 HOLOGRAPHIC TRUMP DEMO - SMOOTH & REFINED 🇺🇸
 * 
 * A SOPHISTICATED HOLOGRAPHIC PROJECTION:
 * =======================================
 * 🔷 GEOMETRY: 256x256 = 65,536 VERTICES (Smooth, high detail)
 * 💎 HOLOGRAM EFFECT: Transparent, glowing, NO SPIKES!
 * ✨ PARTICLES: Refined energy field (3,000 particles)
 * 💡 LIGHTING: Clean, focused lighting (10 lights)
 * 🎨 MATERIALS: Normal mapping ONLY for smooth detail
 * 🎭 ANIMATION: Smooth, stable rotation
 * 🏆 PERFORMANCE: Optimized for 60 FPS
 * 
 * USING NORMAL MAPPING INSTEAD OF DISPLACEMENT = SMOOTH SURFACE!
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Enhanced depth map for NORMAL mapping (not displacement!)
function imageToDepthMap(imageUrl: string): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Gentle contrast for smooth normal mapping
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const normalized = luminance / 255;
        const enhanced = Math.pow(normalized, 0.6) * 255; // Gentler curve
        const contrasted = ((enhanced / 255 - 0.5) * 1.2 + 0.5) * 255; // Less contrast
        const final = Math.max(0, Math.min(255, contrasted));
        
        data[i] = data[i + 1] = data[i + 2] = final;
      }
      
      ctx.putImageData(imageData, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      resolve(texture);
    };
    img.src = imageUrl;
  });
}

// Hologram Energy Field
function HologramEnergyField() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 3000;
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 7 + Math.random() * 2;
      const height = (Math.random() - 0.5) * 14;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = -5 + Math.sin(angle) * radius;
      
      colors[i * 3] = 0.3;
      colors[i * 3 + 1] = 0.8;
      colors[i * 3 + 2] = 1;
    }
    
    return { positions, colors };
  }, []);
  
  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const time = state.clock.elapsedTime;
      
      for (let i = 0; i < particleCount; i++) {
        const angle = time * 0.05 + i * 0.001;
        const radius = 7 + Math.sin(time * 0.5 + i * 0.01) * 0.5;
        
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 2] = -5 + Math.sin(angle) * radius;
        positions[i * 3 + 1] += Math.sin(time + i) * 0.001;
        
        if (positions[i * 3 + 1] > 7 || positions[i * 3 + 1] < -7) {
          positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Hologram Scan Lines
function HologramScanLines() {
  const linesRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.position.y = (state.clock.elapsedTime * 2) % 16 - 8;
    }
  });
  
  return (
    <group ref={linesRef}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[0, i * 0.5, -5]}>
          <planeGeometry args={[15, 0.05]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// Hologram Ring
function HologramRing() {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.2;
      const scale = 1 + Math.sin(state.clock.elapsedTime) * 0.02;
      ringRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <mesh ref={ringRef} position={[0, 0, -5]}>
      <torusGeometry args={[8, 0.05, 16, 100]} />
      <meshStandardMaterial 
        color="#00ffff" 
        emissive="#00ffff"
        emissiveIntensity={2}
        transparent
        opacity={0.6}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
}

export default function UltraTrumpDemo() {
  const [depthMap, setDepthMap] = useState<THREE.Texture | null>(null);
  const colorTexture = useLoader(THREE.TextureLoader, '/trumptest.png');
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    imageToDepthMap('/trumptest.png').then(depth => {
      setDepthMap(depth);
    });
  }, []);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.1;
      const scale = 1 + Math.sin(time * 0.8) * 0.01;
      meshRef.current.scale.set(scale, scale, 1);
      
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material) {
        material.opacity = 0.9 + Math.sin(time * 10) * 0.05;
      }
    }
    
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(time * 0.3) * 0.2;
    }
  });
  
  if (!depthMap) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial 
            color="#00ffff" 
            emissive="#00ffff" 
            emissiveIntensity={1}
            transparent
            opacity={0.8}
          />
        </mesh>
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 0, 5]} intensity={2} color="#00ffff" />
      </group>
    );
  }
  
  return (
    <group name="HologramTrumpDemo">
      {/* SMOOTH HOLOGRAPHIC CENTERPIECE - NO DISPLACEMENT! */}
      <group ref={groupRef}>
        <mesh ref={meshRef} position={[0, 0, -5]}>
          {/* Lower poly count for smoother surface */}
          <planeGeometry args={[12, 12, 256, 256]} />
          <meshStandardMaterial
            map={colorTexture}
            
            // NORMAL MAPPING ONLY - NO DISPLACEMENT!
            // This gives 3D detail illusion without actual geometry spikes
            normalMap={depthMap}
            normalScale={new THREE.Vector2(1.5, 1.5)}
            
            // Subtle AO for depth perception
            aoMap={depthMap}
            aoMapIntensity={1.2}
            
            // HOLOGRAM MATERIAL PROPERTIES
            transparent
            opacity={0.9}
            emissive="#00ccff"
            emissiveIntensity={0.6}
            metalness={0.2}
            roughness={0.7}
            envMapIntensity={1.2}
            
            // Additive blending for glow
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      
      {/* REFINED PARTICLE SYSTEM */}
      <HologramEnergyField />
      
      {/* HOLOGRAM SCAN LINES */}
      <HologramScanLines />
      
      {/* SINGLE STABLE RING */}
      <HologramRing />
      
      {/* DARK BACKGROUND FOG */}
      <fog attach="fog" args={['#000510', 15, 50]} />
      
      {/* DARK REFLECTIVE FLOOR */}
      <mesh position={[0, -6, -5]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#000510"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={1}
        />
      </mesh>
      
      {/* REFINED LIGHTING - HOLOGRAM STYLE */}
      
      {/* Main hologram light from above */}
      <directionalLight 
        position={[0, 20, 10]} 
        intensity={1.5} 
        color="#00ddff"
      />
      
      {/* Rim lights for definition */}
      <directionalLight position={[-10, 10, 5]} intensity={0.8} color="#0088ff" />
      <directionalLight position={[10, 10, 5]} intensity={0.8} color="#0088ff" />
      
      {/* Accent lights */}
      <spotLight 
        position={[0, 15, 0]} 
        angle={0.5} 
        intensity={2} 
        penumbra={0.5} 
        color="#00ffff"
      />
      
      <spotLight position={[-8, 8, -3]} angle={0.6} intensity={1.2} penumbra={0.6} color="#0099ff" />
      <spotLight position={[8, 8, -3]} angle={0.6} intensity={1.2} penumbra={0.6} color="#0099ff" />
      
      {/* Point lights for glow */}
      <pointLight position={[0, 8, 0]} intensity={2} distance={15} color="#00ffff" />
      <pointLight position={[-6, 4, -3]} intensity={1.5} distance={12} color="#0088ff" />
      <pointLight position={[6, 4, -3]} intensity={1.5} distance={12} color="#0088ff" />
      
      {/* Subtle ambient */}
      <ambientLight intensity={0.3} color="#001122" />
      <hemisphereLight args={['#000510', '#00ffff', 0.5]} />
      
      {/* GRID - Hologram style */}
      <gridHelper args={[40, 120, '#003366', '#001133']} position={[0, -6, -5]} />
    </group>
  );
}
