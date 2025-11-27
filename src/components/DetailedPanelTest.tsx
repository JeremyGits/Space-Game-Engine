/**
 * Detailed Panel Test
 * Showcases procedural geometric detail on panels
 * Demonstrates what the engine can do with displacement and detail
 */

import { useMemo } from 'react';
import * as THREE from 'three';

// Generate procedural displacement texture
function createProceduralDisplacement(width: number, height: number, pattern: string) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  // Fill with base gray
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, width, height);
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  if (pattern === 'rivets') {
    // Create rivet pattern
    const rivetSpacing = 64;
    for (let y = rivetSpacing/2; y < height; y += rivetSpacing) {
      for (let x = rivetSpacing/2; x < width; x += rivetSpacing) {
        // Draw circular rivet
        for (let dy = -16; dy <= 16; dy++) {
          for (let dx = -16; dx <= 16; dx++) {
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 12) {
              const px = Math.floor(x + dx);
              const py = Math.floor(y + dy);
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const idx = (py * width + px) * 4;
                // Raised rivet (white = high)
                const height = Math.max(0, 255 - dist * 15);
                data[idx] = data[idx+1] = data[idx+2] = height;
              }
            }
          }
        }
      }
    }
  } else if (pattern === 'panels') {
    // Create recessed panel lines
    const panelSize = 128;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // Panel lines (dark = recessed)
        if (x % panelSize < 4 || y % panelSize < 4) {
          data[idx] = data[idx+1] = data[idx+2] = 32; // Dark (recessed)
        } else {
          data[idx] = data[idx+1] = data[idx+2] = 180; // Light (raised)
        }
      }
    }
  } else if (pattern === 'grating') {
    // Create grating pattern
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // Hexagonal grating
        const gridX = x % 32;
        const gridY = y % 32;
        if (gridX < 2 || gridY < 2 || gridX > 30 || gridY > 30) {
          data[idx] = data[idx+1] = data[idx+2] = 0; // Black (holes)
        } else {
          data[idx] = data[idx+1] = data[idx+2] = 200; // Light (metal)
        }
      }
    }
  } else if (pattern === 'engraved') {
    // Create engraved text pattern
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('PANEL-01', 50, height/2);
    ctx.fillText('CAUTION', 50, height/2 + 60);
    
    const newData = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < data.length; i++) {
      data[i] = newData.data[i];
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function DetailedPanelTest() {
  // Generate procedural textures
  const rivetDisplacement = useMemo(() => createProceduralDisplacement(512, 512, 'rivets'), []);
  const panelDisplacement = useMemo(() => createProceduralDisplacement(512, 512, 'panels'), []);
  const gratingDisplacement = useMemo(() => createProceduralDisplacement(512, 512, 'grating'), []);
  const engravedDisplacement = useMemo(() => createProceduralDisplacement(512, 512, 'engraved'), []);
  
  return (
    <group name="DetailedPanelTest">
      {/* Panel with Rivets - Displacement Mapped */}
      <mesh position={[-3, 1, -3]} castShadow receiveShadow>
        <planeGeometry args={[1.5, 1.5, 200, 200]} />
        <meshStandardMaterial
          color="#666666"
          displacementMap={rivetDisplacement}
          displacementScale={0.08}
          normalMap={rivetDisplacement}
          normalScale={[2, 2]}
          aoMap={rivetDisplacement}
          aoMapIntensity={0.8}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[-3, 0.5, -2.9]}>
        <boxGeometry args={[1.4, 0.12, 0.02]} />
        <meshStandardMaterial color="#111" emissive="#00ff00" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Panel with Recessed Lines - Displacement Mapped */}
      <mesh position={[-1, 1, -3]} castShadow receiveShadow>
        <planeGeometry args={[1.5, 1.5, 200, 200]} />
        <meshStandardMaterial
          color="#555555"
          displacementMap={panelDisplacement}
          displacementScale={0.05}
          normalMap={panelDisplacement}
          normalScale={[3, 3]}
          aoMap={panelDisplacement}
          aoMapIntensity={1.2}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[-1, 0.5, -2.9]}>
        <boxGeometry args={[1.4, 0.12, 0.02]} />
        <meshStandardMaterial color="#111" emissive="#00aaff" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Grating Panel - Displacement Mapped */}
      <mesh position={[1, 1, -3]} castShadow receiveShadow>
        <planeGeometry args={[1.5, 1.5, 200, 200]} />
        <meshStandardMaterial
          color="#444444"
          displacementMap={gratingDisplacement}
          displacementScale={0.12}
          normalMap={gratingDisplacement}
          normalScale={[2.5, 2.5]}
          aoMap={gratingDisplacement}
          aoMapIntensity={1.5}
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[1, 0.5, -2.9]}>
        <boxGeometry args={[1.4, 0.12, 0.02]} />
        <meshStandardMaterial color="#111" emissive="#ffaa00" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Engraved Text Panel - Displacement Mapped */}
      <mesh position={[3, 1, -3]} castShadow receiveShadow>
        <planeGeometry args={[1.5, 1.5, 200, 200]} />
        <meshStandardMaterial
          color="#666666"
          displacementMap={engravedDisplacement}
          displacementScale={0.06}
          normalMap={engravedDisplacement}
          normalScale={[3, 3]}
          aoMap={engravedDisplacement}
          aoMapIntensity={1.3}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[3, 0.5, -2.9]}>
        <boxGeometry args={[1.4, 0.12, 0.02]} />
        <meshStandardMaterial color="#111" emissive="#ff00ff" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Complex Panel - Multiple Details */}
      <mesh position={[0, -1, -3]} castShadow receiveShadow>
        <planeGeometry args={[2.5, 1.5, 256, 256]} />
        <meshStandardMaterial
          color="#555555"
          displacementMap={rivetDisplacement}
          displacementScale={0.1}
          normalMap={panelDisplacement}
          normalScale={[2, 2]}
          aoMap={rivetDisplacement}
          aoMapIntensity={1}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, -0.3, -2.9]}>
        <boxGeometry args={[2.4, 0.15, 0.02]} />
        <meshStandardMaterial color="#111" emissive="#00ff00" emissiveIntensity={0.4} />
      </mesh>
      
      {/* Assembled Room with Detailed Panels */}
      <mesh position={[0, 0, -5]} receiveShadow>
        <planeGeometry args={[8, 5, 256, 256]} />
        <meshStandardMaterial
          color="#444444"
          displacementMap={panelDisplacement}
          displacementScale={0.04}
          normalMap={panelDisplacement}
          normalScale={[2, 2]}
          aoMap={panelDisplacement}
          aoMapIntensity={0.9}
          metalness={0.75}
          roughness={0.35}
        />
      </mesh>
      
      {/* Detailed Floor with Grating */}
      <mesh position={[0, -2.5, -3]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 6, 256, 256]} />
        <meshStandardMaterial
          color="#333333"
          displacementMap={gratingDisplacement}
          displacementScale={0.08}
          normalMap={gratingDisplacement}
          normalScale={[2, 2]}
          aoMap={gratingDisplacement}
          aoMapIntensity={1.5}
          metalness={0.6}
          roughness={0.5}
        />
      </mesh>
      
      {/* Detailed Ceiling */}
      <mesh position={[0, 2.5, -3]} rotation={[Math.PI/2, 0, 0]} castShadow>
        <planeGeometry args={[8, 6, 200, 200]} />
        <meshStandardMaterial
          color="#444444"
          displacementMap={panelDisplacement}
          displacementScale={0.03}
          normalMap={panelDisplacement}
          normalScale={[1.5, 1.5]}
          aoMap={panelDisplacement}
          aoMapIntensity={0.8}
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>
      
      {/* Info Panel */}
      <mesh position={[0, 2, -2.5]}>
        <boxGeometry args={[3, 0.3, 0.05]} />
        <meshStandardMaterial
          color="#111111"
          emissive="#00ff00"
          emissiveIntensity={0.4}
        />
      </mesh>
      
      {/* Enhanced Lighting with Shadows for Edge Definition */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[8, 8, 8]} 
        intensity={2} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-6, 4, -6]} intensity={1.2} castShadow />
      <pointLight position={[0, 4, -2]} intensity={3} color="#ffffff" distance={15} castShadow />
      <pointLight position={[-4, 2, 0]} intensity={2} color="#ffffff" distance={10} />
      <pointLight position={[4, 2, 0]} intensity={2} color="#ffffff" distance={10} />
      <spotLight 
        position={[0, 6, -3]} 
        angle={0.6} 
        intensity={2.5} 
        penumbra={0.3} 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight position={[-3, 3, -1]} angle={0.4} intensity={1.5} penumbra={0.6} color="#aaccff" castShadow />
      <spotLight position={[3, 3, -1]} angle={0.4} intensity={1.5} penumbra={0.6} color="#ffccaa" />
      
      {/* Grid Helper */}
      <gridHelper args={[10, 50, '#555555', '#222222']} position={[0, -2.5, -3]} />
    </group>
  );
}
