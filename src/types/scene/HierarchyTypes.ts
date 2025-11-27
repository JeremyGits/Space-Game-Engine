/**
 * Hierarchy Types
 * 
 * Type definitions for scene hierarchy management
 */

import { ISceneNode } from './NodeTypes';

/**
 * Hierarchy traversal order
 */
export enum TraversalOrder {
  /** Depth-first pre-order */
  DEPTH_FIRST_PRE = 'depth-first-pre',
  
  /** Depth-first post-order */
  DEPTH_FIRST_POST = 'depth-first-post',
  
  /** Breadth-first */
  BREADTH_FIRST = 'breadth-first'
}

/**
 * Hierarchy update mode
 */
export enum HierarchyUpdateMode {
  /** Update only if dirty */
  DIRTY_ONLY = 'dirty-only',
  
  /** Force update all */
  FORCE_ALL = 'force-all',
  
  /** Update from root */
  FROM_ROOT = 'from-root'
}

/**
 * Transform space
 */
export enum TransformSpace {
  /** Local space (relative to parent) */
  LOCAL = 'local',
  
  /** World space (absolute) */
  WORLD = 'world',
  
  /** Parent space */
  PARENT = 'parent'
}

/**
 * Hierarchy node data
 */
export interface HierarchyNodeData {
  /** Node reference */
  node: ISceneNode;
  
  /** Depth in hierarchy */
  depth: number;
  
  /** Index in parent's children */
  siblingIndex: number;
  
  /** Number of descendants */
  descendantCount: number;
  
  /** Is leaf node */
  isLeaf: boolean;
  
  /** Is root node */
  isRoot: boolean;
}

/**
 * Transform hierarchy
 */
export interface TransformHierarchy {
  /** Root nodes */
  roots: ISceneNode[];
  
  /** All nodes (flat list) */
  allNodes: ISceneNode[];
  
  /** Node lookup by ID */
  nodeMap: Map<string, ISceneNode>;
  
  /** Dirty nodes (need transform update) */
  dirtyNodes: Set<string>;
  
  /** Update mode */
  updateMode: HierarchyUpdateMode;
}

/**
 * Parent-child relationship
 */
export interface ParentChildRelationship {
  /** Parent node ID */
  parentId: string;
  
  /** Child node ID */
  childId: string;
  
  /** Child index in parent's children array */
  childIndex: number;
  
  /** Relationship timestamp */
  timestamp: number;
}

/**
 * Hierarchy change event
 */
export interface HierarchyChangeEvent {
  /** Event type */
  type: 'added' | 'removed' | 'moved' | 'reordered';
  
  /** Affected node */
  node: ISceneNode;
  
  /** Old parent (for moved/removed) */
  oldParent?: ISceneNode;
  
  /** New parent (for added/moved) */
  newParent?: ISceneNode;
  
  /** Old index */
  oldIndex?: number;
  
  /** New index */
  newIndex?: number;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * Hierarchy query options
 */
export interface HierarchyQueryOptions {
  /** Include inactive nodes */
  includeInactive?: boolean;
  
  /** Include invisible nodes */
  includeInvisible?: boolean;
  
  /** Maximum depth (-1 for unlimited) */
  maxDepth?: number;
  
  /** Layer mask filter */
  layerMask?: number;
  
  /** Node type filter */
  typeFilter?: string[];
  
  /** Custom filter predicate */
  customFilter?: (node: ISceneNode) => boolean;
}

/**
 * Hierarchy statistics
 */
export interface HierarchyStatistics {
  /** Total nodes */
  totalNodes: number;
  
  /** Root nodes */
  rootNodes: number;
  
  /** Leaf nodes */
  leafNodes: number;
  
  /** Maximum depth */
  maxDepth: number;
  
  /** Average depth */
  averageDepth: number;
  
  /** Active nodes */
  activeNodes: number;
  
  /** Visible nodes */
  visibleNodes: number;
  
  /** Dirty nodes */
  dirtyNodes: number;
  
  /** Nodes by type */
  nodesByType: Map<string, number>;
}

/**
 * Transform propagation options
 */
export interface TransformPropagationOptions {
  /** Propagate to children */
  propagateToChildren?: boolean;
  
  /** Update world matrix */
  updateWorldMatrix?: boolean;
  
  /** Update bounds */
  updateBounds?: boolean;
  
  /** Notify listeners */
  notifyListeners?: boolean;
  
  /** Force update even if not dirty */
  forceUpdate?: boolean;
}

/**
 * Hierarchy operation result
 */
export interface HierarchyOperationResult {
  /** Operation succeeded */
  success: boolean;
  
  /** Affected nodes */
  affectedNodes: ISceneNode[];
  
  /** Error message (if failed) */
  error?: string;
  
  /** Operation duration (milliseconds) */
  duration: number;
}
