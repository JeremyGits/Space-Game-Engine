import * as THREE from 'three';
import { ReactElement } from 'react';

/**
 * Cockpit Type
 */
export enum CockpitType {
  FIGHTER = 'fighter',
  TRANSPORT = 'transport',
  SCOUT = 'scout',
  HEAVY = 'heavy',
  CUSTOM = 'custom'
}

/**
 * Cockpit Configuration
 */
export interface CockpitConfig {
  type: CockpitType;
  name: string;
  description: string;
  
  // Visual properties
  fov?: number;
  cameraOffset?: THREE.Vector3;
  
  // MFD configuration
  mfdCount: number;
  mfdLayout: 'horizontal' | 'vertical' | 'grid' | 'custom';
  
  // Features
  features: {
    radar?: boolean;
    navigation?: boolean;
    weapons?: boolean;
    engineering?: boolean;
    communications?: boolean;
  };
  
  // Component reference
  component: any; // React component
}

/**
 * Ship-Cockpit Assignment
 */
export interface ShipCockpitAssignment {
  shipType: string;
  cockpitType: CockpitType;
  customizations?: {
    mfdLayout?: string;
    colorScheme?: string;
    hudStyle?: string;
  };
}

/**
 * Cockpit System
 * Manages multiple cockpit designs and ship assignments
 */
export class CockpitSystem {
  private cockpits: Map<CockpitType, CockpitConfig>;
  private shipAssignments: Map<string, CockpitType>;
  private currentCockpit: CockpitType | null = null;
  
  constructor() {
    this.cockpits = new Map();
    this.shipAssignments = new Map();
  }
  
  /**
   * Register cockpit design
   */
  registerCockpit(config: CockpitConfig): void {
    this.cockpits.set(config.type, config);
  }
  
  /**
   * Register multiple cockpits
   */
  registerCockpits(configs: CockpitConfig[]): void {
    configs.forEach(config => this.registerCockpit(config));
  }
  
  /**
   * Get cockpit configuration
   */
  getCockpit(type: CockpitType): CockpitConfig | undefined {
    return this.cockpits.get(type);
  }
  
  /**
   * Get all registered cockpits
   */
  getAllCockpits(): CockpitConfig[] {
    return Array.from(this.cockpits.values());
  }
  
  /**
   * Assign cockpit to ship type
   */
  assignCockpitToShip(shipType: string, cockpitType: CockpitType): void {
    this.shipAssignments.set(shipType, cockpitType);
  }
  
  /**
   * Get cockpit for ship type
   */
  getCockpitForShip(shipType: string): CockpitConfig | undefined {
    const cockpitType = this.shipAssignments.get(shipType);
    if (!cockpitType) return undefined;
    
    return this.cockpits.get(cockpitType);
  }
  
  /**
   * Set current active cockpit
   */
  setCurrentCockpit(type: CockpitType): void {
    this.currentCockpit = type;
  }
  
  /**
   * Get current active cockpit
   */
  getCurrentCockpit(): CockpitConfig | null {
    if (!this.currentCockpit) return null;
    return this.cockpits.get(this.currentCockpit) || null;
  }
  
  /**
   * Switch cockpit
   */
  switchCockpit(type: CockpitType): boolean {
    if (!this.cockpits.has(type)) return false;
    
    this.currentCockpit = type;
    return true;
  }
  
  /**
   * Get cockpit component
   */
  getCockpitComponent(type: CockpitType): any | null {
    const config = this.cockpits.get(type);
    return config?.component || null;
  }
  
  /**
   * Check if cockpit has feature
   */
  hasFeature(type: CockpitType, feature: keyof CockpitConfig['features']): boolean {
    const config = this.cockpits.get(type);
    if (!config) return false;
    
    return config.features[feature] || false;
  }
}

// Singleton instance
export const cockpitSystem = new CockpitSystem();

// Initialize default cockpit assignments
export function initializeDefaultCockpits(): void {
  // Fighter cockpit
  cockpitSystem.registerCockpit({
    type: CockpitType.FIGHTER,
    name: 'Fighter Cockpit',
    description: 'Compact fighter cockpit with 3 MFDs',
    fov: 75,
    mfdCount: 3,
    mfdLayout: 'horizontal',
    features: {
      radar: true,
      navigation: true,
      weapons: true
    },
    component: null // Will be set when component is created
  });
  
  // Transport cockpit
  cockpitSystem.registerCockpit({
    type: CockpitType.TRANSPORT,
    name: 'Transport Cockpit',
    description: 'Wide transport cockpit with 5 MFDs',
    fov: 90,
    mfdCount: 5,
    mfdLayout: 'grid',
    features: {
      radar: true,
      navigation: true,
      engineering: true,
      communications: true
    },
    component: null
  });
  
  // Scout cockpit
  cockpitSystem.registerCockpit({
    type: CockpitType.SCOUT,
    name: 'Scout Cockpit',
    description: 'Panoramic scout cockpit with advanced sensors',
    fov: 100,
    mfdCount: 4,
    mfdLayout: 'horizontal',
    features: {
      radar: true,
      navigation: true
    },
    component: null
  });
  
  // Heavy cockpit
  cockpitSystem.registerCockpit({
    type: CockpitType.HEAVY,
    name: 'Heavy Cockpit',
    description: 'Armored heavy cockpit with tactical displays',
    fov: 70,
    mfdCount: 6,
    mfdLayout: 'grid',
    features: {
      radar: true,
      navigation: true,
      weapons: true,
      engineering: true
    },
    component: null
  });
  
  // Default ship assignments
  cockpitSystem.assignCockpitToShip('fighter', CockpitType.FIGHTER);
  cockpitSystem.assignCockpitToShip('transport', CockpitType.TRANSPORT);
  cockpitSystem.assignCockpitToShip('scout', CockpitType.SCOUT);
  cockpitSystem.assignCockpitToShip('heavy', CockpitType.HEAVY);
}
