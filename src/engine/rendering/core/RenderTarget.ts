/**
 * Render Target
 * 
 * Manages off-screen rendering targets (framebuffers with textures)
 */

import { RenderTargetConfig, TextureFormat } from '../../../types/rendering/RenderingTypes';
import { RenderContext } from './RenderContext';

/**
 * Render target for off-screen rendering
 */
export class RenderTarget {
  private context: RenderContext;
  private config: RenderTargetConfig;
  private framebuffer: WebGLFramebuffer | null = null;
  private texture: WebGLTexture | null = null;
  private depthBuffer: WebGLRenderbuffer | null = null;
  private stencilBuffer: WebGLRenderbuffer | null = null;
  private width: number;
  private height: number;
  
  /**
   * Create render target
   */
  constructor(context: RenderContext, config: RenderTargetConfig) {
    this.context = context;
    this.config = config;
    this.width = config.width;
    this.height = config.height;
    
    this.initialize();
  }
  
  /**
   * Initialize render target
   */
  private initialize(): void {
    const gl = this.context.getContext();
    if (!gl) {
      throw new Error('WebGL context not available');
    }
    
    // Create framebuffer
    this.framebuffer = gl.createFramebuffer();
    if (!this.framebuffer) {
      throw new Error('Failed to create framebuffer');
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    
    // Create texture
    this.createTexture(gl);
    
    // Create depth buffer if needed
    if (this.config.depthBuffer) {
      this.createDepthBuffer(gl);
    }
    
    // Create stencil buffer if needed
    if (this.config.stencilBuffer) {
      this.createStencilBuffer(gl);
    }
    
    // Check framebuffer status
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer incomplete: ${this.getFramebufferStatusString(gl, status)}`);
    }
    
    // Unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  
  /**
   * Create texture attachment
   */
  private createTexture(gl: WebGL2RenderingContext | WebGLRenderingContext): void {
    this.texture = gl.createTexture();
    if (!this.texture) {
      throw new Error('Failed to create texture');
    }
    
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.getTextureFilter(gl, this.config.minFilter));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.getTextureFilter(gl, this.config.magFilter));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.getTextureWrap(gl, this.config.wrapS));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.getTextureWrap(gl, this.config.wrapT));
    
    // Allocate texture storage
    const format = this.getTextureFormat(gl, this.config.format);
    const internalFormat = this.getInternalFormat(gl, this.config.format);
    const type = this.getTextureType(gl, this.config.format);
    
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      this.width,
      this.height,
      0,
      format,
      type,
      null
    );
    
    // Generate mipmaps if needed
    if (this.config.generateMipmaps) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    
    // Attach to framebuffer
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.texture,
      0
    );
    
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  
  /**
   * Create depth buffer
   */
  private createDepthBuffer(gl: WebGL2RenderingContext | WebGLRenderingContext): void {
    this.depthBuffer = gl.createRenderbuffer();
    if (!this.depthBuffer) {
      throw new Error('Failed to create depth buffer');
    }
    
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
    
    if (this.config.samples > 1 && this.context.isWebGL2Context()) {
      // Multisampled depth buffer (WebGL2 only)
      (gl as WebGL2RenderingContext).renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        this.config.samples,
        gl.DEPTH_COMPONENT16,
        this.width,
        this.height
      );
    } else {
      // Regular depth buffer
      gl.renderbufferStorage(
        gl.RENDERBUFFER,
        gl.DEPTH_COMPONENT16,
        this.width,
        this.height
      );
    }
    
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      this.depthBuffer
    );
    
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }
  
  /**
   * Create stencil buffer
   */
  private createStencilBuffer(gl: WebGL2RenderingContext | WebGLRenderingContext): void {
    this.stencilBuffer = gl.createRenderbuffer();
    if (!this.stencilBuffer) {
      throw new Error('Failed to create stencil buffer');
    }
    
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.stencilBuffer);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.STENCIL_INDEX8,
      this.width,
      this.height
    );
    
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.STENCIL_ATTACHMENT,
      gl.RENDERBUFFER,
      this.stencilBuffer
    );
    
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }
  
  /**
   * Get texture filter constant
   */
  private getTextureFilter(gl: WebGL2RenderingContext | WebGLRenderingContext, filter: string): number {
    const map: Record<string, number> = {
      'nearest': gl.NEAREST,
      'linear': gl.LINEAR,
      'nearest_mipmap_nearest': gl.NEAREST_MIPMAP_NEAREST,
      'linear_mipmap_nearest': gl.LINEAR_MIPMAP_NEAREST,
      'nearest_mipmap_linear': gl.NEAREST_MIPMAP_LINEAR,
      'linear_mipmap_linear': gl.LINEAR_MIPMAP_LINEAR
    };
    return map[filter] || gl.LINEAR;
  }
  
  /**
   * Get texture wrap constant
   */
  private getTextureWrap(gl: WebGL2RenderingContext | WebGLRenderingContext, wrap: string): number {
    const map: Record<string, number> = {
      'repeat': gl.REPEAT,
      'clamp_to_edge': gl.CLAMP_TO_EDGE,
      'mirrored_repeat': gl.MIRRORED_REPEAT
    };
    return map[wrap] || gl.CLAMP_TO_EDGE;
  }
  
  /**
   * Get texture format
   */
  private getTextureFormat(gl: WebGL2RenderingContext | WebGLRenderingContext, format: TextureFormat): number {
    const map: Record<string, number> = {
      'rgb': gl.RGB,
      'rgba': gl.RGBA,
      'depth': gl.DEPTH_COMPONENT,
      'depth_stencil': gl.DEPTH_STENCIL
    };
    return map[format] || gl.RGBA;
  }
  
  /**
   * Get internal format
   */
  private getInternalFormat(gl: WebGL2RenderingContext | WebGLRenderingContext, format: TextureFormat): number {
    if (this.context.isWebGL2Context()) {
      const gl2 = gl as WebGL2RenderingContext;
      const map: Record<string, number> = {
        'rgb': gl2.RGB8,
        'rgba': gl2.RGBA8,
        'depth': gl2.DEPTH_COMPONENT16,
        'depth_stencil': gl2.DEPTH24_STENCIL8
      };
      return map[format] || gl2.RGBA8;
    } else {
      return this.getTextureFormat(gl, format);
    }
  }
  
  /**
   * Get texture type
   */
  private getTextureType(gl: WebGL2RenderingContext | WebGLRenderingContext, format: TextureFormat): number {
    if (format === 'depth_stencil') {
      if (this.context.isWebGL2Context()) {
        return (gl as WebGL2RenderingContext).UNSIGNED_INT_24_8;
      } else {
        // WebGL1 fallback
        const ext = this.context.getExtension('WEBGL_depth_texture');
        return ext ? ext.UNSIGNED_INT_24_8_WEBGL : gl.UNSIGNED_INT;
      }
    }
    
    const map: Record<string, number> = {
      'rgb': gl.UNSIGNED_BYTE,
      'rgba': gl.UNSIGNED_BYTE,
      'depth': gl.UNSIGNED_SHORT
    };
    return map[format] || gl.UNSIGNED_BYTE;
  }
  
  /**
   * Get framebuffer status string
   */
  private getFramebufferStatusString(gl: WebGL2RenderingContext | WebGLRenderingContext, status: number): string {
    const map: Record<number, string> = {
      [gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]: 'INCOMPLETE_ATTACHMENT',
      [gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]: 'INCOMPLETE_MISSING_ATTACHMENT',
      [gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]: 'INCOMPLETE_DIMENSIONS',
      [gl.FRAMEBUFFER_UNSUPPORTED]: 'UNSUPPORTED'
    };
    return map[status] || 'UNKNOWN';
  }
  
  /**
   * Bind render target
   */
  bind(): void {
    const gl = this.context.getContext();
    if (!gl) return;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    this.context.setViewport(0, 0, this.width, this.height);
  }
  
  /**
   * Unbind render target (bind default framebuffer)
   */
  unbind(): void {
    const gl = this.context.getContext();
    if (!gl) return;
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const size = this.context.getSize();
    this.context.setViewport(0, 0, size.width, size.height);
  }
  
  /**
   * Resize render target
   */
  resize(width: number, height: number): void {
    if (this.width === width && this.height === height) {
      return;
    }
    
    this.width = width;
    this.height = height;
    
    // Dispose old resources
    this.dispose();
    
    // Recreate
    this.initialize();
  }
  
  /**
   * Get texture
   */
  getTexture(): WebGLTexture | null {
    return this.texture;
  }
  
  /**
   * Get framebuffer
   */
  getFramebuffer(): WebGLFramebuffer | null {
    return this.framebuffer;
  }
  
  /**
   * Get size
   */
  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
  
  /**
   * Dispose render target
   */
  dispose(): void {
    const gl = this.context.getContext();
    if (!gl) return;
    
    if (this.texture) {
      gl.deleteTexture(this.texture);
      this.texture = null;
    }
    
    if (this.depthBuffer) {
      gl.deleteRenderbuffer(this.depthBuffer);
      this.depthBuffer = null;
    }
    
    if (this.stencilBuffer) {
      gl.deleteRenderbuffer(this.stencilBuffer);
      this.stencilBuffer = null;
    }
    
    if (this.framebuffer) {
      gl.deleteFramebuffer(this.framebuffer);
      this.framebuffer = null;
    }
  }
}
