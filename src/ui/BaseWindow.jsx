/**
 * BaseWindow - Reusable golden standard window component
 * Provides History window design and behavior for all bird-type windows
 * Reference: HistoryPanel golden standard
 */

import React, { useState, useEffect, useRef } from 'react';

export default function BaseWindow({ 
  title, 
  docked = false, 
  onToggleDock = () => {},
  children,
  defaultPosition = { x: 100, y: 50 }, // Changed from y: 100 to y: 50
  defaultSize = { width: 300, height: 200 },
  showHeader = true,
  showActions = false,
  actions = null,
  count = null,
  className = ''
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState(defaultSize);
  const [position, setPosition] = useState(defaultPosition);
  const [isDocked, setIsDocked] = useState(docked);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const wrapperRef = useRef(null);

  // Handle dragging (from HistoryPanel)
  const handleMouseDown = (e) => {
    if (docked) return;
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;
    
    const handleMouseMove = (e) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY
      });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle resizing (replicated from HistoryPanel)
  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    
    setIsResizing(true);
    setResizeStart({ x: startX, y: startY, width: startWidth, height: startHeight });
    
    const handleMouseMove = (e) => {
      const newWidth = Math.max(200, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(150, resizeStart.height + (e.clientY - resizeStart.y));
      setSize({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Mouse move handler for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(200, resizeStart.width + deltaX);
        const newHeight = Math.max(150, resizeStart.height + deltaY);
        
        setSize({ width: newWidth, height: newHeight });
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizeStart, setSize]);

  const panelStyle = docked ? styles.docked : {
    ...styles.floating,
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    cursor: isResizing ? 'nwse-resize' : 'default'
  };

  return (
    <div 
      ref={wrapperRef}
      className={`base-window ${className}`}
      style={panelStyle}
    >
      {/* Header */}
      {showHeader && (
        <div 
          style={{
            ...styles.header,
            cursor: docked ? 'default' : 'move'
          }}
          onMouseDown={docked ? undefined : handleMouseDown}
        >
          <span style={styles.headerTitle}>{title}</span>
          {count !== null && (
            <span style={styles.headerCount}>{count}</span>
          )}
          <button
            style={styles.dockBtn}
            onClick={onToggleDock}
            title={docked ? 'Undock (float)' : 'Dock to sidebar'}
          >
            {docked ? '⇱' : '⇲'}
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{
        ...styles.content,
        height: docked ? 'auto' : size.height - (showHeader ? 40 : 0) - (showActions ? 35 : 0)
      }}>
        {children}
      </div>

      {/* Actions */}
      {showActions && (
        <div style={styles.actions}>
          {actions}
        </div>
      )}

      {/* Resize handle */}
      {!docked && (
        <div
          style={styles.resizeHandle}
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
}

const styles = {
  docked: {
    display: 'flex',
    flexDirection: 'column',
    background: '#12122a',
    borderTop: '1px solid #2a2a4a',
    height: 250, // Fixed height instead of maxHeight
    fontFamily: 'sans-serif',
    fontSize: '0.75rem',
    color: '#ccc',
    overflow: 'hidden', // Prevent overflow at container level
  },
  floating: {
    position: 'fixed',
    right: 220,
    top: 60,
    width: 300,
    height: 200,
    display: 'flex',
    flexDirection: 'column',
    background: '#12122aee',
    border: '1px solid #3a3a6a',
    borderRadius: 6,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    fontFamily: 'sans-serif',
    fontSize: '0.75rem',
    color: '#ccc',
    zIndex: 1000,
    resize: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    background: '#10102a',
    borderBottom: '1px solid #2a2a4a',
    borderRadius: '6px 6px 0 0',
  },
  headerTitle: {
    flex: 1,
    fontWeight: 'bold',
    color: '#00ff88',
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  headerCount: {
    color: '#555',
    fontSize: '0.65rem',
    fontFamily: 'monospace',
  },
  dockBtn: {
    background: 'none',
    border: '1px solid #333',
    color: '#888',
    borderRadius: 3,
    padding: '1px 5px',
    cursor: 'pointer',
    fontSize: '0.7rem',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '2px 0',
    minHeight: 0, // Allow flex item to shrink
  },
  actions: {
    display: 'flex',
    gap: 4,
    padding: '4px 8px',
    borderTop: '1px solid #2a2a4a',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '16px',
    height: '16px',
    cursor: 'nwse-resize',
    background: 'linear-gradient(135deg, transparent 50%, #3a3a6a 50%)',
    borderRadius: '0 0 6px 0',
  },
};
