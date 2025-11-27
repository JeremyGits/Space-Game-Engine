/**
 * LOD Selection Shader
 * 
 * GPU-accelerated LOD (Level of Detail) selection.
 * Dynamically selects appropriate detail level based on distance.
 */

#version 300 es
precision highp float;

// Input
in vec3 voxelPosition;
in float voxelSize;
in int voxelLOD;

// Uniforms
uniform vec3 cameraPosition;
uniform float lodDistances[8]; // Distance thresholds for each LOD
uniform int maxLOD;

// Output
out int selectedLOD;
out float lodBlend;

// Calculate LOD based on distance
int calculateLOD(float distance) {
  for (int i = 0; i < maxLOD; i++) {
    if (distance < lodDistances[i]) {
      return i;
    }
  }
  return maxLOD - 1;
}

// Calculate blend factor between LOD levels
float calculateLODBlend(float distance, int lod) {
  if (lod >= maxLOD - 1) {
    return 0.0;
  }
  
  float currentDist = lodDistances[lod];
  float nextDist = lodDistances[lod + 1];
  
  return smoothstep(currentDist, nextDist, distance);
}

void main() {
  // Calculate distance to camera
  float distance = length(voxelPosition - cameraPosition);
  
  // Select LOD
  selectedLOD = calculateLOD(distance);
  
  // Calculate blend factor for smooth transitions
  lodBlend = calculateLODBlend(distance, selectedLOD);
  
  // Output position
  gl_Position = vec4(voxelPosition, 1.0);
}
