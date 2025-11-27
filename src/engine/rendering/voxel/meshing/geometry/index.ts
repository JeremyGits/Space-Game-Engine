/**
 * Geometry Module - Export Module
 * 
 * Mesh geometry structures and utilities for voxel rendering.
 */

// Vertex buffer
export { VertexBuffer } from './VertexBuffer';
export type { VertexAttributes, VertexBufferOptions } from './VertexBuffer';

// Index buffer
export { IndexBuffer, IndexBufferType, PrimitiveType } from './IndexBuffer';
export type { IndexBufferOptions } from './IndexBuffer';

// Normal calculator
export { NormalCalculator, NormalMethod } from './NormalCalculator';
export type { NormalCalculationOptions } from './NormalCalculator';

// Quad mesh
export { QuadMesh } from './QuadMesh';
export type { Quad, QuadMeshOptions } from './QuadMesh';

// Triangle mesh
export { TriangleMesh } from './TriangleMesh';
export type { Triangle, TriangleMeshOptions } from './TriangleMesh';
