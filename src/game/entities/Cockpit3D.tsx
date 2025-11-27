    import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { Radar } from '../../components/Radar';
import { useMemo, useEffect } from 'react';
import { pbrMaterialManager } from '../../engine/rendering/materials/PBRMaterialManager';

interface Cockpit3DProps {
  shipPosition: THREE.Vector3;
}

/**
 * 3D Cockpit with actual geometry and PBR materials
 * Built with boxes, cylinders, and other shapes to create depth
 * Uses PBR Material Manager for realistic materials
 */
export function Cockpit3D({ shipPosition }: Cockpit3DProps) {
  const texture = useTexture('/cockpit.png');
  const stationPosition = new THREE.Vector3(0, 0, -50);
  
  // Initialize PBR materials
  useEffect(() => {
    pbrMaterialManager.createPresets();
  }, []);
  
  // Create PBR materials
  const materials = useMemo(() => {
    return {
      dashboardMetal: new THREE.MeshPhysicalMaterial({
        color: '#1a1a1a',
        metalness: 0.9,
        roughness: 0.2,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2
      }),
      panelMetal: new THREE.MeshPhysicalMaterial({
        color: '#0a0a0a',
        metalness: 0.95,
        roughness: 0.15,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1
      }),
      frameMetal: new THREE.MeshPhysicalMaterial({
        color: '#2a2a2a',
        metalness: 0.8,
        roughness: 0.3
      }),
      seatFabric: new THREE.MeshPhysicalMaterial({
        color: '#1a1a2a',
        metalness: 0.0,
        roughness: 0.95
      }),
      cablePlastic: new THREE.MeshPhysicalMaterial({
        color: '#333333',
        metalness: 0.1,
        roughness: 0.7
      }),
      screenGlass: new THREE.MeshPhysicalMaterial({
        color: '#001100',
        metalness: 0.9,
        roughness: 0.05,
        emissive: new THREE.Color('#00ff00'),
        emissiveIntensity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        transparent: false
      }),
      buttonEmissive: (color: string) => new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.3,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.8
      })
    };
  }, []);
  
  return (
    <group>
      {/* Cockpit lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[0, -0.5, -1]} intensity={0.6} color="#00ff00" distance={3} />
      
      {/* MAIN DASHBOARD - Angled panel with depth */}
      <group position={[0, -0.4, -2.2]} rotation={[0.3, 0, 0]}>
        {/* Dashboard base - thick panel with PBR */}
        <mesh position={[0, 0, 0]} material={materials.dashboardMetal}>
          <boxGeometry args={[3, 0.1, 0.8]} />
        </mesh>
        
        {/* Dashboard top surface with texture */}
        <mesh position={[0, 0.06, 0]} rotation={[-0.1, 0, 0]}>
          <planeGeometry args={[3, 0.8]} />
          <meshStandardMaterial 
            map={texture}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>
        
        {/* MFD Screen housings - raised boxes with PBR */}
        {/* Left MFD housing */}
        <mesh position={[-0.85, 0.08, 0]} material={materials.panelMetal}>
          <boxGeometry args={[0.52, 0.08, 0.52]} />
        </mesh>
        
        {/* Left MFD screen with glass material */}
        <mesh position={[-0.85, 0.13, 0]} material={materials.screenGlass}>
          <planeGeometry args={[0.5, 0.5]} />
        </mesh>
        
        {/* Center MFD housing - circular with PBR */}
        <mesh position={[0, 0.08, 0]} material={materials.panelMetal}>
          <cylinderGeometry args={[0.27, 0.27, 0.08, 32]} />
        </mesh>
        
        {/* Center MFD screen with radar and glass material */}
        <group position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh material={materials.screenGlass}>
            <circleGeometry args={[0.25, 32]} />
          </mesh>
          <group scale={[0.9, 0.9, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
            <Radar 
              shipPosition={shipPosition}
              stationPosition={stationPosition}
              radarRange={100}
            />
          </group>
        </group>
        
        {/* Right MFD housing with PBR */}
        <mesh position={[0.85, 0.08, 0]} material={materials.panelMetal}>
          <boxGeometry args={[0.52, 0.08, 0.52]} />
        </mesh>
        
        {/* Right MFD screen with glass material */}
        <mesh position={[0.85, 0.13, 0]} material={materials.screenGlass}>
          <planeGeometry args={[0.5, 0.5]} />
        </mesh>
        
        {/* Control buttons with emissive PBR materials */}
        {[-1.2, -0.5, 0.5, 1.2].map((x, i) => (
          <mesh 
            key={i} 
            position={[x, 0.08, 0.3]}
            material={materials.buttonEmissive(i % 2 === 0 ? "#ff3300" : "#00ff00")}
          >
            <boxGeometry args={[0.08, 0.04, 0.08]} />
          </mesh>
        ))}
      </group>
      
      {/* SIDE PANELS - Left and Right with PBR */}
      {/* Left panel */}
      <group position={[-1.8, -0.2, -2]} rotation={[0.2, 0.3, 0]}>
        <mesh material={materials.dashboardMetal}>
          <boxGeometry args={[0.6, 0.8, 0.1]} />
        </mesh>
        {/* Small displays on left panel */}
        <mesh position={[0, 0.2, 0.06]} material={materials.screenGlass}>
          <planeGeometry args={[0.3, 0.2]} />
        </mesh>
      </group>
      
      {/* Right panel */}
      <group position={[1.8, -0.2, -2]} rotation={[0.2, -0.3, 0]}>
        <mesh material={materials.dashboardMetal}>
          <boxGeometry args={[0.6, 0.8, 0.1]} />
        </mesh>
        {/* Small displays on right panel */}
        <mesh position={[0, 0.2, 0.06]} material={materials.screenGlass}>
          <planeGeometry args={[0.3, 0.2]} />
        </mesh>
      </group>
      
      {/* OVERHEAD PANEL with PBR */}
      <group position={[0, 0.8, -1.5]} rotation={[-0.5, 0, 0]}>
        <mesh material={materials.dashboardMetal}>
          <boxGeometry args={[2, 0.08, 0.6]} />
        </mesh>
        {/* Overhead switches with PBR */}
        {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
          <mesh key={i} position={[x, -0.05, 0]} material={materials.cablePlastic}>
            <boxGeometry args={[0.06, 0.03, 0.1]} />
          </mesh>
        ))}
      </group>
      
      {/* WINDOW FRAMES with PBR - Give structure to the view */}
      {/* Top window frame */}
      <mesh position={[0, 0.6, -1.8]} material={materials.frameMetal}>
        <boxGeometry args={[4, 0.1, 0.1]} />
      </mesh>
      
      {/* Left window frame */}
      <mesh position={[-2, 0, -1.8]} rotation={[0, 0, 0.2]} material={materials.frameMetal}>
        <boxGeometry args={[0.1, 1.2, 0.1]} />
      </mesh>
      
      {/* Right window frame */}
      <mesh position={[2, 0, -1.8]} rotation={[0, 0, -0.2]} material={materials.frameMetal}>
        <boxGeometry args={[0.1, 1.2, 0.1]} />
      </mesh>
      
      {/* CENTER CONSOLE with PBR - Between pilot's legs */}
      <group position={[0, -0.8, -1.2]}>
        <mesh material={materials.dashboardMetal}>
          <boxGeometry args={[0.4, 0.3, 1]} />
        </mesh>
        {/* Throttle lever with emissive PBR */}
        <mesh position={[-0.15, 0.2, 0.2]} material={materials.buttonEmissive('#ff3300')}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
        </mesh>
        {/* Stick base with PBR */}
        <mesh position={[0.15, 0.2, 0]} material={materials.cablePlastic}>
          <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
        </mesh>
      </group>
      
      {/* SEAT EDGES with fabric PBR - Visible on sides */}
      {/* Left seat edge */}
      <mesh position={[-0.6, -0.5, -0.5]} rotation={[0, 0, 0.3]} material={materials.seatFabric}>
        <boxGeometry args={[0.15, 0.8, 0.8]} />
      </mesh>
      
      {/* Right seat edge */}
      <mesh position={[0.6, -0.5, -0.5]} rotation={[0, 0, -0.3]} material={materials.seatFabric}>
        <boxGeometry args={[0.15, 0.8, 0.8]} />
      </mesh>
      
      {/* DETAIL PIPES AND CABLES with PBR */}
      {/* Left cable conduit */}
      <mesh position={[-1.5, 0.3, -1.5]} rotation={[0, 0, Math.PI / 2]} material={materials.cablePlastic}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
      </mesh>
      
      {/* Right cable conduit */}
      <mesh position={[1.5, 0.3, -1.5]} rotation={[0, 0, Math.PI / 2]} material={materials.cablePlastic}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
      </mesh>
      
      {/* Accent lights */}
      <pointLight position={[-1.5, 0, -1.5]} intensity={0.3} distance={2} color="#0088ff" />
      <pointLight position={[1.5, 0, -1.5]} intensity={0.3} distance={2} color="#0088ff" />
      <pointLight position={[0, 0.5, -1.5]} intensity={0.2} distance={2} color="#ff3300" />
    </group>
  );
}
