import { useRef } from 'react';

/**
 * Custom hook for camera state and pan/zoom logic for hex grid.
 */
export function useHexCamera(initial = { x: 0, y: 0, zoom: 1.0 }) {
  const cameraRef = useRef({ ...initial });

  function setCamera(x, y, zoom) {
    if (x !== undefined) cameraRef.current.x = x;
    if (y !== undefined) cameraRef.current.y = y;
    if (zoom !== undefined) cameraRef.current.zoom = zoom;
  }

  function moveCamera(dx, dy) {
    cameraRef.current.x += dx;
    cameraRef.current.y += dy;
  }

  function setZoom(zoom) {
    cameraRef.current.zoom = zoom;
  }

  return {
    cameraRef,
    setCamera,
    moveCamera,
    setZoom,
  };
}
