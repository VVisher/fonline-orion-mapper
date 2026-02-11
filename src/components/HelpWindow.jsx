import React, { useState } from 'react';

/**
 * F1 Help Window showing all hotkey controls
 * Toggleable help panel with keyboard shortcuts reference
 */
export default function HelpWindow() {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcuts data
  const shortcuts = {
    'File Operations': [
      { key: 'Ctrl+O', description: 'Open map file' },
      { key: 'Ctrl+S', description: 'Save map file' },
      { key: 'Ctrl+N', description: 'New map' },
    ],
    'Edit Operations': [
      { key: 'Ctrl+Z', description: 'Undo' },
      { key: 'Ctrl+Y', description: 'Redo' },
      { key: 'Ctrl+Shift+Z', description: 'Redo (alternative)' },
    ],
    'View Controls': [
      { key: 'Mouse Wheel', description: 'Zoom in/out' },
      { key: 'Ctrl + Plus', description: 'Zoom in' },
      { key: 'Ctrl + Minus', description: 'Zoom out' },
      { key: 'Arrow Keys', description: 'Pan camera' },
      { key: 'F12', description: 'Toggle debug window' },
      { key: 'F1', description: 'Toggle this help window' },
    ],
    'Tool Controls': [
      { key: 'S', description: 'Select tool' },
      { key: 'T', description: 'Tile tool' },
      { key: 'E', description: 'Erase tool' },
    ],
    'Selection Operations': [
      { key: 'A', description: 'Select all objects in layer' },
      { key: 'Plus', description: 'Expand selection to adjacent hexes' },
      { key: 'Minus', description: 'Clear selection' },
      { key: 'Delete', description: 'Delete selected objects' },
    ],
    'Layer Controls': [
      { key: '1', description: 'Switch to tiles layer' },
      { key: '2', description: 'Switch to items layer' },
      { key: '3', description: 'Switch to critters layer' },
      { key: '4', description: 'Switch to scenery layer' },
      { key: '5', description: 'Switch to doors layer' },
      { key: '6', description: 'Switch to blockers layer' },
      { key: '7', description: 'Switch to walls layer' },
    ],
    'System': [
      { key: 'Ctrl+Shift+R', description: 'Clear config and reload' },
      { key: 'Escape', description: 'Cancel current operation' },
    ],
  };

  // Global F1 key handler
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible) {
    return null; // Help window is hidden
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.window}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Keyboard Shortcuts</h2>
          <button
            style={styles.closeButton}
            onClick={() => setIsVisible(false)}
            title="Close (F1)"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {Object.entries(shortcuts).map(([category, items]) => (
            <div key={category} style={styles.category}>
              <h3 style={styles.categoryTitle}>{category}</h3>
              <div style={styles.shortcutList}>
                {items.map((shortcut, index) => (
                  <div key={index} style={styles.shortcutItem}>
                    <div style={styles.key}>
                      <kbd style={styles.kbd}>{shortcut.key}</kbd>
                    </div>
                    <div style={styles.description}>
                      {shortcut.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Press <kbd style={styles.kbd}>F1</kbd> to toggle this help window
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
  },
  window: {
    background: '#1a1a2e',
    border: '2px solid #3a3a6a',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    maxWidth: '800px',
    maxHeight: '90vh',
    width: '90%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: '#2a2a4a',
    borderBottom: '1px solid #3a3a6a',
  },
  title: {
    margin: 0,
    color: '#00ff88',
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#ccc',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  content: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
  },
  category: {
    marginBottom: '24px',
  },
  categoryTitle: {
    margin: '0 0 12px 0',
    color: '#88aaff',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    borderBottom: '1px solid #3a3a6a',
    paddingBottom: '8px',
  },
  shortcutList: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '8px 16px',
    alignItems: 'center',
  },
  shortcutItem: {
    display: 'contents',
  },
  key: {
    justifySelf: 'start',
  },
  kbd: {
    background: '#3a3a6a',
    border: '1px solid #5a5a8a',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '0.85rem',
    color: '#fff',
    fontFamily: 'monospace',
    display: 'inline-block',
    minWidth: '20px',
    textAlign: 'center',
  },
  description: {
    color: '#ccc',
    fontSize: '0.9rem',
  },
  footer: {
    padding: '16px 24px',
    background: '#2a2a4a',
    borderTop: '1px solid #3a3a6a',
    textAlign: 'center',
  },
  footerText: {
    margin: 0,
    color: '#888',
    fontSize: '0.85rem',
  },
};
