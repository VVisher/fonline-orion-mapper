// useHexGridEvents.js
// Modular hook for HexGrid event and tool logic
import { useCallback, useRef } from 'react';
import { pixelToHex } from '../../engine/hexMath.js';

export function useHexGridEvents({
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
}) {
  // Mouse wheel zoom - fix passive listener issue
  const onWheel = useCallback((e) => {
    // Don't call preventDefault here since we're using manual event listener
    const cam = cameraRef.current;
    const oldZoom = cam.zoom;
    const ZOOM_STEP = 0.1, MIN_ZOOM = 0.25, MAX_ZOOM = 4.0;
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
  }, [cameraRef, containerRef, needsGridRedrawRef, applyCamera]);

  // Add keyboard zoom controls to avoid browser zoom conflicts
  const onKeyDown = useCallback((e) => {
    const cam = cameraRef.current;
    const ZOOM_STEP = 0.1, MIN_ZOOM = 0.25, MAX_ZOOM = 4.0;
    const PAN_SPEED = 20;
    let needsRedraw = false;
    
    // Mass selection (Starcraft-style)
    if (e.key === 'a' && !e.ctrlKey && !e.shiftKey) {
      const ms = mapStateRef.current;
      if (ms && ms.activeTool === 'select') {
        // Select all objects of current layer
        const layerObjects = ms.objects.filter(obj => {
          if (ms.activeLayer === 'items') return [1, 2, 3, 4, 5, 6, 7].includes(obj.MapObjType);
          if (ms.activeLayer === 'scenery') return [8, 9].includes(obj.MapObjType);
          if (ms.activeLayer === 'doors') return [10].includes(obj.MapObjType);
          if (ms.activeLayer === 'blockers') return [11].includes(obj.MapObjType);
          if (ms.activeLayer === 'critters') return [12].includes(obj.MapObjType);
          if (ms.activeLayer === 'walls') return [13].includes(obj.MapObjType);
          return false;
        });
        
        // Select all matching objects
        ms.clearSelection();
        layerObjects.forEach(obj => {
          const objIdx = ms.objects.indexOf(obj);
          ms.selectObject(objIdx, true); // Add to selection
        });
        needsRedraw = true;
      }
      e.preventDefault();
    }
    // Selection expansion shortcuts
    else if (e.key === '+' || e.key === '=') {
      const ms = mapStateRef.current;
      if (ms && ms.selectedHex && ms.activeTool === 'select') {
        // Expand selection to adjacent hexes
        const { hx, hy } = ms.selectedHex;
        const adjacentHexes = [
          { hx: hx - 1, hy: hy },
          { hx: hx + 1, hy: hy },
          { hx: hx, hy: hy - 1 },
          { hx: hx, hy: hy + 1 }
        ];
        
        adjacentHexes.forEach(hex => {
          const objectsInHex = ms.objects.filter(obj => obj.MapX === hex.hx && obj.MapY === hex.hy);
          if (objectsInHex.length > 0) {
            // Find first object matching active layer
            for (let i = objectsInHex.length - 1; i >= 0; i--) {
              const obj = objectsInHex[i];
              const objIdx = ms.objects.indexOf(obj);
              
              if (ms.activeLayer === 'items' && [1, 2, 3, 4, 5, 6, 7].includes(obj.MapObjType)) {
                ms.selectObject(objIdx, true); // Add to selection
                break;
              } else if (ms.activeLayer === 'scenery' && [8, 9].includes(obj.MapObjType)) {
                ms.selectObject(objIdx, true);
                break;
              } else if (ms.activeLayer === 'doors' && [10].includes(obj.MapObjType)) {
                ms.selectObject(objIdx, true);
                break;
              } else if (ms.activeLayer === 'blockers' && [11].includes(obj.MapObjType)) {
                ms.selectObject(objIdx, true);
                break;
              } else if (ms.activeLayer === 'critters' && [12].includes(obj.MapObjType)) {
                ms.selectObject(objIdx, true);
                break;
              } else if (ms.activeLayer === 'walls' && [13].includes(obj.MapObjType)) {
                ms.selectObject(objIdx, true);
                break;
              }
            }
          }
        });
        needsRedraw = true;
      }
      e.preventDefault();
    } else if (e.key === '-' || e.key === '_') {
      const ms = mapStateRef.current;
      if (ms && ms.activeTool === 'select') {
        // Clear selection
        ms.clearSelection();
        needsRedraw = true;
      }
      e.preventDefault();
    }
    // Zoom controls (Ctrl + +/- for zoom)
    else if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
      cam.zoom = Math.min(MAX_ZOOM, cam.zoom + ZOOM_STEP);
      needsGridRedrawRef.current = true;
      applyCamera();
      e.preventDefault();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
      cam.zoom = Math.max(MIN_ZOOM, cam.zoom - ZOOM_STEP);
      needsGridRedrawRef.current = true;
      applyCamera();
      e.preventDefault();
    }
    // Pan controls
    else if (e.key === 'ArrowUp') {
      cam.y -= PAN_SPEED;
      needsGridRedrawRef.current = true;
      applyCamera();
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      cam.y += PAN_SPEED;
      needsGridRedrawRef.current = true;
      applyCamera();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      cam.x -= PAN_SPEED;
      needsGridRedrawRef.current = true;
      applyCamera();
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      cam.x += PAN_SPEED;
      needsGridRedrawRef.current = true;
      applyCamera();
      e.preventDefault();
    }
    
    // Call redrawObjects outside of conditionals to maintain hook order
    if (needsRedraw) {
      redrawObjects();
    }
  }, [cameraRef, needsGridRedrawRef, applyCamera, redrawObjects]);

  // Mouse down (panning, tile/object/tool logic)
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
        
        // Also erase objects in this hex based on active layer priority
        const objectsInHex = ms.objects.filter(obj => obj.MapX === hex.hx && obj.MapY === hex.hy);
        if (objectsInHex.length > 0) {
          // Find object with highest priority based on active layer
          let targetObj = null;
          let targetIdx = -1;
          
          if (ms.activeLayer === 'tiles') {
            // Don't erase objects when in tile mode
          } else {
            // Find first object that matches active layer
            for (let i = objectsInHex.length - 1; i >= 0; i--) {
              const obj = objectsInHex[i];
              const objIdx = ms.objects.indexOf(obj);
              
              if (ms.activeLayer === 'items' && [1, 2, 3, 4, 5, 6, 7].includes(obj.MapObjType)) {
                targetObj = obj;
                targetIdx = objIdx;
                break;
              } else if (ms.activeLayer === 'scenery' && [8, 9].includes(obj.MapObjType)) {
                targetObj = obj;
                targetIdx = objIdx;
                break;
              } else if (ms.activeLayer === 'doors' && [10].includes(obj.MapObjType)) {
                targetObj = obj;
                targetIdx = objIdx;
                break;
              } else if (ms.activeLayer === 'blockers' && [11].includes(obj.MapObjType)) {
                targetObj = obj;
                targetIdx = objIdx;
                break;
              } else if (ms.activeLayer === 'critters' && [12].includes(obj.MapObjType)) {
                targetObj = obj;
                targetIdx = objIdx;
                break;
              } else if (ms.activeLayer === 'walls' && [13].includes(obj.MapObjType)) {
                targetObj = obj;
                targetIdx = objIdx;
                break;
              }
            }
          }
          
          if (targetObj && targetIdx >= 0) {
            ms.removeObject(targetIdx);
            redrawObjects();
          }
        }
        
        redrawTiles();
      } else {
        // SELECT tool with multi-selection support
        const objectsInHex = ms.objects.filter(obj => obj.MapX === hex.hx && obj.MapY === hex.hy);
        
        if (objectsInHex.length > 0) {
          // Find object with highest priority based on active layer
          let targetObj = null;
          let targetIdx = -1;
          
          if (ms.activeLayer === 'tiles') {
            // In tile mode, don't select objects
            ms.clearSelection();
            ms.setSelectedHex(hex);
          } else {
            // Find first object that matches active layer (priority order)
            for (let i = objectsInHex.length - 1; i >= 0; i--) {
              const obj = objectsInHex[i];
              const objIdx = ms.objects.indexOf(obj);
              
              if (ms.activeLayer === 'items' && [1, 2, 3, 4, 5, 6, 7].includes(obj.MapObjType)) {
                targetObj = obj;
                targetIdx = objIdx;
                break;
              } else if (ms.activeLayer === 'scenery' && [8, 9].includes(obj.MapObjType)) {
                targetObj = obj;
                targetIdx = objIdx;
                break;
              } else if (ms.activeLayer === 'doors' && [10].includes(obj.MapObjType)) {
                targetObj = obj;
                targetIdx = objIdx;
                break;
              } else if (ms.activeLayer === 'blockers' && [11].includes(obj.MapObjType)) {
                targetObj = obj;
                targetIdx = objIdx;
                break;
              } else if (ms.activeLayer === 'critters' && [12].includes(obj.MapObjType)) {
                targetObj = obj;
                targetIdx = objIdx;
                break;
              } else if (ms.activeLayer === 'walls' && [13].includes(obj.MapObjType)) {
                targetObj = obj;
                targetIdx = objIdx;
                break;
              }
            }
            
            if (targetObj && targetIdx >= 0) {
              ms.selectObject(targetIdx, e.ctrlKey || e.shiftKey);
              ms.setSelectedHex(hex);
            } else {
              ms.clearSelection();
              ms.setSelectedHex(hex);
            }
          }
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
  }, [cameraRef, containerRef, mapStateRef, historyRef, redrawTiles, findObjectAtHex, screenToWorld, panStartRef, isPanningRef]);

  // Mouse move (panning, hover logic)
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
  }, [cameraRef, containerRef, mapStateRef, needsGridRedrawRef, applyCamera, screenToWorld, panStartRef, isPanningRef]);

  // Mouse up (end panning)
  const onMouseUp = useCallback(() => {
    isPanningRef.current = false;
  }, [isPanningRef]);

  return {
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onKeyDown
  };
}
