/**
 * Standard Shader (Phong/Blinn-Phong Lighting)
 * 
 * Features:
 * - Phong/Blinn-Phong lighting model
 * - Multiple light types (directional, point, spot)
 * - Normal mapping
 * - Specular mapping
 * - Ambient occlusion
 * - Emissive mapping
 * - Shadow mapping
 */

export const StandardVertexShader = `
#version 300 es
precision highp float;

// Attributes
in vec3 position;
in vec3 normal;
in vec2 uv;
in vec3 tangent;
in vec3 bitangent;

// Uniforms - Matrices
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

// Uniforms - Shadow
#ifdef USE_SHADOW_MAP
uniform mat4 shadowMatrix;
#endif

// Varyings
out vec3 vPosition;
out vec3 vNormal;
out vec2 vUv;
out vec3 vViewPosition;

#ifdef USE_NORMAL_MAP
out mat3 vTBN;
#endif

#ifdef USE_SHADOW_MAP
out vec4 vShadowCoord;
#endif

void main() {
  // Transform position
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * viewPosition;
  
  // Pass varyings
  vPosition = worldPosition.xyz;
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  vViewPosition = viewPosition.xyz;
  
  #ifdef USE_NORMAL_MAP
  // Calculate TBN matrix for normal mapping
  vec3 T = normalize(normalMatrix * tangent);
  vec3 B = normalize(normalMatrix * bitangent);
  vec3 N = vNormal;
  vTBN = mat3(T, B, N);
  #endif
  
  #ifdef USE_SHADOW_MAP
  // Calculate shadow coordinates
  vShadowCoord = shadowMatrix * worldPosition;
  #endif
}
`;

export const StandardFragmentShader = `
#version 300 es
precision highp float;

// Maximum lights
#ifndef MAX_LIGHTS
#define MAX_LIGHTS 8
#endif

// Light types
#define LIGHT_TYPE_DIRECTIONAL 0
#define LIGHT_TYPE_POINT 1
#define LIGHT_TYPE_SPOT 2

// Light structure
struct Light {
  int type;
  vec3 position;
  vec3 direction;
  vec3 color;
  float intensity;
  float distance;
  float decay;
  float angle;
  float penumbra;
  bool castShadow;
};

// Varyings
in vec3 vPosition;
in vec3 vNormal;
in vec2 vUv;
in vec3 vViewPosition;

#ifdef USE_NORMAL_MAP
in mat3 vTBN;
#endif

#ifdef USE_SHADOW_MAP
in vec4 vShadowCoord;
#endif

// Uniforms - Material
uniform vec3 diffuseColor;
uniform float opacity;
uniform vec3 specularColor;
uniform float shininess;

// Uniforms - Textures
#ifdef USE_MAP
uniform sampler2D map;
#endif

#ifdef USE_NORMAL_MAP
uniform sampler2D normalMap;
uniform float normalScale;
#endif

#ifdef USE_SPECULAR_MAP
uniform sampler2D specularMap;
#endif

#ifdef USE_ROUGHNESS_MAP
uniform sampler2D roughnessMap;
#endif

#ifdef USE_AO_MAP
uniform sampler2D aoMap;
uniform float aoMapIntensity;
#endif

#ifdef USE_EMISSIVE_MAP
uniform sampler2D emissiveMap;
uniform vec3 emissiveColor;
uniform float emissiveIntensity;
#endif

#ifdef USE_SHADOW_MAP
uniform sampler2D shadowMap;
uniform float shadowBias;
uniform float shadowRadius;
#endif

// Uniforms - Lighting
uniform vec3 ambientLightColor;
uniform int numLights;
uniform Light lights[MAX_LIGHTS];

// Uniforms - Camera
uniform vec3 cameraPosition;

// Output
out vec4 fragColor;

// Calculate shadow
#ifdef USE_SHADOW_MAP
float calculateShadow(vec4 shadowCoord) {
  // Perspective divide
  vec3 projCoords = shadowCoord.xyz / shadowCoord.w;
  
  // Transform to [0,1] range
  projCoords = projCoords * 0.5 + 0.5;
  
  // Check if outside shadow map
  if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || 
      projCoords.y < 0.0 || projCoords.y > 1.0) {
    return 1.0;
  }
  
  // Get closest depth value from shadow map
  float closestDepth = texture(shadowMap, projCoords.xy).r;
  
  // Get depth of current fragment
  float currentDepth = projCoords.z;
  
  // PCF (Percentage Closer Filtering)
  float shadow = 0.0;
  vec2 texelSize = 1.0 / vec2(textureSize(shadowMap, 0));
  
  for(int x = -1; x <= 1; ++x) {
    for(int y = -1; y <= 1; ++y) {
      float pcfDepth = texture(shadowMap, projCoords.xy + vec2(x, y) * texelSize * shadowRadius).r;
      shadow += currentDepth - shadowBias > pcfDepth ? 0.0 : 1.0;
    }
  }
  shadow /= 9.0;
  
  return shadow;
}
#endif

// Calculate directional light
vec3 calculateDirectionalLight(Light light, vec3 normal, vec3 viewDir, vec3 diffuse, vec3 specular, float shininess) {
  vec3 lightDir = normalize(-light.direction);
  
  // Diffuse
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuseLight = light.color * light.intensity * diff * diffuse;
  
  // Specular (Blinn-Phong)
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), shininess);
  vec3 specularLight = light.color * light.intensity * spec * specular;
  
  return diffuseLight + specularLight;
}

// Calculate point light
vec3 calculatePointLight(Light light, vec3 normal, vec3 viewDir, vec3 diffuse, vec3 specular, float shininess) {
  vec3 lightDir = normalize(light.position - vPosition);
  float distance = length(light.position - vPosition);
  
  // Attenuation
  float attenuation = 1.0 / (1.0 + light.decay * distance * distance);
  
  // Distance falloff
  if (light.distance > 0.0) {
    attenuation *= clamp(1.0 - pow(distance / light.distance, 4.0), 0.0, 1.0);
  }
  
  // Diffuse
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuseLight = light.color * light.intensity * diff * diffuse * attenuation;
  
  // Specular (Blinn-Phong)
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), shininess);
  vec3 specularLight = light.color * light.intensity * spec * specular * attenuation;
  
  return diffuseLight + specularLight;
}

// Calculate spot light
vec3 calculateSpotLight(Light light, vec3 normal, vec3 viewDir, vec3 diffuse, vec3 specular, float shininess) {
  vec3 lightDir = normalize(light.position - vPosition);
  float distance = length(light.position - vPosition);
  
  // Attenuation
  float attenuation = 1.0 / (1.0 + light.decay * distance * distance);
  
  // Distance falloff
  if (light.distance > 0.0) {
    attenuation *= clamp(1.0 - pow(distance / light.distance, 4.0), 0.0, 1.0);
  }
  
  // Spot cone
  float theta = dot(lightDir, normalize(-light.direction));
  float epsilon = light.angle - light.angle * light.penumbra;
  float spotEffect = clamp((theta - light.angle) / epsilon, 0.0, 1.0);
  
  // Diffuse
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuseLight = light.color * light.intensity * diff * diffuse * attenuation * spotEffect;
  
  // Specular (Blinn-Phong)
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), shininess);
  vec3 specularLight = light.color * light.intensity * spec * specular * attenuation * spotEffect;
  
  return diffuseLight + specularLight;
}

void main() {
  // Base color
  vec3 baseColor = diffuseColor;
  
  #ifdef USE_MAP
  vec4 texColor = texture(map, vUv);
  baseColor *= texColor.rgb;
  #endif
  
  // Normal
  vec3 normal = normalize(vNormal);
  
  #ifdef USE_NORMAL_MAP
  vec3 normalMap = texture(normalMap, vUv).xyz * 2.0 - 1.0;
  normalMap.xy *= normalScale;
  normal = normalize(vTBN * normalMap);
  #endif
  
  // Specular
  vec3 specular = specularColor;
  float specularStrength = 1.0;
  
  #ifdef USE_SPECULAR_MAP
  vec3 specularMapColor = texture(specularMap, vUv).rgb;
  specular *= specularMapColor;
  specularStrength = (specularMapColor.r + specularMapColor.g + specularMapColor.b) / 3.0;
  #endif
  
  // Roughness affects shininess
  float finalShininess = shininess;
  
  #ifdef USE_ROUGHNESS_MAP
  float roughness = texture(roughnessMap, vUv).r;
  finalShininess *= (1.0 - roughness);
  #endif
  
  // View direction
  vec3 viewDir = normalize(cameraPosition - vPosition);
  
  // Ambient
  vec3 ambient = ambientLightColor * baseColor;
  
  // Ambient occlusion
  #ifdef USE_AO_MAP
  float ao = texture(aoMap, vUv).r;
  ambient *= mix(1.0, ao, aoMapIntensity);
  #endif
  
  // Calculate lighting
  vec3 lighting = ambient;
  
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= numLights) break;
    
    Light light = lights[i];
    vec3 lightContribution = vec3(0.0);
    
    if (light.type == LIGHT_TYPE_DIRECTIONAL) {
      lightContribution = calculateDirectionalLight(light, normal, viewDir, baseColor, specular, finalShininess);
    } else if (light.type == LIGHT_TYPE_POINT) {
      lightContribution = calculatePointLight(light, normal, viewDir, baseColor, specular, finalShininess);
    } else if (light.type == LIGHT_TYPE_SPOT) {
      lightContribution = calculateSpotLight(light, normal, viewDir, baseColor, specular, finalShininess);
    }
    
    // Apply shadow
    #ifdef USE_SHADOW_MAP
    if (light.castShadow) {
      float shadow = calculateShadow(vShadowCoord);
      lightContribution *= shadow;
    }
    #endif
    
    lighting += lightContribution;
  }
  
  // Emissive
  #ifdef USE_EMISSIVE_MAP
  vec3 emissive = texture(emissiveMap, vUv).rgb * emissiveColor * emissiveIntensity;
  lighting += emissive;
  #endif
  
  // Final color
  vec3 finalColor = lighting;
  
  // Output
  fragColor = vec4(finalColor, opacity);
  
  #ifdef USE_MAP
  fragColor.a *= texColor.a;
  #endif
}
`;

// Export combined shader
export const StandardShader = {
  vertex: StandardVertexShader,
  fragment: StandardFragmentShader,
  
  // Default defines
  defines: {
    MAX_LIGHTS: 8
  },
  
  // Optional defines
  optionalDefines: [
    'USE_MAP',
    'USE_NORMAL_MAP',
    'USE_SPECULAR_MAP',
    'USE_ROUGHNESS_MAP',
    'USE_AO_MAP',
    'USE_EMISSIVE_MAP',
    'USE_SHADOW_MAP'
  ]
};
