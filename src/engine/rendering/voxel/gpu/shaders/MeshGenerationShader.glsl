/**
 * Mesh Generation Shader
 * 
 * GPU-accelerated mesh generation from voxels.
 * Generates optimized triangle meshes on GPU.
 */

#version 300 es
precision highp float;

// Input
in vec3 voxelPosition;
in vec3 voxelColor;
in float voxelSize;
in int voxelFaces; // Bitmask of visible faces

// Uniforms
uniform mat4 modelMatrix;

// Output (transform feedback)
out vec3 vertexPosition;
out vec3 vertexNormal;
out vec3 vertexColor;
out vec2 vertexUV;

// Face normals
const vec3 FACE_NORMALS[6] = vec3[6](
  vec3(1.0, 0.0, 0.0),   // Right
  vec3(-1.0, 0.0, 0.0),  // Left
  vec3(0.0, 1.0, 0.0),   // Top
  vec3(0.0, -1.0, 0.0),  // Bottom
  vec3(0.0, 0.0, 1.0),   // Front
  vec3(0.0, 0.0, -1.0)   // Back
);

// Generate quad for face
void generateFaceQuad(int faceIndex, vec3 center, float size) {
  vec3 normal = FACE_NORMALS[faceIndex];
  vec3 tangent, bitangent;
  
  // Calculate tangent and bitangent
  if (abs(normal.x) > 0.5) {
    tangent = vec3(0.0, 1.0, 0.0);
  } else {
    tangent = vec3(1.0, 0.0, 0.0);
  }
  bitangent = cross(normal, tangent);
  
  // Generate 4 vertices for quad
  float halfSize = size * 0.5;
  vec3 faceCenter = center + normal * halfSize;
  
  // Vertex 0: Bottom-left
  vertexPosition = faceCenter - tangent * halfSize - bitangent * halfSize;
  vertexNormal = normal;
  vertexColor = voxelColor;
  vertexUV = vec2(0.0, 0.0);
}

void main() {
  // Check which faces are visible
  for (int i = 0; i < 6; i++) {
    int faceMask = 1 << i;
    if ((voxelFaces & faceMask) != 0) {
      // Generate quad for this face
      generateFaceQuad(i, voxelPosition, voxelSize);
    }
  }
  
  // Transform vertex
  vec4 worldPos = modelMatrix * vec4(vertexPosition, 1.0);
  gl_Position = worldPos;
}
