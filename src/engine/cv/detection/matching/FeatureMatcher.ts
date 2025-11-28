/**
 * Feature Matcher
 * Advanced feature detection and matching using ORB, SIFT, SURF algorithms
 */

import type { FeatureMatch, KeyPoint } from '../../../../types/cv';
import { getOpenCV, isOpenCVAvailable } from '../../core/OpenCVLoader';
import { processImage } from '../../core/ImageProcessor';

export interface FeatureMatchingOptions {
  algorithm?: 'orb' | 'sift' | 'surf' | 'akaze' | 'brisk';
  maxFeatures?: number;
  matchThreshold?: number;
  crossCheck?: boolean;
  ratio?: number; // Lowe's ratio test
  ransac?: boolean;
  ransacThreshold?: number;
}

export interface FeatureMatchingResult {
  matches: FeatureMatch[];
  keypoints1: KeyPoint[];
  keypoints2: KeyPoint[];
  homography?: number[][];
  processingTime: number;
  algorithm: string;
}

/**
 * Match features between two images
 */
export async function matchFeatures(
  image1Url: string,
  image2Url: string,
  options: FeatureMatchingOptions = {}
): Promise<FeatureMatchingResult> {
  if (!isOpenCVAvailable()) {
    throw new Error('OpenCV.js not available. Load it first.');
  }
  
  const startTime = performance.now();
  const cv = getOpenCV();
  
  const {
    algorithm = 'orb',
    maxFeatures = 500,
    matchThreshold = 0.7,
    crossCheck = true,
    ratio = 0.75,
    ransac = true,
    ransacThreshold = 3.0,
  } = options;
  
  // Load and process images
  const [processed1, processed2] = await Promise.all([
    processImage(image1Url, { grayscale: true }),
    processImage(image2Url, { grayscale: true }),
  ]);
  
  // Create OpenCV Mats
  const img1 = cv.matFromImageData(processed1.data);
  const img2 = cv.matFromImageData(processed2.data);
  
  try {
    // Detect keypoints and compute descriptors
    const { keypoints: kp1, descriptors: desc1 } = detectAndCompute(cv, img1, algorithm, maxFeatures);
    const { keypoints: kp2, descriptors: desc2 } = detectAndCompute(cv, img2, algorithm, maxFeatures);
    
    // Match descriptors
    const matcher = new cv.BFMatcher(cv.NORM_HAMMING, crossCheck);
    const matches = new cv.DMatchVector();
    
    if (ratio < 1.0) {
      // Use ratio test (Lowe's ratio)
      const knnMatches = new cv.DMatchVectorVector();
      matcher.knnMatch(desc1, desc2, knnMatches, 2);
      
      // Apply ratio test
      for (let i = 0; i < knnMatches.size(); i++) {
        const match = knnMatches.get(i);
        if (match.size() >= 2) {
          const m1 = match.get(0);
          const m2 = match.get(1);
          
          if (m1.distance < ratio * m2.distance) {
            matches.push_back(m1);
          }
        }
      }
      
      knnMatches.delete();
    } else {
      // Direct matching
      matcher.match(desc1, desc2, matches);
    }
    
    // Filter by distance threshold
    const goodMatches: FeatureMatch[] = [];
    const matchArray: any[] = [];
    
    for (let i = 0; i < matches.size(); i++) {
      const match = matches.get(i);
      matchArray.push(match);
    }
    
    // Sort by distance
    matchArray.sort((a, b) => a.distance - b.distance);
    
    // Take best matches
    const maxDistance = matchArray[0]?.distance * matchThreshold || 50;
    
    for (const match of matchArray) {
      if (match.distance <= maxDistance) {
        goodMatches.push({
          queryIdx: match.queryIdx,
          trainIdx: match.trainIdx,
          distance: match.distance,
          confidence: 1 - (match.distance / maxDistance),
        });
      }
    }
    
    // Calculate homography if enough matches and RANSAC enabled
    let homography: number[][] | undefined;
    
    if (ransac && goodMatches.length >= 4) {
      const srcPoints = goodMatches.map(m => {
        const kp = kp1.get(m.queryIdx).pt;
        return [kp.x, kp.y];
      });
      const dstPoints = goodMatches.map(m => {
        const kp = kp2.get(m.trainIdx).pt;
        return [kp.x, kp.y];
      });
      
      const srcMat = cv.matFromArray(srcPoints.length, 1, cv.CV_32FC2, srcPoints.flat());
      const dstMat = cv.matFromArray(dstPoints.length, 1, cv.CV_32FC2, dstPoints.flat());
      
      const H = cv.findHomography(srcMat, dstMat, cv.RANSAC, ransacThreshold);
      
      if (!H.empty()) {
        homography = [];
        for (let i = 0; i < 3; i++) {
          homography[i] = [];
          for (let j = 0; j < 3; j++) {
            homography[i][j] = H.doubleAt(i, j);
          }
        }
      }
      
      srcMat.delete();
      dstMat.delete();
      H.delete();
    }
    
    // Convert keypoints to our format
    const keypoints1: KeyPoint[] = [];
    const keypoints2: KeyPoint[] = [];
    
    for (let i = 0; i < kp1.size(); i++) {
      const kp = kp1.get(i);
      keypoints1.push({
        position: { x: kp.pt.x, y: kp.pt.y },
        size: kp.size,
        angle: kp.angle,
        response: kp.response,
        octave: kp.octave,
        classId: kp.class_id || -1,
      });
    }
    
    for (let i = 0; i < kp2.size(); i++) {
      const kp = kp2.get(i);
      keypoints2.push({
        position: { x: kp.pt.x, y: kp.pt.y },
        size: kp.size,
        angle: kp.angle,
        response: kp.response,
        octave: kp.octave,
        classId: kp.class_id || -1,
      });
    }
    
    const processingTime = performance.now() - startTime;
    
    console.log(`🔍 Matched ${goodMatches.length} features in ${processingTime.toFixed(2)}ms`);
    
    // Clean up
    matcher.delete();
    matches.delete();
    kp1.delete();
    kp2.delete();
    desc1.delete();
    desc2.delete();
    
    return {
      matches: goodMatches,
      keypoints1,
      keypoints2,
      homography,
      processingTime,
      algorithm,
    };
    
  } finally {
    img1.delete();
    img2.delete();
  }
}

/**
 * Detect keypoints and compute descriptors
 */
function detectAndCompute(
  cv: any,
  image: any,
  algorithm: string,
  maxFeatures: number
): { keypoints: any; descriptors: any } {
  const keypoints = new cv.KeyPointVector();
  const descriptors = new cv.Mat();
  
  let detector: any;
  
  switch (algorithm) {
    case 'orb':
      detector = new cv.ORB(maxFeatures);
      break;
    case 'akaze':
      detector = new cv.AKAZE();
      break;
    case 'brisk':
      detector = new cv.BRISK();
      break;
    default:
      detector = new cv.ORB(maxFeatures);
  }
  
  detector.detectAndCompute(image, new cv.Mat(), keypoints, descriptors);
  detector.delete();
  
  return { keypoints, descriptors };
}

/**
 * Find best matches
 */
export async function findBestMatches(
  image1Url: string,
  image2Url: string,
  count: number = 10,
  options?: FeatureMatchingOptions
): Promise<FeatureMatch[]> {
  const result = await matchFeatures(image1Url, image2Url, options);
  
  return result.matches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, count);
}

/**
 * Calculate match quality score
 */
export function calculateMatchQuality(matches: FeatureMatch[]): number {
  if (matches.length === 0) return 0;
  
  const avgConfidence = matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length;
  const matchCount = Math.min(matches.length / 100, 1); // Normalize to 0-1
  
  return (avgConfidence * 0.7) + (matchCount * 0.3);
}

/**
 * Check if images are similar
 */
export async function imagesAreSimilar(
  image1Url: string,
  image2Url: string,
  threshold: number = 0.6
): Promise<boolean> {
  const result = await matchFeatures(image1Url, image2Url, {
    maxFeatures: 200,
    matchThreshold: 0.8,
  });
  
  const quality = calculateMatchQuality(result.matches);
  return quality >= threshold;
}

/**
 * Estimate transformation between images
 */
export async function estimateTransformation(
  image1Url: string,
  image2Url: string
): Promise<{
  translation: { x: number; y: number };
  rotation: number;
  scale: number;
} | null> {
  const result = await matchFeatures(image1Url, image2Url, {
    ransac: true,
  });
  
  if (!result.homography || result.matches.length < 4) {
    return null;
  }
  
  // Extract transformation from homography
  const H = result.homography;
  
  const translation = {
    x: H[0][2],
    y: H[1][2],
  };
  
  const rotation = Math.atan2(H[1][0], H[0][0]) * (180 / Math.PI);
  const scale = Math.sqrt(H[0][0] * H[0][0] + H[1][0] * H[1][0]);
  
  return {
    translation,
    rotation,
    scale,
  };
}
