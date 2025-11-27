/**
 * Stamina System
 * Manages stamina for sprinting and other actions
 */

export interface StaminaConfig {
  maxStamina: number;
  drainRate: number;      // Per second when sprinting
  regenRate: number;      // Per second when not sprinting
  regenDelay: number;     // Delay before regen starts after drain
  minForSprint: number;   // Minimum stamina required to sprint
}

export const DEFAULT_STAMINA_CONFIG: StaminaConfig = {
  maxStamina: 100,
  drainRate: 20,          // Drains 20 per second
  regenRate: 15,          // Regenerates 15 per second
  regenDelay: 1.0,        // 1 second delay
  minForSprint: 10        // Need at least 10 to sprint
};

export class StaminaSystem {
  private config: StaminaConfig;
  private currentStamina: number;
  private timeSinceLastDrain: number = 0;
  
  constructor(config: StaminaConfig = DEFAULT_STAMINA_CONFIG) {
    this.config = { ...config };
    this.currentStamina = config.maxStamina;
  }
  
  /**
   * Update stamina
   */
  update(deltaTime: number, isSprinting: boolean): void {
    if (isSprinting && this.canSprint()) {
      // Drain stamina
      this.currentStamina -= this.config.drainRate * deltaTime;
      this.currentStamina = Math.max(0, this.currentStamina);
      this.timeSinceLastDrain = 0;
    } else {
      // Regenerate stamina after delay
      this.timeSinceLastDrain += deltaTime;
      
      if (this.timeSinceLastDrain >= this.config.regenDelay) {
        this.currentStamina += this.config.regenRate * deltaTime;
        this.currentStamina = Math.min(this.config.maxStamina, this.currentStamina);
      }
    }
  }
  
  /**
   * Check if can sprint
   */
  canSprint(): boolean {
    return this.currentStamina >= this.config.minForSprint;
  }
  
  /**
   * Get current stamina
   */
  getStamina(): number {
    return this.currentStamina;
  }
  
  /**
   * Get max stamina
   */
  getMaxStamina(): number {
    return this.config.maxStamina;
  }
  
  /**
   * Get stamina percentage (0-1)
   */
  getStaminaPercentage(): number {
    return this.currentStamina / this.config.maxStamina;
  }
  
  /**
   * Set stamina
   */
  setStamina(value: number): void {
    this.currentStamina = Math.max(0, Math.min(this.config.maxStamina, value));
  }
  
  /**
   * Add stamina
   */
  addStamina(amount: number): void {
    this.setStamina(this.currentStamina + amount);
  }
  
  /**
   * Check if stamina is full
   */
  isFull(): boolean {
    return this.currentStamina >= this.config.maxStamina;
  }
  
  /**
   * Check if stamina is empty
   */
  isEmpty(): boolean {
    return this.currentStamina <= 0;
  }
  
  /**
   * Reset stamina to full
   */
  reset(): void {
    this.currentStamina = this.config.maxStamina;
    this.timeSinceLastDrain = 0;
  }
}
