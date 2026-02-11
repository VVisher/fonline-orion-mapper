/**
 * DockableWrapper - Handles switching between Nest (docked) and Bird (floating) states
 * Implements the "Nests & Birds" architecture
 * Reference: Technical Spec - Dockable Window System
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWindowSystem } from './WindowProvider';

export default function DockableWrapper({ 
  panelId, 
  children, 
  title, 
  defaultDimensions = { width: 300, height: 400 },
  showHeader = true,
  showControls = true,
  className = '',
  style = {}
}) {
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
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const wrapperRef = useRef(null);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (!panelState.isFloating) return;
    
    // Only allow dragging from header
    const header = e.target.closest('[data-drag-header="true"]');
    if (!header) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - panelState.floatCoords.x,
      y: e.clientY - panelState.floatCoords.y
    });
    
    // Bring to front
    bringToFront(panelId);
  };

  // Handle resizing
  const handleResizeMouseDown = (e) => {
    if (!panelState.isFloating) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: panelState.dimensions.width,
      height: panelState.dimensions.height
    });
  };

  // Mouse move handler for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Constrain to viewport
        const maxX = window.innerWidth - panelState.dimensions.width;
        const maxY = window.innerHeight - panelState.dimensions.height;
        
        updatePanelPosition(panelId, 
          Math.max(0, Math.min(newX, maxX)),
          Math.max(0, Math.min(newY, maxY))
        );
      }
      
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(200, resizeStart.width + deltaX);
        const newHeight = Math.max(150, resizeStart.height + deltaY);
        
        updatePanelDimensions(panelId, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, panelState, updatePanelPosition, updatePanelDimensions]);

  // Render floating window (Bird) - Golden Standard from HistoryPanel
  if (panelState?.isFloating) {
    const floatingStyle = {
      position: 'fixed',
      left: panelState.floatCoords.x,
      top: panelState.floatCoords.y,
      width: panelState.dimensions.width,
      height: panelState.isMinimized ? 'auto' : panelState.dimensions.height,
      display: 'flex',
      flexDirection: 'column',
      background: '#12122aee',
      border: '1px solid #3a3a6a',
      borderRadius: 6,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      fontFamily: 'sans-serif',
      fontSize: '0.75rem',
      color: '#ccc',
      zIndex: panelState.zIndex,
      resize: 'none', // Disable browser resize
      ...style
    };

    const content = (
      <div
        ref={wrapperRef}
        className={`dockable-panel floating ${isDragging ? 'dragging' : ''} ${className}`}
        style={floatingStyle}
        onMouseDown={handleMouseDown}
      >
        {showHeader && (
          <div 
            data-drag-header="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              background: '#10102a',
              borderBottom: '1px solid #2a2a4a',
              borderRadius: '6px 6px 0 0',
              cursor: isDragging ? 'grabbing' : 'move',
              userSelect: 'none'
            }}
          >
            <span style={{ 
              flex: 1,
              fontWeight: 'bold',
              fontSize: '0.8rem',
              color: '#e0e0e0'
            }}>
              {title}
            </span>
            
            {showControls && (
              <button
                onClick={() => toggleFloating(panelId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px 4px',
                  borderRadius: '2px'
                }}
                title="Dock to sidebar"
              >
                ⇲
              </button>
            )}
          </div>
        )}
        
        {!panelState.isMinimized && (
          <div style={{
            height: 'calc(100% - 41px)',
            overflow: 'auto',
            background: '#0f0f23'
          }}>
            {children}
          </div>
        )}
        
        {!panelState.isMinimized && (
          <div
            className="resize-handle"
            onMouseDown={handleResizeMouseDown}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '16px',
              height: '16px',
              cursor: isResizing ? 'nwse-resize' : 'default',
              background: 'linear-gradient(135deg, transparent 50%, #3a3a6a 50%)',
              borderRadius: '0 0 6px 0'
            }}
          />
        )}
      </div>
    );

    // Use portal to render at root level
    return createPortal(content, document.body);
  }

  // Render docked panel (Nest) - Golden Standard from HistoryPanel
  if (panelState?.isVisible) {
    return (
      <div
        ref={wrapperRef}
        className={`dockable-panel docked ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#12122a',
          borderTop: '1px solid #2a2a4a',
          maxHeight: 250,
          fontFamily: 'sans-serif',
          fontSize: '0.75rem',
          color: '#ccc',
          ...style
        }}
      >
        {showHeader && (
          <div 
            className="panel-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              background: '#10102a',
              borderBottom: '1px solid #2a2a4a',
              cursor: 'default'
            }}
          >
            <span style={{ 
              flex: 1,
              fontWeight: 'bold',
              fontSize: '0.8rem',
              color: '#e0e0e0'
            }}>
              {title}
            </span>
            
            {showControls && (
              <button
                onClick={() => toggleFloating(panelId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px 4px',
                  borderRadius: '2px'
                }}
                title="Undock (float)"
              >
                ⇱
              </button>
            )}
          </div>
        )}
        
        <div style={{
          height: showHeader ? 'calc(100% - 41px)' : '100%',
          overflow: 'auto',
          background: '#0f0f23'
        }}>
          {children}
        </div>
      </div>
    );
  }

  // Render placeholder/ghost when panel is hidden
  return (
    <div
      className="panel-placeholder"
      style={{
        border: '2px dashed #333',
        borderRadius: '4px',
        padding: '8px',
        textAlign: 'center',
        color: '#666',
        fontSize: '12px',
        background: '#0a0a1a',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <span>{title} (Hidden)</span>
      <button
        onClick={() => togglePanelVisibility(panelId)}
        style={{
          marginLeft: '8px',
          background: '#1a1a3e',
          border: '1px solid #333',
          color: '#888',
          cursor: 'pointer',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '2px'
        }}
      >
        Show
      </button>
    </div>
  );
}
