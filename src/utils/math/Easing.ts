/**
 * Easing Functions
 * 
 * Collection of easing functions for smooth animations
 * Based on Robert Penner's easing equations
 */

/**
 * Easing function type
 */
export type EasingFunction = (t: number) => number;

/**
 * Linear easing (no easing)
 */
export function linear(t: number): number {
  return t;
}

// ============================================================================
// QUADRATIC EASING
// ============================================================================

export function quadIn(t: number): number {
  return t * t;
}

export function quadOut(t: number): number {
  return t * (2 - t);
}

export function quadInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ============================================================================
// CUBIC EASING
// ============================================================================

export function cubicIn(t: number): number {
  return t * t * t;
}

export function cubicOut(t: number): number {
  const t1 = t - 1;
  return t1 * t1 * t1 + 1;
}

export function cubicInOut(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

// ============================================================================
// QUARTIC EASING
// ============================================================================

export function quartIn(t: number): number {
  return t * t * t * t;
}

export function quartOut(t: number): number {
  const t1 = t - 1;
  return 1 - t1 * t1 * t1 * t1;
}

export function quartInOut(t: number): number {
  const t1 = t - 1;
  return t < 0.5
    ? 8 * t * t * t * t
    : 1 - 8 * t1 * t1 * t1 * t1;
}

// ============================================================================
// QUINTIC EASING
// ============================================================================

export function quintIn(t: number): number {
  return t * t * t * t * t;
}

export function quintOut(t: number): number {
  const t1 = t - 1;
  return 1 + t1 * t1 * t1 * t1 * t1;
}

export function quintInOut(t: number): number {
  const t1 = t - 1;
  return t < 0.5
    ? 16 * t * t * t * t * t
    : 1 + 16 * t1 * t1 * t1 * t1 * t1;
}

// ============================================================================
// SINUSOIDAL EASING
// ============================================================================

export function sineIn(t: number): number {
  return 1 - Math.cos(t * Math.PI / 2);
}

export function sineOut(t: number): number {
  return Math.sin(t * Math.PI / 2);
}

export function sineInOut(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

// ============================================================================
// EXPONENTIAL EASING
// ============================================================================

export function expoIn(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
}

export function expoOut(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function expoInOut(t: number): number {
  if (t === 0 || t === 1) return t;
  
  if (t < 0.5) {
    return Math.pow(2, 20 * t - 10) / 2;
  }
  return (2 - Math.pow(2, -20 * t + 10)) / 2;
}

// ============================================================================
// CIRCULAR EASING
// ============================================================================

export function circIn(t: number): number {
  return 1 - Math.sqrt(1 - t * t);
}

export function circOut(t: number): number {
  const t1 = t - 1;
  return Math.sqrt(1 - t1 * t1);
}

export function circInOut(t: number): number {
  if (t < 0.5) {
    return (1 - Math.sqrt(1 - 4 * t * t)) / 2;
  }
  const t1 = 2 * t - 2;
  return (Math.sqrt(1 - t1 * t1) + 1) / 2;
}

// ============================================================================
// ELASTIC EASING
// ============================================================================

export function elasticIn(t: number): number {
  if (t === 0 || t === 1) return t;
  
  const p = 0.3;
  const s = p / 4;
  const t1 = t - 1;
  
  return -(Math.pow(2, 10 * t1) * Math.sin((t1 - s) * (2 * Math.PI) / p));
}

export function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t;
  
  const p = 0.3;
  const s = p / 4;
  
  return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
}

export function elasticInOut(t: number): number {
  if (t === 0 || t === 1) return t;
  
  const p = 0.3 * 1.5;
  const s = p / 4;
  const t1 = 2 * t - 1;
  
  if (t1 < 0) {
    return -0.5 * (Math.pow(2, 10 * t1) * Math.sin((t1 - s) * (2 * Math.PI) / p));
  }
  return Math.pow(2, -10 * t1) * Math.sin((t1 - s) * (2 * Math.PI) / p) * 0.5 + 1;
}

// ============================================================================
// BACK EASING
// ============================================================================

export function backIn(t: number): number {
  const s = 1.70158;
  return t * t * ((s + 1) * t - s);
}

export function backOut(t: number): number {
  const s = 1.70158;
  const t1 = t - 1;
  return t1 * t1 * ((s + 1) * t1 + s) + 1;
}

export function backInOut(t: number): number {
  const s = 1.70158 * 1.525;
  const t1 = t * 2;
  
  if (t1 < 1) {
    return 0.5 * (t1 * t1 * ((s + 1) * t1 - s));
  }
  
  const t2 = t1 - 2;
  return 0.5 * (t2 * t2 * ((s + 1) * t2 + s) + 2);
}

// ============================================================================
// BOUNCE EASING
// ============================================================================

export function bounceOut(t: number): number {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t;
  } else if (t < 2 / 2.75) {
    const t1 = t - 1.5 / 2.75;
    return 7.5625 * t1 * t1 + 0.75;
  } else if (t < 2.5 / 2.75) {
    const t1 = t - 2.25 / 2.75;
    return 7.5625 * t1 * t1 + 0.9375;
  } else {
    const t1 = t - 2.625 / 2.75;
    return 7.5625 * t1 * t1 + 0.984375;
  }
}

export function bounceIn(t: number): number {
  return 1 - bounceOut(1 - t);
}

export function bounceInOut(t: number): number {
  if (t < 0.5) {
    return bounceIn(t * 2) * 0.5;
  }
  return bounceOut(t * 2 - 1) * 0.5 + 0.5;
}

// ============================================================================
// EASING COLLECTION
// ============================================================================

/**
 * Collection of all easing functions
 */
export const Easing = {
  // Linear
  linear,
  
  // Quadratic
  quadIn,
  quadOut,
  quadInOut,
  
  // Cubic
  cubicIn,
  cubicOut,
  cubicInOut,
  
  // Quartic
  quartIn,
  quartOut,
  quartInOut,
  
  // Quintic
  quintIn,
  quintOut,
  quintInOut,
  
  // Sinusoidal
  sineIn,
  sineOut,
  sineInOut,
  
  // Exponential
  expoIn,
  expoOut,
  expoInOut,
  
  // Circular
  circIn,
  circOut,
  circInOut,
  
  // Elastic
  elasticIn,
  elasticOut,
  elasticInOut,
  
  // Back
  backIn,
  backOut,
  backInOut,
  
  // Bounce
  bounceIn,
  bounceOut,
  bounceInOut
} as const;

/**
 * Easing names for easy reference
 */
export type EasingName = keyof typeof Easing;

/**
 * Get easing function by name
 */
export function getEasing(name: EasingName): EasingFunction {
  return Easing[name];
}

/**
 * Apply easing to a value
 */
export function ease(value: number, easingFn: EasingFunction | EasingName): number {
  const fn = typeof easingFn === 'string' ? getEasing(easingFn) : easingFn;
  return fn(value);
}

/**
 * Create a custom easing function with parameters
 */
export function createCustomEasing(
  type: 'elastic' | 'back',
  params: { amplitude?: number; period?: number; overshoot?: number }
): EasingFunction {
  if (type === 'elastic') {
    const amplitude = params.amplitude ?? 1;
    const period = params.period ?? 0.3;
    
    return (t: number) => {
      if (t === 0 || t === 1) return t;
      const s = period / 4;
      const t1 = t - 1;
      return -(amplitude * Math.pow(2, 10 * t1) * Math.sin((t1 - s) * (2 * Math.PI) / period));
    };
  } else if (type === 'back') {
    const overshoot = params.overshoot ?? 1.70158;
    
    return (t: number) => {
      return t * t * ((overshoot + 1) * t - overshoot);
    };
  }
  
  return linear;
}

/**
 * Chain multiple easing functions
 */
export function chainEasing(...easings: EasingFunction[]): EasingFunction {
  return (t: number) => {
    let result = t;
    for (const easing of easings) {
      result = easing(result);
    }
    return result;
  };
}

/**
 * Reverse an easing function
 */
export function reverseEasing(easing: EasingFunction): EasingFunction {
  return (t: number) => 1 - easing(1 - t);
}

/**
 * Mirror an easing function (in-out from in)
 */
export function mirrorEasing(easing: EasingFunction): EasingFunction {
  return (t: number) => {
    if (t < 0.5) {
      return easing(t * 2) / 2;
    }
    return 1 - easing((1 - t) * 2) / 2;
  };
}
