/**
 * PanelToolbar - Toolbar with panel toggle buttons
 * Integrates with the dockable window system
 * Reference: Technical Spec - Dockable Window System
 */

import React from 'react';
import { useWindowSystem } from '../ui/WindowProvider';

export default function PanelToolbar({ onNew, onOpen, onSave, fileName, mapState, onToggleEntityReactor }) {
  // For now, just use the toggle prop if provided
  const handleEntityToggle = () => {
    if (onToggleEntityReactor) {
      onToggleEntityReactor();
    }
  };

  const displayName = fileName || 'Untitled.fomap';
  const dirtyMark = mapState?.dirty ? ' *' : '';

  return (
    <div style={styles.toolbar}>
      <span style={styles.title}>ORION</span>
      <span style={styles.divider}>|</span>
      
      {/* File Operations */}
      <button style={styles.btn} onClick={onNew}>New</button>
      <button style={styles.btn} onClick={onOpen}>Open</button>
      <button style={styles.btn} onClick={onSave}>Save</button>
      
      <span style={styles.divider}>|</span>
      
      {/* File Info */}
      <span style={styles.fileName}>
        {displayName}{dirtyMark}
      </span>
      <span style={styles.layerBadge}>
        Layer: {mapState?.activeLayer || 'Unknown'}
      </span>
      
      <span style={styles.divider}>|</span>
      
      {/* Panel Toggles */}
      <button
        style={styles.btn}
        onClick={handleEntityToggle}
        title="Toggle Entity Reactor (Ctrl+E)"
      >
        Entities
      </button>
    </div>
  );
}

const styles = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.5rem 1rem',
    background: '#16213e',
    borderBottom: '1px solid #333',
  },
  title: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    color: '#00ff88',
    marginRight: '1rem',
    letterSpacing: '0.15em',
  },
  btn: {
    padding: '0.35rem 0.8rem',
    background: '#1a1a3e',
    color: '#e0e0e0',
    border: '1px solid #444',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  divider: {
    color: '#333',
    fontSize: '1rem',
    userSelect: 'none',
  },
  fileName: {
    color: '#888',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
  },
  layerBadge: {
    marginLeft: 'auto',
    color: '#44aaff',
    fontSize: '0.78rem',
    fontFamily: 'monospace',
    textTransform: 'capitalize',
  },
};
