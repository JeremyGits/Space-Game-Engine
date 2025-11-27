import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Sky } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider, useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { InputManager, InputDeviceType } from '../engine/input';
import { GrassRenderer, RockRenderer } from '../engine/rendering/instancing';
import { 
  CharacterController, 
  CharacterInput, 
  MovementState 
} from '../engine/physics/character';

// First-person player controller with CharacterController
function Player({ inputManager, onStateUpdate }: { 
  inputManager: InputManager,
  onStateUpdate: (state: MovementState, stamina: number) => void
}) {
  const { camera } = useThree();
  const { world } = useRapier();
  const playerRef = useRef<any>(null);
  const controllerRef = useRef<CharacterController>(new CharacterController());
  
  useFrame((_, delta) => {
    if (!playerRef.current || !world) return;
    
    inputManager.update(delta);
    
    // Get input for character controller
    const input: CharacterInput = {
      moveForward: inputManager.getAxis('moveForward'),
      moveRight: inputManager.getAxis('moveRight'),
      jump: inputManager.getAction('jump') > 0.5,
      sprint: inputManager.getAction('sprint') > 0.5,
      crouch: inputManager.getAction('crouch') > 0.5
    };
    
    // DEBUG: Log input values
    if (input.moveForward !== 0 || input.moveRight !== 0) {
      console.log('Input:', input);
    }
    
    // Get player position
    const pos = playerRef.current.translation();
    const position = new THREE.Vector3(pos.x, pos.y, pos.z);
    
    // Update character controller
    const velocity = controllerRef.current.update(
      input,
      position,
      camera.quaternion,
      world,
      delta
    );
    
    // DEBUG: Log velocity
    if (velocity.length() > 0.01) {
      console.log('Velocity:', velocity);
      console.log('Position before:', pos);
    }
    
    // Wake up the body and apply velocity
    playerRef.current.wakeUp();
    playerRef.current.setLinvel(
      { x: velocity.x, y: velocity.y, z: velocity.z },
      true
    );
    
    // DEBUG: Check position after
    if (velocity.length() > 0.01) {
      const newPos = playerRef.current.translation();
      console.log('Position after:', newPos);
    }
    
    // Update camera position
    const cameraHeight = controllerRef.current.getState() === MovementState.CROUCHING ? 0.3 : 0.6;
    camera.position.set(pos.x, pos.y + cameraHeight, pos.z);
    
    // Update HUD with state
    onStateUpdate(
      controllerRef.current.getState(),
      controllerRef.current.getStamina()
    );
  });
  
  return (
    <RigidBody
      ref={playerRef}
      colliders={false}
      mass={1}
      type="dynamic"
      position={[0, 5, 0]}
      enabledRotations={[false, false, false]}
      gravityScale={1}
      linearDamping={0}
      angularDamping={0}
    >
      <CuboidCollider args={[0.3, 0.8, 0.3]} />
    </RigidBody>
  );
}

// Terrain
function Terrain() {
  const terrainRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (!terrainRef.current) return;
    
    const geometry = terrainRef.current.geometry as THREE.PlaneGeometry;
    const positions = geometry.attributes.position;
    
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
        <meshStandardMaterial color="#5a8c6a" />
      </mesh>
    </RigidBody>
  );
}

// GPU Instanced Grass Field
function GrassField() {
  const grassRef = useRef<GrassRenderer | null>(null);
  const { camera } = useThree();
  
  useEffect(() => {
    // Function to calculate terrain height at any X,Z position
    const getTerrainHeight = (x: number, z: number): number => {
      // Match the terrain generation formula
      const height = 
        Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2 +
        Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3;
      return height;
    };
    
    // Create grass renderer with realistic size
    grassRef.current = new GrassRenderer({
      density: 8,           // 8 blades per square meter
      areaSize: 70,         // 70x70 meter area
      bladeHeight: 0.15,    // 15cm tall grass (realistic)
      bladeWidth: 0.02,     // 2cm wide blades
      colorVariation: 0.3,
      windStrength: 0.3,
      lodDistance: 40
    });
    
    // Generate grass with terrain height
    grassRef.current.generateGrassField(getTerrainHeight);
    
    return () => {
      grassRef.current?.dispose();
    };
  }, []);
  
  useFrame((_, delta) => {
    if (grassRef.current) {
      grassRef.current.update(delta);
      grassRef.current.updateLOD(camera.position);
    }
  });
  
  return grassRef.current ? <primitive object={grassRef.current.getMesh()} /> : null;
}

// GPU Instanced Rocks
function Rocks() {
  const rocksRef = useRef<RockRenderer | null>(null);
  
  useEffect(() => {
    // Function to calculate terrain height at any X,Z position
    const getTerrainHeight = (x: number, z: number): number => {
      // Match the terrain generation formula
      const height = 
        Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2 +
        Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3;
      return height;
    };
    
    // Create rock renderer with 2000 rocks
    rocksRef.current = new RockRenderer({
      count: 2000,
      areaSize: 70,
      minSize: 0.15,
      maxSize: 0.6,
      colorVariation: 0.4
    });
    
    // Generate rocks with terrain height
    rocksRef.current.generateRocks(getTerrainHeight);
    
    return () => {
      rocksRef.current?.dispose();
    };
  }, []);
  
  return rocksRef.current ? <primitive object={rocksRef.current.getMesh()} /> : null;
}

// Position tracker
function PositionTracker({ onPositionUpdate, onStatsUpdate }: { 
  onPositionUpdate: (pos: { x: number, y: number, z: number }) => void,
  onStatsUpdate: (stats: { fps: number, triangles: number }) => void
}) {
  const { camera, gl } = useThree();
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  
  useFrame(() => {
    onPositionUpdate({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    });
    
    // Update stats every 30 frames
    frameCount.current++;
    if (frameCount.current % 30 === 0) {
      const now = performance.now();
      const fps = Math.round(1000 / ((now - lastTime.current) / 30));
      lastTime.current = now;
      
      onStatsUpdate({
        fps,
        triangles: gl.info.render.triangles
      });
    }
  });
  
  return null;
}

// HUD
function HUD({ position, stats, grassCount, rockCount }: { 
  position: { x: number, y: number, z: number },
  stats: { fps: number, triangles: number },
  grassCount: number,
  rockCount: number
}) {
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '13px',
      textShadow: '0 0 10px rgba(0,0,0,0.8)',
      pointerEvents: 'none',
      userSelect: 'none',
      background: 'rgba(0,0,0,0.6)',
      padding: '12px',
      borderRadius: '6px',
      minWidth: '250px'
    }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#4ade80' }}>
        🌿 GPU INSTANCING DEMO
      </div>
      
      <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <div style={{ color: '#a3a3a3', fontSize: '11px', marginBottom: '4px' }}>POSITION</div>
        <div>X: {position.x.toFixed(1)}</div>
        <div>Y: {position.y.toFixed(1)}</div>
        <div>Z: {position.z.toFixed(1)}</div>
      </div>
      
      <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <div style={{ color: '#a3a3a3', fontSize: '11px', marginBottom: '4px' }}>PERFORMANCE</div>
        <div style={{ color: stats.fps > 50 ? '#4ade80' : stats.fps > 30 ? '#fbbf24' : '#ef4444' }}>
          FPS: {stats.fps}
        </div>
        <div>Triangles: {stats.triangles.toLocaleString()}</div>
      </div>
      
      <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <div style={{ color: '#a3a3a3', fontSize: '11px', marginBottom: '4px' }}>INSTANCED OBJECTS</div>
        <div style={{ color: '#4ade80' }}>🌱 Grass: {grassCount.toLocaleString()} blades</div>
        <div style={{ color: '#a8a29e' }}>🪨 Rocks: {rockCount.toLocaleString()}</div>
        <div style={{ color: '#60a5fa', marginTop: '4px', fontSize: '11px' }}>
          Total: {(grassCount + rockCount).toLocaleString()} instances
        </div>
      </div>
      
      <div style={{ fontSize: '11px', opacity: 0.9, color: '#d4d4d4' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#a3a3a3' }}>CONTROLS</div>
        <div>W/A/S/D - Move</div>
        <div>Shift - Sprint</div>
        <div>Ctrl - Crouch</div>
        <div>Space - Jump</div>
        <div>Mouse - Look Around</div>
        <div style={{ marginTop: '4px', fontSize: '10px', color: '#737373' }}>Click to lock cursor</div>
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
export default function InstancingDemo() {
  const [inputManager, setInputManager] = useState<InputManager | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [stats, setStats] = useState({ fps: 60, triangles: 0 });
  const [grassCount, setGrassCount] = useState(0);
  const [rockCount, setRockCount] = useState(0);
  
  useEffect(() => {
    const manager = new InputManager({
      enableKeyboard: true,
      enableMouse: true,
      enableGamepad: true,
      mouseSensitivity: 0.5
    });
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      manager.initialize(canvas);
      
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
      
      manager.addAction({
        name: 'jump',
        bindings: [
          { device: 'keyboard' as InputDeviceType, input: 'Space' }
        ]
      });
      
      manager.addAction({
        name: 'sprint',
        bindings: [
          { device: 'keyboard' as InputDeviceType, input: 'ShiftLeft' },
          { device: 'keyboard' as InputDeviceType, input: 'ShiftRight' }
        ]
      });
      
      manager.addAction({
        name: 'crouch',
        bindings: [
          { device: 'keyboard' as InputDeviceType, input: 'ControlLeft' },
          { device: 'keyboard' as InputDeviceType, input: 'ControlRight' }
        ]
      });
      
      setInputManager(manager);
    }
    
    // Set counts after a short delay (after renderers are created)
    setTimeout(() => {
      setGrassCount(39200);  // 8 blades/m² * 70*70 = 39,200
      setRockCount(2000);
    }, 100);
    
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
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={100}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        <hemisphereLight args={['#87CEEB', '#5a8c6a', 0.6]} />
        
        {/* Physics world */}
        <Physics gravity={[0, -9.81, 0]}>
          {inputManager && <Player 
            inputManager={inputManager}
            onStateUpdate={(state, stamina) => {
              // State updates handled here
            }}
          />}
          <Terrain />
        </Physics>
        
        {/* GPU Instanced Objects (no physics needed) */}
        <GrassField />
        <Rocks />
        
        {/* Controls */}
        <PointerLockControls />
        
        {/* Trackers */}
        <PositionTracker 
          onPositionUpdate={setPosition}
          onStatsUpdate={setStats}
        />
      </Canvas>
      
      <HUD 
        position={position} 
        stats={stats}
        grassCount={grassCount}
        rockCount={rockCount}
      />
      <Crosshair />
    </div>
  );
}
