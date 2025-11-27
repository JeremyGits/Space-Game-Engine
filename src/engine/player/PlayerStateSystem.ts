/**
 * Player State System
 * Manages high-level player states (on-foot, in-vehicle, etc.)
 */

export enum PlayerState {
  // On-foot states
  ON_FOOT = 'on_foot',
  
  // Vehicle states
  IN_SPACECRAFT = 'in_spacecraft',
  IN_GROUND_VEHICLE = 'in_ground_vehicle',
  IN_AIRCRAFT = 'in_aircraft',
  
  // Mobile equipment states
  ON_BICYCLE = 'on_bicycle',
  ON_SKATEBOARD = 'on_skateboard',
  ON_SKATES = 'on_skates',
  ON_SCOOTER = 'on_scooter',
  ON_HOVERBOARD = 'on_hoverboard',
  
  // Special states
  IN_SEAT = 'in_seat',           // Sitting (chair, bench, etc.)
  IN_BED = 'in_bed',             // Sleeping/resting
  SWIMMING = 'swimming',
  CLIMBING = 'climbing',
  ZERO_G = 'zero_g',             // Zero gravity (space station interior)
  
  // Transition states
  ENTERING_VEHICLE = 'entering_vehicle',
  EXITING_VEHICLE = 'exiting_vehicle',
  MOUNTING = 'mounting',         // Getting on mobile equipment
  DISMOUNTING = 'dismounting'
}

export interface PlayerStateData {
  state: PlayerState;
  previousState: PlayerState;
  stateTime: number;
  vehicleId?: string;            // ID of current vehicle/equipment
  canExit: boolean;              // Can exit current state
  transitionProgress: number;    // 0-1 for transition states
}

export class PlayerStateSystem {
  private currentState: PlayerState = PlayerState.ON_FOOT;
  private previousState: PlayerState = PlayerState.ON_FOOT;
  private stateTime: number = 0;
  private vehicleId: string | null = null;
  private transitionProgress: number = 0;
  
  // Define valid state transitions
  private transitions = new Map<PlayerState, PlayerState[]>([
    [PlayerState.ON_FOOT, [
      PlayerState.ENTERING_VEHICLE,
      PlayerState.MOUNTING,
      PlayerState.IN_SEAT,
      PlayerState.SWIMMING,
      PlayerState.CLIMBING,
      PlayerState.ZERO_G
    ]],
    [PlayerState.ENTERING_VEHICLE, [
      PlayerState.IN_SPACECRAFT,
      PlayerState.IN_GROUND_VEHICLE,
      PlayerState.IN_AIRCRAFT,
      PlayerState.ON_FOOT  // Cancel
    ]],
    [PlayerState.IN_SPACECRAFT, [
      PlayerState.EXITING_VEHICLE,
      PlayerState.ZERO_G  // Exit to space
    ]],
    [PlayerState.IN_GROUND_VEHICLE, [
      PlayerState.EXITING_VEHICLE
    ]],
    [PlayerState.IN_AIRCRAFT, [
      PlayerState.EXITING_VEHICLE
    ]],
    [PlayerState.EXITING_VEHICLE, [
      PlayerState.ON_FOOT,
      PlayerState.ZERO_G
    ]],
    [PlayerState.MOUNTING, [
      PlayerState.ON_BICYCLE,
      PlayerState.ON_SKATEBOARD,
      PlayerState.ON_SKATES,
      PlayerState.ON_SCOOTER,
      PlayerState.ON_HOVERBOARD,
      PlayerState.ON_FOOT  // Cancel
    ]],
    [PlayerState.ON_BICYCLE, [
      PlayerState.DISMOUNTING
    ]],
    [PlayerState.ON_SKATEBOARD, [
      PlayerState.DISMOUNTING
    ]],
    [PlayerState.ON_SKATES, [
      PlayerState.DISMOUNTING
    ]],
    [PlayerState.ON_SCOOTER, [
      PlayerState.DISMOUNTING
    ]],
    [PlayerState.ON_HOVERBOARD, [
      PlayerState.DISMOUNTING
    ]],
    [PlayerState.DISMOUNTING, [
      PlayerState.ON_FOOT
    ]],
    [PlayerState.IN_SEAT, [
      PlayerState.ON_FOOT
    ]],
    [PlayerState.SWIMMING, [
      PlayerState.ON_FOOT
    ]],
    [PlayerState.CLIMBING, [
      PlayerState.ON_FOOT,
      PlayerState.ZERO_G
    ]],
    [PlayerState.ZERO_G, [
      PlayerState.ON_FOOT,
      PlayerState.ENTERING_VEHICLE,
      PlayerState.CLIMBING
    ]]
  ]);
  
  /**
   * Check if transition is valid
   */
  canTransition(to: PlayerState): boolean {
    const allowed = this.transitions.get(this.currentState) || [];
    return allowed.includes(to);
  }
  
  /**
   * Attempt state transition
   */
  transition(to: PlayerState, vehicleId?: string): boolean {
    if (this.canTransition(to)) {
      this.previousState = this.currentState;
      this.currentState = to;
      this.stateTime = 0;
      this.transitionProgress = 0;
      this.vehicleId = vehicleId || null;
      return true;
    }
    return false;
  }
  
  /**
   * Update state system
   */
  update(deltaTime: number): void {
    this.stateTime += deltaTime;
    
    // Update transition progress for transition states
    if (this.isTransitionState()) {
      this.transitionProgress = Math.min(1, this.transitionProgress + deltaTime * 2); // 0.5s transitions
      
      // Auto-complete transitions
      if (this.transitionProgress >= 1) {
        this.completeTransition();
      }
    }
  }
  
  /**
   * Check if current state is a transition state
   */
  private isTransitionState(): boolean {
    return [
      PlayerState.ENTERING_VEHICLE,
      PlayerState.EXITING_VEHICLE,
      PlayerState.MOUNTING,
      PlayerState.DISMOUNTING
    ].includes(this.currentState);
  }
  
  /**
   * Complete transition to final state
   */
  private completeTransition(): void {
    switch (this.currentState) {
      case PlayerState.ENTERING_VEHICLE:
        // Determine vehicle type and transition
        // This would be set by the vehicle being entered
        break;
      case PlayerState.EXITING_VEHICLE:
        this.transition(PlayerState.ON_FOOT);
        break;
      case PlayerState.MOUNTING:
        // Determine equipment type
        break;
      case PlayerState.DISMOUNTING:
        this.transition(PlayerState.ON_FOOT);
        break;
    }
  }
  
  /**
   * Enter vehicle
   */
  enterVehicle(vehicleType: 'spacecraft' | 'ground' | 'aircraft', vehicleId: string): boolean {
    if (this.transition(PlayerState.ENTERING_VEHICLE, vehicleId)) {
      // After transition completes, move to specific vehicle state
      setTimeout(() => {
        switch (vehicleType) {
          case 'spacecraft':
            this.transition(PlayerState.IN_SPACECRAFT, vehicleId);
            break;
          case 'ground':
            this.transition(PlayerState.IN_GROUND_VEHICLE, vehicleId);
            break;
          case 'aircraft':
            this.transition(PlayerState.IN_AIRCRAFT, vehicleId);
            break;
        }
      }, 500); // Match transition duration
      return true;
    }
    return false;
  }
  
  /**
   * Exit vehicle
   */
  exitVehicle(): boolean {
    return this.transition(PlayerState.EXITING_VEHICLE);
  }
  
  /**
   * Mount equipment
   */
  mountEquipment(equipmentType: 'bicycle' | 'skateboard' | 'skates' | 'scooter' | 'hoverboard', equipmentId: string): boolean {
    if (this.transition(PlayerState.MOUNTING, equipmentId)) {
      setTimeout(() => {
        switch (equipmentType) {
          case 'bicycle':
            this.transition(PlayerState.ON_BICYCLE, equipmentId);
            break;
          case 'skateboard':
            this.transition(PlayerState.ON_SKATEBOARD, equipmentId);
            break;
          case 'skates':
            this.transition(PlayerState.ON_SKATES, equipmentId);
            break;
          case 'scooter':
            this.transition(PlayerState.ON_SCOOTER, equipmentId);
            break;
          case 'hoverboard':
            this.transition(PlayerState.ON_HOVERBOARD, equipmentId);
            break;
        }
      }, 500);
      return true;
    }
    return false;
  }
  
  /**
   * Dismount equipment
   */
  dismount(): boolean {
    return this.transition(PlayerState.DISMOUNTING);
  }
  
  /**
   * Get current state
   */
  getState(): PlayerState {
    return this.currentState;
  }
  
  /**
   * Get state data
   */
  getStateData(): PlayerStateData {
    return {
      state: this.currentState,
      previousState: this.previousState,
      stateTime: this.stateTime,
      vehicleId: this.vehicleId || undefined,
      canExit: this.canExitCurrentState(),
      transitionProgress: this.transitionProgress
    };
  }
  
  /**
   * Check if can exit current state
   */
  private canExitCurrentState(): boolean {
    // Can't exit during transitions
    if (this.isTransitionState()) {
      return false;
    }
    
    // Can always exit on-foot states
    if (this.currentState === PlayerState.ON_FOOT) {
      return true;
    }
    
    // Vehicle/equipment states can be exited
    return true;
  }
  
  /**
   * Check if player is in vehicle
   */
  isInVehicle(): boolean {
    return [
      PlayerState.IN_SPACECRAFT,
      PlayerState.IN_GROUND_VEHICLE,
      PlayerState.IN_AIRCRAFT
    ].includes(this.currentState);
  }
  
  /**
   * Check if player is on mobile equipment
   */
  isOnEquipment(): boolean {
    return [
      PlayerState.ON_BICYCLE,
      PlayerState.ON_SKATEBOARD,
      PlayerState.ON_SKATES,
      PlayerState.ON_SCOOTER,
      PlayerState.ON_HOVERBOARD
    ].includes(this.currentState);
  }
  
  /**
   * Check if player can use character controller
   */
  canUseCharacterController(): boolean {
    return this.currentState === PlayerState.ON_FOOT;
  }
  
  /**
   * Get current vehicle/equipment ID
   */
  getCurrentVehicleId(): string | null {
    return this.vehicleId;
  }
}
