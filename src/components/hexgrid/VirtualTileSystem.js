import { Graphics } from 'pixi.js';
import { HEX_WIDTH, HEX_HEIGHT, HEX_LINE_HEIGHT } from '../../engine/hexMath.js';

/**
 * Virtual Tile System (VTS) - Optimized rendering for large hex grids
 * Only renders tiles/objects that are currently visible in the viewport
 */

const VTS_BUFFER = 3; // Extra tiles around viewport edges
const TILE_CACHE_SIZE = 1000; // Max cached tile graphics

// Global graphics pools for reuse across all VTS instances
const GRID_GRAPHICS_POOL = new Map();
const TILE_GRAPHICS_POOL = new Map();
const OBJECT_GRAPHICS_POOL = new Map();
const OVERLAY_GRAPHICS_POOL = new Map();

/**
 * Get or create a reusable Graphics object from pool
 */
function getGraphicsFromPool(poolKey, pool) {
  let graphics = pool.get(poolKey);
  if (!graphics) {
    graphics = new Graphics();
    pool.set(poolKey, graphics);
  }
  return graphics;
}

/**
 * Get unique graphics from pool with layer suffix
 */
function getGraphicsFromPoolUnique(poolKey, layerSuffix, pool) {
  const uniqueKey = `${poolKey}_${layerSuffix}`;
  let graphics = pool.get(uniqueKey);
  if (!graphics) {
    graphics = new Graphics();
    pool.set(uniqueKey, graphics);
  }
  return graphics;
}

/**
 * Clear and return graphics to pool
 */
function returnGraphicsToPool(graphics) {
  graphics.clear();
  // Keep in pool for reuse - don't destroy
}

/**
 * Calculate visible hex range based on camera and viewport
 */
export function getVisibleHexRange(camera, viewportWidth, viewportHeight, maxHexX, maxHexY) {
  const buffer = VTS_BUFFER;
  
  // Calculate world bounds of viewport
  const worldLeft = camera.x;
  const worldTop = camera.y;
  const worldRight = camera.x + viewportWidth / camera.zoom;
  const worldBottom = camera.y + viewportHeight / camera.zoom;
  
  // Convert to hex coordinates with buffer
  const minHx = Math.max(0, Math.floor(worldLeft / HEX_WIDTH) - buffer);
  const maxHx = Math.min(maxHexX, Math.ceil(worldRight / HEX_WIDTH) + buffer);
  const minHy = Math.max(0, Math.floor(worldTop / HEX_LINE_HEIGHT) - buffer);
  const maxHy = Math.min(maxHexY, Math.ceil(worldBottom / HEX_LINE_HEIGHT) + buffer);
  
  return { minHx, maxHx, minHy, maxHy };
}

/**
 * Filter tiles to only those in visible range
 */
export function filterVisibleTiles(tiles, visibleRange) {
  if (!tiles || tiles.length === 0) return [];
  
  return tiles.filter(tile => 
    tile.hexX >= visibleRange.minHx && 
    tile.hexX <= visibleRange.maxHx &&
    tile.hexY >= visibleRange.minHy && 
    tile.hexY <= visibleRange.maxHy
  );
}

/**
 * Filter objects to only those in visible range
 */
export function filterVisibleObjects(objects, visibleRange) {
  if (!objects || objects.length === 0) return [];
  
  return objects.filter(obj => 
    obj.MapX >= visibleRange.minHx && 
    obj.MapX <= visibleRange.maxHx &&
    obj.MapY >= visibleRange.minHy && 
    obj.MapY <= visibleRange.maxHy
  );
}

/**
 * Optimized grid layer rendering using VTS
 */
export function renderGridLayerVTS(layer, camera, width, height, maxHexX, maxHexY, getHexVertices, GRID_COLOR = 0x444444, GRID_ALPHA = 0.3) {
  if (!layer) return;
  
  layer.removeChildren();
  
  const visibleRange = getVisibleHexRange(camera, width, height, maxHexX, maxHexY);
  
  // Use object pooling with unique key for this layer instance
  const layerId = layer.uid || Math.random().toString(36).substr(2, 9);
  layer.uid = layerId; // Store uid for reuse
  const g = getGraphicsFromPoolUnique('grid', layerId, GRID_GRAPHICS_POOL);
  g.clear();
  
  // Batch render all visible hexes
  for (let hy = visibleRange.minHy; hy <= visibleRange.maxHy; hy++) {
    for (let hx = visibleRange.minHx; hx <= visibleRange.maxHx; hx++) {
      const vertices = getHexVertices(hx, hy);
      g.poly(vertices.flatMap(v => [v.x, v.y]));
      g.stroke({ width: 0.5, color: GRID_COLOR, alpha: GRID_ALPHA });
    }
  }
  
  layer.addChild(g);
}

/**
 * Optimized tile layer rendering using VTS
 */
export function renderTileLayerVTS(layer, tiles, camera, width, height, maxHexX, maxHexY, getHexVertices, TILE_COLOR = 0x2a7858, TILE_ALPHA = 0.8) {
  if (!layer) return;
  
  layer.removeChildren();
  if (!tiles || tiles.length === 0) return;
  
  const visibleRange = getVisibleHexRange(camera, width, height, maxHexX, maxHexY);
  const visibleTiles = filterVisibleTiles(tiles, visibleRange);
  
  if (visibleTiles.length === 0) return;
  
  // Use object pooling with unique key for this layer instance
  const layerId = layer.uid || Math.random().toString(36).substr(2, 9);
  layer.uid = layerId; // Store uid for reuse
  const g = getGraphicsFromPoolUnique('tiles', layerId, TILE_GRAPHICS_POOL);
  g.clear();
  
  // Batch render visible tiles
  for (const tile of visibleTiles) {
    const vertices = getHexVertices(tile.hexX, tile.hexY);
    g.poly(vertices.flatMap(v => [v.x, v.y]));
    g.fill({ color: TILE_COLOR, alpha: TILE_ALPHA });
  }
  
  layer.addChild(g);
}

/**
 * Optimized object layer rendering using VTS
 */
export function renderObjectLayerVTS(layer, objects, selectedObjects, camera, width, height, maxHexX, maxHexY, getHexVertices, OBJ_COLORS = {}, SELECT_COLOR = 0xffaa00, activeLayer = null) {
  if (!layer) return;
  
  layer.removeChildren();
  if (!objects || objects.length === 0) {
    console.log('🔍 renderObjectLayerVTS: No objects to render');
    return;
  }
  
  const visibleRange = getVisibleHexRange(camera, width, height, maxHexX, maxHexY);
  let visibleObjects = filterVisibleObjects(objects, visibleRange);
  
  console.log('🔍 renderObjectLayerVTS:', {
    totalObjects: objects.length,
    visibleObjects: visibleObjects.length,
    activeLayer,
    camera: { x: camera.x, y: camera.y, zoom: camera.zoom }
  });
  
  // Filter by active layer if specified
  if (activeLayer && activeLayer !== 'all') {
    const beforeFilter = visibleObjects.length;
    visibleObjects = visibleObjects.filter(obj => {
      // Map object types to layers based on FOnline standards
      if (activeLayer === 'items') return obj.MapObjType === 1;
      if (activeLayer === 'critters') return obj.MapObjType === 0;
      if (activeLayer === 'scenery') return obj.MapObjType === 2;
      if (activeLayer === 'doors') return obj.MapObjType === 10;
      if (activeLayer === 'blockers') return obj.MapObjType === 11;
      if (activeLayer === 'walls') return obj.MapObjType === 13;
      if (activeLayer === 'roofs') return obj.MapObjType === 5;
      if (activeLayer === 'tiles') return false; // tiles are separate
      return false; // hide if layer not recognized
    });
    console.log('🔍 Layer filter:', `${activeLayer} - ${beforeFilter} -> ${visibleObjects.length} objects`);
  }
  
  if (visibleObjects.length === 0) return;
  
  // Use object pooling with unique keys for this layer instance
  const layerId = layer.uid || Math.random().toString(36).substr(2, 9);
  layer.uid = layerId; // Store uid for reuse
  const gObj = getGraphicsFromPoolUnique('objects', layerId, OBJECT_GRAPHICS_POOL);
  const gSel = getGraphicsFromPoolUnique('selected', layerId, OBJECT_GRAPHICS_POOL);
  gObj.clear();
  gSel.clear();
  
  // Batch render visible objects
  for (let i = 0; i < visibleObjects.length; i++) {
    const obj = visibleObjects[i];
    const originalIndex = objects.indexOf(obj); // Get original index for selection
    const color = OBJ_COLORS[obj.MapObjType] || OBJ_COLORS.default || 0x00ff88;
    
    const vertices = getHexVertices(obj.MapX, obj.MapY);
    gObj.poly(vertices.flatMap(v => [v.x, v.y]));
    gObj.fill({ color, alpha: 0.5 });
    
    if (selectedObjects.includes(originalIndex)) {
      gSel.poly(vertices.flatMap(v => [v.x, v.y]));
      gSel.stroke({ width: 2, color: SELECT_COLOR, alpha: 1 });
    }
  }
  
  layer.addChild(gObj);
  layer.addChild(gSel);
}

/**
 * Optimized overlay layer rendering (hover/selection)
 */
export function renderOverlayLayerVTS(layer, hoveredHex, selectedHex, getHexVertices, HOVER_COLOR = 0x00ff88, HOVER_ALPHA = 0.3, SELECT_COLOR = 0xffaa00, SELECT_ALPHA = 0.8) {
  if (!layer) return;
  
  layer.removeChildren();
  
  if (hoveredHex) {
    const g = new Graphics();
    const vertices = getHexVertices(hoveredHex.hx, hoveredHex.hy);
    g.poly(vertices.flatMap(v => [v.x, v.y]));
    g.fill({ color: HOVER_COLOR, alpha: HOVER_ALPHA });
    layer.addChild(g);
  }
  
  if (selectedHex) {
    const g = new Graphics();
    const vertices = getHexVertices(selectedHex.hx, selectedHex.hy);
    g.stroke({ width: 2, color: SELECT_COLOR, alpha: SELECT_ALPHA });
    layer.addChild(g);
  }
}

/**
 * Performance monitoring for VTS
 */
export class VTSPerformanceMonitor {
  constructor() {
    this.renderTimes = [];
    this.maxSamples = 60;
    this.memorySnapshots = [];
    this.objectPoolStats = {
      gridPoolSize: 0,
      tilePoolSize: 0,
      objectPoolSize: 0,
      overlayPoolSize: 0
    };
  }
  
  startRender() {
    this.startTime = performance.now();
  }
  
  endRender() {
    if (this.startTime) {
      const duration = performance.now() - this.startTime;
      this.renderTimes.push(duration);
      if (this.renderTimes.length > this.maxSamples) {
        this.renderTimes.shift();
      }
      this.startTime = null;
    }
  }
  
  getAverageRenderTime() {
    if (this.renderTimes.length === 0) return 0;
    return this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
  }
  
  getVisibleTileCount(visibleRange) {
    return (visibleRange.maxHx - visibleRange.minHx + 1) * 
           (visibleRange.maxHy - visibleRange.minHy + 1);
  }
  
  captureMemorySnapshot() {
    if (performance.memory) {
      const snapshot = {
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        objectPoolStats: { ...this.objectPoolStats }
      };
      this.memorySnapshots.push(snapshot);
      if (this.memorySnapshots.length > 10) {
        this.memorySnapshots.shift();
      }
      return snapshot;
    }
    return null;
  }
  
  updatePoolStats(poolType, size) {
    this.objectPoolStats[`${poolType}PoolSize`] = size;
  }
  
  getMemoryTrend() {
    if (this.memorySnapshots.length < 2) return null;
    const latest = this.memorySnapshots[this.memorySnapshots.length - 1];
    const previous = this.memorySnapshots[this.memorySnapshots.length - 2];
    const trend = latest.usedJSHeapSize - previous.usedJSHeapSize;
    return {
      trend, // positive = increasing memory
      current: latest.usedJSHeapSize,
      percentage: (trend / previous.usedJSHeapSize) * 100
    };
  }
}
