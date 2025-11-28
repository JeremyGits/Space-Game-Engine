/**
 * 🎨 AAA POST-PROCESSING EFFECTS SYSTEM
 * 
 * Complete suite of professional-grade post-processing effects
 */

import { EffectComposer, Bloom, SSAO, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import * as THREE from 'three';

export interface PostProcessingProps {
  preset?: 'low' | 'medium' | 'high' | 'ultra' | 'cinematic';
  bloomIntensity?: number;
  ssaoIntensity?: number;
  vignetteStrength?: number;
  grainIntensity?: number;
}

const PRESETS = {
  low: {
    bloom: { intensity: 0.3, luminanceThreshold: 0.95, luminanceSmoothing: 0.8, kernelSize: KernelSize.SMALL },
    ssao: { intensity: 0.5, radius: 0.3, samples: 8 },
    chromatic: { offset: [0.0005, 0.0005] as [number, number] },
    vignette: { darkness: 0.3, offset: 0.3 },
    grain: { opacity: 0.02 }
  },
  medium: {
    bloom: { intensity: 0.5, luminanceThreshold: 0.9, luminanceSmoothing: 0.85, kernelSize: KernelSize.MEDIUM },
    ssao: { intensity: 0.8, radius: 0.4, samples: 16 },
    chromatic: { offset: [0.001, 0.001] as [number, number] },
    vignette: { darkness: 0.4, offset: 0.35 },
    grain: { opacity: 0.03 }
  },
  high: {
    bloom: { intensity: 0.7, luminanceThreshold: 0.85, luminanceSmoothing: 0.9, kernelSize: KernelSize.LARGE },
    ssao: { intensity: 1.0, radius: 0.5, samples: 32 },
    chromatic: { offset: [0.0015, 0.0015] as [number, number] },
    vignette: { darkness: 0.45, offset: 0.4 },
    grain: { opacity: 0.04 }
  },
  ultra: {
    bloom: { intensity: 0.9, luminanceThreshold: 0.8, luminanceSmoothing: 0.95, kernelSize: KernelSize.VERY_LARGE },
    ssao: { intensity: 1.2, radius: 0.6, samples: 64 },
    chromatic: { offset: [0.002, 0.002] as [number, number] },
    vignette: { darkness: 0.5, offset: 0.45 },
    grain: { opacity: 0.05 }
  },
  cinematic: {
    bloom: { intensity: 1.2, luminanceThreshold: 0.75, luminanceSmoothing: 0.98, kernelSize: KernelSize.VERY_LARGE },
    ssao: { intensity: 1.5, radius: 0.7, samples: 64 },
    chromatic: { offset: [0.003, 0.003] as [number, number] },
    vignette: { darkness: 0.6, offset: 0.5 },
    grain: { opacity: 0.06 }
  }
};

export function PostProcessingEffects({
  preset = 'ultra',
  bloomIntensity,
  ssaoIntensity,
  vignetteStrength,
  grainIntensity
}: PostProcessingProps) {
  
  const config = PRESETS[preset];
  
  return (
    <EffectComposer multisampling={8}>
      <Bloom
        intensity={bloomIntensity ?? config.bloom.intensity}
        luminanceThreshold={config.bloom.luminanceThreshold}
        luminanceSmoothing={config.bloom.luminanceSmoothing}
        kernelSize={config.bloom.kernelSize}
        mipmapBlur
      />
      
      {/* SSAO temporarily disabled - requires NormalsPass */}
      {/* <SSAO
        intensity={ssaoIntensity ?? config.ssao.intensity}
        radius={config.ssao.radius}
        samples={config.ssao.samples}
        rings={4}
        distanceThreshold={1.0}
        distanceFalloff={0.0}
        rangeThreshold={0.5}
        rangeFalloff={0.1}
        luminanceInfluence={0.7}
        bias={0.025}
        blendFunction={BlendFunction.MULTIPLY}
        color={new THREE.Color(0x000000)}
      /> */}
      
      <ChromaticAberration
        offset={new THREE.Vector2(...config.chromatic.offset)}
        radialModulation={true}
        modulationOffset={0.15}
        blendFunction={BlendFunction.NORMAL}
      />
      
      <Vignette
        darkness={vignetteStrength ?? config.vignette.darkness}
        offset={config.vignette.offset}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
      
      <Noise
        opacity={grainIntensity ?? config.grain.opacity}
        blendFunction={BlendFunction.OVERLAY}
        premultiply
      />
    </EffectComposer>
  );
}

export { PRESETS as PostProcessingPresets };
