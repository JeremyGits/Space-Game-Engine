/**
 * Voxel Compute Shader
 * 
 * GPU-accelerated voxel processing.
 * Note: WebGL2 version using vertex shader + transform feedback
 * For true compute shaders, would need WebGPU
 */

#version 300 es
precision highp float;

// Input attributes
in vec3 position;
in vec3 color;
in float size;

// Uniforms
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float time;

// Output (transform feedback)
out vec3 outPosition;
out vec3 outColor;
out float outSize;

void main() {
  // Process voxel
  outPosition = position;
  outColor = color;
  outSize = size;
  
  // Apply transformations
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vec4 viewPos = viewMatrix * worldPos;
  gl_Position = projectionMatrix * viewPos;
  
  // Point size for rendering
  gl_PointSize = size * 10.0 / -viewPos.z;
}
