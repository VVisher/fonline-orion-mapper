import { useRef } from 'react';

/**
 * Custom hook for managing cursor color/style based on tool.
 */
export function useHexCursor(appRef) {
  function setCursorByTool(tool) {
    const canvas = appRef.current?.canvas;
    if (!canvas) return;
    if (tool === 'select' || !tool) {
      canvas.style.cursor = 'crosshair';
    } else if (tool === 'tile') {
      canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'><circle cx=\'16\' cy=\'16\' r=\'8\' fill=\'%2300ff88\' stroke=\'%2300ff88\' stroke-width=\'2\'/></svg>") 16 16, crosshair';
    } else if (tool === 'erase') {
      canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'><rect x=\'8\' y=\'8\' width=\'16\' height=\'16\' fill=\'%23ff4444\' stroke=\'%23ff4444\' stroke-width=\'2\'/></svg>") 16 16, crosshair';
    } else if (tool === 'run') {
      canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'><polygon points=\'8,24 16,8 24,24\' fill=\'%23ffaa00\' stroke=\'%23ffaa00\' stroke-width=\'2\'/></svg>") 16 16, pointer';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }
  return { setCursorByTool };
}
