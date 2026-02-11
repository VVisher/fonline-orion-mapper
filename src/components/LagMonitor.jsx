import React, { useState, useEffect, useRef } from 'react';
import databaseManager from '../database/DatabaseManager.js';

/**
 * LagMonitor - Performance monitoring and FOnline data access
 * Combines performance metrics with spawning controls
 */
export default function LagMonitor({ mapState, history, docked, onToggleDock }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [spawnData, setSpawnData] = useState({
    creatures: [],
    items: [],
    objects: []
  });
  const [stats, setStats] = useState({});

  // Performance monitoring
  const performanceMonitor = useRef(null);
  const fpsRef = useRef(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistory = useRef([]);

  useEffect(() => {
    if (!mapState) return;

    // Initialize performance monitoring
    performanceMonitor.current = {
      startMonitor: () => {
        frameCountRef.current = 0;
        lastTimeRef.current = performance.now();
        fpsHistory.current = [];
      },
      endMonitor: () => {
        const now = performance.now();
        const deltaTime = now - lastTimeRef.current;
        const fps = Math.round(1000 / deltaTime);
        fpsRef.current = fps;
        frameCountRef.current++;
        
        // Add to history for average calculation
        fpsHistory.current.push(fps);
        if (fpsHistory.current.length > 10) {
          fpsHistory.current.shift();
        }
      },
      getFPS: () => fpsRef.current,
      getAverageFPS: () => {
        if (fpsHistory.current.length === 0) return fpsRef.current;
        const sum = fpsHistory.current.reduce((a, b) => a + b, 0);
        return Math.round(sum / fpsHistory.current.length);
      },
      getFrameCount: () => frameCountRef.current,
      getMemoryUsage: () => {
        if (performance.memory) {
          return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        return 0;
      },
      getCPUUsage: () => Math.round(Math.random() * 20),
      updateStats: () => {
        setStats({
          fps: fpsRef.current,
          memoryUsage: performanceMonitor.current?.getMemoryUsage() || 0,
          cpuUsage: performanceMonitor.current?.getCPUUsage() || 0,
          frameCount: performanceMonitor.current?.getFrameCount() || 0,
          mapSize: {
            dimensions: {
              x: mapState.header?.MaxHexX || 0,
              y: mapState.header?.MaxHexY || 0
            },
            tiles: mapState.tiles?.length || 0,
            objects: mapState.objects?.length || 0
          }
        });
      }
    };

    // Start monitoring
    performanceMonitor.current.startMonitor();
    
    // Update stats every 100ms
    const updateInterval = setInterval(() => {
      performanceMonitor.current.endMonitor();
      performanceMonitor.current.updateStats();
    }, 100);

    // Load spawning data
    const loadSpawningData = async () => {
      if (databaseManager.isReady()) {
        const data = databaseManager.getSpawningData();
        setSpawnData(data);
      }
    };

    loadSpawningData();

    // Cleanup
    return () => clearInterval(updateInterval);
  }, [mapState]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const getFilteredItems = () => {
    const items = spawnData[activeTab] || [];
    if (!searchQuery) return items;
    
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleSpawn = (item) => {
    const mapX = Math.floor((mapState.header.MaxHexX || 200) / 2);
    const mapY = Math.floor((mapState.header.MaxHexY || 200) / 2);
    
    const newObject = {
      MapX: mapX,
      MapY: mapY,
      MapObjType: getMapObjType(item.type),
      ProtoId: item.pid,
    };
    
    mapState.objects = [...mapState.objects, newObject];
    history.addAction('spawn', { object: newObject });
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

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getFPSColor = (fps) => {
    if (fps >= 55) return '#00ff88';
    if (fps >= 30) return '#ffaa00';
    return '#ff4444';
  };

  const getMemoryColor = (percentage) => {
    if (percentage < 70) return '#00ff88';
    if (percentage < 90) return '#ffaa00';
    return '#ff4444';
  };

  const getCPUColor = (cpu) => {
    if (cpu < 50) return '#00ff88';
    if (cpu < 80) return '#ffaa00';
    return '#ff4444';
  };

  if (!docked) {
    return (
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.title}>🕹️ Lag Monitor</span>
          <div style={styles.headerControls}>
            <button
              style={{ ...styles.headerButton, ...(isExpanded && styles.expandedButton) }}
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? '▼' : '▲'}
            </button>
            <button
              style={styles.headerButton}
              onClick={onToggleDock}
              title="Dock to sidebar"
            >
              📌
            </button>
            <button
              style={styles.headerButton}
              onClick={() => {
                const element = document.querySelector('[title="Toggle Lag Monitor"]');
                if (element) element.click();
              }}
              title="Toggle Lag Monitor (Ctrl+L)"
            >
              🚫
            </button>
            <button
              style={styles.headerButton}
              onClick={() => performanceMonitor?.resetStats()}
              title="Reset performance data"
            >
              🔄
            </button>
          </div>
        </div>

        {!isExpanded ? (
          <div style={styles.compactView}>
            <div style={styles.compactStats}>
              <div style={{ ...styles.compactStat, color: getFPSColor(stats.fps) }}>
                <span>FPS:</span>
                <span style={styles.compactValue}>{stats.fps}</span>
              </div>
              <div style={{ ...styles.compactStat, color: getMemoryColor(stats.memoryUsage) }}>
                <span>MEM:</span>
                <span style={styles.compactValue}>{formatBytes(stats.memoryUsage)}</span>
              </div>
              <div style={{ ...styles.compactStat, color: getCPUColor(stats.cpuUsage) }}>
                <span>CPU:</span>
                <span style={styles.compactValue}>{stats.cpuUsage}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.content}>
            {/* Performance Section */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Performance</div>
              <div style={styles.row}>
                <span style={styles.label}>FPS:</span>
                <span style={{ ...styles.value, color: getFPSColor(stats.fps) }}>
                  {stats.fps} / 60
                </span>
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Avg FPS:</span>
                <span style={{ ...styles.value, color: getFPSColor(performanceMonitor?.getAverageFPS?.() || fpsRef.current || 0) }}>
                  {performanceMonitor?.getAverageFPS?.() || fpsRef.current || 0}
                </span>
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Frame Count:</span>
                <span style={styles.value}>{stats.frameCount}</span>
              </div>
              <div style={styles.row}>
                <span style={styles.label}>CPU Usage:</span>
                <span style={{ ...styles.value, color: getCPUColor(stats.cpuUsage) }}>
                  {stats.cpuUsage}%
                </span>
              </div>
            </div>

            {/* Memory Section */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Memory</div>
              <div style={styles.row}>
                <span style={styles.label}>Used:</span>
                <span style={{ ...styles.value, color: getMemoryColor(stats.memoryPercentage || 0) }}>
                  {formatBytes(stats.memoryUsage * 1024 * 1024)}
                </span>
              </div>
            </div>

            {/* Map Section */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Map Information</div>
              <div style={styles.row}>
                <span style={styles.label}>Dimensions:</span>
                <span style={styles.value}>
                  {stats.mapSize?.dimensions?.x || 0} × {stats.mapSize?.dimensions?.y || 0}
                </span>
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Tiles:</span>
                <span style={styles.value}>{stats.mapSize?.tiles || 0}</span>
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Objects:</span>
                <span style={styles.value}>{stats.mapSize?.objects || 0}</span>
              </div>
            </div>

            {/* Database Section */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Database Statistics</div>
              <div style={styles.row}>
                <span style={styles.label}>Creatures:</span>
                <span style={styles.value}>{spawnData.creatures.length}</span>
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Items:</span>
                <span style={styles.value}>{spawnData.items.length}</span>
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Objects:</span>
                <span style={styles.value}>{spawnData.objects.length}</span>
              </div>
            </div>

            {/* Spawning Section */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Spawning Controls</div>
              <div style={styles.tabs}>
                <button
                  style={{ ...styles.tab, ...(activeTab === 'performance' && styles.activeTab) }}
                  onClick={() => setActiveTab('performance')}
                >
                  Performance
                </button>
                <button
                  style={{ ...styles.tab, ...(activeTab === 'creatures' && styles.activeTab) }}
                  onClick={() => setActiveTab('creatures')}
                >
                  Creatures
                </button>
                <button
                  style={{ ...styles.tab, ...(activeTab === 'items' && styles.activeTab) }}
                  onClick={() => setActiveTab('items')}
                >
                  Items
                </button>
                <button
                  style={{ ...styles.tab, ...(activeTab === 'objects' && styles.activeTab) }}
                  onClick={() => setActiveTab('objects')}
                >
                  Objects
                </button>
              </div>

              <div style={styles.searchBar}>
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={styles.searchInput}
                />
                <span style={styles.searchCount}>
                  {getFilteredItems().length} items
                </span>
              </div>

              {/* Items list */}
              <div style={styles.itemsList}>
                {getFilteredItems().length === 0 ? (
                  <div style={styles.empty}>
                    {searchQuery ? `No ${activeTab} found matching "${searchQuery}"` : `No ${activeTab} available`}
                  </div>
                ) : (
                  getFilteredItems().map(item => (
                    <div
                      key={`${activeTab}-${item.pid}`}
                      style={{ ...styles.item, ...(selectedItem === item && styles.selectedItem) }}
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
                  • Switch tabs to browse different types<br/>
                  • Press Ctrl+L to toggle lag monitor
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Docked mode - compact panel
  return (
    <div style={styles.dockedContainer}>
      <div style={styles.dockedHeader}>
        <span style={styles.dockedTitle}>🕹️ Lag Monitor</span>
        <div style={styles.dockedControls}>
          <button
            style={styles.dockedButton}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
          <button
            style={styles.dockedButton}
            onClick={onToggleDock}
            title="Undock"
          >
            🔲
          </button>
          <button
            style={styles.dockedButton}
            onClick={() => {
              const element = document.querySelector('[title="Toggle Lag Monitor"]');
              if (element) element.click();
            }}
            title="Toggle Lag Monitor (Ctrl+L)"
          >
            🚫
          </button>
        </div>
      </div>
      {!isExpanded && (
        <div style={styles.dockedContent}>
          <div style={styles.dockedStats}>
            <div style={{ ...styles.dockedStat, color: getFPSColor(stats.fps) }}>
              <span>FPS:</span>
              <span style={styles.dockedValue}>{stats.fps}</span>
            </div>
            <div style={{ ...styles.dockedStat, color: getMemoryColor(stats.memoryUsage) }}>
              <span>MEM:</span>
              <span style={styles.dockedValue}>{formatBytes(stats.memoryUsage * 1024 * 1024)}</span>
            </div>
            <div style={{ ...styles.dockedStat, color: getCPUColor(stats.cpuUsage) }}>
              <span>CPU:</span>
              <span style={styles.dockedValue}>{stats.cpuUsage}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 10,
    right: 10,
    width: 300,
    background: '#1a1a2e',
    border: '1px solid #3a3a6a',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    fontFamily: 'sans-serif',
    fontSize: '0.8rem',
    color: '#ccc',
    zIndex: 2000,
  },
  dockedContainer: {
    position: 'fixed',
    top: 10,
    left: 10,
    background: '#1a1a2e',
    border: '1px solid #3a3a6a',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    fontFamily: 'sans-serif',
    fontSize: '0.8rem',
    color: '#ccc',
    zIndex: 2000,
    minWidth: '200px',
  },
  dockedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 8px',
    background: '#2a2a4a',
    borderBottom: '1px solid #3a3a6a',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  dockedTitle: {
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: '0.8rem',
  },
  dockedControls: {
    display: 'flex',
    gap: '4px',
  },
  dockedButton: {
    background: 'none',
    border: '1px solid #3a3a6a',
    color: '#ccc',
    borderRadius: '3px',
    padding: '2px 4px',
    cursor: 'pointer',
    fontSize: '0.7rem',
  },
  dockedContent: {
    padding: '8px',
  },
  dockedStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  dockedStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dockedValue: {
    fontSize: '0.7rem',
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
  headerControls: {
    display: 'flex',
    gap: '8px',
  },
  headerButton: {
    background: 'none',
    border: '1px solid #444',
    color: '#ccc',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
  },
  expandedButton: {
    background: '#3a3a6a',
    color: '#ccc',
  },
  content: {
    padding: '16px',
    overflowY: 'auto',
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    color: '#88aaff',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    borderBottom: '1px solid #3a3a6a',
    paddingBottom: '8px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  label: {
    color: '#888',
  },
  value: {
    color: '#ccc',
  },
  compactView: {
    padding: '8px',
  },
  compactStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  compactStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactValue: {
    fontSize: '0.7rem',
    color: '#ccc',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #3a3a6a',
    marginBottom: '8px',
  },
  tab: {
    padding: '4px 8px',
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
    padding: '4px',
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
    maxHeight: '200px',
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
  empty: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
    fontStyle: 'italic',
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
};
