/**
 * Animation System Types
 * Complete type definitions for skeletal animation, rigging, and playback
 */

import { Quaternion } from '../../utils/math/Quaternion';
import { Vector3 } from '../../utils/math/Vector3';
import * as THREE from 'three';

/**
 * Bone in a skeleton hierarchy
 */
export interface Bone {
  id: string;
  name: string;
  parentId: string | null;
  children: string[];
  
  // Transform data
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  
  // Bind pose (rest position)
  bindPosition: Vector3;
  bindRotation: Quaternion;
  bindScale: Vector3;
  
  // Matrices
  localMatrix: THREE.Matrix4;
  worldMatrix: THREE.Matrix4;
  inverseBindMatrix: THREE.Matrix4;
}

/**
 * Skeleton - collection of bones
 */
export interface Skeleton {
  id: string;
  name: string;
  bones: Map<string, Bone>;
  boneArray: Bone[];
  rootBoneId: string;
  
  bindPose: Map<string, {
    position: Vector3;
    rotation: Quaternion;
    scale: Vector3;
  }>;
}

/**
 * Interpolation types
 */
export enum InterpolationType {
  LINEAR = 'linear',
  STEP = 'step',
  CUBIC = 'cubic',
  SPHERICAL_LINEAR = 'slerp'
}

/**
 * Keyframe for animation
 */
export interface Keyframe<T> {
  time: number;
  value: T;
  interpolation: InterpolationType;
  inTangent?: T;
  outTangent?: T;
}

/**
 * Animation track
 */
export interface AnimationTrack<T = any> {
  id: string;
  targetId: string;
  property: string;
  keyframes: Keyframe<T>[];
  interpolation: InterpolationType;
}

/**
 * Blend modes
 */
export enum BlendMode {
  OVERRIDE = 'override',
  ADDITIVE = 'additive',
  BLEND = 'blend'
}

/**
 * Animation clip
 */
export interface AnimationClip {
  id: string;
  name: string;
  duration: number;
  tracks: AnimationTrack[];
  fps: number;
  loop: boolean;
  blendMode: BlendMode;
}

/**
 * Animation action
 */
export interface AnimationAction {
  id: string;
  clip: AnimationClip;
  isPlaying: boolean;
  isPaused: boolean;
  time: number;
  timeScale: number;
  weight: number;
  loop: boolean;
  repetitions: number;
  clampWhenFinished: boolean;
  fadeInDuration: number;
  fadeOutDuration: number;
  onStart?: () => void;
  onComplete?: () => void;
  onLoop?: () => void;
}

/**
 * Animation mixer
 */
export interface AnimationMixer {
  id: string;
  skeleton: Skeleton;
  actions: Map<string, AnimationAction>;
  activeActions: AnimationAction[];
  blendTree?: BlendTree;
  time: number;
  timeScale: number;
}

/**
 * Blend node types
 */
export enum BlendNodeType {
  CLIP = 'clip',
  BLEND_1D = 'blend1d',
  BLEND_2D = 'blend2d',
  ADDITIVE = 'additive',
  OVERRIDE = 'override'
}

/**
 * Blend tree node
 */
export interface BlendNode {
  id: string;
  type: BlendNodeType;
  name: string;
  clip?: AnimationClip;
  children?: BlendNode[];
  blendParameter?: string;
  blendValue?: number;
  positions?: Vector3[];
  weight: number;
}

/**
 * Blend tree
 */
export interface BlendTree {
  id: string;
  name: string;
  rootNode: BlendNode;
  parameters: Map<string, number>;
}

/**
 * Animation state
 */
export interface AnimationState {
  id: string;
  name: string;
  clip: AnimationClip;
  speed: number;
  loop: boolean;
  transitions: AnimationTransition[];
}

/**
 * Condition operators
 */
export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER = 'greater',
  LESS = 'less',
  GREATER_EQUAL = 'greaterEqual',
  LESS_EQUAL = 'lessEqual'
}

/**
 * Transition condition
 */
export interface TransitionCondition {
  parameter: string;
  operator: ConditionOperator;
  value: number | boolean | string;
}

/**
 * Animation transition
 */
export interface AnimationTransition {
  id: string;
  fromState: string;
  toState: string;
  duration: number;
  conditions: TransitionCondition[];
  hasExitTime: boolean;
  exitTime: number;
  offset: number;
}

/**
 * Animation state machine
 */
export interface AnimationStateMachine {
  id: string;
  name: string;
  states: Map<string, AnimationState>;
  currentState: AnimationState | null;
  previousState: AnimationState | null;
  isTransitioning: boolean;
  transitionProgress: number;
  currentTransition: AnimationTransition | null;
  parameters: Map<string, number | boolean | string>;
}

/**
 * IK (Inverse Kinematics) types
 */
export enum IKSolverType {
  TWO_BONE = 'two_bone',
  LOOK_AT = 'look_at',
  FABRIK = 'fabrik',
  CCD = 'ccd'
}

/**
 * IK chain
 */
export interface IKChain {
  id: string;
  bones: string[];
  target: Vector3;
  poleTarget?: Vector3;
  solverType: IKSolverType;
  iterations: number;
  tolerance: number;
}

/**
 * Skinned mesh data
 */
export interface SkinnedMeshData {
  geometry: THREE.BufferGeometry;
  skeleton: Skeleton;
  skinIndices: Float32Array;
  skinWeights: Float32Array;
  maxBoneInfluences: number;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  enableGPUSkinning: boolean;
  maxBones: number;
  maxBoneInfluences: number;
  updateRate: number;
  enableIK: boolean;
  ikIterations: number;
}
