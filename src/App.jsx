import React, { useState, useEffect, useRef, useCallback } from 'react';
import HexGrid from './components/HexGrid.jsx';
import StatusBar from './components/StatusBar.jsx';
import SetupScreen from './components/SetupScreen.jsx';
import TilePanel from './components/TilePanel.jsx';
import ConsolePanel from './components/ConsolePanel.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import CategoryToolbar from './components/CategoryToolbar.jsx';
import { MapState } from './engine/MapState.js';
import { History } from './engine/History.js';
import { logger } from './engine/Logger.js';
import { FomapParser } from './serialization/FomapParser.js';
import { FomapSerializer } from './serialization/FomapSerializer.js';
import { loadConfig } from './engine/ProjectConfig.js';

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
  const [historyDocked, setHistoryDocked] = useState(true);
  const [historyVisible, setHistoryVisible] = useState(true);

  const ms = mapStateRef.current;
  const hist = historyRef.current;

  // Subscribe to mapState + history changes to re-render UI
  useEffect(() => {
    const unsubs = [
      ms.subscribe(() => forceUpdate(n => n + 1)),
      hist.subscribe(() => forceUpdate(n => n + 1)),
    ];
    return () => unsubs.forEach(fn => fn());
  }, [ms, hist]);

  // Log startup
  useEffect(() => {
    logger.info('ORION Mapper initialized.');
    logger.info('Use Ctrl+Z / Ctrl+Y for undo/redo.');
  }, []);

  // Global keyboard: Ctrl+Z, Ctrl+Y, Ctrl+S
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (hist.undo()) logger.info('Undo');
      }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        if (hist.redo()) logger.info('Redo');
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hist]);

  const handleLoad = useCallback(async () => {
    if (window.orionAPI) {
      const filePath = await window.orionAPI.openFileDialog();
      if (!filePath) return;
      const content = await window.orionAPI.readFile(filePath);
      const parsed = FomapParser.parse(content);
      ms.load(parsed);
      hist.clear();
      setFileName(filePath);
      logger.info(`Loaded: ${filePath}`);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.fomap';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const parsed = FomapParser.parse(ev.target.result);
        ms.load(parsed);
        hist.clear();
        setFileName(file.name);
        logger.info(`Loaded: ${file.name}`);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [ms, hist]);

  const handleSave = useCallback(async () => {
    const data = ms.toData();
    const content = FomapSerializer.serialize(data);
    const saveName = fileName || 'Untitled.fomap';

    if (window.orionAPI) {
      const filePath = await window.orionAPI.saveFileDialog();
      if (!filePath) return;
      await window.orionAPI.writeFile(filePath, content);
      setFileName(filePath);
      ms.markClean();
      logger.info(`Saved: ${filePath}`);
      return;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = saveName;
    a.click();
    URL.revokeObjectURL(url);
    ms.markClean();
    logger.info(`Saved: ${saveName}`);
  }, [ms, fileName]);

  const handleNew = useCallback(() => {
    ms.load({
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
    hist.clear();
    setFileName(null);
    logger.info('New map created (200x200).');
  }, [ms, hist]);

  // Title bar text
  const displayName = fileName || 'Untitled.fomap';
  const dirtyMark = ms.dirty ? ' *' : '';
  const activeTool = ms.activeTool || 'select';
  const cursor = TOOL_CURSORS[activeTool] || 'default';

  return (
    <div style={styles.root}>
      {/* ── Header toolbar ── */}
      <div style={styles.toolbar}>
        <span style={styles.title}>ORION</span>
        <span style={styles.divider}>|</span>
        <button style={styles.btn} onClick={handleNew}>New</button>
        <button style={styles.btn} onClick={handleLoad}>Open</button>
        <button style={styles.btn} onClick={handleSave}>Save</button>
        <span style={styles.divider}>|</span>
        <span style={styles.fileName}>
          {displayName}{dirtyMark}
        </span>
        <span style={styles.layerBadge}>
          Layer: {ms.activeLayer}
        </span>
        <button
          style={styles.btn}
          onClick={() => setHistoryVisible(v => !v)}
          title="Toggle History panel"
        >
          History
        </button>
      </div>

      {/* ── Category toolbar (OG mapper style) ── */}
      <CategoryToolbar mapState={ms} />

      {/* ── Main area: canvas + right panel ── */}
      <div style={styles.mainArea}>
        <div style={{ ...styles.canvasWrap, cursor }}>
          <HexGrid
            mapState={ms}
            history={hist}
            width={1200}
            height={600}
          />
        </div>
        <div style={styles.sidePanel}>
          <TilePanel mapState={ms} history={hist} />
          {historyVisible && historyDocked && (
            <HistoryPanel
              history={hist}
              docked={true}
              onToggleDock={() => setHistoryDocked(false)}
            />
          )}
        </div>
      </div>

      {/* ── Floating history panel ── */}
      {historyVisible && !historyDocked && (
        <HistoryPanel
          history={hist}
          docked={false}
          onToggleDock={() => setHistoryDocked(true)}
        />
      )}

      {/* ── Status bar ── */}
      <StatusBar mapState={ms} />

      {/* ── Console panel at bottom ── */}
      <ConsolePanel />
    </div>
  );
}

function App() {
  const savedConfig = loadConfig();
  const [configured, setConfigured] = useState(
    savedConfig.serverValid && savedConfig.clientValid
  );
  const [projectConfig, setProjectConfig] = useState(savedConfig);

  const handleConfigured = useCallback((config) => {
    setProjectConfig(config);
    setConfigured(true);
  }, []);

  if (!configured) {
    return <SetupScreen onConfigured={handleConfigured} />;
  }

  return <MapperView projectConfig={projectConfig} />;
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
  },
  canvasWrap: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#0a0a1a',
  },
  sidePanel: {
    width: 200,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflow: 'hidden',
  },
};

export default App;
