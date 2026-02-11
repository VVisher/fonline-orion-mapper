/**
 * Custom lightweight renderer for maximum performance
 * Bypasses PixiJS overhead with direct Canvas 2D rendering
 */

export class LightweightRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true,
      willReadFrequently: false
    });
    
    this.width = canvas.width;
    this.height = canvas.height;
    this.camera = { x: 0, y: 0, zoom: 1 };
    
    // Pre-calculated hex geometry
    this.hexWidth = 44;
    this.hexHeight = 38;
    this.hexLineHeight = 33;
    
    // Rendering batches
    this.tileBatch = [];
    this.objectBatch = [];
    this.gridBatch = [];
    
    // Performance optimization
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    
    // Cached calculations
    this.visibleRange = { minHx: 0, maxHx: 0, minHy: 0, maxHy: 0 };
    this.screenBounds = { left: 0, top: 0, right: 0, bottom: 0 };
    
    this.setupCanvas();
  }

  setupCanvas() {
    // Optimize canvas for performance
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textBaseline = 'middle';
    this.ctx.textAlign = 'center';
  }

  /**
   * Set camera position and zoom
   */
  setCamera(x, y, zoom) {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.zoom = zoom;
    this.updateVisibleRange();
  }

  /**
   * Update visible hex range based on camera
   */
  updateVisibleRange() {
    const buffer = 3; // 3-tile buffer for smooth panning
    
    // Calculate screen bounds in world coordinates
    this.screenBounds.left = this.camera.x;
    this.screenBounds.top = this.camera.y;
    this.screenBounds.right = this.camera.x + this.width / this.camera.zoom;
    this.screenBounds.bottom = this.camera.y + this.height / this.camera.zoom;
    
    // Convert to hex coordinates
    this.visibleRange.minHx = Math.max(0, Math.floor(this.screenBounds.left / this.hexWidth) - buffer);
    this.visibleRange.maxHx = Math.min(1000, Math.ceil(this.screenBounds.right / this.hexWidth) + buffer);
    this.visibleRange.minHy = Math.max(0, Math.floor(this.screenBounds.top / this.hexLineHeight) - buffer);
    this.visibleRange.maxHy = Math.min(1000, Math.ceil(this.screenBounds.bottom / this.hexLineHeight) + buffer);
  }

  /**
   * Get hex vertices for drawing
   */
  getHexVertices(hexX, hexY) {
    const x = hexX * this.hexWidth;
    const y = hexY * this.hexLineHeight + (hexX % 2) * (this.hexLineHeight / 2);
    
    return [
      { x: x + this.hexWidth / 2, y: y },
      { x: x + this.hexWidth, y: y + this.hexHeight / 2 },
      { x: x + this.hexWidth, y: y + this.hexHeight },
      { x: x + this.hexWidth / 2, y: y + this.hexHeight + this.hexLineHeight / 2 },
      { x: x, y: y + this.hexHeight },
      { x: x, y: y + this.hexHeight / 2 }
    ];
  }

  /**
   * Transform world coordinates to screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.camera.x) * this.camera.zoom,
      y: (worldY - this.camera.y) * this.camera.zoom
    };
  }

  /**
   * Clear canvas with background color
   */
  clear() {
    this.ctx.fillStyle = '#0f0f23';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Render grid lines
   */
  renderGrid() {
    this.ctx.strokeStyle = '#444444';
    this.ctx.lineWidth = 0.5;
    this.ctx.globalAlpha = 0.3;
    
    // Batch render grid lines
    this.ctx.beginPath();
    
    for (let hy = this.visibleRange.minHy; hy <= this.visibleRange.maxHy; hy++) {
      for (let hx = this.visibleRange.minHx; hx <= this.visibleRange.maxHx; hx++) {
        const vertices = this.getHexVertices(hx, hy);
        const firstVertex = this.worldToScreen(vertices[0].x, vertices[0].y);
        
        this.ctx.moveTo(firstVertex.x, firstVertex.y);
        
        for (let i = 1; i < vertices.length; i++) {
          const screenVertex = this.worldToScreen(vertices[i].x, vertices[i].y);
          this.ctx.lineTo(screenVertex.x, screenVertex.y);
        }
        
        this.ctx.closePath();
      }
    }
    
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  /**
   * Render tiles with batched drawing
   */
  renderTiles(tiles) {
    if (!tiles || tiles.length === 0) return;
    
    // Filter visible tiles
    const visibleTiles = tiles.filter(tile => 
      tile.hexX >= this.visibleRange.minHx && 
      tile.hexX <= this.visibleRange.maxHx &&
      tile.hexY >= this.visibleRange.minHy && 
      tile.hexY <= this.visibleRange.maxHy
    );
    
    if (visibleTiles.length === 0) return;
    
    // Batch render tiles
    this.ctx.fillStyle = '#2a7858';
    this.ctx.globalAlpha = 0.8;
    
    this.ctx.beginPath();
    
    for (const tile of visibleTiles) {
      const vertices = this.getHexVertices(tile.hexX, tile.hexY);
      const firstVertex = this.worldToScreen(vertices[0].x, vertices[0].y);
      
      this.ctx.moveTo(firstVertex.x, firstVertex.y);
      
      for (let i = 1; i < vertices.length; i++) {
        const screenVertex = this.worldToScreen(vertices[i].x, vertices[i].y);
        this.ctx.lineTo(screenVertex.x, screenVertex.y);
      }
      
      this.ctx.closePath();
    }
    
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  /**
   * Render objects with type-based coloring
   */
  renderObjects(objects, selectedObjects = []) {
    if (!objects || objects.length === 0) return;
    
    // Filter visible objects
    const visibleObjects = objects.filter(obj => 
      obj.MapX >= this.visibleRange.minHx && 
      obj.MapX <= this.visibleRange.maxHx &&
      obj.MapY >= this.visibleRange.minHy && 
      obj.MapY <= this.visibleRange.maxHy
    );
    
    if (visibleObjects.length === 0) return;
    
    // Group objects by type for batch rendering
    const objectsByType = {};
    const selectedSet = new Set(selectedObjects);
    
    visibleObjects.forEach((obj, index) => {
      const type = obj.MapObjType || 0;
      if (!objectsByType[type]) {
        objectsByType[type] = [];
      }
      objectsByType[type].push({ obj, index, selected: selectedSet.has(index) });
    });
    
    // Render each type with appropriate color
    const typeColors = {
      0: '#ff6b6b', // Critters - red
      1: '#4ecdc4', // Items - cyan
      2: '#45b7d1', // Scenery - blue
      8: '#f9ca24', // Scenery alt - yellow
      9: '#f0932b', // Scenery alt 2 - orange
      10: '#eb4d4b', // Doors - red
      11: '#6ab04c', // Blockers - green
      12: '#c44569', // Critters alt - pink
      13: '#786fa6', // Walls - purple
    };
    
    // Render non-selected objects first
    for (const [type, typeObjects] of Object.entries(objectsByType)) {
      const color = typeColors[type] || '#00ff88';
      
      // Render non-selected objects
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 0.5;
      
      this.ctx.beginPath();
      
      for (const { obj, selected } of typeObjects) {
        if (selected) continue; // Skip selected for now
        
        const vertices = this.getHexVertices(obj.MapX, obj.MapY);
        const firstVertex = this.worldToScreen(vertices[0].x, vertices[0].y);
        
        this.ctx.moveTo(firstVertex.x, firstVertex.y);
        
        for (let i = 1; i < vertices.length; i++) {
          const screenVertex = this.worldToScreen(vertices[i].x, vertices[i].y);
          this.ctx.lineTo(screenVertex.x, screenVertex.y);
        }
        
        this.ctx.closePath();
      }
      
      this.ctx.fill();
    }
    
    // Render selected objects with highlight
    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    
    for (const [type, typeObjects] of Object.entries(objectsByType)) {
      for (const { obj, selected } of typeObjects) {
        if (!selected) continue;
        
        const vertices = this.getHexVertices(obj.MapX, obj.MapY);
        const firstVertex = this.worldToScreen(vertices[0].x, vertices[0].y);
        
        this.ctx.moveTo(firstVertex.x, firstVertex.y);
        
        for (let i = 1; i < vertices.length; i++) {
          const screenVertex = this.worldToScreen(vertices[i].x, vertices[i].y);
          this.ctx.lineTo(screenVertex.x, screenVertex.y);
        }
        
        this.ctx.closePath();
      }
    }
    
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  /**
   * Main render method
   */
  render(tiles, objects, selectedObjects = [], showGrid = true) {
    const startTime = performance.now();
    
    // Clear canvas
    this.clear();
    
    // Render layers
    if (showGrid) this.renderGrid();
    this.renderTiles(tiles);
    this.renderObjects(objects, selectedObjects);
    
    // Calculate FPS
    const endTime = performance.now();
    const frameTime = endTime - startTime;
    this.updateFPS(frameTime);
  }

  /**
   * Update FPS calculation
   */
  updateFPS(frameTime) {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }

  /**
   * Get current FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Resize canvas
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.setupCanvas();
    this.updateVisibleRange();
  }

  /**
   * Destroy renderer
   */
  destroy() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
