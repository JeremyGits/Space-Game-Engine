import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { FirstPersonController, FirstPersonInput } from '../engine/player';

/**
 * Proper First-Person Movement Test
 * Uses engine-level FirstPersonController with defined coordinate system
 * 
 * COORDINATE SYSTEM:
 * - Forward: -Z (North)
 * - Right: +X (East)
 * - Up: +Y
 * 
 * Starting position: (0, 0, 0) facing North (-Z)
 */

function Player() {
  const { camera } = useThree();
  const controllerRef = useRef<FirstPersonController>(
    new FirstPersonController({
      walkSpeed: 5.0,
      runSpeed: 8.0,
      mouseSensitivity: 0.002
    })
  );
  
  const keysPressed = useRef<Set<string>>(new Set());
  const mouseDelta = useRef({ x: 0, y: 0 });
  const isLocked = useRef(false);
  
  useEffect(() => {
    // Set initial position and facing direction
    controllerRef.current.setPosition({ x: 0, y: 1.6, z: 0 } as any);
    controllerRef.current.setYaw(0); // Face North (-Z)
    
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isLocked.current) {
        mouseDelta.current.x += e.movementX;
        mouseDelta.current.y += e.movementY;
      }
    };
    
    const handlePointerLockChange = () => {
      isLocked.current = document.pointerLockElement !== null;
    };
    
    const handleClick = () => {
      document.body.requestPointerLock();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.body.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.body.removeEventListener('click', handleClick);
    };
  }, []);
  
  useFrame((_, delta) => {
    // Build input from keyboard/mouse
    const input: FirstPersonInput = {
      moveForward: (keysPressed.current.has('w') ? 1 : 0) - (keysPressed.current.has('s') ? 1 : 0),
      moveRight: (keysPressed.current.has('d') ? 1 : 0) - (keysPressed.current.has('a') ? 1 : 0),
      moveUp: 0,
      lookDeltaX: mouseDelta.current.x,
      lookDeltaY: mouseDelta.current.y,
      sprint: keysPressed.current.has('shift'),
      crouch: keysPressed.current.has('control'),
      jump: keysPressed.current.has(' ')
    };
    
    // Reset mouse delta
    mouseDelta.current = { x: 0, y: 0 };
    
    // Update controller
    controllerRef.current.update(input, delta);
    
    // Apply to camera
    const camPos = controllerRef.current.getCameraPosition();
    const camQuat = controllerRef.current.getCameraQuaternion();
    
    camera.position.copy(camPos);
    camera.quaternion.copy(camQuat);
  });
  
  return null;
}

// Ground with grid to show direction
function Ground() {
  return (
    <RigidBody type="fixed">
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#5a8c6a" />
      </mesh>
    </RigidBody>
  );
}

// Direction markers
function DirectionMarkers() {
  return (
    <group>
      {/* North (-Z) - Red */}
      <mesh position={[0, 0.1, -10]}>
        <boxGeometry args={[2, 0.2, 2]} />
        <meshStandardMaterial color="red" />
      </mesh>
      
      {/* East (+X) - Green */}
      <mesh position={[10, 0.1, 0]}>
        <boxGeometry args={[2, 0.2, 2]} />
        <meshStandardMaterial color="green" />
      </mesh>
      
      {/* South (+Z) - Blue */}
      <mesh position={[0, 0.1, 10]}>
        <boxGeometry args={[2, 0.2, 2]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      
      {/* West (-X) - Yellow */}
      <mesh position={[-10, 0.1, 0]}>
        <boxGeometry args={[2, 0.2, 2]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
      
      {/* Origin - White */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
}

// HUD
function HUD() {
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      color: 'white',
      fontFamily: 'monospace',
      background: 'rgba(0,0,0,0.8)',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '14px'
    }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#4ade80' }}>
        🎮 PROPER FIRST-PERSON CONTROLLER
      </div>
      
      <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
        <div style={{ color: '#a3a3a3', fontSize: '12px', marginBottom: '5px' }}>COORDINATE SYSTEM</div>
        <div>🔴 North (Forward): -Z</div>
        <div>🟢 East (Right): +X</div>
        <div>🔵 South (Back): +Z</div>
        <div>🟡 West (Left): -X</div>
        <div>⬜ Origin: (0,0,0)</div>
      </div>
      
      <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
        <div style={{ color: '#a3a3a3', fontSize: '12px', marginBottom: '5px' }}>CONTROLS</div>
        <div>W - Move Forward (where you're looking)</div>
        <div>S - Move Backward</div>
        <div>A - Strafe Left</div>
        <div>D - Strafe Right</div>
        <div>Shift - Sprint</div>
        <div>Mouse - Look Around</div>
      </div>
      
      <div style={{ fontSize: '11px', color: '#737373' }}>
        Click to lock cursor and start moving
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

export default function ProperMovementTest() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas shadows camera={{ fov: 75, position: [0, 1.6, 0] }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[50, 50, 25]} intensity={1} castShadow />
        
        <Physics>
          <Player />
          <Ground />
        </Physics>
        
        <DirectionMarkers />
      </Canvas>
      
      <HUD />
      <Crosshair />
    </div>
  );
}
