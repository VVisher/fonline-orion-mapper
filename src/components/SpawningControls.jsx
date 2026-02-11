import React, { useState, useEffect } from 'react';
import databaseManager from '../database/DatabaseManager.js';

/**
 * SpawningControls - Panel for spawning creatures, items, and objects
 * Provides search and selection interface for indexed FOnline data
 */

export default function SpawningControls({ mapState, history }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('creatures');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [spawnData, setSpawnData] = useState({
    creatures: [],
    items: [],
    objects: []
  });

  useEffect(() => {
    const loadDatabase = async () => {
      const loaded = await databaseManager.loadIndex();
      if (loaded) {
        const data = databaseManager.getSpawningData();
        setSpawnData(data);
        setIsLoaded(true);
      }
    };

    loadDatabase();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const getFilteredItems = () => {
    if (!isLoaded) return [];
    
    const items = spawnData[activeTab] || [];
    if (!searchQuery) return items;
    
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleSpawn = (item) => {
    // Spawn the selected item at current map position
    const mapX = Math.floor((mapState.header.MaxHexX || 200) / 2);
    const mapY = Math.floor((mapState.header.MaxHexY || 200) / 2);
    
    const newObject = {
      MapX: mapX,
      MapY: mapY,
      MapObjType: getMapObjType(item.type),
      ProtoId: item.pid,
      // Add other necessary properties
    };
    
    // Add to map state
    mapState.objects = [...mapState.objects, newObject];
    
    // Add to history
    history.addAction('spawn', { object: newObject });
    
    // Force re-render
    mapState._notify();
    
    console.log(`🎯 Spawned ${item.type} "${item.name}" at (${mapX}, ${mapY})`);
  };

  const getMapObjType = (type) => {
    switch (type) {
      case 'creature': return 0;
      case 'item': return 1;
      case 'object': return 2;
      default: return 2;
    }
  };

  if (!isLoaded) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>🎯 Spawning Controls</span>
        </div>
        <div style={styles.loading}>
          Loading FOnline database...
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>🎯 Spawning Controls</span>
        <span style={styles.stats}>
          C: {spawnData.creatures.length} | I: {spawnData.items.length} | O: {spawnData.objects.length}
        </span>
      </div>

      {/* Tab buttons */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'creatures' && styles.activeTab)
          }}
          onClick={() => setActiveTab('creatures')}
        >
          Creatures
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'items' && styles.activeTab)
          }}
          onClick={() => setActiveTab('items')}
        >
          Items
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'objects' && styles.activeTab)
          }}
          onClick={() => setActiveTab('objects')}
        >
          Objects
        </button>
      </div>

      {/* Search bar */}
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={styles.searchInput}
        />
        <span style={styles.searchCount}>
          {filteredItems.length} items
        </span>
      </div>

      {/* Items list */}
      <div style={styles.itemsList}>
        {filteredItems.length === 0 ? (
          <div style={styles.empty}>
            {searchQuery ? `No ${activeTab} found matching "${searchQuery}"` : `No ${activeTab} available`}
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={`${activeTab}-${item.pid}`}
              style={{
                ...styles.item,
                ...(selectedItem === item && styles.selectedItem)
              }}
              onClick={() => setSelectedItem(item)}
              onDoubleClick={() => handleSpawn(item)}
            >
              <div style={styles.itemHeader}>
                <span style={styles.itemPid}>PID: {item.pid}</span>
                <span style={styles.itemType}>{item.type}</span>
              </div>
              <div style={styles.itemName}>{item.name}</div>
              {item.description && (
                <div style={styles.itemDescription}>{item.description}</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Selected item details */}
      {selectedItem && (
        <div style={styles.details}>
          <div style={styles.detailsHeader}>
            <span style={styles.detailsTitle}>Selected: {selectedItem.name}</span>
            <button
              style={styles.spawnButton}
              onClick={() => handleSpawn(selectedItem)}
            >
              🎯 Spawn
            </button>
          </div>
          <div style={styles.detailsContent}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>PID:</span>
              <span style={styles.detailValue}>{selectedItem.pid}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Type:</span>
              <span style={styles.detailValue}>{selectedItem.type}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Name:</span>
              <span style={styles.detailValue}>{selectedItem.name}</span>
            </div>
            {selectedItem.description && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Description:</span>
                <span style={styles.detailValue}>{selectedItem.description}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={styles.instructions}>
        <div style={styles.instructionsTitle}>Instructions:</div>
        <div style={styles.instructionsText}>
          • Click item to select<br/>
          • Double-click or click "Spawn" to place at map center<br/>
          • Use search to filter items<br/>
          • Switch tabs to browse different types
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1a1a2e',
    border: '1px solid #3a3a6a',
    fontFamily: 'sans-serif',
    fontSize: '0.8rem',
    color: '#ccc',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#2a2a4a',
    borderBottom: '1px solid #3a3a6a',
  },
  title: {
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  stats: {
    color: '#88ccaa',
    fontSize: '0.7rem',
    fontFamily: 'monospace',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #3a3a6a',
  },
  tab: {
    padding: '6px 12px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  activeTab: {
    color: '#00ff88',
    borderBottomColor: '#00ff88',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid #3a3a6a',
    gap: '8px',
  },
  searchInput: {
    flex: 1,
    background: '#0a0a1a',
    border: '1px solid #3a3a6a',
    borderRadius: '4px',
    padding: '4px 8px',
    color: '#ccc',
    fontSize: '0.8rem',
  },
  searchCount: {
    color: '#666',
    fontSize: '0.7rem',
    fontFamily: 'monospace',
  },
  itemsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  },
  item: {
    padding: '8px',
    marginBottom: '4px',
    background: '#2a2a4a',
    border: '1px solid #3a3a6a',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  selectedItem: {
    background: '#3a3a6a',
    borderColor: '#00ff88',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  itemPid: {
    color: '#66aaff',
    fontSize: '0.7rem',
    fontFamily: 'monospace',
  },
  itemType: {
    color: '#ffaa00',
    fontSize: '0.7rem',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  itemName: {
    color: '#ccc',
    fontWeight: 'bold',
    marginBottom: '2px',
  },
  itemDescription: {
    color: '#888',
    fontSize: '0.7rem',
    fontStyle: 'italic',
  },
  empty: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
    fontStyle: 'italic',
  },
  details: {
    borderTop: '1px solid #3a3a6a',
    padding: '12px',
    background: '#252545',
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  detailsTitle: {
    color: '#00ff88',
    fontWeight: 'bold',
  },
  spawnButton: {
    padding: '4px 8px',
    background: '#00ff88',
    border: '1px solid #00ff88',
    borderRadius: '4px',
    color: '#000',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  detailsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#88ccaa',
    fontWeight: 'bold',
  },
  detailValue: {
    color: '#ccc',
  },
  instructions: {
    borderTop: '1px solid #3a3a6a',
    padding: '12px',
    background: '#252545',
  },
  instructionsTitle: {
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  instructionsText: {
    color: '#aaa',
    fontSize: '0.7rem',
    lineHeight: '1.4',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    color: '#666',
  },
};
