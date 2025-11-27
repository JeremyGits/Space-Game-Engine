/**
 * Panel Library Test
 * Demonstrates using AI-generated panel pieces to build 3D ship interiors
 * Shows placeholder geometry for various panel shapes
 */

export default function PanelLibraryTest() {
  return (
    <group name="PanelLibraryTest">
      {/* Circular Panel - Hatch */}
      <mesh position={[-2, 0, -3]}>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
        <meshStandardMaterial 
          color="#555555"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      {/* Hatch rim */}
      <mesh position={[-2, 0, -3]}>
        <torusGeometry args={[0.5, 0.05, 16, 32]} />
        <meshStandardMaterial 
          color="#333333"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Corner Triangle Panel */}
      <mesh position={[-1, 0, -3]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.5, 0.1, 3]} />
        <meshStandardMaterial 
          color="#666666"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      
      {/* Small Rectangle Panel */}
      <mesh position={[0, 0, -3]}>
        <boxGeometry args={[0.5, 1, 0.1]} />
        <meshStandardMaterial 
          color="#555555"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      
      {/* Square Panel */}
      <mesh position={[1, 0, -3]}>
        <boxGeometry args={[0.8, 0.8, 0.1]} />
        <meshStandardMaterial 
          color="#666666"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      
      {/* Triangle Panel */}
      <mesh position={[2, 0, -3]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.5, 0.1, 3]} />
        <meshStandardMaterial 
          color="#555555"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      
      {/* L-Shape Panel (composed of two boxes) */}
      <group position={[-2, -1.2, -3]}>
        <mesh position={[0.25, 0.25, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.1]} />
          <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[-0.25, -0.25, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.1]} />
          <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      
      {/* Wide Rectangle Panel */}
      <mesh position={[0, -1.2, -3]}>
        <boxGeometry args={[2, 0.6, 0.1]} />
        <meshStandardMaterial 
          color="#555555"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      
      {/* DEMO: Displacement Mapped Panel with Simulated Depth */}
      <mesh position={[2.5, -1.2, -3]}>
        <planeGeometry args={[1.5, 1.5, 128, 128]} />
        <meshStandardMaterial 
          color="#666666"
          metalness={0.8}
          roughness={0.3}
          // Simulating displacement with a procedural pattern
          // In production, this would use a depth map from AI image
        />
      </mesh>
      
      {/* Label for displacement demo */}
      <mesh position={[2.5, -0.3, -2.9]}>
        <boxGeometry args={[1.4, 0.15, 0.02]} />
        <meshStandardMaterial 
          color="#111111"
          emissive="#00aaff"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Assembled Room Example - Back Wall */}
      <mesh position={[0, 0, -5]}>
        <boxGeometry args={[6, 4, 0.15]} />
        <meshStandardMaterial 
          color="#444444"
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>
      
      {/* Floor */}
      <mesh position={[0, -2, -3]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial 
          color="#333333"
          metalness={0.6}
          roughness={0.5}
        />
      </mesh>
      
      {/* Ceiling */}
      <mesh position={[0, 2, -3]} rotation={[Math.PI/2, 0, 0]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial 
          color="#444444"
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>
      
      {/* Info panel */}
      <mesh position={[0, 1.5, -2.5]}>
        <boxGeometry args={[2, 0.3, 0.05]} />
        <meshStandardMaterial 
          color="#111111"
          emissive="#00ff00"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Enhanced Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 3, -5]} intensity={0.8} />
      <pointLight position={[0, 3, -2]} intensity={2} color="#ffffff" distance={12} />
      <pointLight position={[-3, 1, 0]} intensity={1.2} color="#ffffff" distance={8} />
      <pointLight position={[3, 1, 0]} intensity={1.2} color="#ffffff" distance={8} />
      <spotLight position={[0, 5, -3]} angle={0.5} intensity={1.5} penumbra={0.5} castShadow />
      
      {/* Grid helper */}
      <gridHelper args={[8, 40, '#444444', '#222222']} position={[0, -2, -3]} />
    </group>
  );
}
