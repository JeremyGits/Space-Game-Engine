/**
 * Shape Feature Extraction
 * Extracts shape-based features from contours and masks
 */

import type { ShapeFeatures } from '../../../types/cv/FeatureTypes';

export class ShapeFeatureExtractor {
  /**
   * Extract all shape features from a contour
   */
  static extractFromContour(contour: any, cv: any): ShapeFeatures {
    const area = cv.contourArea(contour);
    const perimeter = cv.arcLength(contour, true);
    const hull = new cv.Mat();
    cv.convexHull(contour, hull);
    const hullArea = cv.contourArea(hull);
    
    // Calculate shape features
    const circularity = this.calculateCircularity(area, perimeter);
    const rectangularity = this.calculateRectangularity(contour, area, cv);
    const convexity = area / hullArea;
    const symmetry = this.calculateSymmetry(contour, cv);
    const compactness = (perimeter * perimeter) / area;
    const { elongation, eccentricity } = this.calculateElongation(contour, cv);
    
    hull.delete();
    
    return {
      circularity,
      rectangularity,
      convexity,
      symmetry,
      compactness,
      elongation,
      eccentricity,
    };
  }
  
  /**
   * Calculate circularity (4π * area / perimeter²)
   * Perfect circle = 1.0, less circular < 1.0
   */
  private static calculateCircularity(area: number, perimeter: number): number {
    if (perimeter === 0) return 0;
    return (4 * Math.PI * area) / (perimeter * perimeter);
  }
  
  /**
   * Calculate rectangularity (area / bounding box area)
   * Perfect rectangle = 1.0
   */
  private static calculateRectangularity(contour: any, area: number, cv: any): number {
    const rect = cv.boundingRect(contour);
    const rectArea = rect.width * rect.height;
    if (rectArea === 0) return 0;
    return area / rectArea;
  }
  
  /**
   * Calculate symmetry by comparing left/right halves
   */
  private static calculateSymmetry(contour: any, cv: any): number {
    const moments = cv.moments(contour);
    const cx = moments.m10 / moments.m00;
    
    // Get all points
    const points: number[][] = [];
    for (let i = 0; i < contour.rows; i++) {
      const x = contour.data32S[i * 2];
      const y = contour.data32S[i * 2 + 1];
      points.push([x, y]);
    }
    
    // Split into left and right
    const leftPoints = points.filter(p => p[0] < cx);
    const rightPoints = points.filter(p => p[0] >= cx);
    
    // Mirror right points
    const mirroredRight = rightPoints.map(p => [2 * cx - p[0], p[1]]);
    
    // Calculate similarity (simplified)
    const minLen = Math.min(leftPoints.length, mirroredRight.length);
    if (minLen === 0) return 0;
    
    let totalDist = 0;
    for (let i = 0; i < minLen; i++) {
      const dx = leftPoints[i][0] - mirroredRight[i][0];
      const dy = leftPoints[i][1] - mirroredRight[i][1];
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }
    
    const avgDist = totalDist / minLen;
    const maxDist = 100; // Normalize
    return Math.max(0, 1 - avgDist / maxDist);
  }
  
  /**
   * Calculate elongation and eccentricity from fitted ellipse
   */
  private static calculateElongation(contour: any, cv: any): { elongation: number; eccentricity: number } {
    if (contour.rows < 5) {
      return { elongation: 1, eccentricity: 0 };
    }
    
    try {
      const ellipse = cv.fitEllipse(contour);
      const majorAxis = Math.max(ellipse.size.width, ellipse.size.height);
      const minorAxis = Math.min(ellipse.size.width, ellipse.size.height);
      
      const elongation = minorAxis > 0 ? majorAxis / minorAxis : 1;
      const eccentricity = minorAxis > 0 
        ? Math.sqrt(1 - (minorAxis * minorAxis) / (majorAxis * majorAxis))
        : 0;
      
      return { elongation, eccentricity };
    } catch {
      return { elongation: 1, eccentricity: 0 };
    }
  }
  
  /**
   * Calculate Hu moments (rotation/scale invariant)
   */
  static calculateHuMoments(contour: any, cv: any) {
    const moments = cv.moments(contour);
    const huMoments = cv.HuMoments(moments);
    
    return {
      hu1: huMoments.data64F[0],
      hu2: huMoments.data64F[1],
      hu3: huMoments.data64F[2],
      hu4: huMoments.data64F[3],
      hu5: huMoments.data64F[4],
      hu6: huMoments.data64F[5],
      hu7: huMoments.data64F[6],
    };
  }
  
  /**
   * Extract shape features from binary mask
   */
  static extractFromMask(mask: any, cv: any): ShapeFeatures {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    
    cv.findContours(
      mask,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );
    
    if (contours.size() === 0) {
      hierarchy.delete();
      contours.delete();
      return this.getDefaultFeatures();
    }
    
    const contour = contours.get(0);
    const features = this.extractFromContour(contour, cv);
    
    contour.delete();
    hierarchy.delete();
    contours.delete();
    
    return features;
  }
  
  private static getDefaultFeatures(): ShapeFeatures {
    return {
      circularity: 0,
      rectangularity: 0,
      convexity: 0,
      symmetry: 0,
      compactness: 0,
      elongation: 1,
      eccentricity: 0,
    };
  }
}
