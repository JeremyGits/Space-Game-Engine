/**
 * Rule-Based Component Classifier
 * Fast classification using geometric and color rules
 * No ML required - perfect for real-time classification
 */

import type { 
  ClassificationResult, 
  ClassifiedComponent, 
  ComponentType,
  SegmentedRegion 
} from '../../../../types/cv/SegmentationTypes';

export interface ClassificationRule {
  name: string;
  componentType: ComponentType;
  conditions: RuleCondition[];
  priority: number;
  confidence: number;
}

export interface RuleCondition {
  property: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'contains';
  value: any;
  weight: number;
}

export class RuleBasedClassifier {
  private rules: ClassificationRule[];
  
  constructor() {
    this.rules = this.initializeDefaultRules();
  }
  
  /**
   * Classify regions using rule-based approach
   */
  classify(regions: SegmentedRegion[]): ClassificationResult {
    const startTime = performance.now();
    const components: ClassifiedComponent[] = [];
    
    for (const region of regions) {
      const classification = this.classifyRegion(region);
      if (classification) {
        components.push(classification);
      }
    }
    
    const processingTime = performance.now() - startTime;
    const avgConfidence = components.length > 0
      ? components.reduce((sum, c) => sum + c.confidence, 0) / components.length
      : 0;
    
    return {
      components,
      totalComponents: components.length,
      averageConfidence: avgConfidence,
      processingTime,
      method: 'rules',
    };
  }
  
  /**
   * Classify single region
   */
  private classifyRegion(region: SegmentedRegion): ClassifiedComponent | null {
    let bestMatch: ClassificationRule | null = null;
    let bestScore = 0;
    
    // Test each rule
    for (const rule of this.rules) {
      const score = this.evaluateRule(rule, region);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = rule;
      }
    }
    
    // Require minimum confidence
    if (!bestMatch || bestScore < 0.3) {
      return null;
    }
    
    // Create classified component
    return {
      id: region.id,
      type: bestMatch.componentType,
      region,
      confidence: bestScore,
      depth: 0,
      geometry: this.getGeometryTemplate(bestMatch.componentType, region),
      material: this.getMaterialProperties(bestMatch.componentType, region),
      metadata: {
        label: bestMatch.name,
        function: this.getComponentFunction(bestMatch.componentType),
        interactable: this.isInteractable(bestMatch.componentType),
        priority: bestMatch.priority,
        tags: [bestMatch.componentType, 'detected'],
      },
    };
  }
  
  /**
   * Evaluate rule against region
   */
  private evaluateRule(rule: ClassificationRule, region: SegmentedRegion): number {
    let totalWeight = 0;
    let matchedWeight = 0;
    
    for (const condition of rule.conditions) {
      totalWeight += condition.weight;
      
      if (this.evaluateCondition(condition, region)) {
        matchedWeight += condition.weight;
      }
    }
    
    return totalWeight > 0 ? (matchedWeight / totalWeight) * rule.confidence : 0;
  }
  
  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: RuleCondition, region: SegmentedRegion): boolean {
    const value = this.getPropertyValue(condition.property, region);
    
    switch (condition.operator) {
      case 'eq': return value === condition.value;
      case 'gt': return value > condition.value;
      case 'lt': return value < condition.value;
      case 'gte': return value >= condition.value;
      case 'lte': return value <= condition.value;
      case 'between': 
        return value >= condition.value[0] && value <= condition.value[1];
      case 'contains':
        return String(value).includes(condition.value);
      default: return false;
    }
  }
  
  /**
   * Get property value from region
   */
  private getPropertyValue(property: string, region: SegmentedRegion): any {
    const parts = property.split('.');
    let value: any = region;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value;
  }
  
  /**
   * Initialize default classification rules
   */
  private initializeDefaultRules(): ClassificationRule[] {
    return [
      // BUTTON - Small, circular or square, high solidity
      {
        name: 'Button',
        componentType: 'button',
        priority: 10,
        confidence: 0.9,
        conditions: [
          { property: 'area', operator: 'between', value: [100, 5000], weight: 1.0 },
          { property: 'properties.solidity', operator: 'gte', value: 0.8, weight: 1.5 },
          { property: 'properties.isConvex', operator: 'eq', value: true, weight: 1.0 },
        ],
      },
      
      // SCREEN - Large, rectangular, low edge density
      {
        name: 'Display Screen',
        componentType: 'screen',
        priority: 9,
        confidence: 0.85,
        conditions: [
          { property: 'area', operator: 'gt', value: 10000, weight: 1.5 },
          { property: 'properties.solidity', operator: 'gte', value: 0.9, weight: 1.0 },
          { property: 'properties.edgeDensity', operator: 'lt', value: 0.05, weight: 1.0 },
        ],
      },
      
      // KNOB - Small, circular, medium solidity
      {
        name: 'Control Knob',
        componentType: 'knob',
        priority: 8,
        confidence: 0.8,
        conditions: [
          { property: 'area', operator: 'between', value: [200, 3000], weight: 1.0 },
          { property: 'properties.solidity', operator: 'between', value: [0.7, 0.95], weight: 1.5 },
        ],
      },
      
      // PANEL - Large, rectangular, variable properties
      {
        name: 'Panel',
        componentType: 'panel',
        priority: 5,
        confidence: 0.7,
        conditions: [
          { property: 'area', operator: 'gt', value: 5000, weight: 1.0 },
          { property: 'properties.solidity', operator: 'gte', value: 0.7, weight: 0.5 },
        ],
      },
      
      // GAUGE - Medium, circular, complex texture
      {
        name: 'Gauge',
        componentType: 'gauge',
        priority: 7,
        confidence: 0.75,
        conditions: [
          { property: 'area', operator: 'between', value: [1000, 8000], weight: 1.0 },
          { property: 'properties.textureComplexity', operator: 'gt', value: 0.5, weight: 1.0 },
        ],
      },
      
      // LEVER - Elongated, medium size
      {
        name: 'Lever/Switch',
        componentType: 'lever',
        priority: 6,
        confidence: 0.7,
        conditions: [
          { property: 'area', operator: 'between', value: [500, 4000], weight: 1.0 },
        ],
      },
    ];
  }
  
  /**
   * Get geometry template for component type
   */
  private getGeometryTemplate(type: ComponentType, region: SegmentedRegion): any {
    const aspectRatio = region.bounds.width / region.bounds.height;
    
    switch (type) {
      case 'button':
        return {
          type: 'cylinder',
          parameters: { radius: 0.02, height: 0.015, segments: 16 },
          scale: [1, 1, 1],
        };
      
      case 'screen':
        return {
          type: 'box',
          parameters: { width: 1, height: 1, depth: 0.05 },
          scale: [region.bounds.width / 100, region.bounds.height / 100, 1],
        };
      
      case 'knob':
        return {
          type: 'cylinder',
          parameters: { radiusTop: 0.025, radiusBottom: 0.02, height: 0.03, segments: 16 },
          scale: [1, 1, 1],
        };
      
      case 'panel':
        return {
          type: 'box',
          parameters: { width: 1, height: 1, depth: 0.1 },
          scale: [region.bounds.width / 100, region.bounds.height / 100, 1],
        };
      
      default:
        return {
          type: 'box',
          parameters: { width: 1, height: 1, depth: 0.05 },
          scale: [1, 1, 1],
        };
    }
  }
  
  /**
   * Get material properties for component type
   */
  private getMaterialProperties(type: ComponentType, region: SegmentedRegion): any {
    switch (type) {
      case 'button':
        return {
          baseColor: region.color,
          metalness: 0.3,
          roughness: 0.7,
          emissive: false,
          transparent: false,
        };
      
      case 'screen':
        return {
          baseColor: { r: 0, g: 100, b: 200 },
          metalness: 0.1,
          roughness: 0.2,
          emissive: true,
          emissiveIntensity: 0.5,
          transparent: false,
        };
      
      case 'knob':
        return {
          baseColor: region.color,
          metalness: 0.8,
          roughness: 0.3,
          emissive: false,
          transparent: false,
        };
      
      default:
        return {
          baseColor: region.color,
          metalness: 0.5,
          roughness: 0.5,
          emissive: false,
          transparent: false,
        };
    }
  }
  
  /**
   * Get component function description
   */
  private getComponentFunction(type: ComponentType): string {
    const functions: Record<ComponentType, string> = {
      button: 'Activates function when pressed',
      screen: 'Displays information',
      knob: 'Rotates to adjust value',
      lever: 'Moves to control system',
      switch: 'Toggles between states',
      panel: 'Structural or decorative element',
      gauge: 'Shows measurement or status',
      display: 'Shows data or graphics',
      control: 'General control element',
      indicator: 'Shows status or warning',
      unknown: 'Unclassified component',
    };
    
    return functions[type] || 'Unknown function';
  }
  
  /**
   * Check if component type is interactable
   */
  private isInteractable(type: ComponentType): boolean {
    return ['button', 'knob', 'lever', 'switch'].includes(type);
  }
  
  /**
   * Add custom rule
   */
  addRule(rule: ClassificationRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Remove rule by name
   */
  removeRule(name: string): void {
    this.rules = this.rules.filter(r => r.name !== name);
  }
  
  /**
   * Get all rules
   */
  getRules(): ClassificationRule[] {
    return [...this.rules];
  }
}
