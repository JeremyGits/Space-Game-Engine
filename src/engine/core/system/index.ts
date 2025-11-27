/**
 * System Management
 * 
 * Complete system architecture for the ECS:
 * - System: Base system class
 * - SystemPriority: Priority levels for execution order
 * - SystemScheduler: System execution scheduling
 */

export { System, SystemPhase } from './System';
export type { SystemConfig } from './System';

export { SystemPriority, SystemPriorityUtils } from './SystemPriority';

export { SystemScheduler } from './SystemScheduler';
export type {
  SystemSchedulerConfig,
  SystemExecutionStats
} from './SystemScheduler';
