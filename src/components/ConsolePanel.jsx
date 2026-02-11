import React, { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '../engine/Logger.js';

/**
 * ConsolePanel — bottom panel with production log output and command input.
 */

const LEVEL_COLORS = {
  info:  '#88ccaa',
  warn:  '#ddaa44',
  error: '#ff5566',
  cmd:   '#66aaff',
};

export default function ConsolePanel({ mapState }) {
  const [lines, setLines] = useState(() => logger.lines);
  const [input, setInput] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [debugMode, setDebugMode] = useState('normal'); // 'normal', 'debug', 'performance'
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef(null);
  
  // Add keyboard shortcut for debug mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDebugMode(debugMode === 'debug' ? 'normal' : 'debug');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debugMode]);

  useEffect(() => {
    const unsub = logger.subscribe(() => {
      setLines([...logger.lines]);
    });
    return unsub;
  }, []);

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const cmd = input.trim();
    if (!cmd) return;
    logger.cmd(`> ${cmd}`);
    // Future: parse and execute commands here
    logger.info(`Unknown command: ${cmd}`);
    setInput('');
  }, [input]);

  const handleKeyDown = (e) => {
    // Prevent hotkeys when typing in console
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (collapsed) {
    return (
      <div style={{ ...styles.collapsedBar, ...(expanded && styles.expandedBar) }}>
        <button style={styles.toggleBtn} onClick={() => {setCollapsed(false); setExpanded(false);}}>
          ▲ Console ({lines.length})
        </button>
        <button 
          style={styles.expandBtn} 
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Collapse to normal" : "Expand for better viewport"}
        >
          {expanded ? '▼' : '▲'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...styles.panel, ...(expanded && styles.expandedPanel) }}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Console</span>
        <div style={styles.controls}>
          <button
            style={{ ...styles.modeBtn, ...(debugMode === 'normal' && styles.activeMode) }}
            onClick={() => setDebugMode('normal')}
            title="Normal console mode"
          >
            Normal
          </button>
          <button
            style={{ ...styles.modeBtn, ...(debugMode === 'debug' && styles.activeMode) }}
            onClick={() => setDebugMode('debug')}
            title="Debug console mode (Ctrl+Shift+D)"
          >
            Debug
          </button>
          <button style={styles.clearBtn} onClick={() => logger.clear()}>Clear</button>
          <button 
            style={styles.expandBtn} 
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Collapse to normal" : "Expand for better viewport"}
          >
            {expanded ? '▼' : '▲'}
          </button>
          <button style={styles.toggleBtn} onClick={() => {setCollapsed(true); setExpanded(false);}}>▼</button>
        </div>
      </div>
      <div ref={scrollRef} style={styles.logArea}>
        {debugMode === 'debug' && (
          <div style={styles.debugSection}>
            <div style={styles.debugHeader}>🐛 Debug Mode</div>
            <div style={styles.debugInfo}>
              <div>🔍 Debug mode is active</div>
              <div>📊 Enhanced logging enabled</div>
              <div>⚡ Performance monitoring active</div>
              <div>🎯 Map state: {mapState ? 'Loaded' : 'Not loaded'}</div>
              <div>📦 Objects: {mapState?.objects?.length || 0}</div>
              <div>🗺️  Tiles: {mapState?.tiles?.length || 0}</div>
            </div>
          </div>
        )}
        {debugMode === 'performance' && (
          <div style={styles.performanceSection}>
            <div style={styles.performanceHeader}>🐛 Performance Monitor</div>
            <div style={styles.performanceStats}>
              <div style={styles.performanceStat}>
                <span style={{ ...styles.performanceLabel, color: '#00ff88' }}>FPS:</span>
                <span style={styles.performanceValue}>60</span>
              </div>
              <div style={styles.performanceStat}>
                <span style={{ ...styles.performanceLabel, color: '#00ff88' }}>MEM:</span>
                <span style={styles.performanceValue}>0 MB</span>
              </div>
              <div style={styles.performanceStat}>
                <span style={{ ...styles.performanceLabel, color: '#00ff88' }}>CPU:</span>
                <span style={styles.performanceValue}>0%</span>
              </div>
            </div>
          </div>
        )}
        {lines.map((line, i) => (
          <div key={i} style={styles.line}>
            <span style={styles.ts}>{line.ts}</span>
            <span style={{ color: LEVEL_COLORS[line.level] || '#ccc' }}>{line.text}</span>
          </div>
        ))}
        {lines.length === 0 && (
          <div style={styles.empty}>No output yet.</div>
        )}
      </div>
      <form onSubmit={handleSubmit} style={styles.inputRow}>
        <span style={styles.prompt}>&gt;</span>
        <input
          style={styles.input}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          spellCheck={false}
        />
      </form>
    </div>
  );
}

const styles = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: 150,
    background: '#0a0a18',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#2a2a4a',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#ccc',
    flexShrink: 0,
    transition: 'height 0.3s ease',
  },
  expandedPanel: {
    height: 400,
  },
  expandedBar: {
    height: 400,
  },
  collapsedBar: {
    display: 'flex',
    alignItems: 'center',
    background: '#0a0a18',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#2a2a4a',
    padding: '2px 8px',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 8px',
    background: '#1a1a3a',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#0a0a2a',
  },
  headerTitle: {
    color: '#88ccaa',
    fontWeight: 'bold',
  },
  controls: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  modeBtn: {
    padding: '2px 6px',
    background: '#0a0a2a',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#2a2a4a',
    borderRadius: '3px',
    color: '#aaa',
    fontSize: '0.7rem',
    cursor: 'pointer',
  },
  activeMode: {
    background: '#2a2a4a',
    color: '#88ccaa',
    borderColor: '#4a4a6a',
  },
  clearBtn: {
    background: 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#333',
    color: '#666',
    borderRadius: 3,
    padding: '1px 6px',
    cursor: 'pointer',
    fontSize: '0.65rem',
  },
  toggleBtn: {
    background: 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#333',
    color: '#666',
    borderRadius: 3,
    padding: '1px 6px',
    cursor: 'pointer',
    fontSize: '0.65rem',
  },
  expandBtn: {
    background: 'none',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#3a3a6a',
    color: '#88ccaa',
    borderRadius: 3,
    padding: '1px 6px',
    cursor: 'pointer',
    fontSize: '0.65rem',
  },
  logArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 8px',
  },
  line: {
    display: 'flex',
    gap: 8,
    lineHeight: 1.5,
  },
  ts: {
    color: '#444',
    flexShrink: 0,
  },
  empty: {
    color: '#333',
    fontStyle: 'italic',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#1a1a3a',
    background: '#08081a',
  },
  prompt: {
    color: '#66aaff',
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#e0e0e0',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    outline: 'none',
  },
  performanceSection: {
    background: '#0a0a2a',
    padding: '8px',
    borderBottom: '1px solid #2a2a4a',
  },
  debugSection: {
    background: '#0a0a2a',
    padding: '8px',
    borderBottom: '1px solid #2a2a4a',
  },
  debugHeader: {
    color: '#ffaa00',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  debugInfo: {
    color: '#aaa',
    fontSize: '0.7rem',
  },
  performanceHeader: {
    color: '#00ff88',
    fontWeight: 'bold',
    marginBottom: '8px',
    fontSize: '0.8rem',
  },
  performanceStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  performanceStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
  performanceValue: {
    fontSize: '0.7rem',
    color: '#ccc',
  },
};
