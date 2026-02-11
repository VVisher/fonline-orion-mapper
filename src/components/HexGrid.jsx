
import React, { useRef, useEffect, useCallback, memo } from 'react';
import { Application, Container } from 'pixi.js';
import {
  HEX_WIDTH, HEX_HEIGHT, HEX_LINE_HEIGHT,
  hexToPixel, pixelToHex, getHexVertices
} from '../engine/hexMath.js';

import {
  renderGridLayer,
  renderTileLayer,
  renderObjectLayer,
  renderOverlayLayer
} from './hexgrid/HexGridLayers.js';
import {
  renderGridLayerVTS,
  renderTileLayerVTS,
  renderObjectLayerVTS
} from './hexgrid/VirtualTileSystem.js';
import { useHexGridEvents } from './hexgrid/useHexGridEvents.js';

// Nuclear optimizations
import { LightweightRenderer } from '../renderer/LightweightRenderer.js';
import { LODSystem } from '../renderer/LODSystem.js';
import { BinaryMapFormat } from '../serialization/BinaryMapFormat.js';

// Object color constants
const OBJ_COLORS = {
  0: 0xff6b6b, // Critters - red
  1: 0x4ecdc4, // Items - cyan
  2: 0x45b7d1, // Scenery - blue
  8: 0xf9ca24, // Scenery alt - yellow
  9: 0xf0932b, // Scenery alt 2 - orange
  10: 0xeb4d4b, // Doors - red
  11: 0x6ab04c, // Blockers - green
  12: 0xc44569, // Critters alt - pink
  13: 0x786fa6, // Walls - purple
  default: 0x00ff88, // Default green
};
import { useHexCamera } from './hexgrid/useHexCamera.js';
import { useHexCursor } from './hexgrid/useHexCursor.js';
import { useThrottle, usePerformanceMonitor, useRAFScheduler, useDebounce } from './hexgrid/usePerformance.js';



const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.1;
const PAN_SPEED = 20;

/**
 * Get the visible hex range for the current viewport.
 * Returns { minHx, maxHx, minHy, maxHy } clamped to map bounds.
 */
function getVisibleHexRange(cam, canvasW, canvasH, maxHexX, maxHexY) {
  const pad = 2; // extra hexes around edges
  const worldLeft = cam.x;
  const worldTop = cam.y;
  const worldRight = cam.x + canvasW / cam.zoom;
  const worldBottom = cam.y + canvasH / cam.zoom;

  const minHx = Math.max(0, Math.floor(worldLeft / HEX_WIDTH) - pad);
  const maxHx = Math.min(maxHexX, Math.ceil(worldRight / HEX_WIDTH) + pad);
  const minHy = Math.max(0, Math.floor(worldTop / HEX_LINE_HEIGHT) - pad);
  const maxHy = Math.min(maxHexY, Math.ceil(worldBottom / HEX_LINE_HEIGHT) + pad);

  return { minHx, maxHx, minHy, maxHy };
}

/**
 * HexGrid - PixiJS-based hex grid renderer with camera controls.
 */
export default function HexGrid({ mapState, history, width = 800, height = 600 }) {
  // Don't render if mapState is not ready
  if (!mapState || !mapState.header) {
    return (
      <div style={{ width, height, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
        Initializing map...
      </div>
    );
  }
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const worldRef = useRef(null);
  const gridLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const objectLayerRef = useRef(null);
  const overlayLayerRef = useRef(null);
  const showGridRef = useRef(true);
  const keysRef = useRef(new Set());
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, camX: 0, camY: 0 });
  const needsGridRedrawRef = useRef(true);
  const mapStateRef = useRef(mapState);
  mapStateRef.current = mapState;
  const historyRef = useRef(history);
  historyRef.current = history;

  // Use modular hooks for camera and cursor management
  const { cameraRef, setCamera, moveCamera, setZoom } = useHexCamera({ x: 0, y: 0, zoom: 1.0 });
  const { setCursorByTool } = useHexCursor(appRef);
  
  // Nuclear optimization refs
  const lightweightRendererRef = useRef(null);
  const lodSystemRef = useRef(null);
  const binaryFormatRef = useRef(new BinaryMapFormat());
  const useLightweightRendererRef = useRef(false);
  
  // Performance optimizations
  const { startRender, endRender, getMetrics } = usePerformanceMonitor();
  const { schedule: scheduleRAF } = useRAFScheduler();
  const throttledRedraw = useThrottle(() => {
    const startTime = startRender();
    redrawGrid();
    endRender(startTime);
  }, 16); // 60 FPS throttling
  
  // Debounced tile/object redraws for performance
  const debouncedRedrawTiles = useDebounce(() => {
    const startTime = startRender();
    redrawTiles();
    endRender(startTime);
  }, 8); // 120 FPS for tiles
  
  const debouncedRedrawObjects = useDebounce(() => {
    const startTime = startRender();
    redrawObjects();
    endRender(startTime);
  }, 8);

  // Initialize PixiJS
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let app = new Application();
    let cancelled = false;

    app.init({
      width,
      height,
      background: '#1a1a2e',
      antialias: true,
      preference: 'webgl',
    }).then(() => {
      if (cancelled) return;

      container.innerHTML = '';
      container.appendChild(app.canvas);
      app.canvas.style.display = 'block';
      app.canvas.style.cursor = 'crosshair';

      appRef.current = app;

      // Initialize nuclear optimizations
      lodSystemRef.current = new LODSystem();
      
      // Create lightweight renderer canvas
      const lightweightCanvas = document.createElement('canvas');
      lightweightCanvas.width = width;
      lightweightCanvas.height = height;
      lightweightCanvas.style.position = 'absolute';
      lightweightCanvas.style.top = '0';
      lightweightCanvas.style.left = '0';
      lightweightCanvas.style.display = 'none'; // Hidden by default
      lightweightCanvas.style.pointerEvents = 'none';
      container.appendChild(lightweightCanvas);
      
      lightweightRendererRef.current = new LightweightRenderer(lightweightCanvas);
      
      // Auto-switch to lightweight renderer for performance
      const checkPerformance = () => {
        const fps = lightweightRendererRef.current?.getFPS() || 60;
        if (fps < 30 && !useLightweightRendererRef.current) {
          console.log('🚀 Switching to lightweight renderer for better performance');
          useLightweightRendererRef.current = true;
          app.canvas.style.display = 'none';
          lightweightCanvas.style.display = 'block';
        } else if (fps >= 50 && useLightweightRendererRef.current) {
          console.log('🎨 Switching back to PixiJS renderer');
          useLightweightRendererRef.current = false;
          app.canvas.style.display = 'block';
          lightweightCanvas.style.display = 'none';
        }
      };
      
      // Check performance every 2 seconds
      setInterval(checkPerformance, 2000);

      const world = new Container();
      worldRef.current = world;
      app.stage.addChild(world);

      const tileLayer = new Container();
      tileLayerRef.current = tileLayer;
      world.addChild(tileLayer);

      const gridLayer = new Container();
      gridLayerRef.current = gridLayer;
      world.addChild(gridLayer);

      const objectLayer = new Container();
      objectLayerRef.current = objectLayer;
      world.addChild(objectLayer);

      const overlay = new Container();
      overlayLayerRef.current = overlay;
      world.addChild(overlay);

      // Center camera on WorkHex
      const ms = mapStateRef.current;
      if (ms) {
        const workPx = hexToPixel(
          ms.header.WorkHexX || 100,
          ms.header.WorkHexY || 100,
        );
        setCamera(workPx.x - width / 2, workPx.y - height / 2);
      }

      // Delay initial redraw to ensure all refs are set
      setTimeout(() => {
        if (cancelled) return; // Don't redraw if component unmounted
        if (tileLayerRef.current && ms) redrawTiles();
        if (objectLayerRef.current && ms) redrawObjects();
        if (gridLayerRef.current && ms) redrawGrid();
        if (overlayLayerRef.current && ms) redrawOverlay();
        applyCamera();
      }, 0);
    }).catch((err) => {
      console.error('[ORION] PixiJS init failed:', err);
    });

    return () => {
      cancelled = true;
      try { app.destroy(true, { children: true }); } catch (_) {}
      appRef.current = null;
      worldRef.current = null;
      gridLayerRef.current = null;
      tileLayerRef.current = null;
      objectLayerRef.current = null;
      overlayLayerRef.current = null;
    };
  }, []);

  // Subscribe to mapState changes (optimized)
  useEffect(() => {
    if (!mapState) return;
    const unsub = mapState.subscribe(() => {
      debouncedRedrawTiles();
      debouncedRedrawObjects();
      redrawOverlay();
    });
    return unsub;
  }, [mapState, debouncedRedrawTiles, debouncedRedrawObjects]);

  // Update cursor when tool changes
  useEffect(() => {
    const ms = mapStateRef.current;
    if (ms) {
      setCursorByTool(ms.activeTool);
    }
  }, [mapState?.activeTool, setCursorByTool]);

  // Keyboard handling
  useEffect(() => {
    const onKeyDown = (e) => {
      keysRef.current.add(e.key);
      if (e.key === 'F10') {
        e.preventDefault();
        showGridRef.current = !showGridRef.current;
        if (gridLayerRef.current) {
          gridLayerRef.current.visible = showGridRef.current;
        }
      }
      // Tool shortcuts (only when not typing in an input)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const ms = mapStateRef.current;
      if (!ms) return;
      if (e.key === '1') { ms.setActiveTool('select'); }
      if (e.key === '2') { ms.setActiveTool('tile'); }
      if (e.key === '3') { ms.setActiveTool('erase'); }
    };
    const onKeyUp = (e) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Animation loop for keyboard panning + grid redraw (optimized)
  useEffect(() => {
    let rafId;
    const tick = () => {
      const keys = keysRef.current;
      let moved = false;
      const speed = PAN_SPEED / cameraRef.current.zoom;
      if (keys.has('ArrowLeft') || keys.has('a')) { moveCamera(-speed, 0); moved = true; }
      if (keys.has('ArrowRight') || keys.has('d')) { moveCamera(speed, 0); moved = true; }
      if (keys.has('ArrowUp') || keys.has('w')) { moveCamera(0, -speed); moved = true; }
      if (keys.has('ArrowDown') || keys.has('s')) { moveCamera(0, speed); moved = true; }
      if (moved) {
        needsGridRedrawRef.current = true;
        applyCamera();
      }
      if (needsGridRedrawRef.current) {
        needsGridRedrawRef.current = false;
        throttledRedraw();
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [moveCamera, throttledRedraw]);

  function applyCamera() {
    const world = worldRef.current;
    if (!world) return;
    const cam = cameraRef.current;
    world.scale.set(cam.zoom);
    world.position.set(-cam.x * cam.zoom, -cam.y * cam.zoom);
  }

  function screenToWorld(sx, sy) {
    const cam = cameraRef.current;
    return {
      x: sx / cam.zoom + cam.x,
      y: sy / cam.zoom + cam.y,
    };
  }

  // ---- Drawing functions ----


  // --- Modular rendering layer calls ---
  function redrawGrid() {
    try {
      const ms = mapStateRef.current;
      if (!ms) return;
      
      // Use lightweight renderer if enabled
      if (useLightweightRendererRef.current && lightweightRendererRef.current) {
        lightweightRendererRef.current.render(
          ms.tiles,
          ms.objects,
          ms.selectedObjects || [],
          showGridRef.current
        );
        return;
      }
      
      // Fall back to PixiJS renderer
      const layer = gridLayerRef.current;
      if (!layer) return;
      
      renderGridLayerVTS(
        layer,
        cameraRef.current,
        width,
        height,
        ms.header.MaxHexX || 200,
        ms.header.MaxHexY || 200,
        getHexVertices
      );
    } catch (error) {
      console.error('[ORION] Error in redrawGrid:', error);
    }
  }

  function redrawTiles() {
    try {
      const layer = tileLayerRef.current;
      const ms = mapStateRef.current;
      if (!layer || !ms) return;
      
      // Don't render tiles if tiles layer is hidden
      if (ms.layerVisibility?.tiles === false) {
        layer.removeChildren();
        return;
      }
      
      renderTileLayerVTS(
        layer,
        ms.tiles,
        cameraRef.current,
        width,
        height,
        ms.header.MaxHexX || 200,
        ms.header.MaxHexY || 200,
        getHexVertices,
        0x2a7858, // Teal color
        0.8
      );
    } catch (error) {
      console.error('[ORION] Error in redrawTiles:', error);
    }
  }

  function redrawObjects() {
    try {
      const layer = objectLayerRef.current;
      const ms = mapStateRef.current;
      if (!layer || !ms) {
        console.log('🔍 redrawObjects: No layer or mapState');
        return;
      }
      
      console.log('🔍 redrawObjects called:', {
        hasLayer: !!layer,
        hasMapState: !!ms,
        objectCount: ms.objects?.length || 0,
        selectedCount: ms.selectedObjects?.length || 0,
        activeLayer: ms.activeLayer,
        camera: cameraRef.current
      });
      
      renderObjectLayerVTS(
        layer,
        ms.objects,
        ms.selectedObjects || [],
        cameraRef.current,
        width,
        height,
        ms.header.MaxHexX || 200,
        ms.header.MaxHexY || 200,
        getHexVertices,
        OBJ_COLORS,
        0xffaa00,
        ms.activeLayer
      );
    } catch (error) {
      console.error('[ORION] Error in redrawObjects:', error);
    }
  }

  function redrawOverlay() {
    try {
      const layer = overlayLayerRef.current;
      const ms = mapStateRef.current;
      if (!layer || !ms) return;
      layer.removeChildren();
      renderOverlayLayer({
        layer,
        hoveredHex: ms.hoveredHex,
        selectedHex: ms.selectedHex,
        getHexVertices
      });
    } catch (error) {
      console.error('[ORION] Error in redrawOverlay:', error);
    }
  }


  // --- Use modular event/tool logic hook ---
  const {
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onKeyDown
  } = useHexGridEvents({
    containerRef,
    cameraRef,
    mapStateRef,
    historyRef,
    redrawTiles,
    redrawObjects,
    redrawOverlay,
    needsGridRedrawRef,
    applyCamera,
    screenToWorld,
    findObjectAtHex,
    panStartRef,
    isPanningRef
  });

  function findObjectAtHex(hx, hy) {
    const ms = mapStateRef.current;
    if (!ms) return -1;
    for (let i = ms.objects.length - 1; i >= 0; i--) {
      const obj = ms.objects[i];
      if (obj.MapX === hx && obj.MapY === hy) return i;
    }
    return -1;
  }

  // Add wheel event listener manually to fix passive issue
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e) => {
      e.preventDefault(); // Call preventDefault here instead
      onWheel(e);
    };
    
    // Add non-passive wheel event listener
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [onWheel]);

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      style={{ width, height, overflow: 'hidden' }}
      tabIndex={0} // Make div focusable for keyboard events
    />
  );
}
