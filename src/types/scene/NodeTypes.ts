/**
 * Node Types
 * 
 * Type definitions for scene graph nodes
 */

import { Vector3 } from '../../utils/math/Vector3';
import { Quaternion } from '../../utils/math/Quaternion';
import { Matrix4 } from '../../utils/math/Matrix4';

/**
 * Scene node interface
 */
export interface ISceneNode {
  /** Unique node ID */
  id: string;
  
  /** Node name */
  name: string;
  
  /** Node type */
  type: NodeType;
  
  /** Parent node */
  parent: ISceneNode | null;
  
  /** Child nodes */
  children: ISceneNode[];
  
  /** Local transform */
  transform: NodeTransform;
  
  /** World transform (cached) */
  worldTransform: NodeTransform;
  
  /** World matrix (cached) */
  worldMatrix: Matrix4;
  
  /** Is active */
  active: boolean;
  
  /** Is visible */
  visible: boolean;
  
  /** Layer mask */
  layer: number;
  
  /** User data */
  userData: Record<string, any>;
}

/**
 * Node type
 */
export enum NodeType {
  EMPTY = 'empty',
  MESH = 'mesh',
  LIGHT = 'light',
  CAMERA = 'camera',
  GROUP = 'group',
  BONE = 'bone',
  PARTICLE_SYSTEM = 'particle-system',
  AUDIO_SOURCE = 'audio-source'
}

/**
 * Node transform
 */
export interface NodeTransform {
  /** Position */
  position: Vector3;
  
  /** Rotation (quaternion) */
  rotation: Quaternion;
  
  /** Scale */
  scale: Vector3;
  
  /** Transform matrix (cached) */
  matrix: Matrix4;
  
  /** Is matrix dirty */
  matrixNeedsUpdate: boolean;
}

/**
 * Node bounds
 */
export interface NodeBounds {
  /** Bounding box min */
  min: Vector3;
  
  /** Bounding box max */
  max: Vector3;
  
  /** Bounding sphere center */
  center: Vector3;
  
  /** Bounding sphere radius */
  radius: number;
  
  /** Is bounds dirty */
  needsUpdate: boolean;
}

/**
 * Node visibility info
 */
export interface NodeVisibility {
  /** Is in frustum */
  inFrustum: boolean;
  
  /** Is occluded */
  occluded: boolean;
  
  /** Distance to camera */
  distanceToCamera: number;
  
  /** LOD level */
  lodLevel: number;
  
  /** Last visibility check frame */
  lastCheckFrame: number;
}

/**
 * Node update flags
 */
export interface NodeUpdateFlags {
  /** Transform changed */
  transformChanged: boolean;
  
  /** Bounds changed */
  boundsChanged: boolean;
  
  /** Visibility changed */
  visibilityChanged: boolean;
  
  /** Material changed */
  materialChanged: boolean;
  
  /** Geometry changed */
  geometryChanged: boolean;
}

/**
 * Node traversal callback
 */
export type NodeTraversalCallback = (node: ISceneNode) => boolean | void;

/**
 * Node filter predicate
 */
export type NodeFilterPredicate = (node: ISceneNode) => boolean;

/**
 * Node comparison function
 */
export type NodeComparator = (a: ISceneNode, b: ISceneNode) => number;

/**
 * Node event types
 */
export enum NodeEventType {
  ADDED = 'added',
  REMOVED = 'removed',
  PARENT_CHANGED = 'parent-changed',
  TRANSFORM_CHANGED = 'transform-changed',
  VISIBILITY_CHANGED = 'visibility-changed',
  ACTIVE_CHANGED = 'active-changed'
}

/**
 * Node event
 */
export interface NodeEvent {
  /** Event type */
  type: NodeEventType;
  
  /** Target node */
  target: ISceneNode;
  
  /** Event data */
  data?: any;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * Node creation options
 */
export interface NodeCreationOptions {
  /** Node name */
  name?: string;
  
  /** Node type */
  type?: NodeType;
  
  /** Initial position */
  position?: Vector3;
  
  /** Initial rotation */
  rotation?: Quaternion;
  
  /** Initial scale */
  scale?: Vector3;
  
  /** Parent node */
  parent?: ISceneNode;
  
  /** Is active */
  active?: boolean;
  
  /** Is visible */
  visible?: boolean;
  
  /** Layer */
  layer?: number;
  
  /** User data */
  userData?: Record<string, any>;
}
