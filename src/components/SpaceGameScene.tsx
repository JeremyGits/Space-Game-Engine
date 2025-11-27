import { useState, useEffect } from 'react';
import React from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Starfield } from '../game/entities/Starfield';
import { SpaceStation } from '../game/entities/SpaceStation';
import { Spacecraft } from '../game/entities/Spacecraft';
import { useSpacecraftInput } from '../hooks/useSpacecraftInput';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import SimpleCockpit from '../game/entities/SimpleCockpit';

// Camera controller - handles both chase and cockpit views
function CameraController({ viewMode, shipPosition, shipRotation }: { 
  viewMode: 'chase' | 'cockpit', 
  shipPosition: THREE.Vector3,
  shipRotation: THREE.Quaternion
}) {
  const { camera } = useThree();
  
  useFrame(() => {
    if (viewMode === 'cockpit') {
      // Cockpit view - camera at pilot position inside ship
      camera.position.copy(shipPosition);
      camera.quaternion.copy(shipRotation);
    } else {
      // Chase view - camera behind and above ship
      const cameraOffset = new THREE.Vector3(0, 2, 8);
      cameraOffset.applyQuaternion(shipRotation);
      camera.position.copy(shipPosition).add(cameraOffset);
      
      // Look ahead of ship
      const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(shipRotation);
      const lookAtPoint = shipPosition.clone().add(forwardVector.multiplyScalar(5));
      camera.lookAt(lookAtPoint);
    }
  });
  
  return null;
}

export function SpaceGameScene() {
  const input = useSpacecraftInput();
  const [viewMode, setViewMode] = useState<'chase' | 'cockpit'>('chase');
  
  const [shipData, setShipData] = useState({
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Quaternion(),
    fuel: 100,
    speed: 0
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'v') {
        setViewMode(prev => prev === 'chase' ? 'cockpit' : 'chase');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const distanceToStation = shipData.position.distanceTo(new THREE.Vector3(0, 0, -50));

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000' }}>
      {/* Main HUD */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #00ff00',
        minWidth: '250px'
      }}>
        <div style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold', color: '#00ff00' }}>
          🚀 SPACECRAFT STATUS
        </div>
        <div style={{ marginBottom: '5px' }}>
          <span style={{ color: '#888' }}>Position:</span> X:{shipData.position.x.toFixed(1)} Y:{shipData.position.y.toFixed(1)} Z:{shipData.position.z.toFixed(1)}
        </div>
        <div style={{ marginBottom: '5px' }}>
          <span style={{ color: '#888' }}>Speed:</span> {shipData.speed.toFixed(2)} m/s
        </div>
        <div style={{ marginBottom: '5px' }}>
          <span style={{ color: '#888' }}>Velocity:</span> X:{shipData.velocity.x.toFixed(1)} Y:{shipData.velocity.y.toFixed(1)} Z:{shipData.velocity.z.toFixed(1)}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <span style={{ color: '#888' }}>Distance to Station:</span> {distanceToStation.toFixed(1)} m
        </div>
        <div style={{ marginBottom: '5px' }}>
          <span style={{ color: '#888' }}>Fuel:</span> {shipData.fuel.toFixed(1)}%
        </div>
        <div style={{
          width: '100%',
          height: '10px',
          background: '#222',
          border: '1px solid #00ff00',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${shipData.fuel}%`,
            height: '100%',
            background: shipData.fuel > 30 ? '#00ff00' : shipData.fuel > 10 ? '#ffaa00' : '#ff0000',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>

      {/* View mode indicator */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        color: viewMode === 'cockpit' ? '#00ff00' : '#00aaff',
        fontFamily: 'monospace',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '10px 20px',
        borderRadius: '8px',
        border: `2px solid ${viewMode === 'cockpit' ? '#00ff00' : '#00aaff'}`,
        textAlign: 'center'
      }}>
        {viewMode === 'cockpit' ? '🎯 COCKPIT VIEW' : '📷 CHASE VIEW'}
        <div style={{ fontSize: '10px', marginTop: '5px', color: '#888' }}>Press V to toggle</div>
      </div>

      {/* Controls HUD */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        color: '#00aaff',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #00aaff',
        minWidth: '300px'
      }}>
        <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>🎮 CONTROLS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
          <div>
            <div style={{ color: '#888', marginBottom: '3px' }}>TRANSLATION:</div>
            <div>W/S - Forward/Back</div>
            <div>A/D - Left/Right</div>
            <div>Space/Ctrl - Up/Down</div>
          </div>
          <div>
            <div style={{ color: '#888', marginBottom: '3px' }}>ROTATION:</div>
            <div>↑/↓ - Pitch</div>
            <div>←/→ - Yaw</div>
            <div>Q/E - Roll</div>
          </div>
        </div>
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #00aaff' }}>
          <div>Shift - Boost</div>
          <div>X - Brake</div>
          <div style={{ color: '#00ff00', fontWeight: 'bold' }}>V - Toggle View</div>
        </div>
        {input.boost && (
          <div style={{ marginTop: '10px', color: '#ff6600', fontWeight: 'bold' }}>🔥 BOOST ACTIVE</div>
        )}
      </div>

      {/* Input indicators */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '11px',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #00ff00'
      }}>
        <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>INPUT STATUS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px' }}>
          <span style={{ color: '#888' }}>Forward:</span>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '60px', height: '6px', background: '#222', border: '1px solid #00ff00', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '50%',
                transform: `translateX(${input.forward * 50}%)`,
                width: '4px',
                height: '100%',
                background: '#00ff00'
              }} />
            </div>
            <span style={{ marginLeft: '5px' }}>{input.forward.toFixed(2)}</span>
          </div>
          <span style={{ color: '#888' }}>Right:</span>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '60px', height: '6px', background: '#222', border: '1px solid #00ff00', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '50%',
                transform: `translateX(${input.right * 50}%)`,
                width: '4px',
                height: '100%',
                background: '#00ff00'
              }} />
            </div>
            <span style={{ marginLeft: '5px' }}>{input.right.toFixed(2)}</span>
          </div>
          <span style={{ color: '#888' }}>Up:</span>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '60px', height: '6px', background: '#222', border: '1px solid #00ff00', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '50%',
                transform: `translateX(${input.up * 50}%)`,
                width: '4px',
                height: '100%',
                background: '#00ff00'
              }} />
            </div>
            <span style={{ marginLeft: '5px' }}>{input.up.toFixed(2)}</span>
          </div>
          <span style={{ color: '#888' }}>Pitch:</span>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '60px', height: '6px', background: '#222', border: '1px solid #ffaa00', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '50%',
                transform: `translateX(${input.pitch * 50}%)`,
                width: '4px',
                height: '100%',
                background: '#ffaa00'
              }} />
            </div>
            <span style={{ marginLeft: '5px' }}>{input.pitch.toFixed(2)}</span>
          </div>
          <span style={{ color: '#888' }}>Yaw:</span>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '60px', height: '6px', background: '#222', border: '1px solid #ffaa00', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '50%',
                transform: `translateX(${input.yaw * 50}%)`,
                width: '4px',
                height: '100%',
                background: '#ffaa00'
              }} />
            </div>
            <span style={{ marginLeft: '5px' }}>{input.yaw.toFixed(2)}</span>
          </div>
          <span style={{ color: '#888' }}>Roll:</span>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '60px', height: '6px', background: '#222', border: '1px solid #ffaa00', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '50%',
                transform: `translateX(${input.roll * 50}%)`,
                width: '4px',
                height: '100%',
                background: '#ffaa00'
              }} />
            </div>
            <span style={{ marginLeft: '5px' }}>{input.roll.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Crosshair */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        <div style={{
          width: '20px',
          height: '2px',
          background: 'rgba(0, 255, 0, 0.6)',
          position: 'absolute',
          left: '-10px',
          top: '-1px'
        }} />
        <div style={{
          width: '2px',
          height: '20px',
          background: 'rgba(0, 255, 0, 0.6)',
          position: 'absolute',
          left: '-1px',
          top: '-10px'
        }} />
        <div style={{
          width: '4px',
          height: '4px',
          border: '1px solid rgba(0, 255, 0, 0.6)',
          borderRadius: '50%',
          position: 'absolute',
          left: '-2px',
          top: '-2px'
        }} />
      </div>

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 2, 5], fov: 75 }}>
        <CameraController 
          viewMode={viewMode} 
          shipPosition={shipData.position} 
          shipRotation={shipData.rotation}
        />
        <ambientLight intensity={0.1} />
        <directionalLight position={[100, 50, 50]} intensity={1.5} color="#ffffff" />
        
        {/* Simple Cockpit - Clean curved surface approach */}
        {viewMode === 'cockpit' && <SimpleCockpit />}
        
        <Starfield count={5000} radius={500} size={1.5} />
        <SpaceStation position={[0, 0, -50]} />
        
        {/* Spacecraft - always update physics, hide model in cockpit view */}
        <group visible={viewMode === 'chase'}>
          <Spacecraft input={input} onUpdate={setShipData} />
        </group>
        
        <gridHelper args={[100, 20, '#444444', '#222222']} position={[0, -10, 0]} />
      </Canvas>
    </div>
  );
}
