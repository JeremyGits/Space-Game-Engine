/**
 * ProfilerMarker
 * 
 * Marks and measures performance of specific code sections.
 */

export interface ProfilerMeasurement {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  count: number;
}

export class ProfilerMarker {
  private measurements: Map<string, ProfilerMeasurement[]> = new Map();
  private activeMarkers: Map<string, number> = new Map();
  private historySize: number = 100;

  constructor(historySize: number = 100) {
    this.historySize = historySize;
  }

  /**
   * Begin a profiler marker
   */
  begin(name: string): void {
    this.activeMarkers.set(name, performance.now());
  }

  /**
   * End a profiler marker
   */
  end(name: string): void {
    const startTime = this.activeMarkers.get(name);
    
    if (startTime === undefined) {
      console.warn(`[ProfilerMarker] No active marker found for: ${name}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Get or create measurement array
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }

    const measurements = this.measurements.get(name)!;
    
    // Add measurement
    measurements.push({
      name,
      startTime,
      endTime,
      duration,
      count: measurements.length + 1
    });

    // Limit history size
    if (measurements.length > this.historySize) {
      measurements.shift();
    }

    // Remove active marker
    this.activeMarkers.delete(name);
  }

  /**
   * Measure a function execution
   */
  measure<T>(name: string, fn: () => T): T {
    this.begin(name);
    try {
      return fn();
    } finally {
      this.end(name);
    }
  }

  /**
   * Measure an async function execution
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.begin(name);
    try {
      return await fn();
    } finally {
      this.end(name);
    }
  }

  /**
   * Get measurements for a marker
   */
  getMeasurements(name: string): ProfilerMeasurement[] {
    return this.measurements.get(name) || [];
  }

  /**
   * Get average duration for a marker
   */
  getAverageDuration(name: string): number {
    const measurements = this.getMeasurements(name);
    if (measurements.length === 0) return 0;

    const sum = measurements.reduce((acc, m) => acc + m.duration, 0);
    return sum / measurements.length;
  }

  /**
   * Get minimum duration for a marker
   */
  getMinDuration(name: string): number {
    const measurements = this.getMeasurements(name);
    if (measurements.length === 0) return 0;

    return Math.min(...measurements.map(m => m.duration));
  }

  /**
   * Get maximum duration for a marker
   */
  getMaxDuration(name: string): number {
    const measurements = this.getMeasurements(name);
    if (measurements.length === 0) return 0;

    return Math.max(...measurements.map(m => m.duration));
  }

  /**
   * Get last duration for a marker
   */
  getLastDuration(name: string): number {
    const measurements = this.getMeasurements(name);
    if (measurements.length === 0) return 0;

    return measurements[measurements.length - 1].duration;
  }

  /**
   * Get all marker names
   */
  getMarkerNames(): string[] {
    return Array.from(this.measurements.keys());
  }

  /**
   * Get summary for a marker
   */
  getSummary(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    last: number;
  } {
    return {
      count: this.getMeasurements(name).length,
      average: this.getAverageDuration(name),
      min: this.getMinDuration(name),
      max: this.getMaxDuration(name),
      last: this.getLastDuration(name)
    };
  }

  /**
   * Get all summaries
   */
  getAllSummaries(): Map<string, ReturnType<typeof this.getSummary>> {
    const summaries = new Map();
    
    for (const name of this.getMarkerNames()) {
      summaries.set(name, this.getSummary(name));
    }
    
    return summaries;
  }

  /**
   * Clear measurements for a marker
   */
  clear(name: string): void {
    this.measurements.delete(name);
    this.activeMarkers.delete(name);
  }

  /**
   * Clear all measurements
   */
  clearAll(): void {
    this.measurements.clear();
    this.activeMarkers.clear();
  }

  /**
   * Set history size
   */
  setHistorySize(size: number): void {
    this.historySize = size;
    
    // Trim existing measurements
    for (const [name, measurements] of this.measurements) {
      if (measurements.length > size) {
        this.measurements.set(name, measurements.slice(-size));
      }
    }
  }

  /**
   * Export measurements as JSON
   */
  export(): string {
    const data: any = {};
    
    for (const [name, measurements] of this.measurements) {
      data[name] = {
        measurements,
        summary: this.getSummary(name)
      };
    }
    
    return JSON.stringify(data, null, 2);
  }
}
