/**
 * Render Context
 * 
 * WebGL context wrapper and state management
 */

import { RenderConfig } from '../../../types/rendering/RenderingTypes';
import { EventEmitter } from '../../core/EventEmitter';

/**
 * WebGL context wrapper
 */
export class RenderContext extends EventEmitter {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
  private isWebGL2: boolean = false;
  private extensions: Map<string, any> = new Map();
  private state: RenderState;
  
  /**
   * Create render context
   */
  constructor(canvas: HTMLCanvasElement, config: RenderConfig) {
    super();
    
    this.canvas = canvas;
    this.state = new RenderState();
    
    this.initializeContext(config);
  }
  
  /**
   * Initialize WebGL context
   */
  private initializeContext(config: RenderConfig): void {
    const contextAttributes: WebGLContextAttributes = {
      alpha: config.clearColor.a < 1,
      depth: config.depthTest,
      stencil: false,
      antialias: config.antialias,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false
    };
    
    // Try WebGL2 first
    this.gl = this.canvas.getContext('webgl2', contextAttributes) as WebGL2RenderingContext;
    
    if (this.gl) {
      this.isWebGL2 = true;
      console.log('WebGL2 context created');
    } else {
      // Fallback to WebGL1
      this.gl = this.canvas.getContext('webgl', contextAttributes) as WebGLRenderingContext;
      
      if (this.gl) {
        this.isWebGL2 = false;
        console.log('WebGL1 context created');
      } else {
        throw new Error('WebGL not supported');
      }
    }
    
    // Load extensions
    this.loadExtensions();
    
    // Set initial state
    this.applyConfig(config);
    
    // Handle context loss
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost.bind(this), false);
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored.bind(this), false);
  }
  
  /**
   * Load WebGL extensions
   */
  private loadExtensions(): void {
    if (!this.gl) return;
    
    const extensionNames = [
      // WebGL1 extensions
      'OES_texture_float',
      'OES_texture_float_linear',
      'OES_texture_half_float',
      'OES_texture_half_float_linear',
      'OES_standard_derivatives',
      'OES_element_index_uint',
      'OES_vertex_array_object',
      'WEBGL_depth_texture',
      'WEBGL_draw_buffers',
      'ANGLE_instanced_arrays',
      'EXT_blend_minmax',
      'EXT_shader_texture_lod',
      'EXT_texture_filter_anisotropic',
      'WEBGL_lose_context',
      'WEBGL_compressed_texture_s3tc',
      'WEBGL_compressed_texture_etc1',
      'WEBGL_compressed_texture_pvrtc'
    ];
    
    for (const name of extensionNames) {
      const ext = this.gl.getExtension(name);
      if (ext) {
        this.extensions.set(name, ext);
        console.log(`Extension loaded: ${name}`);
      }
    }
  }
  
  /**
   * Apply configuration
   */
  private applyConfig(config: RenderConfig): void {
    if (!this.gl) return;
    
    // Set clear color
    this.gl.clearColor(
      config.clearColor.r,
      config.clearColor.g,
      config.clearColor.b,
      config.clearColor.a
    );
    
    // Depth test
    if (config.depthTest) {
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.depthFunc(this.getDepthFunc(config.depthFunc));
      this.gl.depthMask(config.depthWrite);
    } else {
      this.gl.disable(this.gl.DEPTH_TEST);
    }
    
    // Blending
    if (config.blending) {
      this.gl.enable(this.gl.BLEND);
      this.setBlendMode(config.blendMode);
    } else {
      this.gl.disable(this.gl.BLEND);
    }
    
    // Face culling
    if (config.culling) {
      this.gl.enable(this.gl.CULL_FACE);
      this.gl.cullFace(this.getCullFace(config.cullFace));
    } else {
      this.gl.disable(this.gl.CULL_FACE);
    }
    
    // Set viewport
    this.setViewport(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Get WebGL depth function
   */
  private getDepthFunc(func: string): number {
    if (!this.gl) return 0;
    
    const map: Record<string, number> = {
      'never': this.gl.NEVER,
      'less': this.gl.LESS,
      'equal': this.gl.EQUAL,
      'lequal': this.gl.LEQUAL,
      'greater': this.gl.GREATER,
      'notequal': this.gl.NOTEQUAL,
      'gequal': this.gl.GEQUAL,
      'always': this.gl.ALWAYS
    };
    
    return map[func] || this.gl.LEQUAL;
  }
  
  /**
   * Get WebGL cull face
   */
  private getCullFace(face: string): number {
    if (!this.gl) return 0;
    
    const map: Record<string, number> = {
      'front': this.gl.FRONT,
      'back': this.gl.BACK,
      'front_and_back': this.gl.FRONT_AND_BACK
    };
    
    return map[face] || this.gl.BACK;
  }
  
  /**
   * Set blend mode
   */
  private setBlendMode(mode: string): void {
    if (!this.gl) return;
    
    switch (mode) {
      case 'normal':
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        break;
      case 'additive':
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
        break;
      case 'multiply':
        this.gl.blendFunc(this.gl.DST_COLOR, this.gl.ZERO);
        break;
      case 'screen':
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_COLOR);
        break;
      default:
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }
  }
  
  /**
   * Set viewport
   */
  setViewport(x: number, y: number, width: number, height: number): void {
    if (!this.gl) return;
    
    if (this.state.viewport.x !== x ||
        this.state.viewport.y !== y ||
        this.state.viewport.width !== width ||
        this.state.viewport.height !== height) {
      
      this.gl.viewport(x, y, width, height);
      this.state.viewport = { x, y, width, height };
    }
  }
  
  /**
   * Set scissor test
   */
  setScissor(x: number, y: number, width: number, height: number): void {
    if (!this.gl) return;
    
    this.gl.enable(this.gl.SCISSOR_TEST);
    this.gl.scissor(x, y, width, height);
    this.state.scissor = { x, y, width, height };
  }
  
  /**
   * Disable scissor test
   */
  disableScissor(): void {
    if (!this.gl) return;
    
    this.gl.disable(this.gl.SCISSOR_TEST);
    this.state.scissor = null;
  }
  
  /**
   * Clear buffers
   */
  clear(color: boolean = true, depth: boolean = true, stencil: boolean = false): void {
    if (!this.gl) return;
    
    let mask = 0;
    if (color) mask |= this.gl.COLOR_BUFFER_BIT;
    if (depth) mask |= this.gl.DEPTH_BUFFER_BIT;
    if (stencil) mask |= this.gl.STENCIL_BUFFER_BIT;
    
    this.gl.clear(mask);
  }
  
  /**
   * Resize canvas
   */
  resize(width: number, height: number, pixelRatio: number = 1): void {
    const displayWidth = Math.floor(width * pixelRatio);
    const displayHeight = Math.floor(height * pixelRatio);
    
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      
      this.setViewport(0, 0, displayWidth, displayHeight);
      
      this.emit('resize', { width: displayWidth, height: displayHeight });
    }
  }
  
  /**
   * Handle context lost
   */
  private handleContextLost(event: Event): void {
    event.preventDefault();
    console.warn('WebGL context lost');
    this.emit('contextlost');
  }
  
  /**
   * Handle context restored
   */
  private handleContextRestored(): void {
    console.log('WebGL context restored');
    this.emit('contextrestored');
  }
  
  /**
   * Get WebGL context
   */
  getContext(): WebGL2RenderingContext | WebGLRenderingContext | null {
    return this.gl;
  }
  
  /**
   * Check if WebGL2
   */
  isWebGL2Context(): boolean {
    return this.isWebGL2;
  }
  
  /**
   * Get extension
   */
  getExtension(name: string): any {
    return this.extensions.get(name);
  }
  
  /**
   * Check if extension is supported
   */
  hasExtension(name: string): boolean {
    return this.extensions.has(name);
  }
  
  /**
   * Get canvas
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  /**
   * Get canvas size
   */
  getSize(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }
  
  /**
   * Get current state
   */
  getState(): RenderState {
    return this.state;
  }
  
  /**
   * Dispose context
   */
  dispose(): void {
    if (this.gl) {
      const loseContext = this.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
    }
    
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost.bind(this));
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored.bind(this));
    
    this.removeAllListeners();
  }
}

/**
 * Render state
 */
class RenderState {
  viewport: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };
  scissor: { x: number; y: number; width: number; height: number } | null = null;
  currentProgram: WebGLProgram | null = null;
  currentFramebuffer: WebGLFramebuffer | null = null;
  currentTexture: WebGLTexture | null = null;
  currentVertexArray: WebGLVertexArrayObject | null = null;
}
