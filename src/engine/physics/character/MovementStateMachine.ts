/**
 * Movement State Machine
 * Manages character movement states and transitions
 */

export enum MovementState {
  IDLE = 'idle',
  WALKING = 'walking',
  RUNNING = 'running',
  CROUCHING = 'crouching',
  JUMPING = 'jumping',
  FALLING = 'falling',
  LANDING = 'landing'
}

export class MovementStateMachine {
  private currentState: MovementState = MovementState.IDLE;
  private previousState: MovementState = MovementState.IDLE;
  private stateTime: number = 0;
  
  // Define valid state transitions
  private transitions = new Map<MovementState, MovementState[]>([
    [MovementState.IDLE, [
      MovementState.WALKING,
      MovementState.RUNNING,
      MovementState.CROUCHING,
      MovementState.JUMPING,
      MovementState.FALLING
    ]],
    [MovementState.WALKING, [
      MovementState.IDLE,
      MovementState.RUNNING,
      MovementState.CROUCHING,
      MovementState.JUMPING,
      MovementState.FALLING
    ]],
    [MovementState.RUNNING, [
      MovementState.IDLE,
      MovementState.WALKING,
      MovementState.JUMPING,
      MovementState.FALLING
    ]],
    [MovementState.CROUCHING, [
      MovementState.IDLE,
      MovementState.WALKING,
      MovementState.FALLING
    ]],
    [MovementState.JUMPING, [
      MovementState.FALLING
    ]],
    [MovementState.FALLING, [
      MovementState.LANDING,
      MovementState.IDLE
    ]],
    [MovementState.LANDING, [
      MovementState.IDLE,
      MovementState.WALKING,
      MovementState.RUNNING
    ]]
  ]);
  
  /**
   * Check if transition to target state is valid
   */
  canTransition(to: MovementState): boolean {
    const allowed = this.transitions.get(this.currentState) || [];
    return allowed.includes(to);
  }
  
  /**
   * Attempt to transition to new state
   * @returns true if transition was successful
   */
  transition(to: MovementState): boolean {
    if (this.canTransition(to)) {
      this.previousState = this.currentState;
      this.currentState = to;
      this.stateTime = 0;
      return true;
    }
    return false;
  }
  
  /**
   * Force transition without validation (use carefully)
   */
  forceTransition(to: MovementState): void {
    this.previousState = this.currentState;
    this.currentState = to;
    this.stateTime = 0;
  }
  
  /**
   * Update state timer
   */
  update(deltaTime: number): void {
    this.stateTime += deltaTime;
  }
  
  /**
   * Get current state
   */
  getState(): MovementState {
    return this.currentState;
  }
  
  /**
   * Get previous state
   */
  getPreviousState(): MovementState {
    return this.previousState;
  }
  
  /**
   * Get time spent in current state
   */
  getStateTime(): number {
    return this.stateTime;
  }
  
  /**
   * Check if in specific state
   */
  isState(state: MovementState): boolean {
    return this.currentState === state;
  }
  
  /**
   * Check if in any of the provided states
   */
  isAnyState(...states: MovementState[]): boolean {
    return states.includes(this.currentState);
  }
}
