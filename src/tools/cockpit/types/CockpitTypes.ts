/**
 * Cockpit Generator Types
 * 
 * Types for the automatic cockpit generation system
 */

import * as THREE from 'three';

/**
 * Configuration for cockpit generation
 */
export interface CockpitConfig {
  // Image source
  imageUrl: string;
  
  // Geometry settings
  geometry: {
    // Cockpit curvature (degrees) - how much the sides curve
    curvature: number;
    
    // Width of the cockpit (meters)
    width: number;
    
    // Height of the cockpit (meters)
    height: number;
    
    // Depth of the cockpit (meters)
    depth: number;
    
    // Seat position relative to cockpit center
    seatPosition: THREE.Vector3;
  };
  
  // Panel definitions
  panels: {
    // Left side panel
    left: PanelConfig;
    
    // Right side panel
    right: PanelConfig;
    
    // Top/overhead panel
    top: PanelConfig;
    
    // Center console
    center: PanelConfig;
  };
  
  // Screen/display definitions
  screens?: ScreenConfig[];
  
  // Interactive elements (buttons, switches)
  interactive?: InteractiveElement[];
  
  // Material settings
  materials: {
    // Base material properties
    metalness: number;
    roughness: number;
    
    // Emissive for glowing screens/buttons
    emissiveIntensity: number;
    
    // Normal map strength for depth
    normalScale: number;
  };
}

/**
 * Panel configuration
 */
export interface PanelConfig {
  // Whether this panel exists
  enabled: boolean;
  
  // Curve amount (0 = flat, 1 = full curve)
  curve: number;
  
  // Depth offset from center (meters)
  depth: number;
  
  // Angle relative to center (degrees)
  angle: number;
  
  // UV mapping region (0-1 coordinates in source image)
  uvRegion: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Subdivision for smooth curves
  segments: number;
}

/**
 * Screen/display configuration
 */
export interface ScreenConfig {
  // Screen identifier
  id: string;
  
  // Position in 3D space
  position: THREE.Vector3;
  
  // Size (width, height in meters)
  size: THREE.Vector2;
  
  // Rotation (euler angles)
  rotation: THREE.Euler;
  
  // UV region in source image
  uvRegion: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Whether screen is emissive (glowing)
  emissive: boolean;
  
  // Emissive color
  emissiveColor?: THREE.Color;
  
  // Emissive intensity
  emissiveIntensity?: number;
}

/**
 * Interactive element (button, switch, etc.)
 */
export interface InteractiveElement {
  // Element identifier
  id: string;
  
  // Type of element
  type: 'button' | 'switch' | 'lever' | 'dial' | 'screen';
  
  // Position in 3D space
  position: THREE.Vector3;
  
  // Size
  size: THREE.Vector3;
  
  // Rotation
  rotation: THREE.Euler;
  
  // Callback when interacted with
  onInteract?: (element: InteractiveElement) => void;
  
  // Visual state
  state?: 'on' | 'off' | 'active' | 'inactive';
}

/**
 * Generated cockpit result
 */
export interface GeneratedCockpit {
  // Main cockpit mesh
  mesh: THREE.Group;
  
  // Individual panel meshes
  panels: {
    left?: THREE.Mesh;
    right?: THREE.Mesh;
    top?: THREE.Mesh;
    center?: THREE.Mesh;
  };
  
  // Screen meshes
  screens: THREE.Mesh[];
  
  // Interactive element meshes
  interactive: THREE.Mesh[];
  
  // Materials used
  materials: {
    base: THREE.Material;
    screen: THREE.Material;
    emissive: THREE.Material;
  };
  
  // Recommended camera position
  cameraPosition: THREE.Vector3;
  
  // Recommended camera target
  cameraTarget: THREE.Vector3;
}

/**
 * Preset configurations for common cockpit types
 */
export enum CockpitPreset {
  FIGHTER = 'fighter',
  TRANSPORT = 'transport',
  SHUTTLE = 'shuttle',
  RACING = 'racing',
  CUSTOM = 'custom'
}

/**
 * Cockpit generation options
 */
export interface GenerationOptions {
  // Use preset configuration
  preset?: CockpitPreset;
  
  // Generate normal maps for depth
  generateNormalMaps: boolean;
  
  // Generate emissive maps for screens
  generateEmissiveMaps: boolean;
  
  // Optimize geometry
  optimize: boolean;
  
  // Add collision geometry
  addCollision: boolean;
  
  // Debug mode (show wireframes, helpers)
  debug: boolean;
}
