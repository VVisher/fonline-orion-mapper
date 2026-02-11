import React, { useState, useEffect, useCallback } from 'react';
import { LAYERS } from '../engine/MapState.js';
import { logger } from '../engine/Logger.js';
import { withButtonAnimation, withInputAnimation } from '../styles/GlobalStyles.jsx';

/**
 * TilePanel — right sidebar: tools, layer mode, visibility, undo/redo, tile brush.
 *
 * Props:
 *   mapState — MapState instance
 *   history  — History instance
 */

// Common FOnline tile prefixes for quick browsing
const TILE_CATEGORIES = [
  { label: 'Desert',   prefix: 'art\\tiles\\DES' },
  { label: 'Dirt',     prefix: 'art\\tiles\\DRT' },
  { label: 'Edge',     prefix: 'art\\tiles\\EDG' },
  { label: 'Floor',    prefix: 'art\\tiles\\FLR' },
  { label: 'Grass',    prefix: 'art\\tiles\\GRS' },
  { label: 'Road',     prefix: 'art\\tiles\\RD' },
  { label: 'Sand',     prefix: 'art\\tiles\\SND' },
  { label: 'Cave',     prefix: 'art\\tiles\\CAV' },
  { label: 'City',     prefix: 'art\\tiles\\CTY' },
];

// Layer display labels and colors
const LAYER_META = {
  tiles:    { label: 'Tiles',    color: '#44aaff' },
  scenery:  { label: 'Scenery',  color: '#44cc88' },
  items:    { label: 'Items',    color: '#ddaa44' },
  critters: { label: 'Critters', color: '#ff6688' },
  doors:    { label: 'Doors',    color: '#aa88ff' },
  roofs:    { label: 'Roofs',    color: '#88cccc' },
  blockers: { label: 'Blockers', color: '#ff4444' },
};

export default function TilePanel({ mapState, history }) {
  const [tilePath, setTilePath] = useState('art\\tiles\\EDG5000.frm');
  const [, forceUpdate] = useState(0);
  const [tileBrushError, setTileBrushError] = useState(false);
  const [buttonStates, setButtonStates] = useState({});

  // Re-render when mapState or history changes
  useEffect(() => {
    if (!mapState) return;
    const unsubs = [];
    unsubs.push(mapState.subscribe(() => forceUpdate(n => n + 1)));
    if (history) unsubs.push(history.subscribe(() => forceUpdate(n => n + 1)));
    return () => unsubs.forEach(fn => fn());
  }, [mapState, history]);

  const activeTool = mapState?.activeTool || 'select';
  const activeLayer = mapState?.activeLayer || 'tiles';

  const setTool = useCallback((tool) => {
    // Clear previous error
    setTileBrushError(false);
    
    // Check if tile tool is selected without valid tile
    if (tool === 'tile' && (!tilePath || tilePath.trim() === '')) {
      setTileBrushError(true);
      logger.error('Please select a tile before using the tile brush');
      return;
    }
    
    // Set button animation state
    setButtonStates(prev => ({ ...prev, [tool]: 'active' }));
    setTimeout(() => {
      setButtonStates(prev => ({ ...prev, [tool]: 'base' }));
    }, 200);
    
    mapState.setActiveTool(tool);
    if (tool === 'tile') mapState.setTileBrush(tilePath);
  }, [mapState, tilePath]);

  const handlePathChange = useCallback((e) => {
    const val = e.target.value;
    setTilePath(val);
    if (mapState.activeTool === 'tile') {
      mapState.setTileBrush(val);
    }
  }, [mapState]);

  const handleCategoryClick = useCallback((prefix) => {
    const path = prefix + '5000.frm';
    setTilePath(path);
    
    // Clear error when a valid tile is selected
    setTileBrushError(false);
    
    // Set button animation state
    setButtonStates(prev => ({ ...prev, [prefix]: 'active' }));
    setTimeout(() => {
      setButtonStates(prev => ({ ...prev, [prefix]: 'base' }));
    }, 200);
    
    mapState.setActiveTool('tile');
    mapState.setTileBrush(path);
    
    logger.info(`Selected tile category: ${prefix}`);
  }, [mapState]);

  const tileCount = mapState?.tiles?.length || 0;
  const objCount = mapState?.objects?.length || 0;

  return (
    <div style={styles.panel}>
      {/* ── Tools ── */}
      <div style={styles.header}>Tools</div>
      <div style={styles.toolRow}>
        {['select', 'tile', 'erase'].map((t) => (
          <button
            key={t}
            style={{
              ...(activeTool === t ? styles.toolBtnActive : styles.toolBtn),
              ...(tileBrushError && t === 'tile' && styles.toolBtnError),
              ...withButtonAnimation({}, buttonStates[t] || 'base')
            }}
            onClick={() => setTool(t)}
            title={`${t} (${t === 'select' ? '1' : t === 'tile' ? '2' : '3'})`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Undo / Redo ── */}
      {history && (
        <div style={styles.toolRow}>
          <button
            style={history.canUndo ? styles.toolBtn : styles.toolBtnDisabled}
            onClick={() => history.undo()}
            disabled={!history.canUndo}
            title="Undo (Ctrl+Z)"
          >
            Undo ({history.undoCount})
          </button>
          <button
            style={history.canRedo ? styles.toolBtn : styles.toolBtnDisabled}
            onClick={() => history.redo()}
            disabled={!history.canRedo}
            title="Redo (Ctrl+Y)"
          >
            Redo ({history.redoCount})
          </button>
        </div>
      )}

      {/* ── Active Layer ── */}
      <div style={styles.header}>Layer Mode</div>
      <div style={styles.layerList}>
        {LAYERS.map((layer) => {
          const meta = LAYER_META[layer];
          const isActive = activeLayer === layer;
          const isVisible = mapState?.layerVisibility?.[layer] !== false;
          return (
            <div key={layer} style={styles.layerRow}>
              <button
                style={{
                  ...styles.layerBtn,
                  borderColor: isActive ? meta.color : '#333',
                  background: isActive ? meta.color + '22' : '#1a1a3e',
                  color: isActive ? meta.color : '#888',
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
                onClick={() => mapState.setActiveLayer(layer)}
                title={`Switch to ${meta.label} (Ctrl+click to toggle visibility)`}
              >
                {meta.label}
              </button>
              <button
                style={{
                  ...styles.visBtn,
                  color: isVisible ? meta.color : '#333',
                }}
                onClick={() => mapState.toggleLayerVisibility(layer)}
                title={`${isVisible ? 'Hide' : 'Show'} ${meta.label}`}
              >
                {isVisible ? '●' : '○'}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Tile Brush (shown when tile tool active) ── */}
      {activeTool === 'tile' && (
        <>
          <div style={{
            ...styles.header,
            ...(tileBrushError && styles.headerError)
          }}>Tile Brush</div>
          <div style={styles.section}>
            <input
              style={{
                ...styles.input,
                ...(tileBrushError && styles.inputError),
                ...withInputAnimation({}, tileBrushError ? 'error' : 'base')
              }}
              type="text"
              value={tilePath}
              onChange={handlePathChange}
              placeholder="art\tiles\EDG5000.frm"
              spellCheck={false}
            />
            {tileBrushError && (
              <div style={styles.errorMessage}>
                Please select a tile from Quick Tiles below
              </div>
            )}
          </div>
          <div style={styles.section}>
            <div style={styles.sectionLabel}>Quick Tiles</div>
            <div style={styles.catGrid}>
              {TILE_CATEGORIES.map((cat) => (
                <button
                  key={cat.prefix}
                  style={{
                    ...styles.catBtn,
                    ...withButtonAnimation({}, buttonStates[cat.prefix] || 'base')
                  }}
                  onClick={() => handleCategoryClick(cat.prefix)}
                  title={cat.prefix}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Stats ── */}
      <div style={styles.stats}>
        <div>Tiles: <b>{tileCount}</b></div>
        <div>Objects: <b>{objCount}</b></div>
      </div>

      {/* ── Hints ── */}
      <div style={styles.hints}>
        <div><b>1/2/3</b> — Select / Tile / Erase</div>
        <div><b>Ctrl+Z/Y</b> — Undo / Redo</div>
        <div><b>Click</b> — Place / Select</div>
        <div><b>Right-click</b> — Erase tile</div>
        <div><b>F10</b> — Toggle grid</div>
      </div>
    </div>
  );
}

const styles = {
  panel: {
    flex: 1,
    background: '#12122a',
    borderLeft: '1px solid #2a2a4a',
    display: 'flex',
    flexDirection: 'column',
    padding: '8px',
    gap: 6,
    overflowY: 'auto',
    fontFamily: 'sans-serif',
    fontSize: '0.8rem',
    color: '#ccc',
  },
  header: {
    fontWeight: 'bold',
    fontSize: '0.78rem',
    color: '#00ff88',
    letterSpacing: '0.08em',
    paddingBottom: 3,
    paddingTop: 2,
    borderBottom: '1px solid #2a2a4a',
    textTransform: 'uppercase',
  },
  toolRow: {
    display: 'flex',
    gap: 4,
  },
  toolBtn: {
    flex: 1,
    padding: '5px 0',
    background: '#1a1a3e',
    color: '#aaa',
    border: '1px solid #333',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.72rem',
  },
  toolBtnActive: {
    flex: 1,
    padding: '5px 0',
    background: '#00aa55',
    color: '#fff',
    border: '1px solid #00cc66',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.72rem',
    fontWeight: 'bold',
  },
  toolBtnError: {
    background: '#ff4444',
    color: '#fff',
    border: '1px solid #ff6666',
    animation: 'pulse 1s infinite',
  },
  headerError: {
    color: '#ff4444',
    animation: 'pulse 1s infinite',
  },
  inputError: {
    borderColor: '#ff4444',
    boxShadow: '0 0 0 1px rgba(255, 68, 68, 0.3)',
  },
  errorMessage: {
    color: '#ff4444',
    fontSize: '0.65rem',
    marginTop: '4px',
    padding: '2px 4px',
    background: 'rgba(255, 68, 68, 0.1)',
    borderRadius: '2px',
  },
  toolBtnDisabled: {
    flex: 1,
    padding: '5px 0',
    background: '#111',
    color: '#444',
    border: '1px solid #222',
    borderRadius: 4,
    cursor: 'default',
    fontSize: '0.72rem',
  },
  layerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  layerRow: {
    display: 'flex',
    gap: 3,
    alignItems: 'center',
  },
  layerBtn: {
    flex: 1,
    padding: '3px 6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#333',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: '0.7rem',
    textAlign: 'left',
  },
  visBtn: {
    width: 22,
    height: 22,
    background: 'none',
    border: '1px solid #222',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: '0.7rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  sectionLabel: {
    color: '#888',
    fontSize: '0.68rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    background: '#0a0a1a',
    color: '#e0e0e0',
    border: '1px solid #333',
    borderRadius: 4,
    padding: '4px 6px',
    fontSize: '0.72rem',
    fontFamily: 'monospace',
    outline: 'none',
  },
  catGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 3,
  },
  catBtn: {
    padding: '2px 5px',
    background: '#1a1a3e',
    color: '#aaa',
    border: '1px solid #2a2a4a',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: '0.65rem',
  },
  stats: {
    color: '#666',
    fontSize: '0.7rem',
    paddingTop: 4,
    borderTop: '1px solid #1a1a3a',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  hints: {
    color: '#444',
    fontSize: '0.62rem',
    lineHeight: 1.6,
    paddingTop: 4,
    borderTop: '1px solid #1a1a3a',
    marginTop: 'auto',
  },
};
