/**
 * Post-Processing Types
 * Defines types for AAA-quality post-processing effects
 */

import { BlendFunction } from 'postprocessing';

/**
 * Bloom effect configuration
 */
export interface BloomConfig {
  intensity: number;
  luminanceThreshold: number;
  luminanceSmoothing: number;
  mipmapBlur: boolean;
  radius: number;
}

/**
 * SSAO (Screen Space Ambient Occlusion) configuration
 */
export interface SSAOConfig {
  radius: number;
  intensity: number;
  bias: number;
  samples: number;
  rings: number;
  distanceThreshold: number;
  rangeFalloff: number;
  luminanceInfluence: number;
  color: string;
}

/**
 * SSR (Screen Space Reflections) configuration
 */
export interface SSRConfig {
  intensity: number;
  exponent: number;
  distance: number;
  fade: number;
  roughnessFade: number;
  thickness: number;
  ior: number;
  maxRoughness: number;
  maxDepthDifference: number;
  blend: number;
  correction: number;
  correctionRadius: number;
  blur: number;
  blurKernel: number;
  blurSharpness: number;
  jitter: number;
  jitterRoughness: number;
  steps: number;
  refineSteps: number;
  missedRays: boolean;
}

/**
 * Tone mapping modes
 */
export enum ToneMappingMode {
  LINEAR = 0,
  REINHARD = 1,
  CINEON = 2,
  ACES_FILMIC = 3,
  AGX = 4,
  NEUTRAL = 5
}

/**
 * Tone mapping configuration
 */
export interface ToneMappingConfig {
  mode: ToneMappingMode;
  exposure: number;
  whitePoint: number;
  adaptive: boolean;
  adaptationRate: number;
  averageLuminance: number;
  middleGrey: number;
}

/**
 * Color grading configuration
 */
export interface ColorGradingConfig {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  temperature: number;
  tint: number;
  shadows: {
    r: number;
    g: number;
    b: number;
  };
  midtones: {
    r: number;
    g: number;
    b: number;
  };
  highlights: {
    r: number;
    g: number;
    b: number;
  };
}

/**
 * Chromatic aberration configuration
 */
export interface ChromaticAberrationConfig {
  offset: [number, number];
  radialModulation: boolean;
  modulationOffset: number;
}

/**
 * Film grain configuration
 */
export interface FilmGrainConfig {
  intensity: number;
  size: number;
  luminanceThreshold: number;
}

/**
 * Vignette configuration
 */
export interface VignetteConfig {
  darkness: number;
  offset: number;
  eskil: boolean;
}

/**
 * Anti-aliasing modes
 */
export enum AntiAliasingMode {
  NONE = 'none',
  FXAA = 'fxaa',
  SMAA = 'smaa',
  TAA = 'taa'
}

/**
 * FXAA configuration
 */
export interface FXAAConfig {
  edgeThreshold: number;
  edgeThresholdMin: number;
  searchSteps: number;
  searchThreshold: number;
  subpixelQuality: number;
}

/**
 * SMAA configuration
 */
export interface SMAAConfig {
  preset: 'low' | 'medium' | 'high' | 'ultra';
  edgeDetectionThreshold: number;
  maxSearchSteps: number;
}

/**
 * TAA (Temporal Anti-Aliasing) configuration
 */
export interface TAAConfig {
  samples: number;
  jitterScale: number;
  mipBias: number;
  feedback: number;
}

/**
 * Complete post-processing configuration
 */
export interface PostProcessingConfig {
  enabled: boolean;
  bloom?: BloomConfig;
  ssao?: SSAOConfig;
  ssr?: SSRConfig;
  toneMapping?: ToneMappingConfig;
  colorGrading?: ColorGradingConfig;
  chromaticAberration?: ChromaticAberrationConfig;
  filmGrain?: FilmGrainConfig;
  vignette?: VignetteConfig;
  antiAliasing?: {
    mode: AntiAliasingMode;
    fxaa?: FXAAConfig;
    smaa?: SMAAConfig;
    taa?: TAAConfig;
  };
}

/**
 * Post-processing preset configurations
 */
export enum PostProcessingPreset {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
  CINEMATIC = 'cinematic'
}

/**
 * Post-processing quality settings
 */
export interface PostProcessingQuality {
  preset: PostProcessingPreset;
  renderScale: number;
  shadowQuality: 'low' | 'medium' | 'high' | 'ultra';
  effectQuality: 'low' | 'medium' | 'high' | 'ultra';
}
