/**
 * Nest - Container for docked panels
 * Manages the "Nest" state in the "Nests & Birds" architecture
 * Reference: Technical Spec - Dockable Window System
 */

import React from 'react';
import { useWindowSystem } from './WindowProvider';

export default function Nest({ 
  anchor, 
  children, 
  className = '', 
  style = {},
  showPlaceholders = true 
}) {
  const { getPanelsByAnchor } = useWindowSystem();
  const dockedPanels = getPanelsByAnchor(anchor);

  const nestStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflow: 'hidden',
    height: '100%',
    ...style
  };

  // If no panels and no placeholders, render nothing
  if (dockedPanels.length === 0 && !showPlaceholders) {
    return null;
  }

  return (
    <div 
      className={`nest nest-${anchor} ${className}`}
      style={nestStyle}
    >
      {children}
      
      {/* Show placeholder if no panels */}
      {dockedPanels.length === 0 && showPlaceholders && (
        <div
          className="nest-placeholder"
          style={{
            border: '2px dashed #333',
            borderRadius: '4px',
            padding: '16px',
            textAlign: 'center',
            color: '#666',
            fontSize: '12px',
            background: '#0a0a1a',
            minHeight: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontStyle: 'italic'
          }}
        >
          <div>
            <div>Empty Nest</div>
            <div style={{ fontSize: '10px', marginTop: '4px' }}>
              Drag panels here to dock them
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
