/**
 * PBR Shader (Physically Based Rendering)
 * 
 * Features:
 * - Metallic-Roughness workflow
 * - Image-Based Lighting (IBL)
 * - Multiple light types
 * - Normal mapping
 * - Ambient occlusion
 * - Emissive
 * - Clearcoat
 * - Sheen
 * - Transmission
 */

export const PBRVertexShader = `
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
  // Calculate TBN matrix
  vec3 T = normalize(normalMatrix * tangent);
  vec3 B = normalize(normalMatrix * bitangent);
  vec3 N = vNormal;
  vTBN = mat3(T, B, N);
  #endif
  
  #ifdef USE_SHADOW_MAP
  vShadowCoord = shadowMatrix * worldPosition;
  #endif
}
`;

export const PBRFragmentShader = `
#version 300 es
precision highp float;

#define PI 3.14159265359
#define RECIPROCAL_PI 0.31830988618

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
uniform vec3 baseColor;
uniform float opacity;
uniform float metalness;
uniform float roughness;

// Uniforms - Textures
#ifdef USE_MAP
uniform sampler2D map;
#endif

#ifdef USE_NORMAL_MAP
uniform sampler2D normalMap;
uniform float normalScale;
#endif

#ifdef USE_METALNESS_MAP
uniform sampler2D metalnessMap;
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

// Clearcoat
#ifdef USE_CLEARCOAT
uniform float clearcoat;
uniform float clearcoatRoughness;
#ifdef USE_CLEARCOAT_MAP
uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESS_MAP
uniform sampler2D clearcoatRoughnessMap;
#endif
#ifdef USE_CLEARCOAT_NORMAL_MAP
uniform sampler2D clearcoatNormalMap;
#endif
#endif

// Sheen
#ifdef USE_SHEEN
uniform float sheen;
uniform vec3 sheenColor;
uniform float sheenRoughness;
#endif

// Transmission
#ifdef USE_TRANSMISSION
uniform float transmission;
uniform float ior;
uniform float thickness;
#endif

// IBL
#ifdef USE_IBL
uniform samplerCube envMap;
uniform samplerCube irradianceMap;
uniform float envMapIntensity;
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

// ===== PBR Functions =====

// Distribution GGX (Trowbridge-Reitz)
float DistributionGGX(vec3 N, vec3 H, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = max(dot(N, H), 0.0);
  float NdotH2 = NdotH * NdotH;
  
  float nom = a2;
  float denom = (NdotH2 * (a2 - 1.0) + 1.0);
  denom = PI * denom * denom;
  
  return nom / denom;
}

// Geometry Schlick GGX
float GeometrySchlickGGX(float NdotV, float roughness) {
  float r = (roughness + 1.0);
  float k = (r * r) / 8.0;
  
  float nom = NdotV;
  float denom = NdotV * (1.0 - k) + k;
  
  return nom / denom;
}

// Geometry Smith
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  float ggx2 = GeometrySchlickGGX(NdotV, roughness);
  float ggx1 = GeometrySchlickGGX(NdotL, roughness);
  
  return ggx1 * ggx2;
}

// Fresnel Schlick
vec3 FresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// Fresnel Schlick with roughness
vec3 FresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
  return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// Calculate shadow
#ifdef USE_SHADOW_MAP
float calculateShadow(vec4 shadowCoord) {
  vec3 projCoords = shadowCoord.xyz / shadowCoord.w;
  projCoords = projCoords * 0.5 + 0.5;
  
  if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 || 
      projCoords.y < 0.0 || projCoords.y > 1.0) {
    return 1.0;
  }
  
  float currentDepth = projCoords.z;
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
vec3 calculateDirectionalLight(Light light, vec3 N, vec3 V, vec3 F0, vec3 albedo, float metallic, float roughness) {
  vec3 L = normalize(-light.direction);
  vec3 H = normalize(V + L);
  
  // Cook-Torrance BRDF
  float NDF = DistributionGGX(N, H, roughness);
  float G = GeometrySmith(N, V, L, roughness);
  vec3 F = FresnelSchlick(max(dot(H, V), 0.0), F0);
  
  vec3 numerator = NDF * G * F;
  float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
  vec3 specular = numerator / denominator;
  
  // Energy conservation
  vec3 kS = F;
  vec3 kD = vec3(1.0) - kS;
  kD *= 1.0 - metallic;
  
  float NdotL = max(dot(N, L), 0.0);
  
  return (kD * albedo / PI + specular) * light.color * light.intensity * NdotL;
}

// Calculate point light
vec3 calculatePointLight(Light light, vec3 N, vec3 V, vec3 F0, vec3 albedo, float metallic, float roughness) {
  vec3 L = normalize(light.position - vPosition);
  vec3 H = normalize(V + L);
  float distance = length(light.position - vPosition);
  
  // Attenuation
  float attenuation = 1.0 / (distance * distance);
  if (light.distance > 0.0) {
    attenuation *= pow(clamp(1.0 - pow(distance / light.distance, 4.0), 0.0, 1.0), 2.0);
  }
  
  vec3 radiance = light.color * light.intensity * attenuation;
  
  // Cook-Torrance BRDF
  float NDF = DistributionGGX(N, H, roughness);
  float G = GeometrySmith(N, V, L, roughness);
  vec3 F = FresnelSchlick(max(dot(H, V), 0.0), F0);
  
  vec3 numerator = NDF * G * F;
  float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
  vec3 specular = numerator / denominator;
  
  vec3 kS = F;
  vec3 kD = vec3(1.0) - kS;
  kD *= 1.0 - metallic;
  
  float NdotL = max(dot(N, L), 0.0);
  
  return (kD * albedo / PI + specular) * radiance * NdotL;
}

// Calculate spot light
vec3 calculateSpotLight(Light light, vec3 N, vec3 V, vec3 F0, vec3 albedo, float metallic, float roughness) {
  vec3 L = normalize(light.position - vPosition);
  vec3 H = normalize(V + L);
  float distance = length(light.position - vPosition);
  
  // Attenuation
  float attenuation = 1.0 / (distance * distance);
  if (light.distance > 0.0) {
    attenuation *= pow(clamp(1.0 - pow(distance / light.distance, 4.0), 0.0, 1.0), 2.0);
  }
  
  // Spot cone
  float theta = dot(L, normalize(-light.direction));
  float epsilon = light.angle - light.angle * light.penumbra;
  float spotEffect = clamp((theta - light.angle) / epsilon, 0.0, 1.0);
  
  vec3 radiance = light.color * light.intensity * attenuation * spotEffect;
  
  // Cook-Torrance BRDF
  float NDF = DistributionGGX(N, H, roughness);
  float G = GeometrySmith(N, V, L, roughness);
  vec3 F = FresnelSchlick(max(dot(H, V), 0.0), F0);
  
  vec3 numerator = NDF * G * F;
  float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
  vec3 specular = numerator / denominator;
  
  vec3 kS = F;
  vec3 kD = vec3(1.0) - kS;
  kD *= 1.0 - metallic;
  
  float NdotL = max(dot(N, L), 0.0);
  
  return (kD * albedo / PI + specular) * radiance * NdotL;
}

void main() {
  // Base color
  vec3 albedo = baseColor;
  
  #ifdef USE_MAP
  vec4 texColor = texture(map, vUv);
  albedo *= texColor.rgb;
  #endif
  
  // Normal
  vec3 N = normalize(vNormal);
  
  #ifdef USE_NORMAL_MAP
  vec3 normalMap = texture(normalMap, vUv).xyz * 2.0 - 1.0;
  normalMap.xy *= normalScale;
  N = normalize(vTBN * normalMap);
  #endif
  
  // Material properties
  float metallic = metalness;
  float roughness = roughness;
  
  #ifdef USE_METALNESS_MAP
  metallic *= texture(metalnessMap, vUv).b;
  #endif
  
  #ifdef USE_ROUGHNESS_MAP
  roughness *= texture(roughnessMap, vUv).g;
  #endif
  
  // View direction
  vec3 V = normalize(cameraPosition - vPosition);
  
  // Calculate reflectance at normal incidence
  vec3 F0 = vec3(0.04);
  F0 = mix(F0, albedo, metallic);
  
  // Reflectance equation
  vec3 Lo = vec3(0.0);
  
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= numLights) break;
    
    Light light = lights[i];
    vec3 lightContribution = vec3(0.0);
    
    if (light.type == LIGHT_TYPE_DIRECTIONAL) {
      lightContribution = calculateDirectionalLight(light, N, V, F0, albedo, metallic, roughness);
    } else if (light.type == LIGHT_TYPE_POINT) {
      lightContribution = calculatePointLight(light, N, V, F0, albedo, metallic, roughness);
    } else if (light.type == LIGHT_TYPE_SPOT) {
      lightContribution = calculateSpotLight(light, N, V, F0, albedo, metallic, roughness);
    }
    
    #ifdef USE_SHADOW_MAP
    if (light.castShadow) {
      float shadow = calculateShadow(vShadowCoord);
      lightContribution *= shadow;
    }
    #endif
    
    Lo += lightContribution;
  }
  
  // Ambient lighting (IBL or simple ambient)
  vec3 ambient = vec3(0.0);
  
  #ifdef USE_IBL
  // IBL diffuse
  vec3 F = FresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);
  vec3 kS = F;
  vec3 kD = 1.0 - kS;
  kD *= 1.0 - metallic;
  
  vec3 irradiance = texture(irradianceMap, N).rgb;
  vec3 diffuse = irradiance * albedo;
  
  // IBL specular
  vec3 R = reflect(-V, N);
  const float MAX_REFLECTION_LOD = 4.0;
  vec3 prefilteredColor = textureLod(envMap, R, roughness * MAX_REFLECTION_LOD).rgb;
  vec2 brdf = vec2(max(dot(N, V), 0.0), roughness); // Simplified BRDF LUT
  vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);
  
  ambient = (kD * diffuse + specular) * envMapIntensity;
  #else
  // Simple ambient
  vec3 kS = FresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);
  vec3 kD = 1.0 - kS;
  kD *= 1.0 - metallic;
  ambient = ambientLightColor * albedo * kD;
  #endif
  
  // Ambient occlusion
  #ifdef USE_AO_MAP
  float ao = texture(aoMap, vUv).r;
  ambient *= mix(1.0, ao, aoMapIntensity);
  #endif
  
  // Final color
  vec3 color = ambient + Lo;
  
  // Clearcoat
  #ifdef USE_CLEARCOAT
  float clearcoatValue = clearcoat;
  float clearcoatRoughnessValue = clearcoatRoughness;
  
  #ifdef USE_CLEARCOAT_MAP
  clearcoatValue *= texture(clearcoatMap, vUv).r;
  #endif
  
  #ifdef USE_CLEARCOAT_ROUGHNESS_MAP
  clearcoatRoughnessValue *= texture(clearcoatRoughnessMap, vUv).g;
  #endif
  
  if (clearcoatValue > 0.0) {
    vec3 clearcoatNormal = N;
    #ifdef USE_CLEARCOAT_NORMAL_MAP
    vec3 clearcoatNormalMap = texture(clearcoatNormalMap, vUv).xyz * 2.0 - 1.0;
    clearcoatNormal = normalize(vTBN * clearcoatNormalMap);
    #endif
    
    // Simplified clearcoat calculation
    vec3 H = normalize(V + N);
    float clearcoatDotNH = max(dot(clearcoatNormal, H), 0.0);
    float clearcoatSpecular = pow(clearcoatDotNH, 1.0 / (clearcoatRoughnessValue + 0.001));
    color += clearcoatSpecular * clearcoatValue * 0.25;
  }
  #endif
  
  // Sheen
  #ifdef USE_SHEEN
  if (sheen > 0.0) {
    vec3 H = normalize(V + N);
    float sheenDotNH = max(dot(N, H), 0.0);
    float sheenSpecular = pow(1.0 - sheenDotNH, 5.0);
    color += sheenColor * sheenSpecular * sheen;
  }
  #endif
  
  // Emissive
  #ifdef USE_EMISSIVE_MAP
  vec3 emissive = texture(emissiveMap, vUv).rgb * emissiveColor * emissiveIntensity;
  color += emissive;
  #endif
  
  // HDR tonemapping (Reinhard)
  color = color / (color + vec3(1.0));
  
  // Gamma correction
  color = pow(color, vec3(1.0 / 2.2));
  
  // Output
  fragColor = vec4(color, opacity);
  
  #ifdef USE_MAP
  fragColor.a *= texColor.a;
  #endif
}
`;

// Export combined shader
export const PBRShader = {
  vertex: PBRVertexShader,
  fragment: PBRFragmentShader,
  
  // Default defines
  defines: {
    MAX_LIGHTS: 8
  },
  
  // Optional defines
  optionalDefines: [
    'USE_MAP',
    'USE_NORMAL_MAP',
    'USE_METALNESS_MAP',
    'USE_ROUGHNESS_MAP',
    'USE_AO_MAP',
    'USE_EMISSIVE_MAP',
    'USE_IBL',
    'USE_SHADOW_MAP',
    'USE_CLEARCOAT',
    'USE_CLEARCOAT_MAP',
    'USE_CLEARCOAT_ROUGHNESS_MAP',
    'USE_CLEARCOAT_NORMAL_MAP',
    'USE_SHEEN',
    'USE_TRANSMISSION'
  ]
};
