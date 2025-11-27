import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SpacecraftController } from '../systems/SpacecraftController';
import { SpacecraftInput } from '../systems/SpacecraftController';

interface SpacecraftProps {
  input: SpacecraftInput;
  onUpdate?: (data: {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    rotation: THREE.Quaternion;
    fuel: number;
    speed: number;
  }) => void;
}

export function Spacecraft({ input, onUpdate }: SpacecraftProps) {
  const shipRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  const controllerRef = useRef<SpacecraftController>(
    new SpacecraftController({
      mass: 1000,
      thrustForce: 5000,
      rcsForce: 1000,
      boostMultiplier: 2.0,
      maxSpeed: 50,
      maxAngularSpeed: 2.0,
      fuel: 100,
      maxFuel: 100,
      fuelConsumption: 10
    })
  );

  useFrame((_, delta) => {
    if (!shipRef.current) return;

    const controller = controllerRef.current;
    
    // Update physics
    controller.update(input, delta);
    
    // Apply to mesh
    const position = controller.getPosition();
    const rotation = controller.getRotation();
    
    shipRef.current.position.copy(position);
    shipRef.current.quaternion.copy(rotation);
    
    // Callback with ship data (camera will be updated in SpaceGameScene)
    if (onUpdate) {
      onUpdate({
        position: controller.getPosition(),
        velocity: controller.getVelocity(),
        rotation: controller.getRotation(),
        fuel: controller.getFuel(),
        speed: controller.getSpeed()
      });
    }
  });

  // Thruster particle effect intensity based on input
  const thrusterIntensity = Math.abs(input.forward) + Math.abs(input.right) + Math.abs(input.up);
  const thrusterColor = input.boost ? '#ff3300' : '#ff6600';

  return (
    <group ref={shipRef}>
      {/* Main body - spacecraft cone */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.5, 2, 8]} />
        <meshStandardMaterial 
          color="#4488ff" 
          metalness={0.7} 
          roughness={0.3}
        />
      </mesh>

      {/* Wings */}
      <mesh position={[-0.8, 0, 0.5]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.1, 1, 0.5]} />
        <meshStandardMaterial color="#3366cc" metalness={0.6} roughness={0.4} />
      </mesh>
      
      <mesh position={[0.8, 0, 0.5]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.1, 1, 0.5]} />
        <meshStandardMaterial color="#3366cc" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Engine glow - intensity based on thrust */}
      <mesh position={[0, 0, 1.2]}>
        <sphereGeometry args={[0.3 * (1 + thrusterIntensity * 0.5), 8, 8]} />
        <meshStandardMaterial 
          color={thrusterColor}
          emissive={thrusterColor}
          emissiveIntensity={1 + thrusterIntensity * 2}
        />
      </mesh>

      {/* Cockpit */}
      <mesh position={[0, 0.2, -0.8]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial 
          color="#88ccff" 
          metalness={0.9} 
          roughness={0.1}
          transparent={true}
          opacity={0.6}
        />
      </mesh>

      {/* RCS thrusters (small) */}
      {input.pitch !== 0 && (
        <>
          <pointLight position={[0, 0.5, 0.5]} intensity={2} distance={5} color="#00aaff" />
          <pointLight position={[0, -0.5, 0.5]} intensity={2} distance={5} color="#00aaff" />
        </>
      )}
      
      {input.yaw !== 0 && (
        <>
          <pointLight position={[0.5, 0, 0.5]} intensity={2} distance={5} color="#00aaff" />
          <pointLight position={[-0.5, 0, 0.5]} intensity={2} distance={5} color="#00aaff" />
        </>
      )}

      {/* Main thruster light */}
      <pointLight 
        position={[0, 0, 1.5]} 
        intensity={2 + thrusterIntensity * 3} 
        distance={10 + thrusterIntensity * 5} 
        color={thrusterColor} 
      />
    </group>
  );
}
