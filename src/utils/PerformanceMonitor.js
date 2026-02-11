/**
 * Performance Monitor Utility
 * Provides performance tracking for map loading and other operations
 */

class PerformanceMonitor {
  constructor() {
    this.stats = {
      mapLoadTime: 0,
      parseTime: 0,
      renderTime: 0,
      totalOperations: 0
    };
    this.timers = new Map();
    this.startTimes = new Map();
  }

  /**
   * Start timing a map load operation
   */
  startMapLoadTimer(filePath) {
    const timerId = `mapLoad_${filePath}`;
    this.startTimes.set(timerId, performance.now());
    this.stats.totalOperations++;
  }

  /**
   * End timing a map load operation
   */
  endMapLoadTimer(filePath) {
    const timerId = `mapLoad_${filePath}`;
    const startTime = this.startTimes.get(timerId);
    
    if (startTime) {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      this.stats.mapLoadTime = loadTime;
      this.startTimes.delete(timerId);
      
      return loadTime;
    }
    
    return 0;
  }

  /**
   * Start a generic timer
   */
  startTimer(name) {
    this.startTimes.set(name, performance.now());
  }

  /**
   * End a generic timer
   */
  endTimer(name) {
    const startTime = this.startTimes.get(name);
    
    if (startTime) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.startTimes.delete(name);
      return duration;
    }
    
    return 0;
  }

  /**
   * Get current statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset all statistics
   */
  reset() {
    this.stats = {
      mapLoadTime: 0,
      parseTime: 0,
      renderTime: 0,
      totalOperations: 0
    };
    this.startTimes.clear();
    this.timers.clear();
  }

  /**
   * Log performance summary
   */
  logSummary() {
    console.log('📊 Performance Summary:');
    console.log(`  - Map Load Time: ${(this.stats.mapLoadTime / 1000).toFixed(2)}s`);
    console.log(`  - Parse Time: ${(this.stats.parseTime / 1000).toFixed(2)}s`);
    console.log(`  - Render Time: ${(this.stats.renderTime / 1000).toFixed(2)}s`);
    console.log(`  - Total Operations: ${this.stats.totalOperations}`);
  }
}

// Create a singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
