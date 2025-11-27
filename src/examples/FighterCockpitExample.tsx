/**
 * Fighter Cockpit Example
 * 
 * Example using the cockpit image you provided
 */

import React from 'react';
import { CockpitViewer } from '../components/CockpitViewer';
import { CockpitConfig } from '../tools/cockpit/types/CockpitTypes';
import * as THREE from 'three';

/**
 * Configuration for your specific cockpit image
 * 
 * This is tailored to the fighter cockpit image you showed me with:
 * - Curved side panels
 * - Three center screens (white squares)
 * - Overhead panel
 * - Center console with controls
 */
export const fighterCockpitConfig: CockpitConfig = {
  // Your cockpit image URL
  // Replace this with the actual path to your image
  imageUrl: '/cockpit-fighter.jpg',
  
  geometry: {
    // Cockpit curvature - fighter jets have aggressive curves
    curvature: 120,
    
    // Dimensions (in meters)
    width: 2.0,
    height: 1.5,
    depth: 1.5,
    
    // Seat position (pilot's eye level)
    seatPosition: new THREE.Vector3(0, -0.2, 0)
  },
  
  panels: {
    // Left side panel
    left: {
      enabled: true,
      curve: 0.3,        // 30% curve
      depth: 0.5,        // 50cm from center
      angle: -30,        // 30° angle inward
      uvRegion: {
        x: 0,            // Left 30% of image
        y: 0,
        width: 0.3,
        height: 1
      },
      segments: 16       // Smooth curve
    },
    
    // Right side panel
    right: {
      enabled: true,
      curve: 0.3,
      depth: 0.5,
      angle: 30,         // 30° angle inward
      uvRegion: {
        x: 0.7,          // Right 30% of image
        y: 0,
        width: 0.3,
        height: 1
      },
      segments: 16
    },
    
    // Top/overhead panel
    top: {
      enabled: true,
      curve: 0.2,
      depth: 0.3,
      angle: 0,
      uvRegion: {
        x: 0.3,          // Top center of image
        y: 0,
        width: 0.4,
        height: 0.3
      },
      segments: 16
    },
    
    // Center console
    center: {
      enabled: true,
      curve: 0.1,
      depth: 0.7,
      angle: 0,
      uvRegion: {
        x: 0.3,          // Bottom center of image
        y: 0.5,
        width: 0.4,
        height: 0.5
      },
      segments: 16
    }
  },
  
  // The three center screens (white squares in your image)
  screens: [
    // Left screen
    {
      id: 'left_mfd',
      position: new THREE.Vector3(-0.3, 0.1, -0.6),
      size: new THREE.Vector2(0.25, 0.25),
      rotation: new THREE.Euler(0, 0, 0),
      uvRegion: {
        x: 0.35,
        y: 0.3,
        width: 0.1,
        height: 0.15
      },
      emissive: true,
      emissiveColor: new THREE.Color(0x00ff00),
      emissiveIntensity: 0.5
    },
    // Center screen
    {
      id: 'center_mfd',
      position: new THREE.Vector3(0, 0.1, -0.6),
      size: new THREE.Vector2(0.25, 0.25),
      rotation: new THREE.Euler(0, 0, 0),
      uvRegion: {
        x: 0.45,
        y: 0.3,
        width: 0.1,
        height: 0.15
      },
      emissive: true,
      emissiveColor: new THREE.Color(0x00ff00),
      emissiveIntensity: 0.5
    },
    // Right screen
    {
      id: 'right_mfd',
      position: new THREE.Vector3(0.3, 0.1, -0.6),
      size: new THREE.Vector2(0.25, 0.25),
      rotation: new THREE.Euler(0, 0, 0),
      uvRegion: {
        x: 0.55,
        y: 0.3,
        width: 0.1,
        height: 0.15
      },
      emissive: true,
      emissiveColor: new THREE.Color(0x00ff00),
      emissiveIntensity: 0.5
    }
  ],
  
  // Interactive elements (buttons, switches)
  interactive: [
    // Example button on left panel
    {
      id: 'weapon_select',
      type: 'button',
      position: new THREE.Vector3(-0.6, 0, -0.4),
      size: new THREE.Vector3(0.03, 0.02, 0.03),
      rotation: new THREE.Euler(0, 0, 0),
      state: 'off'
    },
    // Example switch on right panel
    {
      id: 'landing_gear',
      type: 'switch',
      position: new THREE.Vector3(0.6, -0.2, -0.4),
      size: new THREE.Vector3(0.02, 0.04, 0.02),
      rotation: new THREE.Euler(0, 0, 0),
      state: 'off'
    }
  ],
  
  // Material properties
  materials: {
    metalness: 0.7,              // Metallic look
    roughness: 0.3,              // Somewhat shiny
    emissiveIntensity: 0.5,      // Glowing screens
    normalScale: 1.0             // Button depth
  }
};

/**
 * Fighter Cockpit Demo Component
 */
export function FighterCockpitDemo() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <CockpitViewer 
        config={fighterCockpitConfig}
        enableControls={true}
        showStats={true}
      />
      
      {/* Instructions overlay */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '14px',
        background: 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '8px',
        maxWidth: '400px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>Fighter Cockpit Demo</h3>
        <p style={{ margin: '5px 0' }}>🖱️ <strong>Mouse:</strong> Look around</p>
        <p style={{ margin: '5px 0' }}>🔄 <strong>Scroll:</strong> Zoom in/out</p>
        <p style={{ margin: '5px 0' }}>📱 <strong>Drag:</strong> Rotate view</p>
        <hr style={{ margin: '10px 0', border: '1px solid #333' }} />
        <p style={{ margin: '5px 0', fontSize: '12px', color: '#888' }}>
          This cockpit was automatically generated from your image!
        </p>
      </div>
    </div>
  );
}

/**
 * Simple usage example
 */
export function SimpleCockpitExample() {
  return (
    <div>
      <h1>Cockpit Generator Example</h1>
      <p>Replace the imageUrl in fighterCockpitConfig with your actual cockpit image path</p>
      <FighterCockpitDemo />
    </div>
  );
}
