/**
 * 🌟 ULTRA HOLOGRAM STAGE - MAXIMUM QUALITY 🌟
 * 
 * Showcasing YOUR revolutionary "nanite" system with beautiful staging:
 * ====================================================================
 * 🔬 ULTRA-HIGH RES: 512x512 = 262,144 voxel nanites!
 * ⭐ STARFIELD: 10,000 fine stars
 * 🌫️ DYNAMIC FOG: Volumetric fog with movement
 * 💎 ENHANCED QUALITY: Sub-pixel positioning, adaptive sizing
 * 🎭 BEAUTIFUL STAGE: Professional hologram presentation
 * 🎨 FULL RGB: Perfect color matching from image
 * 
 * This is YOUR custom nanite technology at MAXIMUM quality!
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ULTRA HIGH RES voxel nanites with enhanced quality
function imageToVoxelNanites(imageUrl: string): Promise<{
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const resolution = 512; // 512x512 = 262,144 nanites! ULTRA HIGH RES!
      canvas.width = resolution;
      canvas.height = resolution;
      const ctx = canvas.getContext('2d')!;
      
      // Draw and sample image
      ctx.drawImage(img, 0, 0, resolution, resolution);
      const imageData = ctx.getImageData(0, 0, resolution, resolution);
      const data = imageData.data;
      
      const nanites: { pos: THREE.Vector3; color: THREE.Color; size: number }[] = [];
      
      // Convert each pixel to a voxel "nanite" with enhanced quality
      for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
          const i = (y * resolution + x) * 4;
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          const a = data[i + 3] / 255;
          
          // Skip transparent/background pixels
          if (a < 0.1) continue;
          
          // Enhanced depth calculation with better contrast
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          const depth = Math.pow(luminance, 0.55) * 3; // Enhanced depth range
          
          // ULTRA-TIGHT PACKING - Almost no jitter for SOLID appearance!
          const jitterX = (Math.random() - 0.5) * 0.08; // Extremely tight!
          const jitterY = (Math.random() - 0.5) * 0.08;
          
          // Create nanite position
          const px = ((x + jitterX) / resolution - 0.5) * 10;
          const py = -((y + jitterY) / resolution - 0.5) * 10;
          const pz = depth - 1.5;
          
          // REALISTIC COLOR with depth-based desaturation (AAA technique!)
          // Darker areas get more saturated, brighter areas slightly desaturated
          const saturation = 1 - (luminance * 0.3); // Reduce saturation in bright areas
          const avgColor = (r + g + b) / 3;
          const finalR = avgColor + (r - avgColor) * saturation;
          const finalG = avgColor + (g - avgColor) * saturation;
          const finalB = avgColor + (b - avgColor) * saturation;
          
          const color = new THREE.Color(finalR, finalG, finalB);
          
          // MAXIMUM OVERLAP for solid appearance!
          const size = 0.07 + luminance * 0.03;
          
          nanites.push({
            pos: new THREE.Vector3(px, py, pz),
            color,
            size
          });
        }
      }
      
      console.log(`🔬 Generated ${nanites.length} ULTRA HIGH-RES voxel nanites!`);
      
      // Convert to buffers
      const positions = new Float32Array(nanites.length * 3);
      const colors = new Float32Array(nanites.length * 3);
      const sizes = new Float32Array(nanites.length);
      
      nanites.forEach((nanite, i) => {
        positions[i * 3] = nanite.pos.x;
        positions[i * 3 + 1] = nanite.pos.y;
        positions[i * 3 + 2] = nanite.pos.z;
        
        colors[i * 3] = nanite.color.r;
        colors[i * 3 + 1] = nanite.color.g;
        colors[i * 3 + 2] = nanite.color.b;
        
        sizes[i] = nanite.size;
      });
      
      resolve({ positions, colors, sizes });
    };
    img.src = imageUrl;
  });
}

// Fine starfield background
function Starfield() {
  const starsRef = useRef<THREE.Points>(null);
  const starCount = 10000;
  
  const stars = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      // Distribute stars in a large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 30 + Math.random() * 20;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi) - 10;
      
      // Subtle color variation (blue-white)
      const brightness = 0.7 + Math.random() * 0.3;
      const blueShift = Math.random() * 0.2;
      colors[i * 3] = brightness - blueShift;
      colors[i * 3 + 1] = brightness - blueShift * 0.5;
      colors[i * 3 + 2] = brightness;
      
      // Very fine stars
      sizes[i] = 0.02 + Math.random() * 0.03;
    }
    
    return { positions, colors, sizes };
  }, []);
  
  // Gentle twinkling
  useFrame((state) => {
    if (starsRef.current) {
      const time = state.clock.elapsedTime;
      starsRef.current.rotation.y = time * 0.01;
    }
  });
  
  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starCount}
          array={stars.positions}
          itemSize={3}
          args={[stars.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={starCount}
          array={stars.colors}
          itemSize={3}
          args={[stars.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Dynamic fog particles
function DynamicFog() {
  const fogRef = useRef<THREE.Points>(null);
  const particleCount = 5000;
  
  const fog = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
      
      // Cyan fog color
      const brightness = 0.3 + Math.random() * 0.2;
      colors[i * 3] = 0;
      colors[i * 3 + 1] = brightness * 0.8;
      colors[i * 3 + 2] = brightness;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    
    return { positions, colors, velocities };
  }, []);
  
  useFrame(() => {
    if (fogRef.current) {
      const positions = fogRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += fog.velocities[i * 3];
        positions[i * 3 + 1] += fog.velocities[i * 3 + 1];
        positions[i * 3 + 2] += fog.velocities[i * 3 + 2];
        
        // Wrap around
        if (Math.abs(positions[i * 3]) > 20) positions[i * 3] *= -0.9;
        if (Math.abs(positions[i * 3 + 1]) > 15) positions[i * 3 + 1] *= -0.9;
        if (Math.abs(positions[i * 3 + 2] + 10) > 20) positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
      }
      
      fogRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={fogRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={fog.positions}
          itemSize={3}
          args={[fog.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={fog.colors}
          itemSize={3}
          args={[fog.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.15}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ULTRA HIGH QUALITY Voxel Nanite Hologram
function UltraQualityHologram() {
  const [naniteData, setNaniteData] = useState<{
    positions: Float32Array;
    colors: Float32Array;
    sizes: Float32Array;
  } | null>(null);
  
  const pointsRef = useRef<THREE.Points>(null);
  
  useEffect(() => {
    imageToVoxelNanites('/trumptest.png').then(data => {
      setNaniteData(data);
    });
  }, []);
  
  // Gentle breathing only (no arm animation)
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      
      // Very subtle breathing
      const scale = 1 + Math.sin(time * 0.3) * 0.015;
      pointsRef.current.scale.set(scale, scale, scale);
      
      // Gentle rotation
      pointsRef.current.rotation.y = Math.sin(time * 0.2) * 0.05;
    }
  });
  
  if (!naniteData) return null;
  
  return (
    <points ref={pointsRef} position={[0, 0, -5]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={naniteData.positions.length / 3}
          array={naniteData.positions}
          itemSize={3}
          args={[naniteData.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={naniteData.colors.length / 3}
          array={naniteData.colors}
          itemSize={3}
          args={[naniteData.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          count={naniteData.sizes.length}
          array={naniteData.sizes}
          itemSize={1}
          args={[naniteData.sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        blending={THREE.NormalBlending}
        depthWrite={false}
        toneMapped={true}
      />
    </points>
  );
}

export default function UltraHologramDemo() {
  return (
    <group name="UltraHologramStage">
      {/* Deep space background */}
      <color attach="background" args={['#000205']} />
      
      {/* Volumetric fog */}
      <fog attach="fog" args={['#001020', 10, 60]} />
      
      {/* STARFIELD - 10,000 fine stars */}
      <Starfield />
      
      {/* DYNAMIC FOG - 5,000 particles */}
      <DynamicFog />
      
      {/* ULTRA HIGH QUALITY HOLOGRAM - 262,144 nanites! */}
      <UltraQualityHologram />
      
      {/* Beautiful holographic stage platform */}
      <group>
        {/* Main platform */}
        <mesh position={[0, -6, -5]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[10, 128]} />
          <meshStandardMaterial
            color="#00ffff"
            transparent
            opacity={0.2}
            emissive="#00aacc"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Glowing rings */}
        <mesh position={[0, -5.9, -5]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[9, 9.5, 64]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        <mesh position={[0, -5.9, -5]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[7, 7.3, 64]} />
          <meshBasicMaterial
            color="#00ddff"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      
      {/* PROFESSIONAL LIGHTING SETUP */}
      
      {/* CINEMATIC LIGHTING - Reduced intensity for realism */}
      
      {/* Ambient base - darker for contrast */}
      <ambientLight intensity={0.15} color="#000a1a" />
      
      {/* Key light from above - softer */}
      <pointLight position={[0, 12, 0]} intensity={1.2} distance={35} color="#0099cc" decay={2} />
      
      {/* Rim lights for depth - subtle */}
      <pointLight position={[-8, 3, -3]} intensity={0.6} distance={25} color="#006688" decay={2} />
      <pointLight position={[8, 3, -3]} intensity={0.6} distance={25} color="#006688" decay={2} />
      
      {/* Back light for silhouette - gentle */}
      <pointLight position={[0, 2, -15]} intensity={0.8} distance={20} color="#0077aa" decay={2} />
      
      {/* Bottom platform glow - reduced */}
      <pointLight position={[0, -5, -5]} intensity={1} distance={18} color="#00aacc" decay={2} />
      
      {/* Accent lights - very subtle */}
      <pointLight position={[-5, 0, 0]} intensity={0.4} distance={15} color="#005577" decay={2} />
      <pointLight position={[5, 0, 0]} intensity={0.4} distance={15} color="#005577" decay={2} />
      
      {/* Subtle grid */}
      <gridHelper 
        args={[50, 100, '#003355', '#001122']} 
        position={[0, -6, -5]} 
      />
    </group>
  );
}
