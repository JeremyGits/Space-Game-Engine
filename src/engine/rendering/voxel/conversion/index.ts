/**
 * Voxel Conversion - Export Module
 * 
 * Image-to-voxel conversion pipeline for turning 2D images into 3D voxel geometry.
 */

// Main converter
export { ImageToVoxelConverter } from './ImageToVoxelConverter';
export type { ConversionOptions, ConversionResult } from './ImageToVoxelConverter';

// Depth extraction
export { DepthMapExtractor, DepthExtractionMethod } from './DepthMapExtractor';
export type { DepthExtractionOptions } from './DepthMapExtractor';

// Color extraction
export { ColorExtractor } from './ColorExtractor';
export type { ColorExtractionOptions, PaletteColor } from './ColorExtractor';

// Material extraction
export { MaterialExtractor } from './MaterialExtractor';
export type { MaterialExtractionOptions } from './MaterialExtractor';

// Normal extraction
export { NormalExtractor } from './NormalExtractor';
export type { NormalExtractionOptions } from './NormalExtractor';

// Specialized depth algorithms
export * from './depth';

// Sampling algorithms
export * from './sampling';

// Validation and quality assurance
export * from './validation';
