/**
 * Particle Shader
 * 
 * Features:
 * - GPU-based particle rendering
 * - Billboard particles
 * - Texture atlas support
 * - Color over lifetime
 * - Size over lifetime
 * - Rotation
 * - Soft particles
 * - Additive/Alpha blending
 */

export const ParticleVertexShader = `
#version 300 es
precision highp float;

// Attributes
in vec3 position;        // Particle position
in vec2 uv;             // Particle UV (0-1 for quad)
in vec4 color;          // Particle color
in float size;          // Particle size
in float rotation;      // Particle rotation
in float lifetime;      // Particle lifetime (0-1)

#ifdef USE_TEXTURE_ATLAS
in vec2 atlasOffset;    // Texture atlas offset
in vec2 atlasSize;      // Texture atlas tile size
#endif

// Uniforms
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;
uniform vec2 screenSize;

#ifdef USE_SOFT_PARTICLES
uniform sampler2D depthTexture;
uniform float softness;
uniform float near;
uniform float far;
#endif

// Varyings
out vec2 vUv;
out vec4 vColor;
out float vLifetime;

#ifdef USE_SOFT_PARTICLES
out vec4 vScreenPos;
#endif

// Billboard calculation
vec3 billboard(vec3 particlePos, vec2 offset, float size, float rotation) {
  // Get camera right and up vectors from view matrix
  vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 cameraUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  
  // Apply rotation
  if (rotation != 0.0) {
    float c = cos(rotation);
    float s = sin(rotation);
    vec2 rotated = vec2(
      offset.x * c - offset.y * s,
      offset.x * s + offset.y * c
    );
    offset = rotated;
  }
  
  // Calculate billboard position
  vec3 worldPos = particlePos + (cameraRight * offset.x + cameraUp * offset.y) * size;
  
  return worldPos;
}

void main() {
  // Calculate billboard offset (-0.5 to 0.5)
  vec2 offset = uv - 0.5;
  
  // Calculate world position with billboard
  vec3 worldPos = billboard(position, offset, size, rotation);
  
  // Transform to clip space
  vec4 viewPos = viewMatrix * vec4(worldPos, 1.0);
  gl_Position = projectionMatrix * viewPos;
  
  // Pass varyings
  vColor = color;
  vLifetime = lifetime;
  
  #ifdef USE_TEXTURE_ATLAS
  // Calculate UV with atlas offset
  vUv = atlasOffset + uv * atlasSize;
  #else
  vUv = uv;
  #endif
  
  #ifdef USE_SOFT_PARTICLES
  vScreenPos = gl_Position;
  #endif
}
`;

export const ParticleFragmentShader = `
#version 300 es
precision highp float;

// Varyings
in vec2 vUv;
in vec4 vColor;
in float vLifetime;

#ifdef USE_SOFT_PARTICLES
in vec4 vScreenPos;
#endif

// Uniforms
#ifdef USE_TEXTURE
uniform sampler2D particleTexture;
#endif

#ifdef USE_SOFT_PARTICLES
uniform sampler2D depthTexture;
uniform float softness;
uniform float near;
uniform float far;
#endif

#ifdef USE_COLOR_CURVE
uniform sampler2D colorCurve;
#endif

#ifdef USE_ALPHA_CURVE
uniform sampler2D alphaCurve;
#endif

// Output
out vec4 fragColor;

#ifdef USE_SOFT_PARTICLES
// Linearize depth
float linearizeDepth(float depth) {
  float z = depth * 2.0 - 1.0;
  return (2.0 * near * far) / (far + near - z * (far - near));
}

// Calculate soft particle fade
float calculateSoftFade() {
  // Get screen coordinates
  vec2 screenUV = (vScreenPos.xy / vScreenPos.w) * 0.5 + 0.5;
  
  // Sample depth buffer
  float sceneDepth = texture(depthTexture, screenUV).r;
  float particleDepth = gl_FragCoord.z;
  
  // Linearize depths
  float sceneDepthLinear = linearizeDepth(sceneDepth);
  float particleDepthLinear = linearizeDepth(particleDepth);
  
  // Calculate fade
  float depthDiff = sceneDepthLinear - particleDepthLinear;
  float fade = clamp(depthDiff / softness, 0.0, 1.0);
  
  return fade;
}
#endif

void main() {
  // Base color
  vec4 color = vColor;
  
  #ifdef USE_TEXTURE
  // Sample particle texture
  vec4 texColor = texture(particleTexture, vUv);
  color *= texColor;
  #endif
  
  #ifdef USE_COLOR_CURVE
  // Apply color curve based on lifetime
  vec3 curveColor = texture(colorCurve, vec2(vLifetime, 0.5)).rgb;
  color.rgb *= curveColor;
  #endif
  
  #ifdef USE_ALPHA_CURVE
  // Apply alpha curve based on lifetime
  float curveAlpha = texture(alphaCurve, vec2(vLifetime, 0.5)).r;
  color.a *= curveAlpha;
  #endif
  
  // Fade at edges (circular fade)
  #ifdef USE_CIRCULAR_FADE
  vec2 center = vUv - 0.5;
  float dist = length(center);
  float fade = 1.0 - smoothstep(0.4, 0.5, dist);
  color.a *= fade;
  #endif
  
  // Soft particles
  #ifdef USE_SOFT_PARTICLES
  float softFade = calculateSoftFade();
  color.a *= softFade;
  #endif
  
  // Discard fully transparent pixels
  if (color.a < 0.01) {
    discard;
  }
  
  fragColor = color;
}
`;

// Export combined shader
export const ParticleShader = {
  vertex: ParticleVertexShader,
  fragment: ParticleFragmentShader,
  
  // Default defines
  defines: {},
  
  // Optional defines
  optionalDefines: [
    'USE_TEXTURE',
    'USE_TEXTURE_ATLAS',
    'USE_SOFT_PARTICLES',
    'USE_COLOR_CURVE',
    'USE_ALPHA_CURVE',
    'USE_CIRCULAR_FADE'
  ]
};
