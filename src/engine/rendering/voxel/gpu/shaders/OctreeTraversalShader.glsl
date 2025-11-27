/**
 * Octree Traversal Shader
 * 
 * GPU-accelerated octree traversal for voxel rendering.
 * Efficiently traverses sparse voxel octree on GPU.
 */

#version 300 es
precision highp float;

// Input
in vec3 rayOrigin;
in vec3 rayDirection;

// Uniforms
uniform sampler3D octreeTexture;
uniform vec3 octreeMin;
uniform vec3 octreeMax;
uniform int maxDepth;
uniform float voxelSize;

// Output
out vec4 fragColor;

// Octree traversal
bool traverseOctree(vec3 origin, vec3 dir, out vec3 hitPos, out vec3 hitColor) {
  vec3 invDir = 1.0 / dir;
  vec3 tMin = (octreeMin - origin) * invDir;
  vec3 tMax = (octreeMax - origin) * invDir;
  
  vec3 t1 = min(tMin, tMax);
  vec3 t2 = max(tMin, tMax);
  
  float tNear = max(max(t1.x, t1.y), t1.z);
  float tFar = min(min(t2.x, t2.y), t2.z);
  
  if (tNear > tFar || tFar < 0.0) {
    return false;
  }
  
  // Start traversal
  vec3 pos = origin + dir * max(tNear, 0.0);
  float t = max(tNear, 0.0);
  
  while (t < tFar) {
    // Sample octree
    vec3 uvw = (pos - octreeMin) / (octreeMax - octreeMin);
    vec4 voxelData = texture(octreeTexture, uvw);
    
    // Check if voxel exists (alpha > 0)
    if (voxelData.a > 0.5) {
      hitPos = pos;
      hitColor = voxelData.rgb;
      return true;
    }
    
    // Step forward
    t += voxelSize;
    pos = origin + dir * t;
  }
  
  return false;
}

void main() {
  vec3 hitPos, hitColor;
  
  if (traverseOctree(rayOrigin, normalize(rayDirection), hitPos, hitColor)) {
    // Hit voxel - output color
    fragColor = vec4(hitColor, 1.0);
  } else {
    // Miss - transparent
    fragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
}
