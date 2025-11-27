import * as THREE from 'three';

/**
 * Camera Projection Configuration
 */
export interface CameraProjectionConfig {
  camera: THREE.Camera;
  target: THREE.Object3D;
  textureSize?: number;
  updateRate?: number; // Hz
}

/**
 * UV Projection Mapping
 * Projects textures onto geometry using camera projection
 */
export class UVProjectionMapper {
  private projectionMatrix: THREE.Matrix4;
  private viewMatrix: THREE.Matrix4;
  private textureMatrix: THREE.Matrix4;
  
  constructor() {
    this.projectionMatrix = new THREE.Matrix4();
    this.viewMatrix = new THREE.Matrix4();
    this.textureMatrix = new THREE.Matrix4();
  }
  
  /**
   * Calculate projection matrix for camera
   */
  calculateProjectionMatrix(camera: THREE.Camera): THREE.Matrix4 {
    this.projectionMatrix.copy(camera.projectionMatrix);
    this.viewMatrix.copy(camera.matrixWorldInverse);
    
    // Combine projection and view matrices
    this.textureMatrix.copy(this.projectionMatrix);
    this.textureMatrix.multiply(this.viewMatrix);
    
    return this.textureMatrix;
  }
  
  /**
   * Project UV coordinates onto mesh
   */
  projectUVs(
    mesh: THREE.Mesh,
    camera: THREE.Camera,
    texture: THREE.Texture
  ): void {
    const geometry = mesh.geometry;
    
    if (!geometry.attributes.position) return;
    
    const positions = geometry.attributes.position;
    const uvs = new Float32Array(positions.count * 2);
    
    // Calculate projection matrix
    const projMatrix = this.calculateProjectionMatrix(camera);
    
    // Project each vertex
    const vertex = new THREE.Vector3();
    const projected = new THREE.Vector4();
    
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Transform to world space
      vertex.applyMatrix4(mesh.matrixWorld);
      
      // Project to camera space
      projected.set(vertex.x, vertex.y, vertex.z, 1.0);
      projected.applyMatrix4(projMatrix);
      
      // Perspective divide
      if (projected.w !== 0) {
        projected.x /= projected.w;
        projected.y /= projected.w;
      }
      
      // Convert to UV coordinates (0-1 range)
      uvs[i * 2] = (projected.x + 1) / 2;
      uvs[i * 2 + 1] = (projected.y + 1) / 2;
    }
    
    // Update geometry UVs
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.attributes.uv.needsUpdate = true;
  }
  
  /**
   * Create projection material with custom shader
   */
  createProjectionMaterial(
    texture: THREE.Texture,
    camera: THREE.Camera
  ): THREE.ShaderMaterial {
    const projMatrix = this.calculateProjectionMatrix(camera);
    
    return new THREE.ShaderMaterial({
      uniforms: {
        projectionMap: { value: texture },
        projectionMatrix: { value: projMatrix },
        opacity: { value: 1.0 }
      },
      vertexShader: `
        uniform mat4 projectionMatrix;
        varying vec4 vProjectedCoord;
        varying vec3 vNormal;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vProjectedCoord = projectionMatrix * worldPosition;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D projectionMap;
        uniform float opacity;
        varying vec4 vProjectedCoord;
        varying vec3 vNormal;
        
        void main() {
          // Perspective divide
          vec3 projected = vProjectedCoord.xyz / vProjectedCoord.w;
          
          // Convert to UV coordinates
          vec2 uv = projected.xy * 0.5 + 0.5;
          
          // Sample texture
          vec4 texColor = texture2D(projectionMap, uv);
          
          // Apply opacity
          texColor.a *= opacity;
          
          // Fade based on viewing angle
          float facing = dot(vNormal, vec3(0.0, 0.0, 1.0));
          texColor.a *= smoothstep(0.0, 0.3, facing);
          
          gl_FragColor = texColor;
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }
}

/**
 * Camera Projection System
 * Handles advanced camera projection, render targets, and texture projection
 */
export class CameraProjectionSystem {
  private renderTargets: Map<string, THREE.WebGLRenderTarget>;
  private projectionMappers: Map<string, UVProjectionMapper>;
  private cameras: Map<string, THREE.Camera>;
  
  constructor() {
    this.renderTargets = new Map();
    this.projectionMappers = new Map();
    this.cameras = new Map();
  }
  
  /**
   * Create render target for camera
   */
  createRenderTarget(
    name: string,
    width: number = 1024,
    height: number = 1024,
    options?: THREE.RenderTargetOptions
  ): THREE.WebGLRenderTarget {
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      ...options
    });
    
    this.renderTargets.set(name, renderTarget);
    return renderTarget;
  }
  
  /**
   * Get render target
   */
  getRenderTarget(name: string): THREE.WebGLRenderTarget | undefined {
    return this.renderTargets.get(name);
  }
  
  /**
   * Register camera for projection
   */
  registerCamera(name: string, camera: THREE.Camera): void {
    this.cameras.set(name, camera);
    this.projectionMappers.set(name, new UVProjectionMapper());
  }
  
  /**
   * Get projection mapper for camera
   */
  getProjectionMapper(name: string): UVProjectionMapper | undefined {
    return this.projectionMappers.get(name);
  }
  
  /**
   * Render scene to texture from camera perspective
   */
  renderToTexture(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderTarget: THREE.WebGLRenderTarget
  ): THREE.Texture {
    // Store current render target
    const currentRenderTarget = renderer.getRenderTarget();
    
    // Render to our target
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    
    // Restore previous render target
    renderer.setRenderTarget(currentRenderTarget);
    
    return renderTarget.texture;
  }
  
  /**
   * Create projection camera for specific view
   */
  createProjectionCamera(
    fov: number = 75,
    aspect: number = 1,
    near: number = 0.1,
    far: number = 1000
  ): THREE.PerspectiveCamera {
    return new THREE.PerspectiveCamera(fov, aspect, near, far);
  }
  
  /**
   * Project texture onto mesh using camera
   */
  projectTextureOntoMesh(
    mesh: THREE.Mesh,
    texture: THREE.Texture,
    camera: THREE.Camera,
    mapperName: string = 'default'
  ): void {
    let mapper = this.projectionMappers.get(mapperName);
    
    if (!mapper) {
      mapper = new UVProjectionMapper();
      this.projectionMappers.set(mapperName, mapper);
    }
    
    mapper.projectUVs(mesh, camera, texture);
  }
  
  /**
   * Create decal projection (for cockpit details, damage, etc.)
   */
  createDecalProjection(
    position: THREE.Vector3,
    rotation: THREE.Euler,
    scale: THREE.Vector3,
    texture: THREE.Texture
  ): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    
    const decal = new THREE.Mesh(geometry, material);
    decal.position.copy(position);
    decal.rotation.copy(rotation);
    decal.scale.copy(scale);
    
    return decal;
  }
  
  /**
   * Create environment map from position
   */
  createEnvironmentMap(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    position: THREE.Vector3,
    size: number = 512
  ): THREE.CubeTexture {
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, new THREE.WebGLCubeRenderTarget(size));
    cubeCamera.position.copy(position);
    cubeCamera.update(renderer, scene);
    
    return cubeCamera.renderTarget.texture as THREE.CubeTexture;
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this.renderTargets.forEach(rt => rt.dispose());
    this.renderTargets.clear();
    this.projectionMappers.clear();
    this.cameras.clear();
  }
}

// Singleton instance
export const cameraProjectionSystem = new CameraProjectionSystem();
