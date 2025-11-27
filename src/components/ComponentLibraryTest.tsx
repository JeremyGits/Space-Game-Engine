/**
 * Component Library Test
 * Demonstrates using individual Grok-generated components in 3D
 * Shows placeholder geometry when images aren't available yet
 */

export default function ComponentLibraryTest() {
  return (
    <group name="ComponentLibraryTest">
      {/* Push Button 1 - Red (Placeholder) */}
      <mesh position={[-0.5, 0, -1]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
        <meshStandardMaterial 
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[-0.5, 0.025, -1]}>
        <ringGeometry args={[0.03, 0.035, 16]} />
        <meshStandardMaterial 
          color="#333333"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Push Button 2 - Green (Placeholder) */}
      <mesh position={[-0.3, 0, -1]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
        <meshStandardMaterial 
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[-0.3, 0.025, -1]}>
        <ringGeometry args={[0.03, 0.035, 16]} />
        <meshStandardMaterial 
          color="#333333"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Rotary Knob - Silver (Placeholder) */}
      <mesh position={[-0.1, 0, -1]}>
        <cylinderGeometry args={[0.025, 0.02, 0.03, 16]} />
        <meshStandardMaterial 
          color="#c0c0c0"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* Knob indicator line */}
      <mesh position={[-0.1, 0.02, -0.98]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.002, 0.015, 0.002]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
      
      {/* Joystick - Black (Placeholder) */}
      <mesh position={[0.1, -0.125, -0.8]}>
        <cylinderGeometry args={[0.02, 0.015, 0.15, 16]} />
        <meshStandardMaterial 
          color="#222222"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      {/* Joystick grip */}
      <mesh position={[0.1, -0.05, -0.8]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial 
          color="#333333"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
      
      {/* Throttle Lever - Red Knob (Placeholder) */}
      <mesh position={[0.3, -0.05, -0.9]}>
        <cylinderGeometry args={[0.015, 0.015, 0.2, 16]} />
        <meshStandardMaterial 
          color="#888888"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* Throttle grip */}
      <mesh position={[0.3, 0.05, -0.9]}>
        <cylinderGeometry args={[0.025, 0.025, 0.04, 16]} />
        <meshStandardMaterial 
          color="#ff0000"
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      
      {/* MFD Screen - Placeholder */}
      <mesh position={[0, 0.2, -1.2]}>
        <boxGeometry args={[0.3, 0.2, 0.02]} />
        <meshStandardMaterial 
          color="#001100"
          emissive="#00ff00"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Screen frame */}
      <mesh position={[0, 0.2, -1.19]}>
        <boxGeometry args={[0.32, 0.22, 0.01]} />
        <meshStandardMaterial 
          color="#333333"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Info text */}
      <mesh position={[0, -0.3, -1]}>
        <boxGeometry args={[1.5, 0.15, 0.01]} />
        <meshStandardMaterial 
          color="#111111"
          emissive="#00ff00"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Lighting for components */}
      <pointLight position={[0, 0, 0]} intensity={1.0} color="#ffffff" distance={3} />
      <pointLight position={[-0.5, 0.5, -0.5]} intensity={0.5} color="#ffffff" distance={2} />
      <ambientLight intensity={0.4} />
      
      {/* Grid helper for reference */}
      <gridHelper args={[2, 20, '#444444', '#222222']} position={[0, -0.5, -1]} />
    </group>
  );
}
