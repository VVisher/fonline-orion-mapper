import React from 'react';

/**
 * StatusBar - Displays current hex coordinates, selection info, tool, layer, and map stats.
 */
export default function StatusBar({ mapState }) {
  if (!mapState) return null;

  const hover = mapState.hoveredHex;
  const sel = mapState.selectedHex;
  const selCount = mapState.selectedObjects.length;
  const objCount = mapState.objects.length;
  const tileCount = mapState.tiles.length;
  const maxX = mapState.header.MaxHexX || 0;
  const maxY = mapState.header.MaxHexY || 0;
  const tool = mapState.activeTool || 'select';
  const layer = mapState.activeLayer || 'tiles';

  return (
    <div style={styles.bar}>
      <span style={styles.section}>
        <b>Hover:</b>{' '}
        {hover ? `(${hover.hx}, ${hover.hy})` : '—'}
      </span>
      <span style={styles.section}>
        <b>Sel:</b>{' '}
        {sel ? `(${sel.hx}, ${sel.hy})` : '—'}
      </span>
      <span style={styles.section}>
        <b>Tool:</b> {tool}
      </span>
      <span style={styles.section}>
        <b>Layer:</b> {layer}
      </span>
      <span style={styles.section}>
        <b>Obj:</b> {selCount > 0 ? `${selCount}sel/` : ''}{objCount}
      </span>
      <span style={styles.section}>
        <b>Tiles:</b> {tileCount}
      </span>
      <span style={styles.section}>
        <b>Map:</b> {maxX}×{maxY}
      </span>
      <span style={styles.hint}>
        Scroll=Zoom | Shift+Drag/WASD=Pan | F10=Grid | 1/2/3=Tools
      </span>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.2rem',
    padding: '0.4rem 1rem',
    background: '#16213e',
    color: '#e0e0e0',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    borderTop: '1px solid #333',
    flexWrap: 'wrap',
  },
  section: {
    whiteSpace: 'nowrap',
  },
  hint: {
    marginLeft: 'auto',
    color: '#888',
    fontSize: '0.75rem',
  },
};
