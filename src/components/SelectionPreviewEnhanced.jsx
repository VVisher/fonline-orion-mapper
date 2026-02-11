/**
 * SelectionPreviewEnhanced - Advanced selection preview with entity-specific views
 * Shows different preview types based on selected entity class
 */

import React, { useState, useEffect } from 'react';
import BaseWindow from '../ui/BaseWindow';

export default function SelectionPreviewEnhanced({ mapState, docked = false, onToggleDock = () => {} }) {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [viewMode, setViewMode] = useState('inv'); // 'inv' or 'item' for items/scenery
  const [entityType, setEntityType] = useState('none'); // 'item', 'scenery', 'critter', 'tile', 'none'

  useEffect(() => {
    if (!mapState) return;

    // Get selected entity from mapState
    const updateSelection = () => {
      const selection = mapState.getSelectedEntity();
      if (selection) {
        setSelectedEntity(selection);
        
        // Determine entity type based on MapObjType or other properties
        if (selection.MapObjType === 1) {
          setEntityType('critter');
        } else if (selection.MapObjType === 2) {
          setEntityType('item');
        } else if (selection.MapObjType === 3) {
          setEntityType('scenery');
        } else if (selection.isTile) {
          setEntityType('tile');
        } else {
          setEntityType('unknown');
        }
      } else {
        setSelectedEntity(null);
        setEntityType('none');
      }
    };

    updateSelection();
    
    // Subscribe to mapState changes
    const unsub = mapState.subscribe(updateSelection);
    return unsub;
  }, [mapState]);

  const getEntityStats = () => {
    if (!selectedEntity) return null;

    const stats = {
      protoId: selectedEntity.protoId || 'N/A',
      position: `(${selectedEntity.x || 0}, ${selectedEntity.y || 0})`,
      type: entityType,
    };

    // Add type-specific stats
    switch (entityType) {
      case 'item':
      case 'scenery':
        stats.canPickup = selectedEntity.MapObjType === 2 ? 'Yes' : 'No';
        stats.hasInv = selectedEntity.hasInv || 'Unknown';
        stats.weight = selectedEntity.weight || 'Unknown';
        stats.value = selectedEntity.cost || 'Unknown';
        break;
      
      case 'critter':
        stats.health = selectedEntity.health || 'Unknown';
        stats.level = selectedEntity.level || 'Unknown';
        stats.team = selectedEntity.team || 'Unknown';
        stats.ai = selectedEntity.ai || 'Unknown';
        break;
      
      case 'tile':
        stats.terrain = selectedEntity.terrain || 'Unknown';
        stats.passable = selectedEntity.passable !== false ? 'Yes' : 'No';
        stats.roof = selectedEntity.roof || 'No';
        break;
    }

    return stats;
  };

  const stats = getEntityStats();

  const renderPreview = () => {
    if (!selectedEntity) {
      return (
        <div style={styles.noSelection}>
          <div style={styles.noSelectionIcon}>🎯</div>
          <div style={styles.noSelectionText}>No entity selected</div>
          <div style={styles.noSelectionSubtext}>Click on the map to select an entity</div>
        </div>
      );
    }

    // Render based on entity type
    switch (entityType) {
      case 'item':
      case 'scenery':
        return renderItemPreview();
      
      case 'critter':
        return renderCritterPreview();
      
      case 'tile':
        return renderTilePreview();
      
      default:
        return renderUnknownPreview();
    }
  };

  const renderItemPreview = () => {
    return (
      <div style={styles.previewContainer}>
        {/* View Mode Toggle */}
        <div style={styles.viewToggle}>
          <button
            style={{
              ...styles.viewButton,
              ...(viewMode === 'inv' && styles.activeViewButton)
            }}
            onClick={() => setViewMode('inv')}
          >
            Inv View
          </button>
          <button
            style={{
              ...styles.viewButton,
              ...(viewMode === 'item' && styles.activeViewButton)
            }}
            onClick={() => setViewMode('item')}
          >
            Item View
          </button>
        </div>

        {/* Preview Image */}
        <div style={styles.imageContainer}>
          <div style={styles.previewImage}>
            <div style={styles.imagePlaceholder}>
              {viewMode === 'inv' ? '📦' : '🎒'}
              <div style={styles.imageLabel}>
                {viewMode === 'inv' ? 'Inventory Image' : 'Ground Image'}
              </div>
            </div>
          </div>
        </div>

        {/* Entity Stats */}
        <div style={styles.statsContainer}>
          <div style={styles.statsHeader}>Entity Information</div>
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} style={styles.statRow}>
              <span style={styles.statLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}:
              </span>
              <span style={styles.statValue}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCritterPreview = () => {
    return (
      <div style={styles.previewContainer}>
        {/* Critter Preview */}
        <div style={styles.imageContainer}>
          <div style={styles.previewImage}>
            <div style={styles.imagePlaceholder}>
              🦎
              <div style={styles.imageLabel}>Critter Sprite</div>
            </div>
          </div>
        </div>

        {/* Critter Stats */}
        <div style={styles.statsContainer}>
          <div style={styles.statsHeader}>Critter Information</div>
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} style={styles.statRow}>
              <span style={styles.statLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}:
              </span>
              <span style={styles.statValue}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTilePreview = () => {
    return (
      <div style={styles.previewContainer}>
        {/* Tile Preview */}
        <div style={styles.imageContainer}>
          <div style={styles.previewImage}>
            <div style={styles.imagePlaceholder}>
              🗺️
              <div style={styles.imageLabel}>Tile Texture</div>
            </div>
          </div>
        </div>

        {/* Tile Stats */}
        <div style={styles.statsContainer}>
          <div style={styles.statsHeader}>Tile Information</div>
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} style={styles.statRow}>
              <span style={styles.statLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}:
              </span>
              <span style={styles.statValue}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUnknownPreview = () => {
    return (
      <div style={styles.previewContainer}>
        <div style={styles.imageContainer}>
          <div style={styles.previewImage}>
            <div style={styles.imagePlaceholder}>
              ❓
              <div style={styles.imageLabel}>Unknown Entity</div>
            </div>
          </div>
        </div>

        <div style={styles.statsContainer}>
          <div style={styles.statsHeader}>Entity Information</div>
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} style={styles.statRow}>
              <span style={styles.statLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}:
              </span>
              <span style={styles.statValue}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const countText = selectedEntity ? `ID: ${stats.protoId}` : 'No Selection';

  return (
    <BaseWindow
      title="Selection Preview"
      docked={docked}
      onToggleDock={onToggleDock}
      count={countText}
      defaultSize={{ width: 280, height: 400 }}
      defaultPosition={{ x: 750, y: 50 }}
    >
      {renderPreview()}
    </BaseWindow>
  );
}

const styles = {
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '8px',
  },
  noSelection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
    textAlign: 'center',
  },
  noSelectionIcon: {
    fontSize: '3rem',
    marginBottom: '8px',
    opacity: 0.5,
  },
  noSelectionText: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  noSelectionSubtext: {
    fontSize: '0.7rem',
    opacity: 0.7,
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
    marginBottom: '8px',
    padding: '4px',
    background: '#1a1a3e',
    borderRadius: '4px',
  },
  viewButton: {
    flex: 1,
    padding: '4px 8px',
    background: 'none',
    border: '1px solid #333',
    borderRadius: '3px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '0.7rem',
  },
  activeViewButton: {
    background: '#2a2a4a',
    color: '#00ff88',
    borderColor: '#4a4a6a',
  },
  imageContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  previewImage: {
    width: '120px',
    height: '120px',
    background: '#1a1a3e',
    border: '1px solid #333',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#666',
  },
  imageLabel: {
    fontSize: '0.6rem',
    marginTop: '4px',
  },
  statsContainer: {
    flex: 1,
    overflowY: 'auto',
  },
  statsHeader: {
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    marginBottom: '8px',
    paddingBottom: '4px',
    borderBottom: '1px solid #2a2a4a',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0',
    fontSize: '0.7rem',
  },
  statLabel: {
    color: '#88ccaa',
    fontWeight: 'bold',
  },
  statValue: {
    color: '#ccc',
  },
};
