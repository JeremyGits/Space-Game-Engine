/**
 * Render Configuration
 * 
 * Default rendering configuration and presets
 */

import {
  RenderConfig,
  RenderMode,
  RenderQuality,
  DepthFunc,
  BlendMode,
  CullFace
} from '../../types/rendering/RenderingTypes';

/**
 * Default render configuration
 */
export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  mode: RenderMode.FORWARD,
  quality: RenderQuality.HIGH,
  antialias: true,
  shadows: true,
  shadowMapSize: 2048,
  postProcessing: true,
  hdr: true,
  bloom: true,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  maxLights: 8,
  frustumCulling: true,
  occlusionCulling: false,
  lod: true,
  clearColor: { r: 0, g: 0, b: 0, a: 1 },
  depthTest: true,
  depthWrite: true,
  depthFunc: DepthFunc.LEQUAL,
  blending: false,
  blendMode: BlendMode.NORMAL,
  culling: true,
  cullFace: CullFace.BACK
};

/**
 * Quality presets
 */
export const QUALITY_PRESETS: Record<RenderQuality, Partial<RenderConfig>> = {
  [RenderQuality.LOW]: {
    quality: RenderQuality.LOW,
    antialias: false,
    shadows: false,
    shadowMapSize: 512,
    postProcessing: false,
    hdr: false,
    bloom: false,
    pixelRatio: 1,
    maxLights: 4,
    frustumCulling: true,
    occlusionCulling: false,
    lod: true
  },
  
  [RenderQuality.MEDIUM]: {
    quality: RenderQuality.MEDIUM,
    antialias: true,
    shadows: true,
    shadowMapSize: 1024,
    postProcessing: true,
    hdr: false,
    bloom: false,
    pixelRatio: 1,
    maxLights: 6,
    frustumCulling: true,
    occlusionCulling: false,
    lod: true
  },
  
  [RenderQuality.HIGH]: {
    quality: RenderQuality.HIGH,
    antialias: true,
    shadows: true,
    shadowMapSize: 2048,
    postProcessing: true,
    hdr: true,
    bloom: true,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    maxLights: 8,
    frustumCulling: true,
    occlusionCulling: false,
    lod: true
  },
  
  [RenderQuality.ULTRA]: {
    quality: RenderQuality.ULTRA,
    antialias: true,
    shadows: true,
    shadowMapSize: 4096,
    postProcessing: true,
    hdr: true,
    bloom: true,
    pixelRatio: window.devicePixelRatio,
    maxLights: 16,
    frustumCulling: true,
    occlusionCulling: true,
    lod: true
  }
};

/**
 * Get quality preset
 */
export function getQualityPreset(quality: RenderQuality): Partial<RenderConfig> {
  return QUALITY_PRESETS[quality];
}

/**
 * Merge configurations
 */
export function mergeRenderConfig(
  base: RenderConfig,
  override: Partial<RenderConfig>
): RenderConfig {
  return { ...base, ...override };
}

/**
 * Create render configuration
 */
export function createRenderConfig(
  quality: RenderQuality = RenderQuality.HIGH,
  overrides: Partial<RenderConfig> = {}
): RenderConfig {
  const preset = getQualityPreset(quality);
  return mergeRenderConfig(
    mergeRenderConfig(DEFAULT_RENDER_CONFIG, preset),
    overrides
  );
}

/**
 * Validate render configuration
 */
export function validateRenderConfig(config: RenderConfig): boolean {
  // Validate shadow map size is power of 2
  if (config.shadows && !isPowerOfTwo(config.shadowMapSize)) {
    console.warn('Shadow map size should be power of 2');
    return false;
  }
  
  // Validate pixel ratio
  if (config.pixelRatio <= 0) {
    console.warn('Pixel ratio must be positive');
    return false;
  }
  
  // Validate max lights
  if (config.maxLights < 1) {
    console.warn('Max lights must be at least 1');
    return false;
  }
  
  return true;
}

/**
 * Check if number is power of 2
 */
function isPowerOfTwo(value: number): boolean {
  return (value & (value - 1)) === 0 && value !== 0;
}

/**
 * Auto-detect optimal quality based on device capabilities
 */
export function autoDetectQuality(): RenderQuality {
  // Check for mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  if (isMobile) {
    return RenderQuality.MEDIUM;
  }
  
  // Check WebGL capabilities
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) {
    return RenderQuality.LOW;
  }
  
  // Check max texture size
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  
  if (maxTextureSize >= 8192) {
    return RenderQuality.ULTRA;
  } else if (maxTextureSize >= 4096) {
    return RenderQuality.HIGH;
  } else if (maxTextureSize >= 2048) {
    return RenderQuality.MEDIUM;
  } else {
    return RenderQuality.LOW;
  }
}
