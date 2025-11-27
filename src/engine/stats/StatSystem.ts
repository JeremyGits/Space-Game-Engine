/**
 * Extensible Stat System
 * Manages character/entity stats like health, stamina, hunger, strength, etc.
 * Fully customizable and extensible for any game
 */

export interface StatConfig {
  name: string;
  displayName: string;
  minValue: number;
  maxValue: number;
  currentValue: number;
  regenRate?: number;        // Per second regeneration
  drainRate?: number;         // Per second drain
  canExceedMax?: boolean;     // Can go above max (e.g., overheal)
  canGoBelowMin?: boolean;    // Can go below min (e.g., negative health = death)
  category?: string;          // Group stats (e.g., 'combat', 'survival', 'attributes')
}

export interface StatModifier {
  id: string;
  statName: string;
  type: 'flat' | 'percentage' | 'multiplier';
  value: number;
  duration?: number;          // Duration in seconds (undefined = permanent)
  source?: string;            // What applied this modifier (e.g., 'potion', 'buff', 'equipment')
}

export class Stat {
  private config: StatConfig;
  private modifiers: StatModifier[] = [];
  private baseValue: number;
  
  constructor(config: StatConfig) {
    this.config = { ...config };
    this.baseValue = config.currentValue;
  }
  
  /**
   * Get current value with all modifiers applied
   */
  getValue(): number {
    let value = this.baseValue;
    
    // Apply flat modifiers first
    for (const mod of this.modifiers) {
      if (mod.type === 'flat') {
        value += mod.value;
      }
    }
    
    // Then percentage modifiers
    for (const mod of this.modifiers) {
      if (mod.type === 'percentage') {
        value += (this.baseValue * (mod.value / 100));
      }
    }
    
    // Finally multipliers
    for (const mod of this.modifiers) {
      if (mod.type === 'multiplier') {
        value *= mod.value;
      }
    }
    
    // Clamp to min/max unless configured otherwise
    if (!this.config.canExceedMax) {
      value = Math.min(value, this.config.maxValue);
    }
    if (!this.config.canGoBelowMin) {
      value = Math.max(value, this.config.minValue);
    }
    
    return value;
  }
  
  /**
   * Get base value (without modifiers)
   */
  getBaseValue(): number {
    return this.baseValue;
  }
  
  /**
   * Set base value
   */
  setBaseValue(value: number): void {
    this.baseValue = value;
  }
  
  /**
   * Add to base value
   */
  addValue(amount: number): void {
    this.baseValue += amount;
  }
  
  /**
   * Get max value
   */
  getMax(): number {
    return this.config.maxValue;
  }
  
  /**
   * Get min value
   */
  getMin(): number {
    return this.config.minValue;
  }
  
  /**
   * Get percentage (0-1)
   */
  getPercentage(): number {
    const range = this.config.maxValue - this.config.minValue;
    const current = this.getValue() - this.config.minValue;
    return Math.max(0, Math.min(1, current / range));
  }
  
  /**
   * Check if stat is at max
   */
  isFull(): boolean {
    return this.getValue() >= this.config.maxValue;
  }
  
  /**
   * Check if stat is at min
   */
  isEmpty(): boolean {
    return this.getValue() <= this.config.minValue;
  }
  
  /**
   * Add a modifier
   */
  addModifier(modifier: StatModifier): void {
    this.modifiers.push(modifier);
  }
  
  /**
   * Remove a modifier by ID
   */
  removeModifier(id: string): boolean {
    const index = this.modifiers.findIndex(m => m.id === id);
    if (index !== -1) {
      this.modifiers.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Remove all modifiers from a source
   */
  removeModifiersBySource(source: string): number {
    const before = this.modifiers.length;
    this.modifiers = this.modifiers.filter(m => m.source !== source);
    return before - this.modifiers.length;
  }
  
  /**
   * Get all modifiers
   */
  getModifiers(): StatModifier[] {
    return [...this.modifiers];
  }
  
  /**
   * Update stat (handle regen/drain)
   */
  update(deltaTime: number): void {
    if (this.config.regenRate && this.config.regenRate > 0) {
      this.addValue(this.config.regenRate * deltaTime);
    }
    
    if (this.config.drainRate && this.config.drainRate > 0) {
      this.addValue(-this.config.drainRate * deltaTime);
    }
    
    // Update modifier durations
    for (let i = this.modifiers.length - 1; i >= 0; i--) {
      const mod = this.modifiers[i];
      if (mod.duration !== undefined) {
        mod.duration -= deltaTime;
        if (mod.duration <= 0) {
          this.modifiers.splice(i, 1);
        }
      }
    }
  }
  
  /**
   * Get stat configuration
   */
  getConfig(): StatConfig {
    return { ...this.config };
  }
  
  /**
   * Get stat name
   */
  getName(): string {
    return this.config.name;
  }
  
  /**
   * Get display name
   */
  getDisplayName(): string {
    return this.config.displayName;
  }
}

export class StatSystem {
  private stats = new Map<string, Stat>();
  
  /**
   * Add a new stat
   */
  addStat(config: StatConfig): Stat {
    const stat = new Stat(config);
    this.stats.set(config.name, stat);
    return stat;
  }
  
  /**
   * Get a stat by name
   */
  getStat(name: string): Stat | undefined {
    return this.stats.get(name);
  }
  
  /**
   * Check if stat exists
   */
  hasStat(name: string): boolean {
    return this.stats.has(name);
  }
  
  /**
   * Remove a stat
   */
  removeStat(name: string): boolean {
    return this.stats.delete(name);
  }
  
  /**
   * Get all stats
   */
  getAllStats(): Stat[] {
    return Array.from(this.stats.values());
  }
  
  /**
   * Get stats by category
   */
  getStatsByCategory(category: string): Stat[] {
    return this.getAllStats().filter(stat => 
      stat.getConfig().category === category
    );
  }
  
  /**
   * Update all stats
   */
  update(deltaTime: number): void {
    for (const stat of this.stats.values()) {
      stat.update(deltaTime);
    }
  }
  
  /**
   * Get stat value (convenience method)
   */
  getValue(name: string): number {
    const stat = this.getStat(name);
    return stat ? stat.getValue() : 0;
  }
  
  /**
   * Set stat value (convenience method)
   */
  setValue(name: string, value: number): boolean {
    const stat = this.getStat(name);
    if (stat) {
      stat.setBaseValue(value);
      return true;
    }
    return false;
  }
  
  /**
   * Add to stat value (convenience method)
   */
  addValue(name: string, amount: number): boolean {
    const stat = this.getStat(name);
    if (stat) {
      stat.addValue(amount);
      return true;
    }
    return false;
  }
  
  /**
   * Serialize stats to JSON
   */
  serialize(): Record<string, any> {
    const data: Record<string, any> = {};
    for (const [name, stat] of this.stats) {
      data[name] = {
        baseValue: stat.getBaseValue(),
        modifiers: stat.getModifiers()
      };
    }
    return data;
  }
  
  /**
   * Deserialize stats from JSON
   */
  deserialize(data: Record<string, any>): void {
    for (const [name, statData] of Object.entries(data)) {
      const stat = this.getStat(name);
      if (stat && statData) {
        stat.setBaseValue(statData.baseValue);
        if (statData.modifiers) {
          for (const mod of statData.modifiers) {
            stat.addModifier(mod);
          }
        }
      }
    }
  }
}

/**
 * Preset stat configurations for common game stats
 */
export const COMMON_STATS = {
  // Combat Stats
  HEALTH: {
    name: 'health',
    displayName: 'Health',
    minValue: 0,
    maxValue: 100,
    currentValue: 100,
    regenRate: 1, // 1 HP per second
    category: 'combat'
  } as StatConfig,
  
  STAMINA: {
    name: 'stamina',
    displayName: 'Stamina',
    minValue: 0,
    maxValue: 100,
    currentValue: 100,
    regenRate: 15, // 15 per second
    category: 'combat'
  } as StatConfig,
  
  MANA: {
    name: 'mana',
    displayName: 'Mana',
    minValue: 0,
    maxValue: 100,
    currentValue: 100,
    regenRate: 5, // 5 per second
    category: 'combat'
  } as StatConfig,
  
  // Survival Stats
  HUNGER: {
    name: 'hunger',
    displayName: 'Hunger',
    minValue: 0,
    maxValue: 100,
    currentValue: 100,
    drainRate: 0.5, // Drains 0.5 per second
    category: 'survival'
  } as StatConfig,
  
  THIRST: {
    name: 'thirst',
    displayName: 'Thirst',
    minValue: 0,
    maxValue: 100,
    currentValue: 100,
    drainRate: 1, // Drains 1 per second
    category: 'survival'
  } as StatConfig,
  
  OXYGEN: {
    name: 'oxygen',
    displayName: 'Oxygen',
    minValue: 0,
    maxValue: 100,
    currentValue: 100,
    drainRate: 2, // Drains 2 per second (space suit)
    category: 'survival'
  } as StatConfig,
  
  // Attribute Stats
  STRENGTH: {
    name: 'strength',
    displayName: 'Strength',
    minValue: 1,
    maxValue: 100,
    currentValue: 10,
    category: 'attributes'
  } as StatConfig,
  
  AGILITY: {
    name: 'agility',
    displayName: 'Agility',
    minValue: 1,
    maxValue: 100,
    currentValue: 10,
    category: 'attributes'
  } as StatConfig,
  
  INTELLIGENCE: {
    name: 'intelligence',
    displayName: 'Intelligence',
    minValue: 1,
    maxValue: 100,
    currentValue: 10,
    category: 'attributes'
  } as StatConfig,
  
  ENDURANCE: {
    name: 'endurance',
    displayName: 'Endurance',
    minValue: 1,
    maxValue: 100,
    currentValue: 10,
    category: 'attributes'
  } as StatConfig
};
