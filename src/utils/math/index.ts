/**
 * Math Utilities Exports
 * 
 * Central export point for all math utilities.
 */

// Vector classes
export { Vector2 } from './Vector2';
export { Vector3 } from './Vector3';
export { Vector4 } from './Vector4';

// Matrix classes
export { Matrix3 } from './Matrix3';
export { Matrix4 } from './Matrix4';

// Quaternion
export { Quaternion } from './Quaternion';

// Math utilities - export everything from MathUtils
export {
  MathConstants,
  clamp,
  lerp,
  inverseLerp,
  remap,
  smoothstep,
  smootherstep,
  degToRad,
  radToDeg,
  approximately,
  sign,
  wrap,
  pingPong,
  moveTowards,
  smoothDamp,
  repeat,
  deltaAngle,
  lerpAngle,
  moveTowardsAngle,
  normalizeAngle,
  normalizeAngleSigned,
  random,
  randomInt,
  randomBool,
  randomSign,
  randomFrom,
  randomGaussian,
  SeededRandom,
  PerlinNoise,
  factorial,
  binomial,
  isPowerOfTwo,
  nextPowerOfTwo,
  prevPowerOfTwo,
  roundToNearest,
  floorToNearest,
  ceilToNearest
} from './MathUtils';

// Interpolation utilities
export {
  linear,
  hermite,
  catmullRom,
  cubicBezier,
  quadraticBezier,
  cosine,
  acceleration,
  deceleration,
  BezierCurve,
  Spline,
  CatmullRomSpline,
  Interpolation,
  multiLerp,
  smoothMin,
  smoothMax,
  exponentialIn,
  exponentialOut,
  exponentialInOut,
  circularIn,
  circularOut,
  circularInOut
} from './Interpolation';

// Easing functions
export {
  Easing,
  type EasingFunction,
  type EasingName,
  getEasing,
  ease,
  createCustomEasing,
  chainEasing,
  reverseEasing,
  mirrorEasing,
  // Individual easing functions
  linear as easingLinear,
  quadIn,
  quadOut,
  quadInOut,
  cubicIn,
  cubicOut,
  cubicInOut,
  quartIn,
  quartOut,
  quartInOut,
  quintIn,
  quintOut,
  quintInOut,
  sineIn,
  sineOut,
  sineInOut,
  expoIn,
  expoOut,
  expoInOut,
  circIn,
  circOut,
  circInOut,
  elasticIn,
  elasticOut,
  elasticInOut,
  backIn,
  backOut,
  backInOut,
  bounceIn,
  bounceOut,
  bounceInOut
} from './Easing';
