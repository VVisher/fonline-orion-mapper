import React, { useRef, useEffect, useCallback } from 'react';
import { Application, Graphics, Container } from 'pixi.js';
import {
  HEX_WIDTH, HEX_HEIGHT, HEX_LINE_HEIGHT,
  hexToPixel, pixelToHex, getHexVertices,
} from '../engine/hexMath.js';

const GRID_COLOR = 0x445566;
const GRID_ALPHA = 0.35;
const HOVER_COLOR = 0x00ff88;
const HOVER_ALPHA = 0.35;
const SELECT_COLOR = 0xffcc00;
const SELECT_ALPHA = 0.45;
const OBJ_SCENERY_COLOR = 0x4488ff;
const OBJ_ITEM_COLOR = 0xff8844;
const OBJ_CRITTER_COLOR = 0xff4444;
const TILE_COLOR = 0x335533;
const TILE_ALPHA = 0.25;

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
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const worldRef = useRef(null);
  const gridLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const objectLayerRef = useRef(null);
  const overlayLayerRef = useRef(null);
  const showGridRef = useRef(true);
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1.0 });
  const keysRef = useRef(new Set());
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, camX: 0, camY: 0 });
  const needsGridRedrawRef = useRef(true);
  const mapStateRef = useRef(mapState);
  mapStateRef.current = mapState;
  const historyRef = useRef(history);
  historyRef.current = history;

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
        cameraRef.current.x = workPx.x - width / 2;
        cameraRef.current.y = workPx.y - height / 2;
      }

      redrawTiles();
      redrawObjects();
      redrawGrid();
      redrawOverlay();
      applyCamera();
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

  // Subscribe to mapState changes
  useEffect(() => {
    if (!mapState) return;
    const unsub = mapState.subscribe(() => {
      redrawTiles();
      redrawObjects();
      redrawOverlay();
    });
    return unsub;
  }, [mapState]);

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

  // Animation loop for keyboard panning + grid redraw
  useEffect(() => {
    let rafId;
    const tick = () => {
      const keys = keysRef.current;
      let moved = false;
      const speed = PAN_SPEED / cameraRef.current.zoom;
      if (keys.has('ArrowLeft') || keys.has('a')) { cameraRef.current.x -= speed; moved = true; }
      if (keys.has('ArrowRight') || keys.has('d')) { cameraRef.current.x += speed; moved = true; }
      if (keys.has('ArrowUp') || keys.has('w')) { cameraRef.current.y -= speed; moved = true; }
      if (keys.has('ArrowDown') || keys.has('s')) { cameraRef.current.y += speed; moved = true; }
      if (moved) {
        needsGridRedrawRef.current = true;
        applyCamera();
      }
      if (needsGridRedrawRef.current) {
        needsGridRedrawRef.current = false;
        redrawGrid();
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

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

  function hexFlatCoords(hx, hy) {
    const verts = getHexVertices(hx, hy);
    const flat = [];
    for (const v of verts) { flat.push(v.x, v.y); }
    return flat;
  }

  function redrawGrid() {
    const layer = gridLayerRef.current;
    if (!layer) return;
    layer.removeChildren();

    const ms = mapStateRef.current;
    if (!ms) return;
    const maxX = ms.header.MaxHexX || 200;
    const maxY = ms.header.MaxHexY || 200;

    const range = getVisibleHexRange(cameraRef.current, width, height, maxX, maxY);
    const g = new Graphics();

    for (let hy = range.minHy; hy < range.maxHy; hy++) {
      for (let hx = range.minHx; hx < range.maxHx; hx++) {
        g.poly(hexFlatCoords(hx, hy));
        g.stroke({ width: 0.5, color: GRID_COLOR, alpha: GRID_ALPHA });
      }
    }

    layer.addChild(g);
  }

  function redrawTiles() {
    const layer = tileLayerRef.current;
    const ms = mapStateRef.current;
    if (!layer || !ms) return;
    layer.removeChildren();

    if (ms.tiles.length === 0) return;

    const g = new Graphics();
    for (const tile of ms.tiles) {
      g.poly(hexFlatCoords(tile.hexX, tile.hexY));
      g.fill({ color: TILE_COLOR, alpha: TILE_ALPHA });
    }
    layer.addChild(g);
  }

  function redrawObjects() {
    const layer = objectLayerRef.current;
    const ms = mapStateRef.current;
    if (!layer || !ms) return;
    layer.removeChildren();

    // Sort by Y then X for z-ordering
    const sorted = ms.objects
      .map((obj, idx) => ({ obj, idx }))
      .sort((a, b) => (a.obj.MapY - b.obj.MapY) || (a.obj.MapX - b.obj.MapX));

    const gObj = new Graphics();
    const gSel = new Graphics();

    for (const { obj, idx } of sorted) {
      let color;
      switch (obj.MapObjType) {
        case 0: color = OBJ_CRITTER_COLOR; break;
        case 1: color = OBJ_ITEM_COLOR; break;
        case 2: default: color = OBJ_SCENERY_COLOR; break;
      }

      gObj.poly(hexFlatCoords(obj.MapX, obj.MapY));
      gObj.fill({ color, alpha: 0.5 });

      if (ms.selectedObjects.includes(idx)) {
        gSel.poly(hexFlatCoords(obj.MapX, obj.MapY));
        gSel.stroke({ width: 2, color: SELECT_COLOR, alpha: 1 });
      }
    }

    layer.addChild(gObj);
    layer.addChild(gSel);
  }

  function redrawOverlay() {
    const layer = overlayLayerRef.current;
    const ms = mapStateRef.current;
    if (!layer || !ms) return;
    layer.removeChildren();

    if (ms.hoveredHex) {
      const g = new Graphics();
      g.poly(hexFlatCoords(ms.hoveredHex.hx, ms.hoveredHex.hy));
      g.fill({ color: HOVER_COLOR, alpha: HOVER_ALPHA });
      layer.addChild(g);
    }

    if (ms.selectedHex) {
      const g = new Graphics();
      g.poly(hexFlatCoords(ms.selectedHex.hx, ms.selectedHex.hy));
      g.stroke({ width: 2, color: SELECT_COLOR, alpha: SELECT_ALPHA });
      layer.addChild(g);
    }
  }

  // ---- Event handlers ----

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const cam = cameraRef.current;
    const oldZoom = cam.zoom;
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    cam.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cam.zoom + delta));

    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const worldBefore = { x: mx / oldZoom + cam.x, y: my / oldZoom + cam.y };
    const worldAfter = { x: mx / cam.zoom + cam.x, y: my / cam.zoom + cam.y };
    cam.x -= (worldAfter.x - worldBefore.x);
    cam.y -= (worldAfter.y - worldBefore.y);

    needsGridRedrawRef.current = true;
    applyCamera();
  }, []);

  const onMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX, y: e.clientY,
        camX: cameraRef.current.x, camY: cameraRef.current.y,
      };
      e.preventDefault();
    } else if (e.button === 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wp = screenToWorld(sx, sy);
      const hex = pixelToHex(wp.x, wp.y);

      const ms = mapStateRef.current;
      if (!ms) return;

      if (ms.activeTool === 'tile' && ms.tileBrush) {
        const shortName = ms.tileBrush.split('\\').pop().replace('.frm', '');
        if (historyRef.current) historyRef.current.push(`Tile ${shortName} @(${hex.hx},${hex.hy})`);
        ms.removeTileAt(hex.hx, hex.hy);
        ms.addTile(hex.hx, hex.hy, ms.tileBrush);
        redrawTiles();
      } else if (ms.activeTool === 'erase') {
        if (historyRef.current) historyRef.current.push(`Erase @(${hex.hx},${hex.hy})`);
        ms.removeTileAt(hex.hx, hex.hy);
        redrawTiles();
      } else {
        const clickedIdx = findObjectAtHex(hex.hx, hex.hy);
        if (clickedIdx >= 0) {
          ms.selectObject(clickedIdx, e.ctrlKey);
          ms.setSelectedHex(hex);
        } else {
          ms.clearSelection();
          ms.setSelectedHex(hex);
        }
      }
    } else if (e.button === 2) {
      // Right-click: erase tile at hex
      const rect = containerRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wp = screenToWorld(sx, sy);
      const hex = pixelToHex(wp.x, wp.y);
      const ms = mapStateRef.current;
      if (ms) {
        if (historyRef.current) historyRef.current.push(`Erase @(${hex.hx},${hex.hy})`);
        ms.removeTileAt(hex.hx, hex.hy);
        redrawTiles();
      }
    }
  }, []);

  const onMouseMove = useCallback((e) => {
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      cameraRef.current.x = panStartRef.current.camX - dx / cameraRef.current.zoom;
      cameraRef.current.y = panStartRef.current.camY - dy / cameraRef.current.zoom;
      needsGridRedrawRef.current = true;
      applyCamera();
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wp = screenToWorld(sx, sy);
    const hex = pixelToHex(wp.x, wp.y);

    const ms = mapStateRef.current;
    if (ms) {
      ms.setHoveredHex(hex);
    }
  }, []);

  const onMouseUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  function findObjectAtHex(hx, hy) {
    const ms = mapStateRef.current;
    if (!ms) return -1;
    for (let i = ms.objects.length - 1; i >= 0; i--) {
      const obj = ms.objects[i];
      if (obj.MapX === hx && obj.MapY === hy) return i;
    }
    return -1;
  }

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{ width, height, overflow: 'hidden' }}
    />
  );
}
