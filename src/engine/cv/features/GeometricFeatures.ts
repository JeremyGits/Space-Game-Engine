/**
 * Geometric Feature Extraction
 * Extracts geometric properties from contours and shapes
 */

import type { GeometricFeatures, HuMoments } from '../../../types/cv/FeatureTypes';
import type { Point2D } from '../../../types/cv/DetectionTypes';

export class GeometricFeatureExtractor {
  /**
   * Extract all geometric features from a contour
   */
  static extractFromContour(contour: any, cv: any): GeometricFeatures {
    const area = cv.contourArea(contour);
    const perimeter = cv.arcLength(contour, true);
    const rect = cv.boundingRect(contour);
    const moments = cv.moments(contour);
    const huMoments = this.calculateHuMoments(moments, cv);
    
    // Calculate centroid
    const centroid: Point2D = {
      x: moments.m10 / moments.m00,
      y: moments.m01 / moments.m00,
    };
    
    // Calculate orientation
    const orientation = this.calculateOrientation(moments);
    
    // Calculate axis lengths from moments
    const { majorAxisLength, minorAxisLength } = this.calculateAxisLengths(moments);
    
    return {
      area,
      perimeter,
      boundingBox: {
        width: rect.width,
        height: rect.height,
        aspectRatio: rect.width / rect.height,
      },
      centroid,
      orientation,
      majorAxisLength,
      minorAxisLength,
      moments: huMoments,
    };
  }
  
  /**
   * Calculate Hu moments (rotation, scale, translation invariant)
   */
  private static calculateHuMoments(moments: any, cv: any): HuMoments {
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
   * Calculate orientation angle from moments
   */
  private static calculateOrientation(moments: any): number {
    const mu20 = moments.mu20;
    const mu11 = moments.mu11;
    const mu02 = moments.mu02;
    
    if (mu20 === mu02) {
      return 0;
    }
    
    const angle = 0.5 * Math.atan2(2 * mu11, mu20 - mu02);
    return (angle * 180) / Math.PI; // Convert to degrees
  }
  
  /**
   * Calculate major and minor axis lengths from moments
   */
  private static calculateAxisLengths(moments: any): {
    majorAxisLength: number;
    minorAxisLength: number;
  } {
    const mu20 = moments.mu20;
    const mu11 = moments.mu11;
    const mu02 = moments.mu02;
    
    const common = Math.sqrt(Math.pow(mu20 - mu02, 2) + 4 * mu11 * mu11);
    
    const majorAxisLength = Math.sqrt(8 * (mu20 + mu02 + common));
    const minorAxisLength = Math.sqrt(8 * (mu20 + mu02 - common));
    
    return { majorAxisLength, minorAxisLength };
  }
  
  /**
   * Extract geometric features from binary mask
   */
  static extractFromMask(mask: any, cv: any): GeometricFeatures {
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
  
  /**
   * Calculate minimum area rectangle
   */
  static calculateMinAreaRect(contour: any, cv: any): {
    center: Point2D;
    size: { width: number; height: number };
    angle: number;
  } {
    if (contour.rows < 5) {
      return {
        center: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        angle: 0,
      };
    }
    
    const rect = cv.minAreaRect(contour);
    return {
      center: { x: rect.center.x, y: rect.center.y },
      size: { width: rect.size.width, height: rect.size.height },
      angle: rect.angle,
    };
  }
  
  /**
   * Calculate minimum enclosing circle
   */
  static calculateMinEnclosingCircle(contour: any, cv: any): {
    center: Point2D;
    radius: number;
  } {
    const circle = cv.minEnclosingCircle(contour);
    return {
      center: { x: circle.center.x, y: circle.center.y },
      radius: circle.radius,
    };
  }
  
  /**
   * Compare two geometric feature sets
   */
  static compare(features1: GeometricFeatures, features2: GeometricFeatures): number {
    // Compare aspect ratios
    const aspectRatioSim = 1 - Math.abs(
      features1.boundingBox.aspectRatio - features2.boundingBox.aspectRatio
    ) / Math.max(features1.boundingBox.aspectRatio, features2.boundingBox.aspectRatio);
    
    // Compare orientations (normalized to 0-180)
    const orientationDiff = Math.abs(features1.orientation - features2.orientation);
    const orientationSim = 1 - Math.min(orientationDiff, 180 - orientationDiff) / 90;
    
    // Compare Hu moments (rotation invariant)
    const huSim = this.compareHuMoments(features1.moments, features2.moments);
    
    // Compare area ratio
    const areaRatio = Math.min(features1.area, features2.area) / Math.max(features1.area, features2.area);
    
    // Weighted combination
    return (
      aspectRatioSim * 0.25 +
      orientationSim * 0.15 +
      huSim * 0.4 +
      areaRatio * 0.2
    );
  }
  
  /**
   * Compare Hu moments using log-based distance
   */
  private static compareHuMoments(hu1: HuMoments, hu2: HuMoments): number {
    const moments1 = [hu1.hu1, hu1.hu2, hu1.hu3, hu1.hu4, hu1.hu5, hu1.hu6, hu1.hu7];
    const moments2 = [hu2.hu1, hu2.hu2, hu2.hu3, hu2.hu4, hu2.hu5, hu2.hu6, hu2.hu7];
    
    let distance = 0;
    for (let i = 0; i < 7; i++) {
      const m1 = Math.sign(moments1[i]) * Math.log10(Math.abs(moments1[i]) + 1e-10);
      const m2 = Math.sign(moments2[i]) * Math.log10(Math.abs(moments2[i]) + 1e-10);
      distance += Math.abs(m1 - m2);
    }
    
    // Normalize and invert to similarity
    const maxDistance = 14; // Empirical max
    return Math.max(0, 1 - distance / maxDistance);
  }
  
  private static getDefaultFeatures(): GeometricFeatures {
    return {
      area: 0,
      perimeter: 0,
      boundingBox: {
        width: 0,
        height: 0,
        aspectRatio: 1,
      },
      centroid: { x: 0, y: 0 },
      orientation: 0,
      majorAxisLength: 0,
      minorAxisLength: 0,
      moments: {
        hu1: 0,
        hu2: 0,
        hu3: 0,
        hu4: 0,
        hu5: 0,
        hu6: 0,
        hu7: 0,
      },
    };
  }
}
