import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { InputManager, InputDeviceType } from '../engine/input';

// Skybox component
function Skybox() {
  const { scene } = useThree();
  
  useEffect(() => {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      '/src/assets/textures/environment/skybox-px.png',
      '/src/assets/textures/environment/skybox-nx.png',
      '/src/assets/textures/environment/skybox-py.png',
      '/src/assets/textures/environment/skybox-ny.png',
      '/src/assets/textures/environment/skybox-pz.png',
      '/src/assets/textures/environment/skybox-nz.png',
    ]);
    scene.background = texture;
  }, [scene]);
  
  return null;
}

// Star cluster component
function StarCluster() {
  const gltf = useLoader(GLTFLoader, '/src/assets/models/star/starcluster15k.glb');
  const meshRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      // Scale up the star cluster to make it huge
      meshRef.current.scale.set(50, 50, 50);
      // Position it away from origin so player isn't in the bright center
      meshRef.current.position.set(0, 0, -500);
    }
  }, []);
  
  return <primitive ref={meshRef} object={gltf.scene} />;
}

// Player camera controller
function PlayerController({ inputManager }: { inputManager: InputManager }) {
  const { camera } = useThree();
  const velocityRef = useRef(new THREE.Vector3());
  const rotationRef = useRef(new THREE.Euler(0, 0, 0));
  
  useFrame((_, delta) => {
    // Update input system
    inputManager.update(delta);
    
    // Get input axes - check raw values for debugging
    const moveForward = inputManager.getAxis('moveForward');
    const moveRight = inputManager.getAxis('moveRight');
    const moveUp = inputManager.getAxis('moveUp');
    const rotateX = inputManager.getAxis('rotateX');
    const rotateY = inputManager.getAxis('rotateY');
    const rotateZ = inputManager.getAxis('rotateZ');
    
    // Movement speed - different speeds for different axes
    const forwardSpeed = 100;  // Faster forward/back
    const strafeSpeed = 80;    // Responsive strafe
    const verticalSpeed = 80;  // Responsive up/down
    const rotateSpeed = 2.0;   // Slightly faster rotation
    
    // Apply rotation
    rotationRef.current.x += rotateX * rotateSpeed * delta;
    rotationRef.current.y += rotateY * rotateSpeed * delta;
    rotationRef.current.z += rotateZ * rotateSpeed * delta;
    
    // Clamp pitch to avoid gimbal lock
    rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x));
    
    camera.rotation.copy(rotationRef.current);
    
    // Calculate movement direction based on camera orientation
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0);
    
    // Apply movement with different speeds
    velocityRef.current.set(0, 0, 0);
    velocityRef.current.addScaledVector(forward, moveForward * forwardSpeed);
    velocityRef.current.addScaledVector(right, moveRight * strafeSpeed);
    velocityRef.current.addScaledVector(up, moveUp * verticalSpeed);
    
    camera.position.add(velocityRef.current.multiplyScalar(delta));
  });
  
  return null;
}

// Cockpit overlay
function CockpitOverlay() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundImage: 'url(/src/assets/textures/ships/default/cockpit.png)',
      backgroundSize: 'cover',  // Cover entire screen, no gaps
      backgroundPosition: 'center 35%',  // Show window area
      backgroundRepeat: 'no-repeat',
      pointerEvents: 'none',
      opacity: 0.85
    }} />
  );
}

// HUD overlay
function HUD({ inputManager }: { inputManager: InputManager | null }) {
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  
  useEffect(() => {
    if (!inputManager) return;
    
    const interval = setInterval(() => {
      // Update position display (would get from camera in real implementation)
      setPosition({
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        z: Math.random() * 1000
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [inputManager]);
  
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      color: '#00ff00',
      fontFamily: 'monospace',
      fontSize: '14px',
      textShadow: '0 0 10px #00ff00',
      pointerEvents: 'none',
      userSelect: 'none'
    }}>
      <div>SPACE DEMO v1.0</div>
      <div style={{ marginTop: 10 }}>
        <div>POS X: {position.x.toFixed(1)}</div>
        <div>POS Y: {position.y.toFixed(1)}</div>
        <div>POS Z: {position.z.toFixed(1)}</div>
      </div>
      <div style={{ marginTop: 20, fontSize: '12px', opacity: 0.7 }}>
        <div>CONTROLS:</div>
        <div>W/S - Forward/Back</div>
        <div>A/D - Left/Right</div>
        <div>Q/E - Roll</div>
        <div>Arrow Keys - Look</div>
        <div>Space/Shift - Up/Down</div>
      </div>
    </div>
  );
}

// Main demo component
export default function SpaceDemo() {
  const [inputManager, setInputManager] = useState<InputManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Initialize input manager
    const manager = new InputManager({
      enableKeyboard: true,
      enableMouse: true,
      enableGamepad: true,
      mouseSensitivity: 0.5
    });
    
    // Wait for canvas to be available
    const initInput = () => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        console.log('Initializing input manager with canvas:', canvas);
        manager.initialize(canvas);
        
        // Define movement axes
        manager.addAxis({
          name: 'moveForward',
          positive: { device: 'keyboard' as InputDeviceType, input: 'KeyW' },
          negative: { device: 'keyboard' as InputDeviceType, input: 'KeyS' },
          deadzone: 0.0,
          sensitivity: 2.0,  // More responsive
          gravity: 8.0,      // Faster response
          snap: true
        });
        
        manager.addAxis({
          name: 'moveRight',
          positive: { device: 'keyboard' as InputDeviceType, input: 'KeyD' },
          negative: { device: 'keyboard' as InputDeviceType, input: 'KeyA' },
          deadzone: 0.0,
          sensitivity: 2.0,  // More responsive
          gravity: 8.0,      // Faster response
          snap: true
        });
        
        manager.addAxis({
          name: 'moveUp',
          positive: { device: 'keyboard' as InputDeviceType, input: 'Space' },
          negative: { device: 'keyboard' as InputDeviceType, input: 'ShiftLeft' },
          deadzone: 0.0,
          sensitivity: 2.0,  // More responsive
          gravity: 8.0,      // Faster response
          snap: true
        });
        
        // Define rotation axes
        manager.addAxis({
          name: 'rotateX',
          positive: { device: 'keyboard' as InputDeviceType, input: 'ArrowDown' },
          negative: { device: 'keyboard' as InputDeviceType, input: 'ArrowUp' },
          deadzone: 0.0,
          sensitivity: 1.5,
          gravity: 6.0,
          snap: true
        });
        
        manager.addAxis({
          name: 'rotateY',
          positive: { device: 'keyboard' as InputDeviceType, input: 'ArrowRight' },
          negative: { device: 'keyboard' as InputDeviceType, input: 'ArrowLeft' },
          deadzone: 0.0,
          sensitivity: 1.5,
          gravity: 6.0,
          snap: true
        });
        
        // Roll - SWAPPED Q and E for correct direction
        manager.addAxis({
          name: 'rotateZ',
          positive: { device: 'keyboard' as InputDeviceType, input: 'KeyQ' },  // Q rolls left
          negative: { device: 'keyboard' as InputDeviceType, input: 'KeyE' },  // E rolls right
          deadzone: 0.0,
          sensitivity: 1.5,
          gravity: 6.0,
          snap: true
        });
        
        console.log('Input manager configured with all axes');
        setInputManager(manager);
      }
    };
    
    // Delay to ensure canvas is mounted
    setTimeout(initInput, 100);
    
    return () => {
      if (manager) {
        manager.dispose();
      }
    };
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
      <Canvas ref={canvasRef}>
        <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={75} />
        <Skybox />
        <StarCluster />
        {/* Enhanced lighting for better visibility */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4080ff" />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#ff8040" />
        {inputManager && <PlayerController inputManager={inputManager} />}
      </Canvas>
      <CockpitOverlay />
      <HUD inputManager={inputManager} />
    </div>
  );
}
