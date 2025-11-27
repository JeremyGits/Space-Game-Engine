/**
 * Vector2
 * 
 * 2D vector class with comprehensive mathematical operations
 */

export class Vector2 {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static one(): Vector2 {
    return new Vector2(1, 1);
  }

  static up(): Vector2 {
    return new Vector2(0, 1);
  }

  static down(): Vector2 {
    return new Vector2(0, -1);
  }

  static left(): Vector2 {
    return new Vector2(-1, 0);
  }

  static right(): Vector2 {
    return new Vector2(1, 0);
  }

  static fromAngle(angle: number, length: number = 1): Vector2 {
    return new Vector2(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  static random(minLength: number = 0, maxLength: number = 1): Vector2 {
    const angle = Math.random() * Math.PI * 2;
    const length = minLength + Math.random() * (maxLength - minLength);
    return Vector2.fromAngle(angle, length);
  }

  // ============================================================================
  // Basic Operations
  // ============================================================================

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  setScalar(scalar: number): this {
    this.x = scalar;
    this.y = scalar;
    return this;
  }

  copy(v: Vector2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  // ============================================================================
  // Arithmetic Operations
  // ============================================================================

  add(v: Vector2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  addScalar(s: number): this {
    this.x += s;
    this.y += s;
    return this;
  }

  addVectors(a: Vector2, b: Vector2): this {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    return this;
  }

  sub(v: Vector2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  subScalar(s: number): this {
    this.x -= s;
    this.y -= s;
    return this;
  }

  subVectors(a: Vector2, b: Vector2): this {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    return this;
  }

  multiply(v: Vector2): this {
    this.x *= v.x;
    this.y *= v.y;
    return this;
  }

  multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  divide(v: Vector2): this {
    this.x /= v.x;
    this.y /= v.y;
    return this;
  }

  divideScalar(scalar: number): this {
    return this.multiplyScalar(1 / scalar);
  }

  negate(): this {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }

  // ============================================================================
  // Vector Operations
  // ============================================================================

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: Vector2): number {
    return this.x * v.y - this.y * v.x;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  length(): number {
    return Math.sqrt(this.lengthSq());
  }

  manhattanLength(): number {
    return Math.abs(this.x) + Math.abs(this.y);
  }

  normalize(): this {
    const len = this.length();
    if (len > 0) {
      return this.divideScalar(len);
    }
    return this;
  }

  setLength(length: number): this {
    return this.normalize().multiplyScalar(length);
  }

  // ============================================================================
  // Interpolation
  // ============================================================================

  lerp(v: Vector2, alpha: number): this {
    this.x += (v.x - this.x) * alpha;
    this.y += (v.y - this.y) * alpha;
    return this;
  }

  lerpVectors(v1: Vector2, v2: Vector2, alpha: number): this {
    this.x = v1.x + (v2.x - v1.x) * alpha;
    this.y = v1.y + (v2.y - v1.y) * alpha;
    return this;
  }

  // ============================================================================
  // Distance & Angle
  // ============================================================================

  distanceTo(v: Vector2): number {
    return Math.sqrt(this.distanceToSquared(v));
  }

  distanceToSquared(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  manhattanDistanceTo(v: Vector2): number {
    return Math.abs(this.x - v.x) + Math.abs(this.y - v.y);
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  angleTo(v: Vector2): number {
    const denominator = Math.sqrt(this.lengthSq() * v.lengthSq());
    if (denominator === 0) return Math.PI / 2;
    const theta = this.dot(v) / denominator;
    return Math.acos(Math.max(-1, Math.min(1, theta)));
  }

  // ============================================================================
  // Rotation
  // ============================================================================

  rotate(angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.x = x;
    this.y = y;
    return this;
  }

  rotateAround(center: Vector2, angle: number): this {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x - center.x;
    const y = this.y - center.y;
    this.x = x * cos - y * sin + center.x;
    this.y = x * sin + y * cos + center.y;
    return this;
  }

  // ============================================================================
  // Clamping & Rounding
  // ============================================================================

  min(v: Vector2): this {
    this.x = Math.min(this.x, v.x);
    this.y = Math.min(this.y, v.y);
    return this;
  }

  max(v: Vector2): this {
    this.x = Math.max(this.x, v.x);
    this.y = Math.max(this.y, v.y);
    return this;
  }

  clamp(min: Vector2, max: Vector2): this {
    this.x = Math.max(min.x, Math.min(max.x, this.x));
    this.y = Math.max(min.y, Math.min(max.y, this.y));
    return this;
  }

  clampScalar(minVal: number, maxVal: number): this {
    this.x = Math.max(minVal, Math.min(maxVal, this.x));
    this.y = Math.max(minVal, Math.min(maxVal, this.y));
    return this;
  }

  clampLength(min: number, max: number): this {
    const length = this.length();
    return this.divideScalar(length || 1).multiplyScalar(
      Math.max(min, Math.min(max, length))
    );
  }

  floor(): this {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    return this;
  }

  ceil(): this {
    this.x = Math.ceil(this.x);
    this.y = Math.ceil(this.y);
    return this;
  }

  round(): this {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    return this;
  }

  roundToZero(): this {
    this.x = this.x < 0 ? Math.ceil(this.x) : Math.floor(this.x);
    this.y = this.y < 0 ? Math.ceil(this.y) : Math.floor(this.y);
    return this;
  }

  // ============================================================================
  // Reflection & Projection
  // ============================================================================

  reflect(normal: Vector2): this {
    const dot = this.dot(normal);
    return this.sub(normal.clone().multiplyScalar(2 * dot));
  }

  project(v: Vector2): this {
    const denominator = v.lengthSq();
    if (denominator === 0) return this.set(0, 0);
    const scalar = v.dot(this) / denominator;
    return this.copy(v).multiplyScalar(scalar);
  }

  projectOnPlane(planeNormal: Vector2): this {
    const v = this.clone().project(planeNormal);
    return this.sub(v);
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  equals(v: Vector2, epsilon: number = 0): boolean {
    if (epsilon === 0) {
      return this.x === v.x && this.y === v.y;
    }
    return (
      Math.abs(this.x - v.x) <= epsilon &&
      Math.abs(this.y - v.y) <= epsilon
    );
  }

  isZero(epsilon: number = 0): boolean {
    if (epsilon === 0) {
      return this.x === 0 && this.y === 0;
    }
    return this.lengthSq() <= epsilon * epsilon;
  }

  // ============================================================================
  // Conversion
  // ============================================================================

  toArray(array: number[] = [], offset: number = 0): number[] {
    array[offset] = this.x;
    array[offset + 1] = this.y;
    return array;
  }

  fromArray(array: number[], offset: number = 0): this {
    this.x = array[offset];
    this.y = array[offset + 1];
    return this;
  }

  toJSON(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  toString(): string {
    return `Vector2(${this.x}, ${this.y})`;
  }

  // ============================================================================
  // Static Utility Methods
  // ============================================================================

  static add(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x + b.x, a.y + b.y);
  }

  static sub(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  static multiply(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x * b.x, a.y * b.y);
  }

  static divide(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x / b.x, a.y / b.y);
  }

  static dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  }

  static cross(a: Vector2, b: Vector2): number {
    return a.x * b.y - a.y * b.x;
  }

  static distance(a: Vector2, b: Vector2): number {
    return Math.sqrt(Vector2.distanceSquared(a, b));
  }

  static distanceSquared(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return new Vector2(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }

  static min(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(Math.min(a.x, b.x), Math.min(a.y, b.y));
  }

  static max(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(Math.max(a.x, b.x), Math.max(a.y, b.y));
  }
}
