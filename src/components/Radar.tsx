import { useMemo } from 'react';
import * as THREE from 'three';

interface RadarProps {
  shipPosition: THREE.Vector3;
  stationPosition: THREE.Vector3;
  radarRange: number;
}

export function Radar({ shipPosition, stationPosition, radarRange }: RadarProps) {
  // Calculate relative position of station to ship
  const relativePos = useMemo(() => {
    const diff = new THREE.Vector3().subVectors(stationPosition, shipPosition);
    const distance = diff.length();
    
    // Normalize to radar range
    const normalizedX = (diff.x / radarRange) * 0.2; // Scale to radar size
    const normalizedZ = -(diff.z / radarRange) * 0.2; // Negative Z to flip radar orientation
    
    return {
      x: Math.max(-0.2, Math.min(0.2, normalizedX)),
      z: Math.max(-0.2, Math.min(0.2, normalizedZ)),
      distance,
      inRange: distance <= radarRange
    };
  }, [shipPosition, stationPosition, radarRange]);

  return (
    <group>
      {/* Radar grid lines */}
      <lineSegments>
        <edgesGeometry attach="geometry" args={[new THREE.CircleGeometry(0.25, 32)]} />
        <lineBasicMaterial attach="material" color="#00ff00" opacity={0.3} transparent />
      </lineSegments>
      
      {/* Radar range circles */}
      <lineSegments>
        <edgesGeometry attach="geometry" args={[new THREE.CircleGeometry(0.125, 32)]} />
        <lineBasicMaterial attach="material" color="#00ff00" opacity={0.2} transparent />
      </lineSegments>
      
      {/* Radar crosshair */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-0.25, 0, 0, 0.25, 0, 0])}
            itemSize={3}
            args={[new Float32Array([-0.25, 0, 0, 0.25, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00ff00" opacity={0.4} transparent />
      </line>
      
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, -0.25, 0, 0, 0.25, 0])}
            itemSize={3}
            args={[new Float32Array([0, -0.25, 0, 0, 0.25, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00ff00" opacity={0.4} transparent />
      </line>
      
      {/* Station blip (if in range) */}
      {relativePos.inRange && (
        <mesh position={[relativePos.x, relativePos.z, 0.001]}>
          <circleGeometry args={[0.015, 8]} />
          <meshBasicMaterial 
            color="#ffaa00" 
            opacity={0.9}
            transparent
          />
        </mesh>
      )}
      
      {/* Player position (center) */}
      <mesh position={[0, 0, 0.001]}>
        <circleGeometry args={[0.01, 8]} />
        <meshBasicMaterial 
          color="#00ff00" 
          opacity={1.0}
        />
      </mesh>
    </group>
  );
}
