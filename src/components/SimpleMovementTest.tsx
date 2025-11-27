import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Sky } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

// Ultra-simple movement test
function SimplePlayer() {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const playerPosition = useRef(new THREE.Vector3(0, 2, 0));
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const speed = 5;
      if (e.key === 'w') velocity.current.z = -speed;
      if (e.key === 's') velocity.current.z = speed;
      if (e.key === 'a') velocity.current.x = -speed;
      if (e.key === 'd') velocity.current.x = speed;
      console.log('Key pressed:', e.key);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 's') velocity.current.z = 0;
      if (e.key === 'a' || e.key === 'd') velocity.current.x = 0;
      console.log('Key released:', e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [camera]);
  
  useFrame((_, delta) => {
    // Get camera forward and right vectors (BEFORE we update camera position)
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();
    
    // Apply velocity relative to camera direction
    const movement = new THREE.Vector3();
    movement.addScaledVector(forward, velocity.current.z * delta);
    movement.addScaledVector(right, velocity.current.x * delta);
    
    playerPosition.current.add(movement);
    
    // Update camera position (preserve rotation from PointerLockControls)
    camera.position.x = playerPosition.current.x;
    camera.position.y = playerPosition.current.y;
    camera.position.z = playerPosition.current.z;
    
    if (movement.length() > 0) {
      console.log('Moving! Position:', playerPosition.current.clone());
      console.log('Camera rotation:', camera.rotation);
    }
  });
  
  return null;
}

// Simple ground
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

export default function SimpleMovementTest() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas shadows camera={{ fov: 75, position: [0, 2, 0] }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[50, 50, 25]} intensity={1} castShadow />
        
        <Physics>
          <SimplePlayer />
          <Ground />
        </Physics>
        
        <PointerLockControls />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: 'white',
        fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.7)',
        padding: '10px'
      }}>
        <div>SIMPLE MOVEMENT TEST</div>
        <div>W/A/S/D to move</div>
        <div>Check console for logs</div>
      </div>
    </div>
  );
}
