/**
 * Cockpit Blueprint System - Type Definitions
 * Defines the structure for cockpit blueprints that map 2D images to 3D cockpits
 */

import { CockpitComponentCategory } from '../types/CockpitComponentTypes';

/**
 * UV Region - defines a rectangular region in texture space (0-1 normalized)
 */
export interface UVRegion {
  /** X coordinate (0-1, left to right) */
  x: number;
  /** Y coordinate (0-1, top to bottom) */
  y: number;
  /** Width (0-1) */
  width: number;
  /** Height (0-1) */
  height: number;
}

/**
 * Material configuration for a component
 */
export interface MaterialConfig {
  /** Material type */
  type: 'metal' | 'plastic' | 'glass' | 'fabric' | 'rubber' | 'carbon';
  /** Base color tint (optional, defaults to texture color) */
  color?: string;
  /** Metalness (0-1) */
  metalness: number;
  /** Roughness (0-1) */
  roughness: number;
  /** Emissive intensity (0-1) */
  emissive?: number;
  /** Emissive color */
  emissiveColor?: string;
  /** Clearcoat (0-1) */
  clearcoat?: number;
  /** Whether this component should receive shadows */
  receiveShadows?: boolean;
  /** Whether this component should cast shadows */
  castShadows?: boolean;
}

/**
 * 3D Transform - position, rotation, scale in 3D space
 */
export interface Transform3D {
  /** Position [x, y, z] in meters */
  position: [number, number, number];
  /** Rotation [x, y, z] in radians */
  rotation: [number, number, number];
  /** Scale [x, y, z] */
  scale: [number, number, number];
}

/**
 * Cockpit Component - a single piece of the cockpit
 */
export interface CockpitComponent {
  /** Unique identifier */
  id: string;
  /** Component name */
  name: string;
  /** Component type (from CockpitComponentTypes) */
  type: CockpitComponentCategory;
  /** Render layer (0 = hull, 1 = panels, 2 = displays, 3 = controls, 4 = details) */
  layer: number;
  /** UV region in source texture */
  uvRegion: UVRegion;
  /** 3D transform */
  transform: Transform3D;
  /** Material configuration */
  material: MaterialConfig;
  /** Geometry type */
  geometry: 'plane' | 'box' | 'cylinder' | 'sphere' | 'custom';
  /** Geometry parameters (depends on geometry type) */
  geometryParams?: any;
  /** Whether component is interactive */
  interactive?: boolean;
  /** Parent component ID (for hierarchical relationships) */
  parentId?: string;
  /** Child component IDs */
  childIds?: string[];
}

/**
 * Layer Definition - organizes components by depth
 */
export interface CockpitLayer {
  /** Layer index (0 = back, higher = front) */
  index: number;
  /** Layer name */
  name: string;
  /** Layer description */
  description: string;
  /** Z-offset for this layer */
  zOffset: number;
  /** Components in this layer */
  componentIds: string[];
}

/**
 * Cockpit Blueprint - complete definition of a cockpit
 */
export interface CockpitBlueprint {
  /** Blueprint name */
  name: string;
  /** Blueprint version */
  version: string;
  /** Description */
  description: string;
  /** Source image path */
  sourceImage: string;
  /** Source image dimensions */
  imageDimensions: {
    width: number;
    height: number;
  };
  /** Cockpit type */
  cockpitType: 'fighter' | 'transport' | 'scout' | 'heavy';
  /** All components */
  components: CockpitComponent[];
  /** Layer organization */
  layers: CockpitLayer[];
  /** Metadata */
  metadata: {
    author?: string;
    created: string;
    modified: string;
    tags?: string[];
  };
}

/**
 * Blueprint Marker - used in the analyzer tool
 */
export interface BlueprintMarker {
  /** Marker ID */
  id: string;
  /** Position in image space (pixels) */
  position: { x: number; y: number };
  /** Marker type */
  type: 'corner' | 'center' | 'reference';
  /** Associated component ID */
  componentId?: string;
}

/**
 * Component Region - defined by markers
 */
export interface ComponentRegion {
  /** Component ID */
  componentId: string;
  /** Corner markers (top-left, top-right, bottom-right, bottom-left) */
  corners: [BlueprintMarker, BlueprintMarker, BlueprintMarker, BlueprintMarker];
  /** Calculated UV region */
  uvRegion: UVRegion;
}

/**
 * Blueprint Export Format
 */
export interface BlueprintExport {
  blueprint: CockpitBlueprint;
  /** Export format version */
  formatVersion: string;
  /** Export timestamp */
  exportedAt: string;
}

/**
 * Predefined layer configurations
 */
export const COCKPIT_LAYERS = {
  HULL: { index: 0, name: 'Hull/Frame', zOffset: -1.0 },
  PANELS: { index: 1, name: 'Instrument Panels', zOffset: -0.7 },
  DISPLAYS: { index: 2, name: 'Displays/Screens', zOffset: -0.5 },
  CONTROLS: { index: 3, name: 'Controls/Switches', zOffset: -0.3 },
  DETAILS: { index: 4, name: 'Details/Labels', zOffset: -0.1 }
} as const;

/**
 * Material presets for common component types
 */
export const MATERIAL_PRESETS: Record<string, MaterialConfig> = {
  METAL_PANEL: {
    type: 'metal',
    metalness: 0.95,
    roughness: 0.2,
    clearcoat: 0.5,
    receiveShadows: true,
    castShadows: true
  },
  PLASTIC_BUTTON: {
    type: 'plastic',
    metalness: 0.0,
    roughness: 0.6,
    receiveShadows: true,
    castShadows: true
  },
  GLASS_SCREEN: {
    type: 'glass',
    metalness: 0.1,
    roughness: 0.05,
    clearcoat: 1.0,
    emissive: 0.3,
    emissiveColor: '#00ff00',
    receiveShadows: false,
    castShadows: false
  },
  FABRIC_SEAT: {
    type: 'fabric',
    metalness: 0.0,
    roughness: 0.9,
    receiveShadows: true,
    castShadows: true
  },
  RUBBER_GRIP: {
    type: 'rubber',
    metalness: 0.0,
    roughness: 0.8,
    receiveShadows: true,
    castShadows: true
  },
  CARBON_FIBER: {
    type: 'carbon',
    metalness: 0.3,
    roughness: 0.4,
    clearcoat: 0.8,
    receiveShadows: true,
    castShadows: true
  }
};
