/**
 * Cockpit Configuration
 * Defines all static values for cockpit geometry to ensure consistent depth and alignment
 */

export const COCKPIT_CONFIG = {
  // Base depths (Z-axis distances from camera)
  depths: {
    sidePanels: -2.8,      // Left and right panels
    topPanel: -2.5,        // Overhead panel
    console: -3.0,         // Center console base
    mfdScreens: -2.95,     // MFD screens (slightly in front of console)
    buttons: -2.7,         // Side console buttons
    indicators: -2.4,      // Top panel indicators
    strips: -2.9,          // Console accent strips
  },
  
  // Panel dimensions
  panels: {
    side: {
      width: 3,
      height: 4,
      xOffset: 2.5,        // Distance from center
      rotation: 0.5,       // Angle inward (radians)
    },
    top: {
      width: 5,
      height: 2,
      yOffset: 2,          // Height above camera
      rotation: -0.5,      // Angle downward
    },
    console: {
      width: 4,
      height: 2.5,
      yOffset: -1.5,       // Below camera
      rotation: 0.3,       // Angle upward
    },
  },
  
  // MFD screen configuration
  mfds: {
    yPosition: -0.9,       // Vertical position on console (raised to avoid clipping)
    spacing: 0.8,          // Horizontal spacing between screens
    left: {
      width: 0.5,
      height: 0.5,
      type: 'square' as const,
    },
    center: {
      radius: 0.25,
      type: 'circle' as const,
    },
    right: {
      width: 0.5,
      height: 0.5,
      type: 'square' as const,
    },
  },
  
  // Button configuration
  buttons: {
    left: {
      xPosition: -2.2,
      startY: -0.5,
      spacing: 0.2,
      radius: 0.04,
      height: 0.02,
      colors: ['#ff0000', '#00ff00', '#ffaa00'],
      emissive: [1.0, 0.8, 0.6],
    },
    right: {
      xPosition: 2.2,
      startY: -0.5,
      spacing: 0.2,
      radius: 0.04,
      height: 0.02,
      colors: ['#0088ff', '#ff00ff', '#00ffff'],
      emissive: [0.9, 0.7, 0.8],
    },
  },
  
  // Status indicators
  indicators: {
    top: {
      yPosition: 1.7,
      spacing: 0.3,
      radius: 0.03,
      colors: ['#00ff00', '#00ff00', '#ffaa00'],
      emissive: [1.2, 1.2, 1.0],
    },
    strips: {
      yPosition: -1.3,
      xOffset: 1.2,
      width: 0.3,
      height: 0.02,
      depth: 0.02,
      color: '#ff6600',
      emissive: 0.9,
    },
  },
  
  // Lighting configuration
  lighting: {
    ambient: 0.3,
    points: [
      { position: [-1, -0.5, -1.5], intensity: 0.3, color: '#00ff00', distance: 3 },
      { position: [1, -0.5, -1.5], intensity: 0.3, color: '#00ff00', distance: 3 },
      { position: [0, -1, -2], intensity: 0.4, color: '#ff6600', distance: 2 },
    ],
  },
  
  // Material properties
  materials: {
    panels: {
      metalness: 0.7,
      roughness: 0.3,
    },
    mfds: {
      baseColor: '#001100',
      emissiveColor: '#00ff00',
      emissiveIntensity: 0.8,
    },
  },
} as const;

// Helper function to get absolute position
export function getCockpitPosition(
  relativePos: [number, number, number], 
  cameraPos: { x: number; y: number; z: number }
): [number, number, number] {
  return [
    cameraPos.x + relativePos[0],
    cameraPos.y + relativePos[1],
    cameraPos.z + relativePos[2],
  ];
}
