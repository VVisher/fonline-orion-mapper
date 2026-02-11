import { useRef, useCallback, useEffect } from 'react';
import { Graphics } from 'pixi.js';

/**
 * Performance optimization hooks for HexGrid
 */

/**
 * Debounce function to limit rapid calls
 */
export function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

/**
 * Throttle function to limit call frequency
 */
export function useThrottle(callback, delay) {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    
    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);
}

/**
 * Performance monitor for tracking render times
 */
export function usePerformanceMonitor() {
  const metricsRef = useRef({
    renderCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    maxRenderTime: 0,
    minRenderTime: Infinity
  });
  
  const startRender = useCallback(() => {
    return performance.now();
  }, []);
  
  const endRender = useCallback((startTime) => {
    const renderTime = performance.now() - startTime;
    const metrics = metricsRef.current;
    
    metrics.renderCount++;
    metrics.totalRenderTime += renderTime;
    metrics.lastRenderTime = renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;
    metrics.maxRenderTime = Math.max(metrics.maxRenderTime, renderTime);
    metrics.minRenderTime = Math.min(metrics.minRenderTime, renderTime);
    
    return renderTime;
  }, []);
  
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);
  
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      maxRenderTime: 0,
      minRenderTime: Infinity
    };
  }, []);
  
  return { startRender, endRender, getMetrics, resetMetrics };
}

/**
 * RAF-based animation scheduler for smooth rendering
 */
export function useRAFScheduler() {
  const rafIdRef = useRef(null);
  const callbacksRef = useRef(new Set());
  
  const schedule = useCallback((callback) => {
    callbacksRef.current.add(callback);
    
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        const callbacks = Array.from(callbacksRef.current);
        callbacksRef.current.clear();
        rafIdRef.current = null;
        
        for (const cb of callbacks) {
          try {
            cb();
          } catch (error) {
            console.error('[ORION] RAF callback error:', error);
          }
        }
      });
    }
  }, []);
  
  const cancel = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    callbacksRef.current.clear();
  }, []);
  
  useEffect(() => {
    return cancel;
  }, [cancel]);
  
  return { schedule, cancel };
}

/**
 * Memory pool for reusable graphics objects
 */
export class GraphicsPool {
  constructor(initialSize = 100) {
    this.pool = [];
    this.inUse = new Set();
    this.expand(initialSize);
  }
  
  expand(count) {
    for (let i = 0; i < count; i++) {
      this.pool.push({ graphics: null, inUse: false });
    }
  }
  
  acquire() {
    // Find available graphics object
    for (let i = 0; i < this.pool.length; i++) {
      const item = this.pool[i];
      if (!item.inUse) {
        item.inUse = true;
        this.inUse.add(item);
        
        if (!item.graphics) {
          // Create new graphics object on demand
          item.graphics = new Graphics();
        }
        
        return item.graphics;
      }
    }
    
    // Pool exhausted, expand and retry
    this.expand(50);
    return this.acquire();
  }
  
  release(graphics) {
    // Find and release the graphics object
    for (const item of this.inUse) {
      if (item.graphics === graphics) {
        item.inUse = false;
        item.graphics.clear();
        this.inUse.delete(item);
        return;
      }
    }
  }
  
  clear() {
    for (const item of this.pool) {
      if (item.graphics) {
        item.graphics.destroy();
      }
    }
    this.pool = [];
    this.inUse.clear();
  }
  
  getStats() {
    return {
      total: this.pool.length,
      inUse: this.inUse.size,
      available: this.pool.length - this.inUse.size
    };
  }
}
