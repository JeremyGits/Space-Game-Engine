/**
 * GPU Memory Manager
 * 
 * Manages GPU memory allocation and deallocation.
 * Tracks memory usage and prevents memory leaks.
 */

import * as THREE from 'three';

/**
 * Memory allocation
 */
export interface MemoryAllocation {
  /** Allocation ID */
  id: string;
  
  /** Size in bytes */
  size: number;
  
  /** Type of resource */
  type: 'buffer' | 'texture' | 'framebuffer';
  
  /** Allocation time */
  timestamp: number;
}

/**
 * Memory statistics
 */
export interface MemoryStats {
  /** Total allocated (MB) */
  totalAllocated: number;
  
  /** Total freed (MB) */
  totalFreed: number;
  
  /** Current usage (MB) */
  currentUsage: number;
  
  /** Peak usage (MB) */
  peakUsage: number;
  
  /** Allocation count */
  allocationCount: number;
}

/**
 * GPU memory manager
 */
export class GPUMemoryManager {
  private allocations: Map<string, MemoryAllocation> = new Map();
  private stats: MemoryStats;
  
  constructor() {
    this.stats = {
      totalAllocated: 0,
      totalFreed: 0,
      currentUsage: 0,
      peakUsage: 0,
      allocationCount: 0
    };
  }
  
  /**
   * Track allocation
   */
  trackAllocation(
    id: string,
    size: number,
    type: MemoryAllocation['type']
  ): void {
    // Remove old allocation if exists
    if (this.allocations.has(id)) {
      this.trackDeallocation(id);
    }
    
    const allocation: MemoryAllocation = {
      id,
      size,
      type,
      timestamp: performance.now()
    };
    
    this.allocations.set(id, allocation);
    
    // Update stats
    const sizeMB = size / (1024 * 1024);
    this.stats.totalAllocated += sizeMB;
    this.stats.currentUsage += sizeMB;
    this.stats.allocationCount++;
    
    if (this.stats.currentUsage > this.stats.peakUsage) {
      this.stats.peakUsage = this.stats.currentUsage;
    }
  }
  
  /**
   * Track deallocation
   */
  trackDeallocation(id: string): void {
    const allocation = this.allocations.get(id);
    if (!allocation) return;
    
    const sizeMB = allocation.size / (1024 * 1024);
    this.stats.totalFreed += sizeMB;
    this.stats.currentUsage -= sizeMB;
    
    this.allocations.delete(id);
  }
  
  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    return { ...this.stats };
  }
  
  /**
   * Get allocations by type
   */
  getAllocationsByType(type: MemoryAllocation['type']): MemoryAllocation[] {
    return Array.from(this.allocations.values()).filter(a => a.type === type);
  }
  
  /**
   * Get oldest allocations
   */
  getOldestAllocations(count: number = 10): MemoryAllocation[] {
    return Array.from(this.allocations.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, count);
  }
  
  /**
   * Get largest allocations
   */
  getLargestAllocations(count: number = 10): MemoryAllocation[] {
    return Array.from(this.allocations.values())
      .sort((a, b) => b.size - a.size)
      .slice(0, count);
  }
  
  /**
   * Check if memory limit exceeded
   */
  isMemoryLimitExceeded(limitMB: number): boolean {
    return this.stats.currentUsage > limitMB;
  }
  
  /**
   * Clear all tracking
   */
  clear(): void {
    this.allocations.clear();
    this.stats = {
      totalAllocated: 0,
      totalFreed: 0,
      currentUsage: 0,
      peakUsage: 0,
      allocationCount: 0
    };
  }
}
