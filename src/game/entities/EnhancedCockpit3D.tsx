import { useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { pbrMaterialManager } from '../../engine/rendering/materials/PBRMaterialManager';
import { environmentMapGenerator } from '../../engine/rendering/environment/EnvironmentMapGenerator';

/**
 * Enhanced 3D Cockpit with Advanced Rendering
 * Uses environment mapping, PBR materials, and realistic reflections
 * 
 * This cockpit will show VISIBLE IMPROVEMENTS:
 * - Metallic reflections on panels
 * - Glossy clearcoat on screens
 * - Realistic material properties
 * - Environment reflections
 */
export default function EnhancedCockpit3D() {
  const { scene, gl } = useThree();
  const cockpitGroupRef = useRef<THREE.Group>(null);
  const envProbeCreated = useRef(false);
  
  // Initialize PBR materials and environment mapping
  useEffect(() => {
    // Create PBR material presets
    pbrMaterialManager.createPresets();
    
    // Create environment probe for reflections
    if (!envProbeCreated.current) {
      environmentMapGenerator.createProbe({
        name: 'cockpit_env',
        position: new THREE.Vector3(0, 0, 0),
        size: 256,
        near: 0.1,
        far: 100,
        updateRate: 10 // Update 10 times per second
      });
      
      envProbeCreated.current = true;
    }
  }, []);
  
  // Update environment map each frame
  useFrame(() => {
    if (envProbeCreated.current) {
      environmentMapGenerator.updateProbes(gl, scene, Date.now());
    }
  });
  
  // Enhanced materials with environment mapping
  const materials = useMemo(() => {
    const probe = environmentMapGenerator.getProbe('cockpit_env');
    
    // Dashboard - Brushed aluminum with environment reflections
    const dashboardMat = new THREE.MeshPhysicalMaterial({
      color: '#2a2a2a',
      metalness: 0.95,
      roughness: 0.15,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5
    });
    if (probe) dashboardMat.envMap = probe.envMap;
    
    // MFD Housing - Polished metal with strong reflections
    const mfdHousingMat = new THREE.MeshPhysicalMaterial({
      color: '#1a1a1a',
      metalness: 0.98,
      roughness: 0.08,
      clearcoat: 0.6,
      clearcoatRoughness: 0.05,
      envMapIntensity: 2.0
    });
    if (probe) mfdHousingMat.envMap = probe.envMap;
    
    // Window Frame - Dark anodized aluminum
    const frameMat = new THREE.MeshPhysicalMaterial({
      color: '#0a0a0a',
      metalness: 0.9,
      roughness: 0.25,
      clearcoat: 0.3,
      envMapIntensity: 1.2
    });
    if (probe) frameMat.envMap = probe.envMap;
    
    // Seat - Fabric (no reflections)
    const seatMat = new THREE.MeshPhysicalMaterial({
      color: '#1a1a1a',
      metalness: 0.0,
      roughness: 0.95,
      envMapIntensity: 0.1
    });
    
    // Cables/Plastic - Matte plastic
    const cableMat = new THREE.MeshPhysicalMaterial({
      color: '#333333',
      metalness: 0.1,
      roughness: 0.7,
      envMapIntensity: 0.3
    });
    
    // Screen Glass - High gloss with clearcoat
    const screenMat = new THREE.MeshPhysicalMaterial({
      color: '#001100',
      metalness: 0.9,
      roughness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      emissive: new THREE.Color('#00ff00'),
      emissiveIntensity: 0.3,
      envMapIntensity: 2.5
    });
    if (probe) screenMat.envMap = probe.envMap;
    
    // Buttons - Emissive with slight reflection
    const buttonRedMat = new THREE.MeshPhysicalMaterial({
      color: '#ff0000',
      metalness: 0.3,
      roughness: 0.4,
      emissive: new THREE.Color('#ff0000'),
      emissiveIntensity: 0.8,
      clearcoat: 0.5,
      envMapIntensity: 0.8
    });
    
    const buttonGreenMat = new THREE.MeshPhysicalMaterial({
      color: '#00ff00',
      metalness: 0.3,
      roughness: 0.4,
      emissive: new THREE.Color('#00ff00'),
      emissiveIntensity: 0.8,
      clearcoat: 0.5,
      envMapIntensity: 0.8
    });
    
    // Accent lights with glow
    const accentBlueMat = new THREE.MeshPhysicalMaterial({
      color: '#0088ff',
      metalness: 0.5,
      roughness: 0.2,
      emissive: new THREE.Color('#0088ff'),
      emissiveIntensity: 1.2,
      clearcoat: 0.8,
      envMapIntensity: 1.0
    });
    
    const accentRedMat = new THREE.MeshPhysicalMaterial({
      color: '#ff0044',
      metalness: 0.5,
      roughness: 0.2,
      emissive: new THREE.Color('#ff0044'),
      emissiveIntensity: 1.2,
      clearcoat: 0.8,
      envMapIntensity: 1.0
    });
    
    return {
      dashboard: dashboardMat,
      mfdHousing: mfdHousingMat,
      frame: frameMat,
      seat: seatMat,
      cable: cableMat,
      screen: screenMat,
      buttonRed: buttonRedMat,
      buttonGreen: buttonGreenMat,
      accentBlue: accentBlueMat,
      accentRed: accentRedMat
    };
  }, []);
  
  return (
    <group ref={cockpitGroupRef}>
      {/* Main Dashboard Panel - with realistic metal reflections */}
      <mesh position={[0, -0.3, -0.8]} material={materials.dashboard}>
        <boxGeometry args={[1.8, 0.6, 0.1]} />
      </mesh>
      
      {/* Left MFD with polished housing */}
      <group position={[-0.5, -0.3, -0.79]}>
        <mesh material={materials.mfdHousing}>
          <boxGeometry args={[0.35, 0.3, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.045]} material={materials.screen}>
          <planeGeometry args={[0.3, 0.25]} />
        </mesh>
      </group>
      
      {/* Center MFD - glossy screen */}
      <group position={[0, -0.3, -0.79]}>
        <mesh material={materials.mfdHousing}>
          <boxGeometry args={[0.35, 0.3, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.045]} material={materials.screen}>
          <planeGeometry args={[0.3, 0.25]} />
        </mesh>
      </group>
      
      {/* Right MFD with reflective housing */}
      <group position={[0.5, -0.3, -0.79]}>
        <mesh material={materials.mfdHousing}>
          <boxGeometry args={[0.35, 0.3, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.045]} material={materials.screen}>
          <planeGeometry args={[0.3, 0.25]} />
        </mesh>
      </group>
      
      {/* Angled Side Panels with metallic finish */}
      <mesh 
        position={[-0.9, -0.2, -0.7]} 
        rotation={[0, 0.3, 0]}
        material={materials.dashboard}
      >
        <boxGeometry args={[0.4, 0.5, 0.1]} />
      </mesh>
      
      <mesh 
        position={[0.9, -0.2, -0.7]} 
        rotation={[0, -0.3, 0]}
        material={materials.dashboard}
      >
        <boxGeometry args={[0.4, 0.5, 0.1]} />
      </mesh>
      
      {/* Overhead Panel with switches */}
      <mesh position={[0, 0.6, -0.5]} material={materials.dashboard}>
        <boxGeometry args={[1.2, 0.15, 0.1]} />
      </mesh>
      
      {/* Overhead switches with realistic materials */}
      {[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => (
        <mesh 
          key={`switch-${i}`}
          position={[x, 0.6, -0.44]} 
          material={i % 2 === 0 ? materials.buttonGreen : materials.buttonRed}
        >
          <boxGeometry args={[0.03, 0.03, 0.02]} />
        </mesh>
      ))}
      
      {/* Window Frames - dark anodized aluminum */}
      <mesh position={[0, 0.3, -0.6]} material={materials.frame}>
        <boxGeometry args={[1.4, 0.05, 0.05]} />
      </mesh>
      
      <mesh position={[-0.7, 0, -0.6]} material={materials.frame}>
        <boxGeometry args={[0.05, 0.6, 0.05]} />
      </mesh>
      
      <mesh position={[0.7, 0, -0.6]} material={materials.frame}>
        <boxGeometry args={[0.05, 0.6, 0.05]} />
      </mesh>
      
      {/* Center Console - brushed metal */}
      <mesh position={[0, -0.6, -0.3]} material={materials.dashboard}>
        <boxGeometry args={[0.3, 0.2, 0.4]} />
      </mesh>
      
      {/* Throttle Lever - metallic with reflections */}
      <mesh position={[-0.1, -0.5, -0.2]} material={materials.mfdHousing}>
        <cylinderGeometry args={[0.02, 0.02, 0.15]} />
      </mesh>
      
      {/* Control Stick - polished metal */}
      <mesh position={[0.1, -0.5, -0.2]} material={materials.mfdHousing}>
        <cylinderGeometry args={[0.015, 0.015, 0.2]} />
      </mesh>
      
      {/* Seat Edges - fabric material */}
      <mesh position={[-0.3, -0.7, 0.2]} material={materials.seat}>
        <boxGeometry args={[0.1, 0.3, 0.4]} />
      </mesh>
      
      <mesh position={[0.3, -0.7, 0.2]} material={materials.seat}>
        <boxGeometry args={[0.1, 0.3, 0.4]} />
      </mesh>
      
      {/* Detail Cables - matte plastic */}
      {[0, 1, 2].map((i) => (
        <mesh 
          key={`cable-${i}`}
          position={[-0.8 + i * 0.3, -0.5, -0.75]} 
          material={materials.cable}
        >
          <cylinderGeometry args={[0.005, 0.005, 0.2]} />
        </mesh>
      ))}
      
      {/* Accent Lighting - glowing strips */}
      <mesh position={[-0.85, -0.3, -0.75]} material={materials.accentBlue}>
        <boxGeometry args={[0.02, 0.4, 0.01]} />
      </mesh>
      
      <mesh position={[0.85, -0.3, -0.75]} material={materials.accentRed}>
        <boxGeometry args={[0.02, 0.4, 0.01]} />
      </mesh>
      
      {/* Additional detail buttons on console */}
      {[-0.08, 0, 0.08].map((x, i) => (
        <mesh 
          key={`console-button-${i}`}
          position={[x, -0.52, -0.1]} 
          material={i === 1 ? materials.buttonRed : materials.buttonGreen}
        >
          <cylinderGeometry args={[0.015, 0.015, 0.01]} />
        </mesh>
      ))}
    </group>
  );
}
