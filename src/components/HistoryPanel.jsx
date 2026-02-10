import React, { useState, useEffect } from 'react';

/**
 * HistoryPanel — dockable/floating panel showing undo/redo history entries.
 *
 * Props:
 *   history  — History instance
 *   docked   — boolean, whether panel is docked to sidebar
 *   onToggleDock — callback to toggle dock state
 */
export default function HistoryPanel({ history, docked, onToggleDock }) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!history) return;
    return history.subscribe(() => forceUpdate(n => n + 1));
  }, [history]);

  if (!history) return null;

  const undoEntries = history.entries;       // most recent first
  const redoEntries = history.redoEntries;   // most recent first

  const panelStyle = docked ? styles.docked : styles.floating;

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>History</span>
        <span style={styles.headerCount}>
          {history.undoCount}u / {history.redoCount}r
        </span>
        <button
          style={styles.dockBtn}
          onClick={onToggleDock}
          title={docked ? 'Undock (float)' : 'Dock to sidebar'}
        >
          {docked ? '⇱' : '⇲'}
        </button>
      </div>

      {/* Entry list */}
      <div style={styles.list}>
        {/* Current state marker */}
        <div style={styles.currentMarker}>
          ▸ Current State
        </div>

        {/* Redo entries (greyed out, above current) */}
        {redoEntries.map((entry, i) => (
          <div
            key={`redo-${i}`}
            style={styles.redoEntry}
            onClick={() => {
              // Redo to this point
              for (let j = 0; j <= i; j++) history.redo();
            }}
            title="Click to redo to this point"
          >
            <span style={styles.entryIcon}>↻</span>
            <span style={styles.entryLabel}>{entry.label}</span>
          </div>
        ))}

        {/* Undo entries (active) */}
        {undoEntries.map((entry) => (
          <div
            key={`undo-${entry.index}`}
            style={styles.undoEntry}
            onClick={() => history.jumpTo(entry.index)}
            title={`Jump to: ${entry.label}`}
          >
            <span style={styles.entryIcon}>●</span>
            <span style={styles.entryLabel}>{entry.label}</span>
          </div>
        ))}

        {undoEntries.length === 0 && redoEntries.length === 0 && (
          <div style={styles.empty}>No history yet.</div>
        )}
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button
          style={history.canUndo ? styles.actionBtn : styles.actionBtnDisabled}
          onClick={() => history.undo()}
          disabled={!history.canUndo}
        >
          Undo
        </button>
        <button
          style={history.canRedo ? styles.actionBtn : styles.actionBtnDisabled}
          onClick={() => history.redo()}
          disabled={!history.canRedo}
        >
          Redo
        </button>
      </div>
    </div>
  );
}

const styles = {
  docked: {
    display: 'flex',
    flexDirection: 'column',
    background: '#12122a',
    borderTop: '1px solid #2a2a4a',
    maxHeight: 250,
    fontFamily: 'sans-serif',
    fontSize: '0.75rem',
    color: '#ccc',
  },
  floating: {
    position: 'fixed',
    right: 220,
    top: 60,
    width: 240,
    maxHeight: 350,
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
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '2px 0',
  },
  currentMarker: {
    padding: '3px 8px',
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: '0.68rem',
    borderBottom: '1px solid #1a1a3a',
  },
  undoEntry: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 8px',
    cursor: 'pointer',
    borderBottom: '1px solid #0a0a1a',
    transition: 'background 0.1s',
  },
  redoEntry: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 8px',
    cursor: 'pointer',
    borderBottom: '1px solid #0a0a1a',
    opacity: 0.4,
  },
  entryIcon: {
    fontSize: '0.6rem',
    color: '#44aaff',
    flexShrink: 0,
  },
  entryLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.68rem',
  },
  empty: {
    padding: '8px',
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    gap: 4,
    padding: '4px 8px',
    borderTop: '1px solid #2a2a4a',
  },
  actionBtn: {
    flex: 1,
    padding: '3px 0',
    background: '#1a1a3e',
    color: '#aaa',
    border: '1px solid #333',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: '0.68rem',
  },
  actionBtnDisabled: {
    flex: 1,
    padding: '3px 0',
    background: '#111',
    color: '#333',
    border: '1px solid #1a1a2a',
    borderRadius: 3,
    cursor: 'default',
    fontSize: '0.68rem',
  },
};
