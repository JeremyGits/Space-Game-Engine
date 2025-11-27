/**
 * Shadow Map
 * 
 * Manages shadow map rendering for a light
 */

import { RenderTarget } from '../../core/RenderTarget';
import { RenderContext } from '../../core/RenderContext';
import { Light } from '../Light';
import { Matrix4 } from '../../../../utils/math/Matrix4';
import { TextureFormat, TextureFilter, TextureWrap } from '../../../../types/rendering/RenderingTypes';

/**
 * Shadow map configuration
 */
export interface ShadowMapConfig {
  size?: number;
  bias?: number;
  radius?: number;
  near?: number;
  far?: number;
}

/**
 * Shadow map class
 */
export class ShadowMap {
  public light: Light;
  public renderTarget: RenderTarget | null = null;
  
  // Configuration
  public size: number;
  public bias: number;
  public radius: number;
  public near: number;
  public far: number;
  
  // Shadow matrix
  public matrix: Matrix4;
  
  // State
  public needsUpdate: boolean = true;
  
  /**
   * Create shadow map
   */
  constructor(light: Light, config: ShadowMapConfig = {}) {
    this.light = light;
    
    this.size = config.size || light.shadowMapSize || 1024;
    this.bias = config.bias !== undefined ? config.bias : light.shadowBias;
    this.radius = config.radius !== undefined ? config.radius : light.shadowRadius;
    this.near = config.near !== undefined ? config.near : 0.1;
    this.far = config.far !== undefined ? config.far : 100;
    
    this.matrix = new Matrix4();
  }
  
  /**
   * Initialize render target
   */
  initialize(context: RenderContext): void {
    if (this.renderTarget) {
      return;
    }
    
    // Create depth render target for shadow map
    this.renderTarget = new RenderTarget(context, {
      width: this.size,
      height: this.size,
      format: TextureFormat.DEPTH,
      minFilter: TextureFilter.NEAREST,
      magFilter: TextureFilter.NEAREST,
      wrapS: TextureWrap.CLAMP_TO_EDGE,
      wrapT: TextureWrap.CLAMP_TO_EDGE,
      generateMipmaps: false,
      samples: 1,
      depthBuffer: true,
      stencilBuffer: false
    });
    
    this.needsUpdate = true;
  }
  
  /**
   * Update shadow matrix
   */
  updateMatrix(): void {
    // Shadow matrix will be updated by specific light types
    this.needsUpdate = false;
  }
  
  /**
   * Resize shadow map
   */
  resize(size: number): void {
    if (this.size === size) {
      return;
    }
    
    this.size = size;
    
    if (this.renderTarget) {
      this.renderTarget.resize(size, size);
    }
    
    this.needsUpdate = true;
  }
  
  /**
   * Dispose shadow map
   */
  dispose(): void {
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }
  }
}
