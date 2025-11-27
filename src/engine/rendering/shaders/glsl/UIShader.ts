/**
 * UI Shader
 * 
 * Features:
 * - Sprite rendering
 * - SDF (Signed Distance Field) text
 * - Rounded rectangles
 * - Gradients
 * - Borders
 * - Shadows
 * - Nine-slice scaling
 */

export const UIVertexShader = `
#version 300 es
precision highp float;

// Attributes
in vec2 position;
in vec2 uv;
in vec4 color;

// Uniforms
uniform mat4 projectionMatrix;
uniform vec2 screenSize;

// Varyings
out vec2 vUv;
out vec4 vColor;
out vec2 vScreenPos;

void main() {
  // Transform to clip space
  gl_Position = projectionMatrix * vec4(position, 0.0, 1.0);
  
  // Pass varyings
  vUv = uv;
  vColor = color;
  vScreenPos = position;
}
`;

export const UIFragmentShader = `
#version 300 es
precision highp float;

// Varyings
in vec2 vUv;
in vec4 vColor;
in vec2 vScreenPos;

// Uniforms
uniform vec2 screenSize;

#ifdef USE_TEXTURE
uniform sampler2D uTexture;
#endif

#ifdef USE_SDF_TEXT
uniform sampler2D sdfTexture;
uniform float sdfThreshold;
uniform float sdfSmoothness;
uniform vec4 outlineColor;
uniform float outlineWidth;
uniform vec2 shadowOffset;
uniform vec4 shadowColor;
#endif

#ifdef USE_ROUNDED_RECT
uniform vec4 borderRadius;  // top-left, top-right, bottom-right, bottom-left
uniform vec2 rectSize;
#endif

#ifdef USE_BORDER
uniform vec4 borderColor;
uniform float borderWidth;
#endif

#ifdef USE_GRADIENT
uniform vec4 gradientStart;
uniform vec4 gradientEnd;
uniform vec2 gradientDirection;  // normalized direction
#endif

#ifdef USE_NINE_SLICE
uniform vec4 sliceBorders;  // left, top, right, bottom (in pixels)
uniform vec2 textureSize;
#endif

// Output
out vec4 fragColor;

// SDF functions
#ifdef USE_SDF_TEXT
float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

vec4 renderSDFText(vec2 uv) {
  // Sample SDF texture (MSDF - Multi-channel Signed Distance Field)
  vec3 sdfSample = texture(sdfTexture, uv).rgb;
  float dist = median(sdfSample.r, sdfSample.g, sdfSample.b);
  
  // Calculate alpha for main text
  float alpha = smoothstep(sdfThreshold - sdfSmoothness, sdfThreshold + sdfSmoothness, dist);
  
  vec4 color = vColor;
  color.a *= alpha;
  
  // Outline
  if (outlineWidth > 0.0) {
    float outlineAlpha = smoothstep(
      sdfThreshold - outlineWidth - sdfSmoothness,
      sdfThreshold - outlineWidth + sdfSmoothness,
      dist
    );
    color = mix(outlineColor, color, alpha);
    color.a = max(outlineAlpha, alpha);
  }
  
  // Shadow
  if (shadowOffset.x != 0.0 || shadowOffset.y != 0.0) {
    vec2 shadowUv = uv + shadowOffset / textureSize;
    vec3 shadowSample = texture(sdfTexture, shadowUv).rgb;
    float shadowDist = median(shadowSample.r, shadowSample.g, shadowSample.b);
    float shadowAlpha = smoothstep(sdfThreshold - sdfSmoothness, sdfThreshold + sdfSmoothness, shadowDist);
    
    // Blend shadow behind text
    color.rgb = mix(shadowColor.rgb, color.rgb, color.a);
    color.a = max(shadowAlpha * shadowColor.a, color.a);
  }
  
  return color;
}
#endif

// Rounded rectangle SDF
#ifdef USE_ROUNDED_RECT
float roundedRectSDF(vec2 pos, vec2 size, vec4 radius) {
  // Select corner radius
  float r = radius.x;
  if (pos.x > 0.5) {
    r = (pos.y > 0.5) ? radius.y : radius.z;
  } else {
    r = (pos.y > 0.5) ? radius.x : radius.w;
  }
  
  // Calculate distance
  vec2 q = abs(pos * size - size * 0.5) - size * 0.5 + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
#endif

// Nine-slice scaling
#ifdef USE_NINE_SLICE
vec2 nineSliceUV(vec2 uv, vec2 size, vec4 borders, vec2 texSize) {
  vec2 pixelPos = uv * size;
  vec2 result = uv;
  
  // Left border
  if (pixelPos.x < borders.x) {
    result.x = pixelPos.x / texSize.x;
  }
  // Right border
  else if (pixelPos.x > size.x - borders.z) {
    result.x = (texSize.x - (size.x - pixelPos.x)) / texSize.x;
  }
  // Center
  else {
    float centerWidth = size.x - borders.x - borders.z;
    float texCenterWidth = texSize.x - borders.x - borders.z;
    result.x = (borders.x + (pixelPos.x - borders.x) * texCenterWidth / centerWidth) / texSize.x;
  }
  
  // Top border
  if (pixelPos.y < borders.y) {
    result.y = pixelPos.y / texSize.y;
  }
  // Bottom border
  else if (pixelPos.y > size.y - borders.w) {
    result.y = (texSize.y - (size.y - pixelPos.y)) / texSize.y;
  }
  // Center
  else {
    float centerHeight = size.y - borders.y - borders.w;
    float texCenterHeight = texSize.y - borders.y - borders.w;
    result.y = (borders.y + (pixelPos.y - borders.y) * texCenterHeight / centerHeight) / texSize.y;
  }
  
  return result;
}
#endif

void main() {
  vec4 color = vColor;
  vec2 uv = vUv;
  
  #ifdef USE_NINE_SLICE
  // Apply nine-slice UV transformation
  uv = nineSliceUV(vUv, rectSize, sliceBorders, textureSize);
  #endif
  
  #ifdef USE_SDF_TEXT
  // SDF text rendering
  color = renderSDFText(uv);
  #else
  #ifdef USE_TEXTURE
  // Sample texture
  vec4 texColor = texture(uTexture, uv);
  color *= texColor;
  #endif
  #endif
  
  #ifdef USE_GRADIENT
  // Apply gradient
  float gradientFactor = dot(vUv, gradientDirection);
  vec4 gradientColor = mix(gradientStart, gradientEnd, gradientFactor);
  color *= gradientColor;
  #endif
  
  #ifdef USE_ROUNDED_RECT
  // Rounded rectangle mask
  float dist = roundedRectSDF(vUv, rectSize, borderRadius);
  float alpha = 1.0 - smoothstep(-1.0, 1.0, dist);
  color.a *= alpha;
  
  #ifdef USE_BORDER
  // Border
  if (borderWidth > 0.0) {
    float borderDist = abs(dist) - borderWidth;
    float borderAlpha = 1.0 - smoothstep(-1.0, 1.0, borderDist);
    if (dist > 0.0) {
      color = borderColor;
      color.a *= borderAlpha;
    } else {
      color = mix(color, borderColor, borderAlpha * (1.0 - alpha));
    }
  }
  #endif
  #endif
  
  // Discard fully transparent pixels
  if (color.a < 0.01) {
    discard;
  }
  
  fragColor = color;
}
`;

// Export combined shader
export const UIShader = {
  vertex: UIVertexShader,
  fragment: UIFragmentShader,
  
  // Default defines
  defines: {},
  
  // Optional defines
  optionalDefines: [
    'USE_TEXTURE',
    'USE_SDF_TEXT',
    'USE_ROUNDED_RECT',
    'USE_BORDER',
    'USE_GRADIENT',
    'USE_NINE_SLICE'
  ]
};
