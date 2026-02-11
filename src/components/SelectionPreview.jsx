import React, { useState, useEffect, useRef } from 'react';

/**
 * SelectionPreview - Shows details about selected objects/entities.
 * 
 * Props:
 *   mapState - MapState instance
 */
export default function SelectionPreview({ mapState }) {
  const [, forceUpdate] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState({ width: 200, height: 150 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDocked, setIsDocked] = useState(true);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  useEffect(() => {
    if (!mapState) return;
    return mapState.subscribe(() => forceUpdate(n => n + 1));
  }, [mapState]);

  const handleMouseDown = (e) => {
    if (isDocked) return;
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
      setIsDragging(false);
    };
    
    setIsDragging(true);
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
      
      if (newWidth >= 150 && newHeight >= 100) {
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

  if (!mapState || !mapState.selectedObjects || mapState.selectedObjects.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>Selection</div>
        <div style={styles.empty}>No objects selected</div>
      </div>
    );
  }

  const selectedObjects = mapState.selectedObjects.map(idx => mapState.objects[idx]);

  const containerStyle = isDocked ? styles.container : {
    ...styles.floating,
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    cursor: isResizing ? 'nwse-resize' : isDragging ? 'move' : 'default'
  };

  return (
    <div style={containerStyle}>
      <div 
        style={{
          ...styles.header,
          cursor: isDocked ? 'default' : 'move'
        }}
        onMouseDown={handleMouseDown}
      >
        <span style={styles.headerTitle}>Selection</span>
        <button
          style={styles.dockBtn}
          onClick={() => setIsDocked(!isDocked)}
          title={isDocked ? 'Undock (float)' : 'Dock to sidebar'}
        >
          {isDocked ? '⇱' : '⇲'}
        </button>
      </div>
      <div style={{
        ...styles.content,
        height: isDocked ? 'auto' : size.height - 80
      }}>
        Selection ({selectedObjects.length})
      </div>
      
      <div style={styles.list}>
        {selectedObjects.map((obj, i) => (
          <div key={i} style={styles.item}>
            <div style={styles.itemHeader}>
              Object #{mapState.selectedObjects[i]}
            </div>
            <div style={styles.details}>
              <div>Position: ({obj.MapX}, {obj.MapY})</div>
              <div>Type: {getObjectTypeLabel(obj.MapObjType)}</div>
              <div>Proto: {obj.ProtoId || 'N/A'}</div>
              {obj.Lexems && (
                <div>Name: {obj.Lexems.join(' ')}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div style={styles.actions}>
        <button
          style={styles.actionBtn}
          onClick={() => {
            mapState.selectedObjects.forEach(idx => {
              mapState.removeObject(idx);
            });
            mapState.clearSelection();
          }}
          title="Delete selected objects"
        >
          Delete
        </button>
        <button
          style={styles.actionBtn}
          onClick={() => {
            // Copy properties for pasting
            const obj = selectedObjects[0];
            navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
          }}
          title="Copy properties to clipboard"
          disabled={selectedObjects.length !== 1}
        >
          Copy
        </button>
      </div>
      
      {/* Resize handle for floating panel */}
      {!isDocked && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '15px',
            height: '15px',
            cursor: 'nwse-resize',
            background: 'linear-gradient(135deg, transparent 50%, #666 50%)',
            borderTopLeftRadius: '3px'
          }}
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
}

function getObjectTypeLabel(type) {
  const types = {
    1: 'Item - Weapon',
    2: 'Item - Armor', 
    3: 'Item - Drug',
    4: 'Item - Ammo',
    5: 'Item - Misc',
    6: 'Item - Key',
    7: 'Item - Container',
    8: 'Scenery - Static',
    9: 'Scenery - Dynamic',
    10: 'Door',
    11: 'Blocker',
    12: 'Critter',
    13: 'Wall'
  };
  return types[type] || `Type ${type}`;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    background: '#12122a',
    borderTop: '1px solid #2a2a4a',
    fontFamily: 'sans-serif',
    fontSize: '0.75rem',
    color: '#ccc',
    maxHeight: 200,
  },
  floating: {
    position: 'fixed',
    right: 220,
    top: 60,
    width: 200,
    height: 150,
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
    padding: '4px 8px',
    background: '#10102a',
    borderBottom: '1px solid #2a2a4a',
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#00ff88',
    fontSize: '0.72rem',
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
  empty: {
    padding: '8px',
    textAlign: 'center',
    color: '#666',
  },
  content: {
    padding: '4px',
    overflowY: 'auto',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px',
  },
  item: {
    background: '#1a1a3a',
    border: '1px solid #2a2a4a',
    borderRadius: 4,
    marginBottom: '4px',
    padding: '4px',
  },
  itemHeader: {
    fontWeight: 'bold',
    color: '#88aaff',
    marginBottom: '2px',
  },
  details: {
    fontSize: '0.7rem',
    color: '#aaa',
    lineHeight: '1.2',
  },
  actions: {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    borderTop: '1px solid #2a2a4a',
  },
  actionBtn: {
    padding: '2px 6px',
    background: '#2a2a4a',
    border: '1px solid #3a3a6a',
    borderRadius: 3,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '0.7rem',
  },
  actionBtn: {
    padding: '2px 6px',
    background: '#2a2a4a',
    border: '1px solid #3a3a6a',
    borderRadius: 3,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '0.7rem',
  },
  actionBtn: {
    padding: '2px 6px',
    background: '#2a2a4a',
    border: '1px solid #3a3a6a',
    borderRadius: 3,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '0.7rem',
  },
  actionBtnDisabled: {
    padding: '2px 6px',
    background: '#1a1a2a',
    border: '1px solid #2a2a3a',
    borderRadius: 3,
    color: '#666',
    cursor: 'not-allowed',
    fontSize: '0.7rem',
  },
};
