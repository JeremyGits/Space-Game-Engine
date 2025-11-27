/**
 * Cockpit Generator Tool
 * 
 * Export all cockpit generation functionality
 */

// Main generator
export { CockpitGenerator } from './CockpitGenerator';

// Geometry generator
export { GeometryGenerator } from './generators/GeometryGenerator';

// Types
export type {
  CockpitConfig,
  PanelConfig,
  ScreenConfig,
  InteractiveElement,
  GeneratedCockpit,
  GenerationOptions
} from './types/CockpitTypes';

export { CockpitPreset } from './types/CockpitTypes';

// React components (re-export from components folder)
export { CockpitViewer, PresetCockpitViewer } from '../../components/CockpitViewer';

// Examples
export { 
  FighterCockpitDemo, 
  SimpleCockpitExample,
  fighterCockpitConfig 
} from '../../examples/FighterCockpitExample';
