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
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState({ width: 300, height: 200 });
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');

  useEffect(() => {
    if (!history) return;
    return history.subscribe(() => forceUpdate(n => n + 1));
  }, [history]);

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

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    
    const handleMouseMove = (e) => {
      const newWidth = startWidth + (e.clientX - startX);
      const newHeight = startHeight + (e.clientY - startY);
      
      if (newWidth >= 200 && newHeight >= 100) {
        setSize({ width: newWidth, height: newHeight });
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const undoEntries = history.getUndoEntries();
  const redoEntries = history.getRedoEntries();

  const panelStyle = docked ? styles.docked : {
    ...styles.floating,
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    cursor: isResizing ? 'nwse-resize' : 'default'
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div 
        style={{
          ...styles.header,
          cursor: docked ? 'default' : 'move'
        }}
        onMouseDown={docked ? undefined : handleMouseDown}
      >
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
      <div style={{
        ...styles.list,
        height: docked ? 'auto' : size.height - 80 // Account for header and resize handle
      }}>
        {/* Current state marker */}
        <div style={styles.currentMarker}>
          ▸ Current State
        </div>

        {/* Redo entries (greyed out, above current) */}
        {redoEntries.map((entry, i) => (
          <div
            key={`redo-${entry.index || i}`}
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
        {undoEntries.map((entry, i) => (
          <div
            key={`undo-${entry.index || i}`}
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
        <button
          style={styles.actionBtn}
          onClick={() => setShowCheckpointModal(true)}
          title="Create checkpoint"
        >
          Checkpoint
        </button>
        <button
          style={styles.actionBtn}
          onClick={() => history.clear()}
          title="Clear all history"
        >
          Clear
        </button>
      </div>
      
      {/* Resize handle for floating panel */}
      {!docked && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '20px',
            height: '20px',
            cursor: 'nwse-resize',
            background: 'linear-gradient(135deg, transparent 50%, #666 50%)',
            borderTopLeftRadius: '4px'
          }}
          onMouseDown={handleResizeMouseDown}
        />
      )}
      
      {/* Checkpoint Modal */}
      {showCheckpointModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              Create Checkpoint
            </div>
            <div style={styles.modalBody}>
              <input
                type="text"
                value={checkpointName}
                onChange={(e) => setCheckpointName(e.target.value)}
                placeholder="Enter checkpoint name..."
                style={styles.modalInput}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (checkpointName.trim()) {
                      history.checkpoint(checkpointName.trim());
                      setCheckpointName('');
                      setShowCheckpointModal(false);
                    }
                  } else if (e.key === 'Escape') {
                    setCheckpointName('');
                    setShowCheckpointModal(false);
                  }
                }}
              />
            </div>
            <div style={styles.modalActions}>
              <button
                style={styles.modalBtn}
                onClick={() => {
                  if (checkpointName.trim()) {
                    history.checkpoint(checkpointName.trim());
                    setCheckpointName('');
                    setShowCheckpointModal(false);
                  }
                }}
                disabled={!checkpointName.trim()}
              >
                Create
              </button>
              <button
                style={styles.modalBtn}
                onClick={() => {
                  setCheckpointName('');
                  setShowCheckpointModal(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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
    resize: 'none', // Disable browser resize
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
    overflowX: 'hidden',
    padding: '2px 0',
    minHeight: 0, // Allow flex item to shrink
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
    background: '#0a0a1e',
    color: '#444',
    border: '1px solid #222',
    borderRadius: 3,
    fontSize: '0.65rem',
    cursor: 'not-allowed',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    background: '#1a1a3e',
    border: '2px solid #3a3a6a',
    borderRadius: 8,
    padding: 0,
    minWidth: 300,
    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
  },
  modalHeader: {
    padding: '12px 16px',
    background: '#2a2a4a',
    borderBottom: '1px solid #3a3a6a',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#ccc',
  },
  modalBody: {
    padding: '16px',
  },
  modalInput: {
    width: '100%',
    padding: '8px 12px',
    background: '#0a0a2a',
    border: '1px solid #3a3a6a',
    borderRadius: 4,
    color: '#ccc',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: 8,
    padding: '12px 16px 16px',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    padding: '6px 16px',
    background: '#2a2a4a',
    border: '1px solid #3a3a6a',
    borderRadius: 4,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  modalBtnDisabled: {
    padding: '6px 16px',
    background: '#1a1a2a',
    border: '1px solid #2a2a3a',
    borderRadius: 4,
    color: '#666',
    cursor: 'not-allowed',
    fontSize: '0.8rem',
  },
};
