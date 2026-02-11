/**
 * Level of Detail (LOD) system for progressive detail rendering
 * Reduces rendering load by simplifying distant objects
 */

export class LODSystem {
  constructor() {
    this.levels = [
      { distance: 200, detail: 1.0, objectThreshold: 100 },  // Full detail
      { distance: 500, detail: 0.75, objectThreshold: 50 }, // 75% detail
      { distance: 1000, detail: 0.5, objectThreshold: 25 },  // 50% detail
      { distance: 2000, detail: 0.25, objectThreshold: 10 }, // 25% detail
      { distance: 4000, detail: 0.1, objectThreshold: 5 },   // 10% detail
    ];
    
    this.currentLevel = 0;
    this.cameraPosition = { x: 0, y: 0 };
    this.zoom = 1;
  }

  /**
   * Update camera position and determine LOD level
   */
  updateCamera(cameraX, cameraY, zoom) {
    this.cameraPosition = { x: cameraX, y: cameraY };
    this.zoom = zoom;
    
    // Calculate effective view distance based on zoom
    const effectiveDistance = 1000 / zoom;
    
    // Find appropriate LOD level
    for (let i = 0; i < this.levels.length; i++) {
      if (effectiveDistance <= this.levels[i].distance) {
        this.currentLevel = i;
        break;
      }
    }
  }

  /**
   * Get current LOD level
   */
  getCurrentLevel() {
    return this.levels[this.currentLevel];
  }

  /**
   * Filter objects based on LOD
   */
  filterObjects(objects) {
    const level = this.getCurrentLevel();
    const filtered = [];
    
    // Group objects by proximity to camera
    const objectGroups = this.groupObjectsByProximity(objects);
    
    // Sample objects based on LOD threshold
    for (const group of objectGroups) {
      const sampleSize = Math.min(group.length, level.objectThreshold);
      const step = Math.max(1, Math.floor(group.length / sampleSize));
      
      for (let i = 0; i < group.length; i += step) {
        filtered.push(group[i]);
        if (filtered.length >= sampleSize) break;
      }
    }
    
    return filtered;
  }

  /**
   * Group objects by their proximity to each other
   */
  groupObjectsByProximity(objects) {
    const groups = [];
    const processed = new Set();
    
    for (let i = 0; i < objects.length; i++) {
      if (processed.has(i)) continue;
      
      const group = [objects[i]];
      processed.add(i);
      
      // Find nearby objects
      for (let j = i + 1; j < objects.length; j++) {
        if (processed.has(j)) continue;
        
        const distance = this.getDistance(objects[i], objects[j]);
        if (distance < 100) { // 100 hex units proximity
          group.push(objects[j]);
          processed.add(j);
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }

  /**
   * Calculate distance between two objects
   */
  getDistance(obj1, obj2) {
    const dx = obj1.MapX - obj2.MapX;
    const dy = obj1.MapY - obj2.MapY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Simplify rendering based on LOD level
   */
  getSimplifiedRenderParams() {
    const level = this.getCurrentLevel();
    
    return {
      // Grid simplification
      gridAlpha: 0.3 * level.detail,
      gridLineWidth: Math.max(0.5, 1.0 * level.detail),
      
      // Tile simplification
      tileAlpha: 0.8 * level.detail,
      
      // Object simplification
      objectAlpha: 0.5 * level.detail,
      objectSize: Math.max(3, 10 * level.detail),
      
      // Performance optimizations
      skipAnimations: level.detail < 0.5,
      reduceEffects: level.detail < 0.75,
    };
  }

  /**
   * Check if object should be rendered at current LOD
   */
  shouldRenderObject(obj) {
    const level = this.getCurrentLevel();
    const distance = this.getDistanceFromCamera(obj);
    
    // Don't render objects beyond maximum LOD distance
    if (distance > this.levels[this.levels.length - 1].distance) {
      return false;
    }
    
    return true;
  }

  /**
   * Get distance from camera to object
   */
  getDistanceFromCamera(obj) {
    const dx = obj.MapX * 44 - this.cameraPosition.x; // Convert hex to world coords
    const dy = obj.MapY * 33 - this.cameraPosition.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get rendering quality for effects
   */
  getEffectQuality() {
    const level = this.getCurrentLevel();
    
    if (level.detail >= 0.75) return 'high';
    if (level.detail >= 0.5) return 'medium';
    if (level.detail >= 0.25) return 'low';
    return 'minimal';
  }

  /**
   * Get LOD statistics
   */
  getStats() {
    return {
      currentLevel: this.currentLevel,
      detail: this.getCurrentLevel().detail,
      objectThreshold: this.getCurrentLevel().objectThreshold,
      effectiveDistance: 1000 / this.zoom,
    };
  }
}
