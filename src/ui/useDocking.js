/**
 * useDocking - Custom hook for managing dockable panels
 * Simplifies panel management for components
 * Reference: Technical Spec - Dockable Window System
 */

import { useCallback } from 'react';
import { useWindowSystem } from './WindowProvider';

export function useDocking(panelId, options = {}) {
  const {
    getPanelState,
    toggleFloating,
    updatePanelPosition,
    updatePanelDimensions,
    bringToFront,
    togglePanelVisibility,
    togglePanelMinimized
  } = useWindowSystem();

  const panelState = getPanelState(panelId);

  // Convenience methods
  const dock = useCallback(() => {
    if (panelState?.isFloating) {
      toggleFloating(panelId);
    }
  }, [panelState, toggleFloating, panelId]);

  const undock = useCallback(() => {
    if (!panelState?.isFloating) {
      toggleFloating(panelId);
    }
  }, [panelState, toggleFloating, panelId]);

  const show = useCallback(() => {
    if (!panelState?.isVisible) {
      togglePanelVisibility(panelId);
    }
  }, [panelState, togglePanelVisibility, panelId]);

  const hide = useCallback(() => {
    if (panelState?.isVisible) {
      togglePanelVisibility(panelId);
    }
  }, [panelState, togglePanelVisibility, panelId]);

  const minimize = useCallback(() => {
    if (!panelState?.isMinimized) {
      togglePanelMinimized(panelId);
    }
  }, [panelState, togglePanelMinimized, panelId]);

  const restore = useCallback(() => {
    if (panelState?.isMinimized) {
      togglePanelMinimized(panelId);
    }
  }, [panelState, togglePanelMinimized, panelId]);

  const moveTo = useCallback((x, y) => {
    if (panelState?.isFloating) {
      updatePanelPosition(panelId, x, y);
    }
  }, [panelState, updatePanelPosition, panelId]);

  const resize = useCallback((width, height) => {
    if (panelState?.isFloating) {
      updatePanelDimensions(panelId, width, height);
    }
  }, [panelState, updatePanelDimensions, panelId]);

  const focus = useCallback(() => {
    if (panelState?.isFloating) {
      bringToFront(panelId);
    }
  }, [panelState, bringToFront, panelId]);

  // Panel state helpers
  const isFloating = panelState?.isFloating || false;
  const isVisible = panelState?.isVisible || false;
  const isMinimized = panelState?.isMinimized || false;
  const position = panelState?.floatCoords || { x: 0, y: 0 };
  const dimensions = panelState?.dimensions || { width: 300, height: 400 };
  const zIndex = panelState?.zIndex || 100;

  return {
    // Raw state
    panelState,
    isFloating,
    isVisible,
    isMinimized,
    position,
    dimensions,
    zIndex,
    
    // Actions
    dock,
    undock,
    show,
    hide,
    minimize,
    restore,
    moveTo,
    resize,
    focus,
    
    // Raw methods for advanced usage
    toggleFloating,
    updatePanelPosition,
    updatePanelDimensions,
    bringToFront,
    togglePanelVisibility,
    togglePanelMinimized
  };
}
