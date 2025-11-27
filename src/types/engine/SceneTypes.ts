/**
 * Scene Management Type Definitions
 * 
 * Types for the scene graph system which manages hierarchical
 * organization of game objects and their transforms.
 */

/**
 * Scene state
 */
export enum SceneState {
  UNLOADED = 'UNLOADED',
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  UNLOADING = 'UNLOADING',
  ERROR = 'ERROR'
}

/**
 * Scene configuration
 */
export interface SceneConfig {
  name: string;
  description?: string;
  preload?: boolean;
  persistent?: boolean;
  physics?: boolean;
  fog?: FogConfig;
  ambient?: AmbientConfig;
}

/**
 * Fog configuration
 */
export interface FogConfig {
  enabled: boolean;
  color: number;
  near: number;
  far: number;
  density?: number;
}

/**
 * Ambient configuration
 */
export interface AmbientConfig {
  color: number;
  intensity: number;
}

/**
 * Scene metadata
 */
export interface SceneMetadata {
  name: string;
  description: string;
  version: string;
  author?: string;
  created: Date;
  modified: Date;
}

/**
 * Scene node (entity in scene graph)
 */
export interface ISceneNode {
  id: string;
  name: string;
  parent: ISceneNode | null;
  children: ISceneNode[];
  active: boolean;
  
  // Lifecycle
  initialize(): void;
  update(deltaTime: number): void;
  destroy(): void;
  
  // Hierarchy
  addChild(child: ISceneNode): void;
  removeChild(child: ISceneNode): void;
  getChild(name: string): ISceneNode | null;
  getChildren(): ISceneNode[];
  isActiveInHierarchy(): boolean;
  
  // Transform
  getWorldPosition(): [number, number, number];
  getWorldRotation(): [number, number, number, number];
  getWorldScale(): [number, number, number];
}

/**
 * Scene interface
 */
export interface IScene {
  name: string;
  state: SceneState;
  config: SceneConfig;
  
  // Lifecycle
  load(): Promise<void>;
  unload(): Promise<void>;
  activate(): void;
  deactivate(): void;
  
  // Scene graph
  getRootNode(): ISceneNode;
  addNode(node: ISceneNode, parent?: ISceneNode): void;
  removeNode(node: ISceneNode): void;
  findNode(name: string): ISceneNode | null;
  findNodeById(id: string): ISceneNode | null;
  
  // Update
  update(deltaTime: number): void;
  
  // Queries
  getNodeCount(): number;
  getActiveNodeCount(): number;
}

/**
 * Scene transition types
 */
export enum SceneTransitionType {
  NONE = 'NONE',
  FADE = 'FADE',
  SLIDE = 'SLIDE',
  CROSSFADE = 'CROSSFADE'
}

/**
 * Scene transition configuration
 */
export interface SceneTransitionConfig {
  type: SceneTransitionType;
  duration: number;
  easing?: (t: number) => number;
}

/**
 * Scene manager events
 */
export enum SceneEventType {
  SCENE_REGISTERED = 'scene:registered',
  SCENE_LOADING = 'scene:loading',
  SCENE_LOADED = 'scene:loaded',
  SCENE_ACTIVATED = 'scene:activated',
  SCENE_DEACTIVATED = 'scene:deactivated',
  SCENE_UNLOADING = 'scene:unloading',
  SCENE_UNLOADED = 'scene:unloaded',
  SCENE_ERROR = 'scene:error',
  TRANSITION_START = 'scene:transition:start',
  TRANSITION_END = 'scene:transition:end'
}

/**
 * Scene event data
 */
export interface SceneEvent {
  sceneName: string;
  state: SceneState;
  error?: Error;
}

/**
 * Scene layer (for rendering order)
 */
export enum SceneLayer {
  BACKGROUND = 0,
  ENVIRONMENT = 100,
  WORLD = 200,
  ENTITIES = 300,
  EFFECTS = 400,
  UI = 500,
  OVERLAY = 600
}

/**
 * Scene query options
 */
export interface SceneQueryOptions {
  name?: string;
  tag?: string;
  layer?: SceneLayer;
  active?: boolean;
  recursive?: boolean;
}

/**
 * Scene statistics
 */
export interface SceneStats {
  totalNodes: number;
  activeNodes: number;
  visibleNodes: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
}
