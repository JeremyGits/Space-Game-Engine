/**
 * Similarity Metrics - Export Module
 * 
 * Various similarity metrics for voxel comparison.
 */

// Base metric
export { SimilarityMetric } from './SimilarityMetric';
export type {
  SimilarityResult,
  SimilarityMetricConfig
} from './SimilarityMetric';

// Color similarity
export { ColorSimilarity } from './ColorSimilarity';
export type { ColorSimilarityConfig } from './ColorSimilarity';

// Spatial proximity
export { SpatialProximity } from './SpatialProximity';
export type { SpatialProximityConfig } from './SpatialProximity';

// Material similarity
export { MaterialSimilarity } from './MaterialSimilarity';
export type { MaterialSimilarityConfig } from './MaterialSimilarity';

// Weighted similarity
export { WeightedSimilarity } from './WeightedSimilarity';
export type { WeightedSimilarityConfig } from './WeightedSimilarity';
