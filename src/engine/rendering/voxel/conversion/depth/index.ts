/**
 * Depth Extraction Algorithms - Export Module
 * 
 * Specialized depth extraction methods for different use cases.
 */

// Luminance-based depth
export { LuminanceDepth } from './LuminanceDepth';
export type { LuminanceDepthOptions } from './LuminanceDepth';

// Gradient-based depth
export { GradientDepth } from './GradientDepth';
export type { GradientDepthOptions } from './GradientDepth';

// Edge-based depth
export { EdgeDepth } from './EdgeDepth';
export type { EdgeDepthOptions } from './EdgeDepth';

// AI-powered depth (placeholder)
export { AIDepth } from './AIDepth';
export type { AIDepthOptions } from './AIDepth';

// Depth enhancement
export { DepthEnhancer } from './DepthEnhancer';
export type { DepthEnhancementOptions } from './DepthEnhancer';
