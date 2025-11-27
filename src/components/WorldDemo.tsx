import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Sky } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { InputManager, InputDeviceType } from '../engine/input';

// First-person player controller with physics
function Player({ inputManager }: { inputManager: InputManager }) {
  const { camera } = useThree();
  const playerRef = useRef<any>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector3());
  
  useFrame((_, delta) => {
    if (!playerRef.current) return;
    
    // Update input system
    inputManager.update(delta);
    
    // Get input axes
    const moveForward = inputManager.getAxis('moveForward');
    const moveRight = inputManager.getAxis('moveRight');
    const jump = inputManager.getAction('jump');
    
    // Movement parameters
    const speed = 5;
    const jumpForce = 5;
    
    // Get current velocity
    const linvel = playerRef.current.linvel();
    
    // Calculate movement direction based on camera
    directionRef.current.set(0, 0, 0);
    
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();
    
    directionRef.current.addScaledVector(forward, moveForward);
    directionRef.current.addScaledVector(right, moveRight);
    
    if (directionRef.current.length() > 0) {
      directionRef.current.normalize();
    }
    
    // Apply movement
    velocityRef.current.set(
      directionRef.current.x * speed,
      linvel.y,
      directionRef.current.z * speed
    );
    
    // Jump
    if (jump && Math.abs(linvel.y) < 0.1) {
      velocityRef.current.y = jumpForce;
    }
    
    playerRef.current.setLinvel(velocityRef.current, true);
    
    // Update camera position to follow player
    const pos = playerRef.current.translation();
    camera.position.set(pos.x, pos.y + 0.6, pos.z);
  });
  
  return (
    <RigidBody
      ref={playerRef}
      colliders={false}
      mass={1}
      type="dynamic"
      position={[0, 5, 0]}
      enabledRotations={[false, false, false]}
      linearDamping={5.0}
      friction={1.0}
    >
      <CuboidCollider args={[0.3, 0.8, 0.3]} friction={2.0} />
    </RigidBody>
  );
}

// Ground plane
function Ground() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#4a7c59" />
      </mesh>
      <CuboidCollider args={[50, 0.1, 50]} position={[0, -0.1, 0]} />
    </RigidBody>
  );
}

// Terrain with hills
function Terrain() {
  const terrainRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (!terrainRef.current) return;
    
    const geometry = terrainRef.current.geometry as THREE.PlaneGeometry;
    const positions = geometry.attributes.position;
    
    // Create hills
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      const height = 
        Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2 +
        Math.sin(x * 0.05) * Math.cos(y * 0.05) * 3;
      
      positions.setZ(i, height);
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }, []);
  
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh ref={terrainRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100, 50, 50]} />
        <meshStandardMaterial color="#5a8c6a" wireframe={false} />
      </mesh>
    </RigidBody>
  );
}

// Cubes scattered around
function Cubes() {
  const cubes = [
    { pos: [5, 2, -5], size: 1, color: '#ff6b6b' },
    { pos: [-5, 2, -5], size: 1.5, color: '#4ecdc4' },
    { pos: [0, 2, -10], size: 1.2, color: '#45b7d1' },
    { pos: [8, 2, 3], size: 0.8, color: '#f9ca24' },
    { pos: [-8, 2, 5], size: 1.3, color: '#6c5ce7' },
    { pos: [3, 2, 8], size: 1, color: '#fd79a8' },
    { pos: [-3, 2, -8], size: 1.1, color: '#00b894' },
  ];
  
  return (
    <>
      {cubes.map((cube, i) => (
        <RigidBody key={i} position={cube.pos as [number, number, number]} colliders="cuboid">
          <mesh castShadow receiveShadow>
            <boxGeometry args={[cube.size, cube.size, cube.size]} />
            <meshStandardMaterial color={cube.color} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

// Spheres
function Spheres() {
  const spheres = [
    { pos: [10, 2, -10], radius: 0.8, color: '#e17055' },
    { pos: [-10, 2, -10], radius: 1, color: '#74b9ff' },
    { pos: [10, 2, 10], radius: 0.7, color: '#a29bfe' },
    { pos: [-10, 2, 10], radius: 0.9, color: '#fd79a8' },
  ];
  
  return (
    <>
      {spheres.map((sphere, i) => (
        <RigidBody key={i} position={sphere.pos as [number, number, number]} colliders="ball">
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[sphere.radius, 32, 32]} />
            <meshStandardMaterial color={sphere.color} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

// Position tracker (inside Canvas)
function PositionTracker({ onPositionUpdate }: { onPositionUpdate: (pos: { x: number, y: number, z: number }) => void }) {
  const { camera } = useThree();
  
  useFrame(() => {
    onPositionUpdate({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    });
  });
  
  return null;
}

// HUD (outside Canvas)
function HUD({ position }: { position: { x: number, y: number, z: number } }) {
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '14px',
      textShadow: '0 0 10px rgba(0,0,0,0.8)',
      pointerEvents: 'none',
      userSelect: 'none',
      background: 'rgba(0,0,0,0.5)',
      padding: '10px',
      borderRadius: '5px'
    }}>
      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
        🌍 WORLD DEMO v1.0
      </div>
      <div style={{ marginTop: 10 }}>
        <div>X: {position.x.toFixed(2)}</div>
        <div>Y: {position.y.toFixed(2)}</div>
        <div>Z: {position.z.toFixed(2)}</div>
      </div>
      <div style={{ marginTop: 15, fontSize: '12px', opacity: 0.9 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>CONTROLS:</div>
        <div>W/A/S/D - Move</div>
        <div>Mouse - Look Around</div>
        <div>Space - Jump</div>
        <div>Click to lock cursor</div>
      </div>
    </div>
  );
}

// Crosshair
function Crosshair() {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none'
    }}>
      <div style={{
        width: '20px',
        height: '2px',
        background: 'rgba(255,255,255,0.8)',
        position: 'absolute',
        left: '-10px',
        top: '-1px'
      }} />
      <div style={{
        width: '2px',
        height: '20px',
        background: 'rgba(255,255,255,0.8)',
        position: 'absolute',
        left: '-1px',
        top: '-10px'
      }} />
    </div>
  );
}

// Main demo component
export default function WorldDemo() {
  const [inputManager, setInputManager] = useState<InputManager | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  
  useEffect(() => {
    // Initialize input manager
    const manager = new InputManager({
      enableKeyboard: true,
      enableMouse: true,
      enableGamepad: true,
      mouseSensitivity: 0.5
    });
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      manager.initialize(canvas);
      
      // Movement axes
      manager.addAxis({
        name: 'moveForward',
        positive: { device: 'keyboard' as InputDeviceType, input: 'KeyW' },
        negative: { device: 'keyboard' as InputDeviceType, input: 'KeyS' },
        deadzone: 0.0,
        sensitivity: 1.0,
        gravity: 10.0,
        snap: true
      });
      
      manager.addAxis({
        name: 'moveRight',
        positive: { device: 'keyboard' as InputDeviceType, input: 'KeyD' },
        negative: { device: 'keyboard' as InputDeviceType, input: 'KeyA' },
        deadzone: 0.0,
        sensitivity: 1.0,
        gravity: 10.0,
        snap: true
      });
      
      // Jump button
      manager.addAction({
        name: 'jump',
        bindings: [
          { device: 'keyboard' as InputDeviceType, input: 'Space' }
        ]
      });
      
      setInputManager(manager);
    }
    
    return () => {
      if (manager) {
        manager.dispose();
      }
    };
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#87CEEB' }}>
      <Canvas shadows camera={{ fov: 75, position: [0, 5, 0] }}>
        <Sky sunPosition={[100, 20, 100]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={100}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        <hemisphereLight args={['#87CEEB', '#5a8c6a', 0.5]} />
        
        {/* Physics world */}
        <Physics gravity={[0, -9.81, 0]}>
          {inputManager && <Player inputManager={inputManager} />}
          <Terrain />
          <Cubes />
          <Spheres />
        </Physics>
        
        {/* Pointer lock controls for mouse look */}
        <PointerLockControls />
        
        {/* Position tracker */}
        <PositionTracker onPositionUpdate={setPosition} />
      </Canvas>
      
      <HUD position={position} />
      <Crosshair />
    </div>
  );
}
