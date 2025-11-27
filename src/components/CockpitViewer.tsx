/**
 * Cockpit Viewer Component
 * 
 * React component for viewing and testing generated cockpits
 */

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { CockpitGenerator } from '../tools/cockpit/CockpitGenerator';
import { CockpitConfig, CockpitPreset, GenerationOptions } from '../tools/cockpit/types/CockpitTypes';

interface CockpitViewerProps {
  config: CockpitConfig;
  options?: Partial<GenerationOptions>;
  enableControls?: boolean;
  showStats?: boolean;
}

/**
 * Cockpit mesh component
 */
function CockpitMesh({ config, options }: { config: CockpitConfig; options?: Partial<GenerationOptions> }) {
  const [cockpit, setCockpit] = useState<THREE.Group | null>(null);
  const { camera } = useThree();
  
  useEffect(() => {
    const generator = new CockpitGenerator(config, options);
    
    generator.generate().then((result) => {
      setCockpit(result.mesh);
      
      // Set camera position
      camera.position.copy(result.cameraPosition);
      camera.lookAt(result.cameraTarget);
    });
  }, [config, options, camera]);
  
  if (!cockpit) return null;
  
  return <primitive object={cockpit} />;
}

/**
 * Main cockpit viewer component
 */
export function CockpitViewer({ config, options, enableControls = true, showStats = false }: CockpitViewerProps) {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#000' }}>
      <Canvas>
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={75} />
        
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <pointLight position={[-5, 3, -5]} intensity={0.3} />
        
        {/* Cockpit */}
        <CockpitMesh config={config} options={options} />
        
        {/* Controls */}
        {enableControls && (
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            target={[0, 0, -0.5]}
          />
        )}
        
        {/* Grid helper (optional) */}
        {showStats && <gridHelper args={[10, 10]} />}
      </Canvas>
      
      {/* UI Overlay */}
      {showStats && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '12px',
          background: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px'
        }}>
          <div>Cockpit Viewer</div>
          <div>Controls: Mouse to look, WASD to move</div>
          <div>Scroll to zoom</div>
        </div>
      )}
    </div>
  );
}

/**
 * Quick preset viewer
 */
export function PresetCockpitViewer({ 
  preset, 
  imageUrl 
}: { 
  preset: CockpitPreset; 
  imageUrl: string;
}) {
  const config = CockpitGenerator.createPreset(preset, imageUrl);
  
  return (
    <CockpitViewer 
      config={config} 
      enableControls={true}
      showStats={true}
    />
  );
}
