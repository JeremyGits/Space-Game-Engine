/**
 * Materials Module - Export Module
 * 
 * Material management for voxel rendering.
 */

// Voxel material
export { VoxelMaterial, VoxelMaterialPresets } from './VoxelMaterial';
export type { VoxelMaterialProperties, VoxelMaterialOptions } from './VoxelMaterial';

// Material atlas
export { MaterialAtlas } from './MaterialAtlas';
export type { MaterialAtlasEntry, MaterialAtlasOptions } from './MaterialAtlas';

// Texture atlas
export { TextureAtlas } from './TextureAtlas';
export type { TextureAtlasEntry, TextureAtlasOptions } from './TextureAtlas';

// Material blending
export { MaterialBlending, BlendMode, MaterialBlendPresets } from './MaterialBlending';
export type { MaterialBlendOptions } from './MaterialBlending';
