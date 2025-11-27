/**
 * Skybox Shader
 * 
 * Features:
 * - Cubemap rendering
 * - HDR support
 * - Exposure control
 * - Procedural sky (optional)
 * - Atmospheric scattering (optional)
 */

export const SkyboxVertexShader = `
#version 300 es
precision highp float;

// Attributes
in vec3 position;

// Uniforms
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

// Varyings
out vec3 vWorldPosition;

void main() {
  vWorldPosition = position;
  
  // Remove translation from view matrix
  mat4 rotView = mat4(mat3(viewMatrix));
  vec4 clipPos = projectionMatrix * rotView * vec4(position, 1.0);
  
  // Set z = w so that after perspective divide, z/w = 1.0 (max depth)
  gl_Position = clipPos.xyww;
}
`;

export const SkyboxFragmentShader = `
#version 300 es
precision highp float;

// Varyings
in vec3 vWorldPosition;

// Uniforms
uniform samplerCube skybox;
uniform float exposure;
uniform float gamma;

#ifdef USE_HDR
uniform float intensity;
#endif

#ifdef USE_PROCEDURAL_SKY
uniform vec3 sunPosition;
uniform vec3 sunColor;
uniform float sunIntensity;
uniform vec3 skyColorTop;
uniform vec3 skyColorHorizon;
uniform vec3 skyColorBottom;
uniform float horizonFalloff;
#endif

// Output
out vec4 fragColor;

#ifdef USE_PROCEDURAL_SKY
// Atmospheric scattering approximation
vec3 calculateProceduralSky(vec3 viewDir) {
  // Normalize view direction
  vec3 V = normalize(viewDir);
  
  // Calculate sun direction
  vec3 sunDir = normalize(sunPosition);
  
  // Sky gradient based on view direction
  float skyGradient = V.y;
  
  // Interpolate between sky colors
  vec3 skyColor;
  if (skyGradient > 0.0) {
    // Above horizon
    skyColor = mix(skyColorHorizon, skyColorTop, pow(skyGradient, horizonFalloff));
  } else {
    // Below horizon
    skyColor = mix(skyColorHorizon, skyColorBottom, pow(-skyGradient, horizonFalloff));
  }
  
  // Sun contribution
  float sunDot = max(dot(V, sunDir), 0.0);
  float sunDisc = smoothstep(0.9995, 0.9999, sunDot); // Sun disc
  float sunGlow = pow(sunDot, 32.0) * 0.5; // Sun glow
  
  vec3 sun = (sunDisc + sunGlow) * sunColor * sunIntensity;
  
  // Atmospheric scattering (simplified Rayleigh)
  float scatter = pow(1.0 - abs(V.y), 3.0) * 0.5;
  vec3 scatterColor = mix(skyColor, sunColor, scatter * sunDot);
  
  return scatterColor + sun;
}
#endif

// Tonemap (Reinhard)
vec3 tonemap(vec3 color, float exposure) {
  color *= exposure;
  return color / (color + vec3(1.0));
}

// Tonemap (ACES Filmic)
vec3 tonemapACES(vec3 color) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

void main() {
  vec3 color;
  
  #ifdef USE_PROCEDURAL_SKY
  // Procedural sky
  color = calculateProceduralSky(vWorldPosition);
  #else
  // Cubemap skybox
  color = texture(skybox, vWorldPosition).rgb;
  
  #ifdef USE_HDR
  // HDR intensity
  color *= intensity;
  #endif
  #endif
  
  // Tonemapping
  #ifdef USE_TONEMAP_ACES
  color = tonemapACES(color * exposure);
  #else
  color = tonemap(color, exposure);
  #endif
  
  // Gamma correction
  color = pow(color, vec3(1.0 / gamma));
  
  fragColor = vec4(color, 1.0);
}
`;

// Export combined shader
export const SkyboxShader = {
  vertex: SkyboxVertexShader,
  fragment: SkyboxFragmentShader,
  
  // Default defines
  defines: {},
  
  // Optional defines
  optionalDefines: [
    'USE_HDR',
    'USE_PROCEDURAL_SKY',
    'USE_TONEMAP_ACES'
  ]
};
