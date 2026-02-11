import React, { useState, useEffect, useRef, useCallback } from 'react';
import HexGrid from './components/HexGrid.jsx';
import StatusBar from './components/StatusBar.jsx';
import SetupScreen from './components/SetupScreen.jsx';
import TilePanel from './components/TilePanel.jsx';
import ConsolePanel from './components/ConsolePanel.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import EntityReactorWindow from "./components/EntityReactor/EntityReactorWindow.jsx";
import LagMonitorBaseWindow from './components/LagMonitorBaseWindow.jsx';
import CategoryToolbar from './components/CategoryToolbar.jsx';
import SelectionPreviewEnhanced from './components/SelectionPreviewEnhanced.jsx';
import HelpWindow from './components/HelpWindow.jsx';
import PanelToolbar from './components/PanelToolbar.jsx';
import Nest from './ui/Nest.jsx';
import DockableWrapper from './ui/DockableWrapper.jsx';
import { WindowProvider } from './ui/WindowProvider.jsx';
import { MapState } from './engine/MapState.js';
import { History } from './engine/History.js';
import { logger } from './engine/Logger.js';
import { FomapParser } from './serialization/FomapParser.js';
import { createFomapParser } from './serialization/StreamingFomapParser.js';
import { globalCSS } from './styles/GlobalStyles.jsx';
import { clearConfig } from './engine/ProjectConfig.js';
import { FomapSerializer } from './serialization/FomapSerializer.js';
import DatabaseManager from './database/DatabaseManager.js';

// Create a singleton instance
const databaseManagerInstance = new DatabaseManager();
import { loadConfig } from './engine/ProjectConfig.js';
import performanceMonitor from './utils/PerformanceMonitor.js';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('🚨 MapperView Error:', error?.toString() || 'Unknown error');
    console.error('🚨 Error Info:', errorInfo || 'No error info available');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: '#1a1a2e',
          color: '#ccc',
          fontFamily: 'monospace',
          borderRadius: '8px',
          margin: '20px',
          border: '1px solid #ff6b6b'
        }}>
          <h2 style={{ color: '#ff6b6b', marginBottom: '16px' }}>🚨 MapperView Error</h2>
          <p style={{ marginBottom: '12px' }}>An error occurred in the MapperView component:</p>
          <pre style={{
            background: '#0a0a1a',
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.8rem',
            color: '#ff6b6b'
          }}>
            {this.state.error ? this.state.error.toString() : 'Unknown error'}
          </pre>
          <details style={{ marginTop: '12px' }}>
            <summary style={{ cursor: 'pointer', color: '#88ccaa' }}>Component Stack</summary>
            <pre style={{
              background: '#0a0a1a',
              padding: '12px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.7rem',
              marginTop: '8px'
            }}>
              {this.state.errorInfo?.componentStack || 'No component stack available'}
            </pre>
          </details>
          <button
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#2a2a4a',
              border: '1px solid #3a3a6a',
              borderRadius: '4px',
              color: '#ccc',
              cursor: 'pointer'
            }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Cursor CSS per active tool
const TOOL_CURSORS = {
  select: 'default',
  tile:   'crosshair',
  erase:  'not-allowed',
};

function MapperView({ projectConfig }) {
  const mapStateRef = useRef(new MapState());
  const historyRef = useRef(new History(mapStateRef.current));
  const [, forceUpdate] = useState(0);
  const [fileName, setFileName] = useState(null);
  const [showEntityReactor, setShowEntityReactor] = useState(false); // Start hidden
  const [historyDocked, setHistoryDocked] = useState(true); // Docked by default
  const [lagMonitorDocked, setLagMonitorDocked] = useState(true); // Docked by default
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  const mapState = mapStateRef.current;
  const history = historyRef.current;
  
  // Initialize database
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await databaseManagerInstance.loadIndex();
        console.log('🗂️ FOnline database loaded successfully');
        
        // Get database stats
        const stats = databaseManagerInstance.getStats();
        console.log('📊 Database stats:', stats);
        
        // Log some sample data
        const creatures = databaseManagerInstance.getAllCreatures();
        const items = databaseManagerInstance.getAllItems();
        const objects = databaseManagerInstance.getAllObjects();
        
        console.log(`🎯 Loaded ${creatures.length} creatures, ${items.length} items, ${objects.length} objects`);
        
        // Show first few of each type
        if (creatures.length > 0) {
          console.log('🦎 Sample creatures:', creatures.slice(0, 3));
        }
        if (items.length > 0) {
          console.log('🎒 Sample items:', items.slice(0, 3));
        }
        if (objects.length > 0) {
          console.log('🗿️ Sample objects:', objects.slice(0, 3));
        }
        
      } catch (error) {
        console.error('❌ Failed to load FOnline database:', error);
        console.log('💡 Run the indexing system first to create fonline-index.json');
      }
    };
    
    initializeDatabase();
  }, []);

  // Subscribe to mapState + history changes to re-render UI
  useEffect(() => {
    const unsubs = [
      mapState.subscribe(() => forceUpdate(n => n + 1)),
      history.subscribe(() => forceUpdate(n => n + 1)),
    ];
    return () => unsubs.forEach(fn => fn());
  }, [mapState, history]);

  // Initialize with a default map if not already loaded
  useEffect(() => {
    if (!mapState.header || !mapState.header.MaxHexX) {
      mapState.load({
        header: {
          Version: 4,
          MaxHexX: 200,
          MaxHexY: 200,
          WorkHexX: 100,
          WorkHexY: 100,
          ScriptModule: '-',
          ScriptFunc: '-',
          NoLogOut: 0,
          Time: 0,
          DayTime: '300  600  1140 1380',
          DayColor0: '18  18  53 ',
          DayColor1: '128 128 128',
          DayColor2: '103 95  86 ',
          DayColor3: '51  40  29 ',
        },
        tiles: [],
        objects: [],
      });
      history.clear();
      logger.info('Default map created (200x200).');
    }
  }, [mapState, history]);

  // Log startup
  useEffect(() => {
    logger.info('ORION Mapper initialized.');
  }, []);

  const handleLoad = useCallback(async () => {
    const parser = createFomapParser();
    
    if (window.orionAPI) {
      const filePath = await window.orionAPI.openFileDialog();
      if (!filePath) return;
      
      try {
        logger.info('Loading map file...');
        
        // Start performance monitoring
        performanceMonitor.startMapLoadTimer(filePath);
        
        const content = await window.orionAPI.readFile(filePath);
        
        // Ensure we have the right format for the parser
        let parseData;
        if (typeof content === 'string') {
          // Text format - use original parser
          parseData = content;
        } else if (content instanceof ArrayBuffer) {
          // Binary format - use streaming parser
          parseData = content;
        } else {
          throw new Error(`Expected ArrayBuffer or string, got: ${typeof content}`);
        }
        
        // Use streaming parser with progress callback
        const parsed = await parser.parseFile(parseData, (progress) => {
          logger.info(`Loading progress: ${Math.round(progress * 100)}%`);
        });
        
        mapState.load(parsed);
        history.clear();
        setFileName(filePath);
        
        // End performance monitoring and log results
        performanceMonitor.endMapLoadTimer();
        
        // Enhanced debugging output
        console.log('🗺️ Map Load Complete:', filePath);
        console.log('⏱️ Load Time:', `${(performanceMonitor.stats.mapLoadTime / 1000).toFixed(2)}s`);
        console.log('📊 Map Statistics:');
        console.log('  - Dimensions:', `${parsed.header?.MaxHexX || 0}x${parsed.header?.MaxHexY || 0}`);
        console.log('  - Tiles parsed:', parsed.tiles?.length || 0);
        console.log('  - Objects parsed:', parsed.objects?.length || 0);
        
        // Object type breakdown
        if (parsed.objects && parsed.objects.length > 0) {
          const objectTypes = {};
          parsed.objects.forEach(obj => {
            const type = obj.MapObjType || 0;
            objectTypes[type] = (objectTypes[type] || 0) + 1;
          });
          console.log('  - Object types:', objectTypes);
          
          // Show first few objects for debugging
          console.log('  - Sample objects:', parsed.objects.slice(0, 5));
        }
        
        // Tile breakdown
        if (parsed.tiles && parsed.tiles.length > 0) {
          console.log('  - Sample tiles:', parsed.tiles.slice(0, 3));
        }
        
        logger.info(`Loaded: ${filePath}`);
      } catch (error) {
        logger.error(`Failed to load map: ${error.message}`);
      } finally {
        parser.destroy();
      }
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.fomap';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        logger.info(`Loading ${file.name}...`);
        
        // Start performance monitoring
        performanceMonitor.startMapLoadTimer(file.name);
        
        const reader = new FileReader();
        
        reader.onload = async (ev) => {
          try {
            // Use streaming parser with progress callback
            const parsed = await parser.parseFile(ev.target.result, (progress) => {
              logger.info(`Loading progress: ${Math.round(progress * 100)}%`);
            });
            
            mapState.load(parsed);
            history.clear();
            setFileName(file.name);
            
            // End performance monitoring and log results
            performanceMonitor.endMapLoadTimer();
            
            // Enhanced debugging output
            console.log('🗺️ Map Load Complete:', file.name);
            console.log('⏱️ Load Time:', `${(performanceMonitor.stats.mapLoadTime / 1000).toFixed(2)}s`);
            console.log('📊 Map Statistics:');
            console.log('  - Dimensions:', `${parsed.header?.MaxHexX || 0}x${parsed.header?.MaxHexY || 0}`);
            console.log('  - Tiles parsed:', parsed.tiles?.length || 0);
            console.log('  - Objects parsed:', parsed.objects?.length || 0);
            
            // Object type breakdown
            if (parsed.objects && parsed.objects.length > 0) {
              const objectTypes = {};
              parsed.objects.forEach(obj => {
                const type = obj.MapObjType || 0;
                objectTypes[type] = (objectTypes[type] || 0) + 1;
              });
              console.log('  - Object types:', objectTypes);
              
              // Show first few objects for debugging
              console.log('  - Sample objects:', parsed.objects.slice(0, 5));
            }
            
            // Tile breakdown
            if (parsed.tiles && parsed.tiles.length > 0) {
              console.log('  - Sample tiles:', parsed.tiles.slice(0, 3));
            }
            
            logger.info(`Loaded: ${file.name}`);
          } catch (error) {
            logger.error(`Failed to parse map: ${error.message}`);
          }
        };
        
        reader.readAsArrayBuffer(file);
      } catch (error) {
        logger.error(`Failed to load file: ${error.message}`);
      } finally {
        parser.destroy();
      }
    };
    input.click();
  }, [mapState, history]);

  const handleSave = useCallback(async () => {
    const data = mapState.toData();
    const content = FomapSerializer.serialize(data);
    const saveName = fileName || 'Untitled.fomap';

    if (window.orionAPI) {
      const filePath = await window.orionAPI.saveFileDialog();
      if (!filePath) return;
      await window.orionAPI.writeFile(filePath, content);
      setFileName(filePath);
      mapState.markClean();
      logger.info(`Saved: ${filePath}`);
    } else {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = saveName;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [mapState, fileName]);

  const handleNew = useCallback(() => {
    mapState.load({
      header: {
        Version: 4,
        MaxHexX: 200,
        MaxHexY: 200,
        WorkHexX: 100,
        WorkHexY: 100,
        ScriptModule: '-',
        ScriptFunc: '-',
        NoLogOut: 0,
        Time: 0,
        DayTime: '300  600  1140 1380',
        DayColor0: '18  18  53 ',
        DayColor1: '128 128 128',
        DayColor2: '103 95  86 ',
        DayColor3: '51  40  29 ',
      },
      tiles: [],
      objects: [],
    });
    history.clear();
    setFileName(null);
    logger.info('New map created.');
  }, [mapState, history]);

  // Handle entity reactor toggle
  const handleToggleEntityReactor = () => {
    setShowEntityReactor(!showEntityReactor);
  };

  // Handle history dock toggle
  const handleToggleHistoryDock = () => {
    setHistoryDocked(!historyDocked);
  };

  // Handle lag monitor dock toggle
  const handleToggleLagMonitorDock = () => {
    setLagMonitorDocked(!lagMonitorDocked);
  };

  // Title bar text
  const displayName = fileName || 'Untitled.fomap';
  const dirtyMark = mapState.dirty ? ' *' : '';
  const activeTool = mapState.activeTool || 'select';
  const cursor = TOOL_CURSORS[activeTool] || 'default';

  return (
    <div style={styles.root}>
      {/* ── Header toolbar ── */}
      <PanelToolbar 
        onNew={handleNew}
        onOpen={handleLoad}
        onSave={handleSave}
        fileName={fileName}
        mapState={mapState}
        onToggleEntityReactor={handleToggleEntityReactor}
      />

      {/* ── Category toolbar (OG mapper style) ── */}
      <CategoryToolbar mapState={mapState} />

      {/* ── Main area: left sidebar + canvas + right sidebar ── */}
      <div style={styles.mainArea}>
        {/* Left Sidebar */}
        <div style={{
          ...styles.leftSidebar,
          width: leftSidebarCollapsed ? 30 : 300,
        }}>
          {!leftSidebarCollapsed && (
            <Nest anchor="left-sidebar" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Lag Monitor in left sidebar */}
              {lagMonitorDocked && (
                <LagMonitorBaseWindow
                  mapState={mapState}
                  history={history}
                  docked={true}
                  onToggleDock={handleToggleLagMonitorDock}
                />
              )}
            </Nest>
          )}
          <button
            style={{
              ...styles.sidebarToggle,
              ...styles.leftSidebarToggle
            }}
            onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            title={leftSidebarCollapsed ? "Expand left sidebar" : "Collapse left sidebar"}
          >
            {leftSidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>
        
        {/* Canvas Area */}
        <div style={styles.canvasArea}>
          <div style={{ ...styles.canvasWrap, cursor }}>
            <HexGrid
              mapState={mapState}
              history={history}
              width={1200}
              height={600}
            />
          </div>
        </div>
        
        {/* Right Sidebar */}
        <div style={{
          ...styles.rightSidebar,
          width: rightSidebarCollapsed ? 30 : 200,
        }}>
          {!rightSidebarCollapsed && (
            <Nest anchor="right-sidebar" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <TilePanel mapState={mapState} history={history} />
              <SelectionPreviewEnhanced mapState={mapState} />
              
              {/* Docked panels */}
              {historyDocked && (
                <HistoryPanel
                  history={history}
                  docked={true}
                  onToggleDock={handleToggleHistoryDock}
                />
              )}
            </Nest>
          )}
          <button
            style={{
              ...styles.sidebarToggle,
              ...styles.rightSidebarToggle
            }}
            onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
            title={rightSidebarCollapsed ? "Expand right sidebar" : "Collapse right sidebar"}
          >
            {rightSidebarCollapsed ? '◀' : '▶'}
          </button>
        </div>
      </div>

      {/* ── Floating Panels (Birds) ── */}
      {showEntityReactor && (
        <EntityReactorWindow
          databaseManager={databaseManagerInstance}
          onProtoSelect={(proto) => {
            console.log('Selected proto:', proto);
            // TODO: Integrate with mapper selection system
          }}
          docked={false}
          onToggleDock={() => {}}
        />
      )}
      
      {!historyDocked && (
        <HistoryPanel
          history={history}
          docked={false}
          onToggleDock={handleToggleHistoryDock}
        />
      )}
      
      {!lagMonitorDocked && (
        <LagMonitorBaseWindow
          mapState={mapState}
          history={history}
          docked={false}
          onToggleDock={handleToggleLagMonitorDock}
        />
      )}

      {/* ── Status bar ── */}
      <StatusBar mapState={mapState} />

      {/* ── Console panel at bottom ── */}
      <ConsolePanel />
      
      {/* ── Help window (F1) ── */}
      <HelpWindow />
    </div>
  );
}

function App() {
  const savedConfig = loadConfig();
  // Force show setup screen for debugging
  const [configured, setConfigured] = useState(false); // Always start with setup screen
  const [projectConfig, setProjectConfig] = useState(savedConfig || {});

  // Inject global styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = globalCSS;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handleConfigured = useCallback((config) => {
    setProjectConfig(config);
    setConfigured(true);
  }, []);

  // Add keyboard shortcut to clear config (Ctrl+Shift+R)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        clearConfig();
        window.location.reload();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <WindowProvider>
      <ErrorBoundary>
        {!configured ? (
          <SetupScreen onConfigured={handleConfigured} />
        ) : (
          <MapperView projectConfig={projectConfig} />
        )}
      </ErrorBoundary>
    </WindowProvider>
  );
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0f0f23',
    color: '#e0e0e0',
    fontFamily: 'sans-serif',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.5rem 1rem',
    background: '#16213e',
    borderBottom: '1px solid #333',
  },
  title: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    color: '#00ff88',
    marginRight: '1rem',
    letterSpacing: '0.15em',
  },
  btn: {
    padding: '0.35rem 0.8rem',
    background: '#1a1a3e',
    color: '#e0e0e0',
    border: '1px solid #444',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  divider: {
    color: '#333',
    fontSize: '1rem',
    userSelect: 'none',
  },
  fileName: {
    color: '#888',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
  },
  layerBadge: {
    marginLeft: 'auto',
    color: '#44aaff',
    fontSize: '0.78rem',
    fontFamily: 'monospace',
    textTransform: 'capitalize',
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  leftSidebar: {
    width: 300,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflow: 'hidden',
    background: '#0a0a1a',
    borderRight: '1px solid #2a2a4a',
    position: 'relative',
    background: '#0a0a1a',
    overflow: 'hidden',
  },
  rightSidebar: {
    width: 200,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflow: 'hidden',
    background: '#0a0a1a',
    borderLeft: '1px solid #2a2a4a',
    position: 'relative',
  },
  canvasArea: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#0a0a1a',
    overflow: 'hidden',
    minWidth: 0,
  },
  floatingPanel: {
    position: 'fixed',
    right: 20,
    top: 80,
    width: 300,
    height: 400,
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a2e',
    border: '1px solid #3a3a6a',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    fontFamily: 'sans-serif',
    fontSize: '0.8rem',
    color: '#ccc',
    zIndex: 1000,
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#2a2a4a',
    borderBottom: '1px solid #3a3a6a',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  panelTitle: {
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  closeButton: {
    background: 'none',
    border: '1px solid #3a3a6a',
    color: '#ccc',
    borderRadius: '4px',
    padding: '2px 6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  dockedLagMonitor: {
    position: 'fixed',
    top: 10,
    left: 10,
    zIndex: 2000,
  },
  sidebarToggle: {
    background: 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#333',
    color: '#666',
    borderRadius: 3,
    padding: '1px 6px',
    cursor: 'pointer',
    fontSize: '0.65rem',
    position: 'absolute',
    top: '4px',
    zIndex: 10,
  },
  leftSidebarToggle: {
    right: '4px',
  },
  rightSidebarToggle: {
    left: '4px',
  },
};

export default App;
