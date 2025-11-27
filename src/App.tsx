import { SpaceGameScene } from './components/SpaceGameScene'
import ComponentLibraryTest from './components/ComponentLibraryTest'
import PanelLibraryTest from './components/PanelLibraryTest'
import DetailedPanelTest from './components/DetailedPanelTest'
import UltraTrumpDemo from './components/UltraTrumpDemo'
import MechaStreetDemo from './components/MechaStreetDemo'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { PostProcessingEffects } from './engine/rendering/postprocessing'
import * as THREE from 'three'
// import ProperMovementTest from './components/ProperMovementTest'
// import SimpleMovementTest from './components/SimpleMovementTest'
// import InstancingDemo from './components/InstancingDemo'
import './index.css'

function App() {
  // Check URL for test mode
  const isComponentTest = window.location.hash === '#component-test';
  const isPanelTest = window.location.hash === '#panel-test';
  const isDetailedPanelTest = window.location.hash === '#detailed-panel-test';
  const isImageTo3D = window.location.hash === '#image-to-3d';
  const isMechaStreet = window.location.hash === '#mecha-street';
  
  if (isComponentTest) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: '#00ff00',
          fontFamily: 'monospace',
          zIndex: 1000,
          background: 'rgba(0,0,0,0.8)',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #00ff00'
        }}>
          <h2>🎯 Component Library Test</h2>
          <p>Testing individual Grok-generated components</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            <a href="#" style={{ color: '#00aaff' }}>Back to Game</a> | <a href="#panel-test" style={{ color: '#00aaff' }}>Panel Test</a>
          </p>
        </div>
        <Canvas camera={{ position: [0, 0, 2], fov: 75 }}>
          <OrbitControls 
            enableDamping
            dampingFactor={0.05}
            minDistance={0.5}
            maxDistance={5}
            target={[0, 0, -1]}
          />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <ComponentLibraryTest />
        </Canvas>
      </div>
    );
  }
  
  if (isPanelTest) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: '#00ff00',
          fontFamily: 'monospace',
          zIndex: 1000,
          background: 'rgba(0,0,0,0.8)',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #00ff00'
        }}>
          <h2>🚀 Ship Panel Library Test</h2>
          <p>Testing modular ship interior panels</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            <a href="#" style={{ color: '#00aaff' }}>Back to Game</a> | <a href="#component-test" style={{ color: '#00aaff' }}>Component Test</a> | <a href="#detailed-panel-test" style={{ color: '#00ff00' }}>Detailed Panels</a>
          </p>
        </div>
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <OrbitControls 
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={15}
            target={[0, 0, -3]}
          />
          <PanelLibraryTest />
        </Canvas>
      </div>
    );
  }
  
  if (isDetailedPanelTest) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: '#00ff00',
          fontFamily: 'monospace',
          zIndex: 1000,
          background: 'rgba(0,0,0,0.8)',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #00ff00'
        }}>
          <h2>✨ Detailed Panel Test - Displacement Mapping</h2>
          <p>Showcasing procedural geometric detail</p>
          <p style={{ fontSize: '11px', marginTop: '8px', color: '#aaaaaa' }}>
            Rivets • Panel Lines • Grating • Engraved Text
          </p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            <a href="#" style={{ color: '#00aaff' }}>Back to Game</a> | <a href="#component-test" style={{ color: '#00aaff' }}>Components</a> | <a href="#panel-test" style={{ color: '#00aaff' }}>Basic Panels</a> | <a href="#image-to-3d" style={{ color: '#ff00ff' }}>Image to 3D</a>
          </p>
        </div>
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <OrbitControls 
            enableDamping
            dampingFactor={0.05}
            minDistance={0.5}
            maxDistance={20}
            target={[0, 0, -3]}
          />
          <DetailedPanelTest />
        </Canvas>
      </div>
    );
  }
  
  if (isImageTo3D) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: '#00ffff',
          fontFamily: 'monospace',
          zIndex: 1000,
          background: 'rgba(0,0,0,0.9)',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #00ffff',
          boxShadow: '0 0 20px rgba(0,255,255,0.5)'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>🇺🇸 HOLOGRAPHIC TRUMP DEMO</h2>
          <p style={{ fontSize: '14px', color: '#00aaff' }}>Smooth holographic projection - NO SPIKES!</p>
          <p style={{ fontSize: '12px', marginTop: '10px', color: '#aaffff' }}>
            💎 Normal Mapping Only • 🌃 Night Scene • ✨ Energy Field<br/>
            📡 Scan Lines • ⭕ Rotating Ring • 🎭 Smooth 60 FPS
          </p>
          <p style={{ fontSize: '12px', marginTop: '15px' }}>
            <a href="#" style={{ color: '#00aaff' }}>Back to Game</a> | <a href="#mecha-street" style={{ color: '#00ff00' }}>Mecha Street</a>
          </p>
        </div>
        <Canvas camera={{ position: [0, 0, 10], fov: 75 }} shadows>
          <OrbitControls 
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={30}
            target={[0, 0, -5]}
          />
          <UltraTrumpDemo />
        </Canvas>
      </div>
    );
  }
  
  if (isMechaStreet) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
        {/* Stats UI Overlay */}
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'rgba(0,0,0,0.85)',
          padding: '20px',
          borderRadius: '10px',
          color: '#00ff00',
          fontFamily: 'monospace',
          border: '2px solid #00ff00',
          minWidth: '280px',
          boxShadow: '0 0 20px rgba(0,255,0,0.3)',
          zIndex: 1000
        }}>
          <h3 style={{ marginBottom: '15px', fontSize: '18px', borderBottom: '1px solid #00ff00', paddingBottom: '10px' }}>
            🤖 MECHA STREET - THIRD PERSON
          </h3>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', marginBottom: '5px', color: '#ffaa00' }}>💡 Lighting</div>
            <div style={{ fontSize: '11px', color: '#888', paddingLeft: '15px' }}>
              • 4x Street Lights (flickering)<br/>
              • Moonlight + Rim Light<br/>
              • 2K Shadows
            </div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', marginBottom: '5px', color: '#ffaa00' }}>🎨 Materials</div>
            <div style={{ fontSize: '11px', color: '#888', paddingLeft: '15px' }}>
              • PBR (Metal 0.9, Rough 0.2)<br/>
              • Emissive visor & reactor<br/>
              • Glow effects
            </div>
          </div>
          
          <div style={{ marginTop: '15px', fontSize: '10px', color: '#00aaff', borderTop: '1px solid #333', paddingTop: '10px' }}>
            ⚡ UE5-level rendering<br/>
            🎮 Procedural geometry<br/>
            🌃 Cinematic lighting
          </div>
          
          <p style={{ fontSize: '12px', marginTop: '15px' }}>
            <a href="#" style={{ color: '#00aaff' }}>Back to Game</a> | <a href="#image-to-3d" style={{ color: '#00ffff' }}>Hologram</a>
          </p>
        </div>
        
        <Canvas 
          camera={{ position: [0, 8, 15], fov: 75 }} 
          shadows
          gl={{
            logarithmicDepthBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            antialias: true,
            powerPreference: 'high-performance',
            alpha: false
          }}
        >
          <color attach="background" args={['#0a0a0a']} />
          <OrbitControls 
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={40}
            target={[0, 2, 0]}
          />
          <MechaStreetDemo />
          <PostProcessingEffects preset="ultra" />
        </Canvas>
      </div>
    );
  }
  
  return <SpaceGameScene />
  // return <ProperMovementTest />
  // return <SimpleMovementTest />
  // return <InstancingDemo />
}

export default App
