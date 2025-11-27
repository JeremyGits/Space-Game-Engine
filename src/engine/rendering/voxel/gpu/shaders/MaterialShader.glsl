/**
 * Material Shader
 * 
 * PBR material rendering for voxels.
 * Full physically-based rendering with lighting.
 */

#version 300 es
precision highp float;

// Input from vertex shader
in vec3 vPosition;
in vec3 vNormal;
in vec3 vColor;
in vec2 vUV;

// Uniforms - Material properties
uniform float metalness;
uniform float roughness;
uniform vec3 emissive;
uniform float emissiveIntensity;
uniform float ao;

// Uniforms - Lighting
uniform vec3 lightDirection;
uniform vec3 lightColor;
uniform float lightIntensity;
uniform vec3 ambientColor;
uniform float ambientIntensity;

// Uniforms - Camera
uniform vec3 cameraPosition;

// Output
out vec4 fragColor;

// Constants
const float PI = 3.14159265359;

// Fresnel-Schlick approximation
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

// GGX/Trowbridge-Reitz normal distribution
float distributionGGX(vec3 N, vec3 H, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = max(dot(N, H), 0.0);
  float NdotH2 = NdotH * NdotH;
  
  float num = a2;
  float denom = (NdotH2 * (a2 - 1.0) + 1.0);
  denom = PI * denom * denom;
  
  return num / denom;
}

// Smith's Schlick-GGX geometry function
float geometrySchlickGGX(float NdotV, float roughness) {
  float r = (roughness + 1.0);
  float k = (r * r) / 8.0;
  
  float num = NdotV;
  float denom = NdotV * (1.0 - k) + k;
  
  return num / denom;
}

// Smith's method for geometry obstruction
float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  float ggx2 = geometrySchlickGGX(NdotV, roughness);
  float ggx1 = geometrySchlickGGX(NdotL, roughness);
  
  return ggx1 * ggx2;
}

void main() {
  // Normalize inputs
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vPosition);
  vec3 L = normalize(-lightDirection);
  vec3 H = normalize(V + L);
  
  // Calculate base reflectivity
  vec3 F0 = vec3(0.04);
  F0 = mix(F0, vColor, metalness);
  
  // Cook-Torrance BRDF
  float NDF = distributionGGX(N, H, roughness);
  float G = geometrySmith(N, V, L, roughness);
  vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
  
  vec3 kS = F;
  vec3 kD = vec3(1.0) - kS;
  kD *= 1.0 - metalness;
  
  vec3 numerator = NDF * G * F;
  float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
  vec3 specular = numerator / denominator;
  
  // Radiance
  float NdotL = max(dot(N, L), 0.0);
  vec3 radiance = lightColor * lightIntensity;
  
  // Outgoing radiance
  vec3 Lo = (kD * vColor / PI + specular) * radiance * NdotL;
  
  // Ambient lighting
  vec3 ambient = ambientColor * ambientIntensity * vColor * ao;
  
  // Emissive
  vec3 emissiveContribution = emissive * emissiveIntensity;
  
  // Final color
  vec3 color = ambient + Lo + emissiveContribution;
  
  // Tone mapping (Reinhard)
  color = color / (color + vec3(1.0));
  
  // Gamma correction
  color = pow(color, vec3(1.0/2.2));
  
  fragColor = vec4(color, 1.0);
}
