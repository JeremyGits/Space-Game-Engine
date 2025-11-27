/**
 * Configuration Types
 * 
 * Type definitions for engine configuration
 */

/**
 * Engine configuration
 */
export interface EngineConfig {
  /** Canvas element or selector */
  canvas?: HTMLCanvasElement | string;
  
  /** Enable debug mode (simple boolean flag) */
  debugMode?: boolean;
  
  /** Target frames per second */
  targetFPS?: number;
  
  /** Fixed timestep for physics (in seconds) */
  fixedTimestep?: number;
  
  /** Maximum frame delta time (in seconds) */
  maxDeltaTime?: number;
  
  /** Enable anti-aliasing */
  antialias?: boolean;
  
  /** Enable shadows */
  shadows?: boolean;
  
  /** Enable post-processing */
  postProcessing?: boolean;
  
  /** Physics configuration */
  physics?: PhysicsConfig;
  
  /** Rendering configuration */
  rendering?: RenderingConfig;
  
  /** Audio configuration */
  audio?: AudioConfig;
  
  /** Input configuration */
  input?: InputConfig;
}

/**
 * Physics configuration
 */
export interface PhysicsConfig {
  /** Enable physics simulation */
  enabled?: boolean;
  
  /** Gravity vector [x, y, z] */
  gravity?: [number, number, number];
  
  /** Number of physics iterations per frame */
  iterations?: number;
  
  /** Enable collision detection */
  collisionDetection?: boolean;
  
  /** Collision detection algorithm */
  collisionAlgorithm?: 'brute-force' | 'spatial-hash' | 'bvh';
  
  /** Enable sleeping for inactive bodies */
  sleeping?: boolean;
  
  /** Sleep threshold */
  sleepThreshold?: number;
}

/**
 * Rendering configuration
 */
export interface RenderingConfig {
  /** Renderer type */
  renderer?: 'webgl' | 'webgl2' | 'webgpu';
  
  /** Enable HDR rendering */
  hdr?: boolean;
  
  /** Tone mapping */
  toneMapping?: 'none' | 'linear' | 'reinhard' | 'cineon' | 'aces';
  
  /** Exposure */
  exposure?: number;
  
  /** Shadow map size */
  shadowMapSize?: number;
  
  /** Shadow map type */
  shadowMapType?: 'basic' | 'pcf' | 'pcf-soft' | 'vsm';
  
  /** Enable fog */
  fog?: boolean;
  
  /** Fog color */
  fogColor?: number;
  
  /** Fog near distance */
  fogNear?: number;
  
  /** Fog far distance */
  fogFar?: number;
  
  /** Clear color */
  clearColor?: number;
  
  /** Clear alpha */
  clearAlpha?: number;
  
  /** Pixel ratio */
  pixelRatio?: number;
  
  /** Enable logarithmic depth buffer */
  logarithmicDepthBuffer?: boolean;
}

/**
 * Audio configuration
 */
export interface AudioConfig {
  /** Enable audio */
  enabled?: boolean;
  
  /** Master volume (0-1) */
  masterVolume?: number;
  
  /** Music volume (0-1) */
  musicVolume?: number;
  
  /** SFX volume (0-1) */
  sfxVolume?: number;
  
  /** Ambient volume (0-1) */
  ambientVolume?: number;
  
  /** Audio context sample rate */
  sampleRate?: number;
  
  /** Enable 3D audio */
  spatialAudio?: boolean;
  
  /** Doppler factor */
  dopplerFactor?: number;
  
  /** Speed of sound */
  speedOfSound?: number;
}

/**
 * Input configuration
 */
export interface InputConfig {
  /** Enable keyboard input */
  keyboard?: boolean;
  
  /** Enable mouse input */
  mouse?: boolean;
  
  /** Enable touch input */
  touch?: boolean;
  
  /** Enable gamepad input */
  gamepad?: boolean;
  
  /** Mouse sensitivity */
  mouseSensitivity?: number;
  
  /** Invert mouse Y axis */
  invertMouseY?: boolean;
  
  /** Gamepad deadzone */
  gamepadDeadzone?: number;
  
  /** Enable pointer lock */
  pointerLock?: boolean;
}

/**
 * Scene configuration
 */
export interface SceneConfig {
  /** Scene name */
  name?: string;
  
  /** Background color */
  background?: number;
  
  /** Enable fog */
  fog?: boolean;
  
  /** Ambient light color */
  ambientLight?: number;
  
  /** Ambient light intensity */
  ambientLightIntensity?: number;
  
  /** Enable frustum culling */
  frustumCulling?: boolean;
  
  /** Enable occlusion culling */
  occlusionCulling?: boolean;
  
  /** LOD bias */
  lodBias?: number;
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  /** Enable performance monitoring */
  monitoring?: boolean;
  
  /** Performance sample size */
  sampleSize?: number;
  
  /** Enable profiling */
  profiling?: boolean;
  
  /** Enable memory tracking */
  memoryTracking?: boolean;
  
  /** Warning threshold for frame time (ms) */
  frameTimeWarning?: number;
  
  /** Warning threshold for memory usage (MB) */
  memoryWarning?: number;
}

/**
 * Debug configuration
 */
export interface DebugConfig {
  /** Show FPS counter */
  showFPS?: boolean;
  
  /** Show memory usage */
  showMemory?: boolean;
  
  /** Show draw calls */
  showDrawCalls?: boolean;
  
  /** Show wireframe */
  showWireframe?: boolean;
  
  /** Show bounding boxes */
  showBoundingBoxes?: boolean;
  
  /** Show collision shapes */
  showCollisionShapes?: boolean;
  
  /** Show normals */
  showNormals?: boolean;
  
  /** Show grid */
  showGrid?: boolean;
  
  /** Show axes */
  showAxes?: boolean;
  
  /** Enable debug logging */
  logging?: boolean;
  
  /** Log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Complete engine configuration with all subsystems
 */
export interface CompleteEngineConfig extends Omit<EngineConfig, 'debugMode'> {
  scene?: SceneConfig;
  performance?: PerformanceConfig;
  debug?: DebugConfig;
}

/**
 * Default engine configuration
 */
export const DEFAULT_ENGINE_CONFIG: CompleteEngineConfig = {
  targetFPS: 60,
  fixedTimestep: 1 / 60,
  maxDeltaTime: 0.1,
  antialias: true,
  shadows: true,
  postProcessing: true,
  
  physics: {
    enabled: true,
    gravity: [0, -9.81, 0],
    iterations: 10,
    collisionDetection: true,
    collisionAlgorithm: 'spatial-hash',
    sleeping: true,
    sleepThreshold: 0.01
  },
  
  rendering: {
    renderer: 'webgl2',
    hdr: false,
    toneMapping: 'aces',
    exposure: 1.0,
    shadowMapSize: 2048,
    shadowMapType: 'pcf-soft',
    fog: false,
    fogColor: 0xffffff,
    fogNear: 1,
    fogFar: 1000,
    clearColor: 0x000000,
    clearAlpha: 1,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    logarithmicDepthBuffer: false
  },
  
  audio: {
    enabled: true,
    masterVolume: 0.8,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    ambientVolume: 0.6,
    sampleRate: 44100,
    spatialAudio: true,
    dopplerFactor: 1.0,
    speedOfSound: 343.3
  },
  
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    gamepad: true,
    mouseSensitivity: 1.0,
    invertMouseY: false,
    gamepadDeadzone: 0.1,
    pointerLock: false
  },
  
  scene: {
    name: 'Main Scene',
    background: 0x000000,
    fog: false,
    ambientLight: 0xffffff,
    ambientLightIntensity: 0.5,
    frustumCulling: true,
    occlusionCulling: false,
    lodBias: 1.0
  },
  
  performance: {
    monitoring: true,
    sampleSize: 60,
    profiling: false,
    memoryTracking: true,
    frameTimeWarning: 16.67,
    memoryWarning: 512
  },
  
  debug: {
    showFPS: false,
    showMemory: false,
    showDrawCalls: false,
    showWireframe: false,
    showBoundingBoxes: false,
    showCollisionShapes: false,
    showNormals: false,
    showGrid: false,
    showAxes: false,
    logging: true,
    logLevel: 'info'
  }
};
