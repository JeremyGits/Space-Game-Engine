/**
 * Interpolation
 * 
 * Advanced interpolation algorithms for smooth animations and transitions
 */

import { clamp } from './MathUtils';

/**
 * Linear interpolation
 */
export function linear(t: number): number {
  return t;
}

/**
 * Cubic Hermite interpolation
 */
export function hermite(t: number, p0: number, m0: number, p1: number, m1: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  
  return h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1;
}

/**
 * Catmull-Rom spline interpolation
 */
export function catmullRom(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

/**
 * Cubic Bezier interpolation
 */
export function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  
  return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3;
}

/**
 * Quadratic Bezier interpolation
 */
export function quadraticBezier(t: number, p0: number, p1: number, p2: number): number {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  
  return uu * p0 + 2 * u * t * p1 + tt * p2;
}

/**
 * Cosine interpolation
 */
export function cosine(t: number): number {
  return (1 - Math.cos(t * Math.PI)) * 0.5;
}

/**
 * Acceleration interpolation
 */
export function acceleration(t: number): number {
  return t * t;
}

/**
 * Deceleration interpolation
 */
export function deceleration(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Bezier curve class for complex curves
 */
export class BezierCurve {
  private points: number[];
  
  constructor(points: number[]) {
    if (points.length < 2) {
      throw new Error('Bezier curve requires at least 2 points');
    }
    this.points = points;
  }
  
  /**
   * Evaluate curve at t (0-1)
   */
  evaluate(t: number): number {
    t = clamp(t, 0, 1);
    return this.deCasteljau(this.points, t);
  }
  
  /**
   * De Casteljau's algorithm for Bezier curves
   */
  private deCasteljau(points: number[], t: number): number {
    if (points.length === 1) {
      return points[0];
    }
    
    const newPoints: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      newPoints.push(points[i] * (1 - t) + points[i + 1] * t);
    }
    
    return this.deCasteljau(newPoints, t);
  }
  
  /**
   * Get derivative at t
   */
  derivative(t: number): number {
    if (this.points.length < 2) return 0;
    
    const derivativePoints: number[] = [];
    const n = this.points.length - 1;
    
    for (let i = 0; i < n; i++) {
      derivativePoints.push(n * (this.points[i + 1] - this.points[i]));
    }
    
    const derivativeCurve = new BezierCurve(derivativePoints);
    return derivativeCurve.evaluate(t);
  }
}

/**
 * Spline interpolation class
 */
export class Spline {
  private points: number[];
  private tangents: number[];
  
  constructor(points: number[], tension: number = 0) {
    if (points.length < 2) {
      throw new Error('Spline requires at least 2 points');
    }
    
    this.points = points;
    this.tangents = this.calculateTangents(points, tension);
  }
  
  /**
   * Calculate tangents for Hermite spline
   */
  private calculateTangents(points: number[], tension: number): number[] {
    const tangents: number[] = [];
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      if (i === 0) {
        tangents.push((1 - tension) * (points[1] - points[0]));
      } else if (i === n - 1) {
        tangents.push((1 - tension) * (points[n - 1] - points[n - 2]));
      } else {
        tangents.push((1 - tension) * (points[i + 1] - points[i - 1]) / 2);
      }
    }
    
    return tangents;
  }
  
  /**
   * Evaluate spline at t (0 to points.length - 1)
   */
  evaluate(t: number): number {
    t = clamp(t, 0, this.points.length - 1);
    
    const segment = Math.floor(t);
    const localT = t - segment;
    
    if (segment >= this.points.length - 1) {
      return this.points[this.points.length - 1];
    }
    
    return hermite(
      localT,
      this.points[segment],
      this.tangents[segment],
      this.points[segment + 1],
      this.tangents[segment + 1]
    );
  }
}

/**
 * Catmull-Rom spline class
 */
export class CatmullRomSpline {
  private points: number[];
  
  constructor(points: number[]) {
    if (points.length < 4) {
      throw new Error('Catmull-Rom spline requires at least 4 points');
    }
    this.points = points;
  }
  
  /**
   * Evaluate spline at t (0 to points.length - 3)
   */
  evaluate(t: number): number {
    t = clamp(t, 0, this.points.length - 3);
    
    const segment = Math.floor(t);
    const localT = t - segment;
    
    return catmullRom(
      localT,
      this.points[segment],
      this.points[segment + 1],
      this.points[segment + 2],
      this.points[segment + 3]
    );
  }
}

/**
 * Interpolation utilities
 */
export const Interpolation = {
  linear,
  hermite,
  catmullRom,
  cubicBezier,
  quadraticBezier,
  cosine,
  acceleration,
  deceleration,
  
  /**
   * Create a Bezier curve
   */
  bezier: (points: number[]) => new BezierCurve(points),
  
  /**
   * Create a spline
   */
  spline: (points: number[], tension?: number) => new Spline(points, tension),
  
  /**
   * Create a Catmull-Rom spline
   */
  catmullRomSpline: (points: number[]) => new CatmullRomSpline(points)
};

/**
 * Interpolate between multiple values
 */
export function multiLerp(values: number[], t: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  
  t = clamp(t, 0, 1);
  const scaledT = t * (values.length - 1);
  const index = Math.floor(scaledT);
  const localT = scaledT - index;
  
  if (index >= values.length - 1) {
    return values[values.length - 1];
  }
  
  return values[index] * (1 - localT) + values[index + 1] * localT;
}

/**
 * Smooth minimum (smooth union)
 */
export function smoothMin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/**
 * Smooth maximum (smooth intersection)
 */
export function smoothMax(a: number, b: number, k: number): number {
  return -smoothMin(-a, -b, k);
}

/**
 * Exponential interpolation
 */
export function exponentialIn(t: number, power: number = 2): number {
  return Math.pow(t, power);
}

/**
 * Exponential out interpolation
 */
export function exponentialOut(t: number, power: number = 2): number {
  return 1 - Math.pow(1 - t, power);
}

/**
 * Exponential in-out interpolation
 */
export function exponentialInOut(t: number, power: number = 2): number {
  if (t < 0.5) {
    return Math.pow(2 * t, power) / 2;
  }
  return 1 - Math.pow(2 * (1 - t), power) / 2;
}

/**
 * Circular interpolation in
 */
export function circularIn(t: number): number {
  return 1 - Math.sqrt(1 - t * t);
}

/**
 * Circular interpolation out
 */
export function circularOut(t: number): number {
  return Math.sqrt(1 - (t - 1) * (t - 1));
}

/**
 * Circular interpolation in-out
 */
export function circularInOut(t: number): number {
  if (t < 0.5) {
    return (1 - Math.sqrt(1 - 4 * t * t)) / 2;
  }
  return (Math.sqrt(1 - 4 * (t - 1) * (t - 1)) + 1) / 2;
}
