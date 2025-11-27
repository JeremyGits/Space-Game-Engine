/**
 * Rendering System Type Definitions
 * 
 * Core types for the rendering engine
 */

import { Vector3 } from '../../utils/math/Vector3';
import { Matrix4 } from '../../utils/math/Matrix4';

/**
 * Render modes
 */
export enum RenderMode {
  FORWARD = 'forward',
  DEFERRED = 'deferred',
  FORWARD_PLUS = 'forward_plus'
}

/**
 * Render quality presets
 */
export enum RenderQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

/**
 * Primitive types
 */
export enum PrimitiveType {
  POINTS = 'points',
  LINES = 'lines',
  LINE_STRIP = 'line_strip',
  LINE_LOOP = 'line_loop',
  TRIANGLES = 'triangles',
  TRIANGLE_STRIP = 'triangle_strip',
  TRIANGLE_FAN = 'triangle_fan'
}

/**
 * Blend modes
 */
export enum BlendMode {
  NONE = 'none',
  NORMAL = 'normal',
  ADDITIVE = 'additive',
  MULTIPLY = 'multiply',
  SCREEN = 'screen'
}

/**
 * Depth test functions
 */
export enum DepthFunc {
  NEVER = 'never',
  LESS = 'less',
  EQUAL = 'equal',
  LEQUAL = 'lequal',
  GREATER = 'greater',
  NOTEQUAL = 'notequal',
  GEQUAL = 'gequal',
  ALWAYS = 'always'
}

/**
 * Cull face modes
 */
export enum CullFace {
  NONE = 'none',
  FRONT = 'front',
  BACK = 'back',
  FRONT_AND_BACK = 'front_and_back'
}

/**
 * Texture formats
 */
export enum TextureFormat {
  RGB = 'rgb',
  RGBA = 'rgba',
  DEPTH = 'depth',
  DEPTH_STENCIL = 'depth_stencil'
}

/**
 * Texture filtering
 */
export enum TextureFilter {
  NEAREST = 'nearest',
  LINEAR = 'linear',
  NEAREST_MIPMAP_NEAREST = 'nearest_mipmap_nearest',
  LINEAR_MIPMAP_NEAREST = 'linear_mipmap_nearest',
  NEAREST_MIPMAP_LINEAR = 'nearest_mipmap_linear',
  LINEAR_MIPMAP_LINEAR = 'linear_mipmap_linear'
}

/**
 * Texture wrapping
 */
export enum TextureWrap {
  REPEAT = 'repeat',
  CLAMP_TO_EDGE = 'clamp_to_edge',
  MIRRORED_REPEAT = 'mirrored_repeat'
}

/**
 * Render pass types
 */
export enum RenderPassType {
  SHADOW = 'shadow',
  DEPTH_PREPASS = 'depth_prepass',
  GEOMETRY = 'geometry',
  LIGHTING = 'lighting',
  TRANSPARENT = 'transparent',
  POST_PROCESS = 'post_process',
  UI = 'ui'
}

/**
 * Rendering configuration
 */
export interface RenderConfig {
  /** Canvas element or selector */
  canvas?: HTMLCanvasElement | string;
  
  /** Render mode */
  mode: RenderMode;
  
  /** Quality preset */
  quality: RenderQuality;
  
  /** Enable anti-aliasing */
  antialias: boolean;
  
  /** Enable shadows */
  shadows: boolean;
  
  /** Shadow map size */
  shadowMapSize: number;
  
  /** Enable post-processing */
  postProcessing: boolean;
  
  /** Enable HDR */
  hdr: boolean;
  
  /** Enable bloom */
  bloom: boolean;
  
  /** Pixel ratio */
  pixelRatio: number;
  
  /** Max lights */
  maxLights: number;
  
  /** Enable frustum culling */
  frustumCulling: boolean;
  
  /** Enable occlusion culling */
  occlusionCulling: boolean;
  
  /** Enable LOD */
  lod: boolean;
  
  /** Clear color */
  clearColor: { r: number; g: number; b: number; a: number };
  
  /** Enable depth test */
  depthTest: boolean;
  
  /** Enable depth write */
  depthWrite: boolean;
  
  /** Depth function */
  depthFunc: DepthFunc;
  
  /** Enable blending */
  blending: boolean;
  
  /** Blend mode */
  blendMode: BlendMode;
  
  /** Enable face culling */
  culling: boolean;
  
  /** Cull face */
  cullFace: CullFace;
}

/**
 * Render statistics
 */
export interface RenderStats {
  /** Frame number */
  frame: number;
  
  /** Draw calls */
  drawCalls: number;
  
  /** Triangles rendered */
  triangles: number;
  
  /** Points rendered */
  points: number;
  
  /** Lines rendered */
  lines: number;
  
  /** Textures used */
  textures: number;
  
  /** Shaders used */
  shaders: number;
  
  /** Render targets used */
  renderTargets: number;
  
  /** Memory used (bytes) */
  memory: number;
  
  /** Render time (ms) */
  renderTime: number;
  
  /** GPU time (ms) */
  gpuTime: number;
}

/**
 * Viewport configuration
 */
export interface Viewport {
  /** X position */
  x: number;
  
  /** Y position */
  y: number;
  
  /** Width */
  width: number;
  
  /** Height */
  height: number;
}

/**
 * Scissor test configuration
 */
export interface ScissorRect {
  /** X position */
  x: number;
  
  /** Y position */
  y: number;
  
  /** Width */
  width: number;
  
  /** Height */
  height: number;
}

/**
 * Render target configuration
 */
export interface RenderTargetConfig {
  /** Width */
  width: number;
  
  /** Height */
  height: number;
  
  /** Texture format */
  format: TextureFormat;
  
  /** Min filter */
  minFilter: TextureFilter;
  
  /** Mag filter */
  magFilter: TextureFilter;
  
  /** Wrap S */
  wrapS: TextureWrap;
  
  /** Wrap T */
  wrapT: TextureWrap;
  
  /** Generate mipmaps */
  generateMipmaps: boolean;
  
  /** Enable depth buffer */
  depthBuffer: boolean;
  
  /** Enable stencil buffer */
  stencilBuffer: boolean;
  
  /** Samples (for MSAA) */
  samples: number;
}

/**
 * Material properties
 */
export interface MaterialProperties {
  /** Diffuse color */
  color?: { r: number; g: number; b: number };
  
  /** Emissive color */
  emissive?: { r: number; g: number; b: number };
  
  /** Specular color */
  specular?: { r: number; g: number; b: number };
  
  /** Shininess */
  shininess?: number;
  
  /** Opacity */
  opacity?: number;
  
  /** Metalness */
  metalness?: number;
  
  /** Roughness */
  roughness?: number;
  
  /** Textures */
  textures?: {
    diffuse?: any;
    normal?: any;
    specular?: any;
    emissive?: any;
    roughness?: any;
    metalness?: any;
    ao?: any;
  };
}

/**
 * Light properties
 */
export interface LightProperties {
  /** Light type */
  type: 'ambient' | 'directional' | 'point' | 'spot';
  
  /** Color */
  color: { r: number; g: number; b: number };
  
  /** Intensity */
  intensity: number;
  
  /** Position (for point/spot) */
  position?: Vector3;
  
  /** Direction (for directional/spot) */
  direction?: Vector3;
  
  /** Distance (for point/spot) */
  distance?: number;
  
  /** Decay (for point/spot) */
  decay?: number;
  
  /** Angle (for spot) */
  angle?: number;
  
  /** Penumbra (for spot) */
  penumbra?: number;
  
  /** Cast shadows */
  castShadow?: boolean;
  
  /** Shadow bias */
  shadowBias?: number;
  
  /** Shadow map size */
  shadowMapSize?: number;
}

/**
 * Camera properties
 */
export interface CameraProperties {
  /** Camera type */
  type: 'perspective' | 'orthographic';
  
  /** Position */
  position: Vector3;
  
  /** Target/look-at point */
  target: Vector3;
  
  /** Up vector */
  up: Vector3;
  
  /** Field of view (perspective) */
  fov?: number;
  
  /** Aspect ratio */
  aspect: number;
  
  /** Near clipping plane */
  near: number;
  
  /** Far clipping plane */
  far: number;
  
  /** Left (orthographic) */
  left?: number;
  
  /** Right (orthographic) */
  right?: number;
  
  /** Top (orthographic) */
  top?: number;
  
  /** Bottom (orthographic) */
  bottom?: number;
  
  /** View matrix */
  viewMatrix?: Matrix4;
  
  /** Projection matrix */
  projectionMatrix?: Matrix4;
  
  /** View-projection matrix */
  viewProjectionMatrix?: Matrix4;
}

/**
 * Renderable object
 */
export interface Renderable {
  /** Unique ID */
  id: string;
  
  /** Geometry */
  geometry: any;
  
  /** Material */
  material: MaterialProperties;
  
  /** Transform matrix */
  transform: Matrix4;
  
  /** Visible */
  visible: boolean;
  
  /** Cast shadows */
  castShadow: boolean;
  
  /** Receive shadows */
  receiveShadow: boolean;
  
  /** Render order */
  renderOrder: number;
  
  /** Frustum culled */
  frustumCulled: boolean;
  
  /** Distance to camera (for sorting) */
  distanceToCamera?: number;
}

/**
 * Render queue item
 */
export interface RenderQueueItem {
  /** Renderable object */
  renderable: Renderable;
  
  /** Distance to camera */
  distance: number;
  
  /** Material ID (for batching) */
  materialId: string;
  
  /** Geometry ID (for batching) */
  geometryId: string;
}

/**
 * Render pass configuration
 */
export interface RenderPassConfig {
  /** Pass name */
  name: string;
  
  /** Pass type */
  type: RenderPassType;
  
  /** Enabled */
  enabled: boolean;
  
  /** Clear color */
  clearColor?: boolean;
  
  /** Clear depth */
  clearDepth?: boolean;
  
  /** Clear stencil */
  clearStencil?: boolean;
  
  /** Render target */
  renderTarget?: any;
  
  /** Viewport */
  viewport?: Viewport;
  
  /** Scissor test */
  scissor?: ScissorRect;
  
  /** Depth test */
  depthTest?: boolean;
  
  /** Depth write */
  depthWrite?: boolean;
  
  /** Blending */
  blending?: boolean;
  
  /** Cull face */
  cullFace?: CullFace;
}

/**
 * Shader uniform
 */
export interface ShaderUniform {
  /** Uniform type */
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'sampler2D' | 'samplerCube';
  
  /** Uniform value */
  value: any;
}

/**
 * Shader program
 */
export interface ShaderProgram {
  /** Program ID */
  id: string;
  
  /** Vertex shader source */
  vertexShader: string;
  
  /** Fragment shader source */
  fragmentShader: string;
  
  /** Uniforms */
  uniforms: Record<string, ShaderUniform>;
  
  /** Attributes */
  attributes: Record<string, number>;
  
  /** WebGL program */
  program?: WebGLProgram;
}
