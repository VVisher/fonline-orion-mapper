import React, { useState, useEffect } from 'react';
import { LAYERS } from '../engine/MapState.js';

/**
 * CategoryToolbar — OG FOnline mapper-style category buttons.
 *
 * Mirrors the original mapper's bottom toolbar: Arm, Drg, Wpn, Amm, Misc, etc.
 * Each button sets the active layer and/or opens a category picker for placing objects.
 *
 * Props:
 *   mapState — MapState instance
 */

// Category definitions matching the OG mapper layout
// group: which layer this category belongs to
// label: short button label
// description: tooltip
const CATEGORIES = [
  { id: 'arm',   label: 'Arm',   group: 'items',    description: 'Armor' },
  { id: 'drg',   label: 'Drg',   group: 'items',    description: 'Drugs & Chems' },
  { id: 'wpn',   label: 'Wpn',   group: 'items',    description: 'Weapons' },
  { id: 'amm',   label: 'Amm',   group: 'items',    description: 'Ammo' },
  { id: 'misc',  label: 'Misc',  group: 'items',    description: 'Misc Items' },
  { id: 'misc2', label: 'Misc2', group: 'items',    description: 'Misc Items 2' },
  { id: 'key',   label: 'Key',   group: 'items',    description: 'Keys & Containers' },
  { id: 'sep1',  label: '|',     group: null,        description: '' },
  { id: 'wall',  label: 'Wall',  group: 'scenery',  description: 'Walls' },
  { id: 'scen',  label: 'Scen',  group: 'scenery',  description: 'Scenery Objects' },
  { id: 'door',  label: 'Door',  group: 'doors',    description: 'Doors' },
  { id: 'grid',  label: 'Grid',  group: 'blockers', description: 'Grid Blockers' },
  { id: 'sep2',  label: '|',     group: null,        description: '' },
  { id: 'tile',  label: 'Tile',  group: 'tiles',    description: 'Floor Tiles' },
  { id: 'roof',  label: 'Roof',  group: 'roofs',    description: 'Roof Tiles' },
  { id: 'sep3',  label: '|',     group: null,        description: '' },
  { id: 'crit',  label: 'Crit',  group: 'critters', description: 'Critters / NPCs' },
  { id: 'sep4',  label: '|',     group: null,        description: '' },
  { id: 'fast',  label: 'Fast',  group: null,        description: 'Fast travel points' },
  { id: 'ign',   label: 'Ign',   group: null,        description: 'Ignore list' },
  { id: 'inv',   label: 'Inv',   group: null,        description: 'Inventory view' },
  { id: 'bag',   label: 'Bag',   group: null,        description: 'Bag / Container view' },
  { id: 'map',   label: 'Map',   group: null,        description: 'Map properties' },
];

export default function CategoryToolbar({ mapState }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!mapState) return;
    return mapState.subscribe(() => forceUpdate(n => n + 1));
  }, [mapState]);

  const activeLayer = mapState?.activeLayer || 'tiles';

  const handleClick = (cat) => {
    if (!cat.group) return; // separator or non-layer button (future functionality)
    setActiveCategory(cat.id);
    if (mapState && cat.group) {
      mapState.setActiveLayer(cat.group);
    }
  };

  return (
    <div style={styles.bar}>
      {CATEGORIES.map((cat) => {
        if (cat.label === '|') {
          return <span key={cat.id} style={styles.sep}>|</span>;
        }

        const isActive = cat.group && cat.group === activeLayer;
        const isSelected = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            style={{
              ...styles.btn,
              ...(isActive ? styles.btnActive : {}),
              ...(isSelected ? styles.btnSelected : {}),
            }}
            onClick={() => handleClick(cat)}
            title={cat.description}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    padding: '2px 8px',
    background: '#111128',
    borderBottom: '1px solid #2a2a4a',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  btn: {
    padding: '3px 6px',
    background: '#1a1a3e',
    color: '#888',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#2a2a4a',
    borderRadius: 2,
    cursor: 'pointer',
    fontSize: '0.68rem',
    fontFamily: 'monospace',
    fontWeight: 'normal',
    lineHeight: 1,
    minWidth: 30,
    textAlign: 'center',
  },
  btnActive: {
    background: '#1a2a4e',
    color: '#44aaff',
    borderColor: '#44aaff44',
  },
  btnSelected: {
    background: '#00aa5533',
    color: '#00ff88',
    borderColor: '#00ff88',
    fontWeight: 'bold',
  },
  sep: {
    color: '#2a2a4a',
    fontSize: '0.8rem',
    padding: '0 2px',
    userSelect: 'none',
  },
};
