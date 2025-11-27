/**
 * Frustum Culling Shader
 * 
 * GPU-accelerated frustum culling for voxels.
 * Culls voxels outside camera frustum.
 */

#version 300 es
precision highp float;

// Input
in vec3 voxelPosition;
in float voxelSize;

// Uniforms
uniform mat4 viewProjectionMatrix;
uniform vec4 frustumPlanes[6]; // Left, Right, Bottom, Top, Near, Far

// Output
out float visible;

// Check if point is inside frustum
bool isInsideFrustum(vec3 pos, float radius) {
  for (int i = 0; i < 6; i++) {
    float distance = dot(frustumPlanes[i].xyz, pos) + frustumPlanes[i].w;
    if (distance < -radius) {
      return false;
    }
  }
  return true;
}

void main() {
  // Check if voxel is visible
  float radius = voxelSize * 0.866; // sqrt(3)/2 for cube diagonal
  
  if (isInsideFrustum(voxelPosition, radius)) {
    visible = 1.0;
  } else {
    visible = 0.0;
  }
  
  // Transform for rendering
  vec4 clipPos = viewProjectionMatrix * vec4(voxelPosition, 1.0);
  gl_Position = clipPos;
}
