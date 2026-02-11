import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Performance monitoring hook for debug window
 * Tracks FPS, memory, CPU, and map statistics
 */
export function usePerformanceMonitor(mapState) {
  const [stats, setStats] = useState({
    fps: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    mapSize: { tiles: 0, objects: 0, dimensions: { x: 0, y: 0 } },
    mapLoadTime: 0,
    mapPath: null,
    renderTime: 0,
    visibleObjects: 0,
    visibleTiles: 0,
    poolStats: { grid: 0, tiles: 0, objects: 0 }
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef([]);
  const mapLoadStartTime = useRef(null);
  const renderStartTime = useRef(performance.now());

  // FPS calculation
  const calculateFPS = useCallback(() => {
    frameCount.current++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime.current >= 1000) {
      const fps = frameCount.current;
      frameCount.current = 0;
      lastTime.current = currentTime;
      
      // Keep FPS history for averaging
      fpsHistory.current.push(fps);
      if (fpsHistory.current.length > 10) {
        fpsHistory.current.shift();
      }
      
      return fps;
    }
    return null;
  }, []);

  // Memory usage calculation
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = performance.memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      };
    }
    return { used: 0, total: 0, limit: 0, percentage: 0 };
  }, []);

  // CPU usage estimation (simplified)
  const getCPUUsage = useCallback(() => {
    // This is a rough estimation - real CPU monitoring requires more complex APIs
    const start = performance.now();
    const busyWork = () => {
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += Math.random();
      }
      return sum;
    };
    
    busyWork();
    const end = performance.now();
    const workTime = end - start;
    
    // Estimate based on how long the work took
    // This is very approximate but gives some indication
    const cpuEstimate = Math.min(100, Math.max(0, (workTime / 10) * 100));
    return Math.round(cpuEstimate);
  }, []);

  // Update map statistics
  const updateMapStats = useCallback(() => {
    if (!mapState) return;

    const mapSize = {
      tiles: mapState.tiles?.length || 0,
      objects: mapState.objects?.length || 0,
      dimensions: {
        x: mapState.header?.MaxHexX || 0,
        y: mapState.header?.MaxHexY || 0
      }
    };

    setStats(prev => ({
      ...prev,
      mapSize
    }));
  }, [mapState]);

  // Start map load timer
  const startMapLoadTimer = useCallback((mapPath) => {
    mapLoadStartTime.current = performance.now();
    setStats(prev => ({
      ...prev,
      mapPath,
      mapLoadTime: 0
    }));
  }, []);

  // End map load timer and log to console
  const endMapLoadTimer = useCallback(() => {
    if (mapLoadStartTime.current) {
      const loadTime = performance.now() - mapLoadStartTime.current;
      const loadTimeSeconds = (loadTime / 1000).toFixed(2);
      
      setStats(prev => ({
        ...prev,
        mapLoadTime: loadTime
      }));

      // Log to console
      if (stats.mapPath) {
        console.log(`🗺️ Map Load Complete: ${stats.mapPath}`);
        console.log(`⏱️ Load Time: ${loadTimeSeconds}s`);
        console.log(`📊 Map Size: ${stats.mapSize.tiles} tiles, ${stats.mapSize.objects} objects`);
        console.log(`🗺️ Dimensions: ${stats.mapSize.dimensions.x}x${stats.mapSize.dimensions.y}`);
      }

      mapLoadStartTime.current = null;
    }
  }, [stats.mapPath, stats.mapSize]);

  // Update render time
  const updateRenderTime = useCallback(() => {
    const now = performance.now();
    const renderTime = now - renderStartTime.current;
    renderStartTime.current = now;
    
    setStats(prev => ({
      ...prev,
      renderTime: Math.round(renderTime * 100) / 100
    }));
  }, []);

  // Main update loop
  const updateStats = useCallback(() => {
    const fps = calculateFPS();
    if (fps !== null) {
      const memoryUsage = getMemoryUsage();
      const cpuUsage = getCPUUsage();

      setStats(prev => ({
        ...prev,
        fps,
        memoryUsage: memoryUsage.used,
        memoryPercentage: memoryUsage.percentage,
        cpuUsage
      }));
    }

    updateRenderTime();
  }, [calculateFPS, getMemoryUsage, getCPUUsage, updateRenderTime]);

  // Set up monitoring interval
  useEffect(() => {
    const interval = setInterval(updateStats, 100); // Update 10 times per second
    
    return () => clearInterval(interval);
  }, [updateStats]);

  // Update map stats when map changes
  useEffect(() => {
    updateMapStats();
  }, [updateMapStats]);

  // Calculate average FPS
  const getAverageFPS = useCallback(() => {
    if (fpsHistory.current.length === 0) return 0;
    const sum = fpsHistory.current.reduce((a, b) => a + b, 0);
    return Math.round(sum / fpsHistory.current.length);
  }, []);

  return {
    stats,
    startMapLoadTimer,
    endMapLoadTimer,
    getAverageFPS,
    updateMapStats
  };
}
