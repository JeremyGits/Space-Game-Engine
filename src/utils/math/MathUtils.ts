/**
 * Math Utilities
 * 
 * Common mathematical utility functions
 */

/**
 * Mathematical constants
 */
export const MathConstants = {
  /** Pi */
  PI: Math.PI,
  
  /** Two Pi (Tau) */
  TWO_PI: Math.PI * 2,
  
  /** Half Pi */
  HALF_PI: Math.PI / 2,
  
  /** Quarter Pi */
  QUARTER_PI: Math.PI / 4,
  
  /** Degrees to radians multiplier */
  DEG2RAD: Math.PI / 180,
  
  /** Radians to degrees multiplier */
  RAD2DEG: 180 / Math.PI,
  
  /** Epsilon for floating point comparisons */
  EPSILON: 0.000001,
  
  /** Golden ratio */
  GOLDEN_RATIO: 1.618033988749895,
  
  /** Euler's number */
  E: Math.E,
  
  /** Square root of 2 */
  SQRT2: Math.SQRT2,
  
  /** Square root of 1/2 */
  SQRT1_2: Math.SQRT1_2
} as const;

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between a and b
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Inverse linear interpolation
 */
export function inverseLerp(a: number, b: number, value: number): number {
  return (value - a) / (b - a);
}

/**
 * Remap a value from one range to another
 */
export function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const t = inverseLerp(inMin, inMax, value);
  return lerp(outMin, outMax, t);
}

/**
 * Smooth step interpolation (3rd order)
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Smoother step interpolation (5th order)
 */
export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * MathConstants.DEG2RAD;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * MathConstants.RAD2DEG;
}

/**
 * Check if two numbers are approximately equal
 */
export function approximately(a: number, b: number, epsilon: number = MathConstants.EPSILON): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Sign function (-1, 0, or 1)
 */
export function sign(value: number): number {
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}

/**
 * Wrap a value between min and max
 */
export function wrap(value: number, min: number, max: number): number {
  const range = max - min;
  return value - range * Math.floor((value - min) / range);
}

/**
 * Ping-pong a value between 0 and length
 */
export function pingPong(t: number, length: number): number {
  t = wrap(t, 0, length * 2);
  return length - Math.abs(t - length);
}

/**
 * Move towards a target value
 */
export function moveTowards(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }
  return current + sign(target - current) * maxDelta;
}

/**
 * Smooth damp (spring-like interpolation)
 */
export function smoothDamp(
  current: number,
  target: number,
  currentVelocity: { value: number },
  smoothTime: number,
  maxSpeed: number = Infinity,
  deltaTime: number
): number {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  
  let change = current - target;
  const originalTo = target;
  
  const maxChange = maxSpeed * smoothTime;
  change = clamp(change, -maxChange, maxChange);
  target = current - change;
  
  const temp = (currentVelocity.value + omega * change) * deltaTime;
  currentVelocity.value = (currentVelocity.value - omega * temp) * exp;
  
  let output = target + (change + temp) * exp;
  
  if (originalTo - current > 0 === output > originalTo) {
    output = originalTo;
    currentVelocity.value = (output - originalTo) / deltaTime;
  }
  
  return output;
}

/**
 * Repeat a value between 0 and length
 */
export function repeat(t: number, length: number): number {
  return clamp(t - Math.floor(t / length) * length, 0, length);
}

/**
 * Delta angle (shortest angle between two angles)
 */
export function deltaAngle(current: number, target: number): number {
  let delta = repeat(target - current, 360);
  if (delta > 180) {
    delta -= 360;
  }
  return delta;
}

/**
 * Lerp angle (shortest path)
 */
export function lerpAngle(a: number, b: number, t: number): number {
  let delta = repeat(b - a, 360);
  if (delta > 180) {
    delta -= 360;
  }
  return a + delta * clamp(t, 0, 1);
}

/**
 * Move towards angle
 */
export function moveTowardsAngle(current: number, target: number, maxDelta: number): number {
  const delta = deltaAngle(current, target);
  if (-maxDelta < delta && delta < maxDelta) {
    return target;
  }
  target = current + delta;
  return moveTowards(current, target, maxDelta);
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(angle: number): number {
  return wrap(angle, 0, 360);
}

/**
 * Normalize angle to -180 to 180 range
 */
export function normalizeAngleSigned(angle: number): number {
  angle = normalizeAngle(angle);
  if (angle > 180) {
    angle -= 360;
  }
  return angle;
}

/**
 * Random number between min and max
 */
export function random(min: number = 0, max: number = 1): number {
  return min + Math.random() * (max - min);
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1));
}

/**
 * Random boolean
 */
export function randomBool(): boolean {
  return Math.random() < 0.5;
}

/**
 * Random sign (-1 or 1)
 */
export function randomSign(): number {
  return randomBool() ? 1 : -1;
}

/**
 * Random from array
 */
export function randomFrom<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

/**
 * Gaussian random (normal distribution)
 */
export function randomGaussian(mean: number = 0, stdDev: number = 1): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Seeded random number generator
 */
export class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
}

/**
 * Perlin noise (simplified 1D)
 */
export class PerlinNoise {
  private permutation: number[];
  
  constructor(seed: number = 0) {
    this.permutation = this.generatePermutation(seed);
  }
  
  private generatePermutation(seed: number): number[] {
    const rng = new SeededRandom(seed);
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    // Shuffle
    for (let i = 255; i > 0; i--) {
      const j = rng.int(0, i);
      [p[i], p[j]] = [p[j], p[i]];
    }
    return [...p, ...p]; // Duplicate for wrapping
  }
  
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  noise(x: number): number {
    const X = Math.floor(x) & 255;
    x -= Math.floor(x);
    const u = this.fade(x);
    
    const a = this.permutation[X];
    const b = this.permutation[X + 1];
    
    return lerp(a / 255, b / 255, u) * 2 - 1;
  }
}

/**
 * Calculate factorial
 */
export function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

/**
 * Calculate binomial coefficient
 */
export function binomial(n: number, k: number): number {
  return factorial(n) / (factorial(k) * factorial(n - k));
}

/**
 * Calculate power of 2
 */
export function isPowerOfTwo(value: number): boolean {
  return (value & (value - 1)) === 0 && value !== 0;
}

/**
 * Next power of 2
 */
export function nextPowerOfTwo(value: number): number {
  value--;
  value |= value >> 1;
  value |= value >> 2;
  value |= value >> 4;
  value |= value >> 8;
  value |= value >> 16;
  value++;
  return value;
}

/**
 * Previous power of 2
 */
export function prevPowerOfTwo(value: number): number {
  return nextPowerOfTwo(value) >> 1;
}

/**
 * Round to nearest multiple
 */
export function roundToNearest(value: number, multiple: number): number {
  return Math.round(value / multiple) * multiple;
}

/**
 * Floor to nearest multiple
 */
export function floorToNearest(value: number, multiple: number): number {
  return Math.floor(value / multiple) * multiple;
}

/**
 * Ceil to nearest multiple
 */
export function ceilToNearest(value: number, multiple: number): number {
  return Math.ceil(value / multiple) * multiple;
}
