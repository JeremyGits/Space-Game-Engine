e/**
 * Cockpit Component Categorization System
 * Official terminology for spacecraft cockpit elements
 */

/**
 * Component Categories (Official Aviation/Spacecraft Terminology)
 */
export enum CockpitComponentCategory {
  // Display Systems
  MFD = 'Multi-Function Display',
  PFD = 'Primary Flight Display',
  ND = 'Navigation Display',
  EICAS = 'Engine Indicating and Crew Alerting System',
  HUD = 'Heads-Up Display',
  
  // Control Interfaces
  STICK = 'Control Stick',
  YOKE = 'Control Yoke',
  THROTTLE = 'Throttle Quadrant',
  PEDALS = 'Rudder Pedals',
  
  // Switches & Buttons
  TOGGLE_SWITCH = 'Toggle Switch',
  PUSH_BUTTON = 'Push Button',
  ROTARY_SWITCH = 'Rotary Selector Switch',
  ROCKER_SWITCH = 'Rocker Switch',
  GUARD_SWITCH = 'Guarded Switch',
  
  // Knobs & Dials
  ROTARY_KNOB = 'Rotary Knob',
  ENCODER = 'Rotary Encoder',
  TRIM_WHEEL = 'Trim Wheel',
  POTENTIOMETER = 'Potentiometer',
  
  // Indicators
  ANNUNCIATOR = 'Annunciator Panel',
  WARNING_LIGHT = 'Warning Light',
  CAUTION_LIGHT = 'Caution Light',
  ADVISORY_LIGHT = 'Advisory Light',
  INDICATOR_LIGHT = 'Indicator Light',
  
  // Gauges & Instruments
  ANALOG_GAUGE = 'Analog Gauge',
  DIGITAL_READOUT = 'Digital Readout',
  TAPE_INDICATOR = 'Tape Indicator',
  COMPASS = 'Compass',
  ALTIMETER = 'Altimeter',
  
  // Structural
  PANEL = 'Instrument Panel',
  CONSOLE = 'Center Console',
  GLARESHIELD = 'Glareshield',
  OVERHEAD_PANEL = 'Overhead Panel',
  SIDE_PANEL = 'Side Panel',
  
  // Other
  CIRCUIT_BREAKER = 'Circuit Breaker',
  FUSE = 'Fuse',
  HANDLE = 'Handle',
  LEVER = 'Lever'
}

/**
 * Component Properties
 */
export interface CockpitComponentSpec {
  id: string;
  category: CockpitComponentCategory;
  name: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  
  // Visual properties
  material: 'metal' | 'plastic' | 'glass' | 'fabric' | 'rubber' | 'composite';
  finish: 'matte' | 'glossy' | 'brushed' | 'anodized' | 'painted';
  color: string;
  
  // Functional properties
  interactive: boolean;
  illuminated: boolean;
  labelText?: string;
  
  // State
  state?: 'on' | 'off' | 'standby' | 'active' | 'warning' | 'caution';
}

/**
 * Standard Cockpit Layout Zones
 */
export enum CockpitZone {
  FORWARD_PANEL = 'Forward Instrument Panel',
  CENTER_CONSOLE = 'Center Console',
  OVERHEAD = 'Overhead Panel',
  LEFT_SIDE = 'Left Side Panel',
  RIGHT_SIDE = 'Right Side Panel',
  GLARESHIELD = 'Glareshield',
  PEDESTAL = 'Pedestal'
}

/**
 * Component Function Types
 */
export enum ComponentFunction {
  // Flight Control
  FLIGHT_CONTROL = 'Flight Control',
  TRIM_CONTROL = 'Trim Control',
  AUTOPILOT = 'Autopilot',
  
  // Navigation
  NAVIGATION = 'Navigation',
  COMMUNICATION = 'Communication',
  RADAR = 'Radar',
  
  // Systems
  ELECTRICAL = 'Electrical System',
  HYDRAULIC = 'Hydraulic System',
  FUEL = 'Fuel System',
  ENVIRONMENTAL = 'Environmental Control',
  
  // Propulsion
  ENGINE_CONTROL = 'Engine Control',
  THRUST_CONTROL = 'Thrust Control',
  
  // Weapons (for combat spacecraft)
  WEAPONS = 'Weapons System',
  COUNTERMEASURES = 'Countermeasures',
  
  // Other
  LIGHTING = 'Lighting Control',
  EMERGENCY = 'Emergency System',
  UTILITY = 'Utility'
}

/**
 * Predefined Component Library
 */
export const STANDARD_COMPONENTS: Record<string, Partial<CockpitComponentSpec>> = {
  // MFDs
  MFD_LARGE: {
    category: CockpitComponentCategory.MFD,
    size: { width: 0.3, height: 0.25, depth: 0.05 },
    material: 'glass',
    finish: 'glossy',
    interactive: true,
    illuminated: true
  },
  
  MFD_SMALL: {
    category: CockpitComponentCategory.MFD,
    size: { width: 0.2, height: 0.15, depth: 0.05 },
    material: 'glass',
    finish: 'glossy',
    interactive: true,
    illuminated: true
  },
  
  // Switches
  TOGGLE_SWITCH_STANDARD: {
    category: CockpitComponentCategory.TOGGLE_SWITCH,
    size: { width: 0.02, height: 0.04, depth: 0.03 },
    material: 'metal',
    finish: 'brushed',
    interactive: true,
    illuminated: false
  },
  
  PUSH_BUTTON_ILLUMINATED: {
    category: CockpitComponentCategory.PUSH_BUTTON,
    size: { width: 0.03, height: 0.03, depth: 0.02 },
    material: 'plastic',
    finish: 'matte',
    interactive: true,
    illuminated: true
  },
  
  GUARD_SWITCH_CRITICAL: {
    category: CockpitComponentCategory.GUARD_SWITCH,
    size: { width: 0.04, height: 0.06, depth: 0.04 },
    material: 'metal',
    finish: 'anodized',
    interactive: true,
    illuminated: false
  },
  
  // Knobs
  ROTARY_KNOB_STANDARD: {
    category: CockpitComponentCategory.ROTARY_KNOB,
    size: { width: 0.04, height: 0.04, depth: 0.03 },
    material: 'metal',
    finish: 'brushed',
    interactive: true,
    illuminated: false
  },
  
  // Controls
  CONTROL_STICK: {
    category: CockpitComponentCategory.STICK,
    size: { width: 0.05, height: 0.3, depth: 0.05 },
    material: 'composite',
    finish: 'matte',
    interactive: true,
    illuminated: false
  },
  
  THROTTLE_LEVER: {
    category: CockpitComponentCategory.THROTTLE,
    size: { width: 0.06, height: 0.2, depth: 0.04 },
    material: 'metal',
    finish: 'brushed',
    interactive: true,
    illuminated: false
  },
  
  // Indicators
  WARNING_LIGHT_RED: {
    category: CockpitComponentCategory.WARNING_LIGHT,
    size: { width: 0.02, height: 0.02, depth: 0.01 },
    material: 'plastic',
    finish: 'glossy',
    interactive: false,
    illuminated: true,
    color: '#ff0000'
  },
  
  CAUTION_LIGHT_AMBER: {
    category: CockpitComponentCategory.CAUTION_LIGHT,
    size: { width: 0.02, height: 0.02, depth: 0.01 },
    material: 'plastic',
    finish: 'glossy',
    interactive: false,
    illuminated: true,
    color: '#ffaa00'
  },
  
  ADVISORY_LIGHT_GREEN: {
    category: CockpitComponentCategory.ADVISORY_LIGHT,
    size: { width: 0.02, height: 0.02, depth: 0.01 },
    material: 'plastic',
    finish: 'glossy',
    interactive: false,
    illuminated: true,
    color: '#00ff00'
  }
};

/**
 * Component Validator
 * Validates cockpit components against standards
 */
export class CockpitComponentValidator {
  /**
   * Validate component specification
   */
  static validate(component: CockpitComponentSpec): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (!component.id) errors.push('Component ID is required');
    if (!component.category) errors.push('Component category is required');
    if (!component.name) errors.push('Component name is required');
    
    // Validate position
    if (!component.position) {
      errors.push('Component position is required');
    } else {
      if (typeof component.position.x !== 'number') errors.push('Position X must be a number');
      if (typeof component.position.y !== 'number') errors.push('Position Y must be a number');
      if (typeof component.position.z !== 'number') errors.push('Position Z must be a number');
    }
    
    // Validate size
    if (!component.size) {
      errors.push('Component size is required');
    } else {
      if (component.size.width <= 0) errors.push('Width must be positive');
      if (component.size.height <= 0) errors.push('Height must be positive');
      if (component.size.depth <= 0) errors.push('Depth must be positive');
    }
    
    // Validate material
    const validMaterials = ['metal', 'plastic', 'glass', 'fabric', 'rubber', 'composite'];
    if (!validMaterials.includes(component.material)) {
      errors.push(`Invalid material: ${component.material}`);
    }
    
    // Validate finish
    const validFinishes = ['matte', 'glossy', 'brushed', 'anodized', 'painted'];
    if (!validFinishes.includes(component.finish)) {
      errors.push(`Invalid finish: ${component.finish}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get component recommendations
   */
  static getRecommendations(category: CockpitComponentCategory): string[] {
    const recommendations: string[] = [];
    
    switch (category) {
      case CockpitComponentCategory.MFD:
        recommendations.push('Use glass material with glossy finish');
        recommendations.push('Enable illumination for visibility');
        recommendations.push('Make interactive for touch input');
        break;
        
      case CockpitComponentCategory.TOGGLE_SWITCH:
        recommendations.push('Use metal material with brushed finish');
        recommendations.push('Typical size: 20mm x 40mm x 30mm');
        recommendations.push('Consider guard for critical functions');
        break;
        
      case CockpitComponentCategory.WARNING_LIGHT:
        recommendations.push('Use red color (#ff0000) for warnings');
        recommendations.push('Use amber color (#ffaa00) for cautions');
        recommendations.push('Use green color (#00ff00) for advisories');
        recommendations.push('Enable illumination');
        break;
        
      case CockpitComponentCategory.ROTARY_KNOB:
        recommendations.push('Use metal material with brushed finish');
        recommendations.push('Typical diameter: 40mm');
        recommendations.push('Add tactile feedback for detents');
        break;
    }
    
    return recommendations;
  }
}
