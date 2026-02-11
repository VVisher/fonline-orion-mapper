/**
 * WindowProvider - Global UI State Management for Dockable Panels
 * Implements the "Nests & Birds" architecture
 * Reference: Technical Spec - Dockable Window System
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

// Create context
const WindowContext = createContext();

// Global window state
const initialWindowState = {
  // Panel configurations
  panels: {
    protoPanel: {
      panelId: 'protoPanel',
      title: 'Proto Panel',
      isFloating: false,
      anchor: 'right-sidebar',
      floatCoords: { x: 50, y: 50 },
      dimensions: { width: 350, height: 500 },
      zIndex: 100,
      isMinimized: false,
      isVisible: true
    }
  },
  // Global z-index counter
  nextZIndex: 101,
  // Active panel (for z-index management)
  activePanel: null
};

export function WindowProvider({ children }) {
  const [windowState, setWindowState] = useState(initialWindowState);

  // Toggle panel floating state
  const toggleFloating = useCallback((panelId) => {
    setWindowState(prev => {
      const panel = prev.panels[panelId];
      if (!panel) return prev;

      const newPanels = {
        ...prev.panels,
        [panelId]: {
          ...panel,
          isFloating: !panel.isFloating,
          // If becoming floating, update z-index
          zIndex: panel.isFloating ? panel.zIndex : prev.nextZIndex
        }
      };

      return {
        ...prev,
        panels: newPanels,
        nextZIndex: panel.isFloating ? prev.nextZIndex : prev.nextZIndex + 1,
        activePanel: panel.isFloating ? prev.activePanel : panelId
      };
    });
  }, []);

  // Update panel position
  const updatePanelPosition = useCallback((panelId, x, y) => {
    setWindowState(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [panelId]: {
          ...prev.panels[panelId],
          floatCoords: { x, y }
        }
      }
    }));
  }, []);

  // Update panel dimensions
  const updatePanelDimensions = useCallback((panelId, width, height) => {
    setWindowState(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [panelId]: {
          ...prev.panels[panelId],
          dimensions: { width, height }
        }
      }
    }));
  }, []);

  // Bring panel to front
  const bringToFront = useCallback((panelId) => {
    setWindowState(prev => {
      const panel = prev.panels[panelId];
      if (!panel || !panel.isFloating) return prev;

      return {
        ...prev,
        panels: {
          ...prev.panels,
          [panelId]: {
            ...panel,
            zIndex: prev.nextZIndex
          }
        },
        nextZIndex: prev.nextZIndex + 1,
        activePanel: panelId
      };
    });
  }, []);

  // Toggle panel visibility
  const togglePanelVisibility = useCallback((panelId) => {
    setWindowState(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [panelId]: {
          ...prev.panels[panelId],
          isVisible: !prev.panels[panelId].isVisible
        }
      }
    }));
  }, []);

  // Toggle panel minimized state
  const togglePanelMinimized = useCallback((panelId) => {
    setWindowState(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [panelId]: {
          ...prev.panels[panelId],
          isMinimized: !prev.panels[panelId].isMinimized
        }
      }
    }));
  }, []);

  // Get panel state
  const getPanelState = useCallback((panelId) => {
    return windowState.panels[panelId];
  }, [windowState]);

  // Get panels by anchor
  const getPanelsByAnchor = useCallback((anchor) => {
    return Object.values(windowState.panels).filter(panel => 
      panel.anchor === anchor && !panel.isFloating && panel.isVisible
    );
  }, [windowState]);

  // Get floating panels
  const getFloatingPanels = useCallback(() => {
    return Object.values(windowState.panels).filter(panel => 
      panel.isFloating && panel.isVisible
    ).sort((a, b) => a.zIndex - b.zIndex);
  }, [windowState]);

  const value = {
    windowState,
    toggleFloating,
    updatePanelPosition,
    updatePanelDimensions,
    bringToFront,
    togglePanelVisibility,
    togglePanelMinimized,
    getPanelState,
    getPanelsByAnchor,
    getFloatingPanels
  };

  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
}

// Hook to use window context
export function useWindowSystem() {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error('useWindowSystem must be used within a WindowProvider');
  }
  return context;
}

export default WindowProvider;
