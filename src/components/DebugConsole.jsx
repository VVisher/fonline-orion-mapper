import React, { useState, useEffect, useRef } from 'react';

/**
 * Enhanced Debug Console with map loading visibility
 * Shows parsed objects, tiles, and rendering statistics
 */
export default function DebugConsole() {
  const [isVisible, setIsVisible] = useState(false);
  const [showTiles, setShowTiles] = useState(false);
  const [showObjects, setShowObjects] = useState(true);
  const [showParsing, setShowParsing] = useState(true);
  const [logs, setLogs] = useState([]);
  const consoleRef = useRef(null);

  // Enhanced console logging
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (type, ...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      setLogs(prev => {
        const newLogs = [...prev, {
          type,
          message,
          timestamp: new Date().toLocaleTimeString(),
          id: Date.now() + Math.random()
        }];
        
        // Keep only last 100 logs
        return newLogs.slice(-100);
      });
    };

    // Override console methods
    console.log = (...args) => {
      originalLog(...args);
      if (showParsing || args[0]?.includes?.('🗺️') || args[0]?.includes?.('⏱️') || args[0]?.includes?.('📊')) {
        addLog('log', ...args);
      }
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', ...args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', ...args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, [showParsing]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return '#ff6b6b';
      case 'warn': return '#feca57';
      case 'log': return '#48dbfb';
      default: return '#ccc';
    }
  };

  const filterLogs = () => {
    return logs.filter(log => {
      if (!showTiles && log.message.includes('tiles')) return false;
      if (!showObjects && log.message.includes('objects')) return false;
      if (!showParsing && !log.message.includes('🗺️') && !log.message.includes('⏱️') && !log.message.includes('📊')) return false;
      return true;
    });
  };

  if (!isVisible) {
    return (
      <button
        style={styles.toggleButton}
        onClick={() => setIsVisible(true)}
        title="Toggle Debug Console (Ctrl+Shift+D)"
      >
        🐛 Debug
      </button>
    );
  }

  const filteredLogs = filterLogs();

  return (
    <div style={styles.overlay}>
      <div style={styles.console}>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>Debug Console</h3>
          <div style={styles.controls}>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={showTiles}
                onChange={(e) => setShowTiles(e.target.checked)}
              />
              Tiles
            </label>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={showObjects}
                onChange={(e) => setShowObjects(e.target.checked)}
              />
              Objects
            </label>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={showParsing}
                onChange={(e) => setShowParsing(e.target.checked)}
              />
              Parsing
            </label>
            <button
              style={styles.clearButton}
              onClick={() => setLogs([])}
              title="Clear logs"
            >
              Clear
            </button>
            <button
              style={styles.closeButton}
              onClick={() => setIsVisible(false)}
              title="Close (Ctrl+Shift+D)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          <div style={styles.logContainer} ref={consoleRef}>
            {filteredLogs.length === 0 ? (
              <div style={styles.empty}>No logs to display</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} style={styles.logEntry}>
                  <span style={{ ...styles.timestamp, color: '#666' }}>
                    [{log.timestamp}]
                  </span>
                  <span style={{ ...styles.message, color: getLogColor(log.type) }}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>
            {filteredLogs.length} logs | Press Ctrl+Shift+D to toggle
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
  },
  console: {
    background: '#1a1a2e',
    border: '2px solid #3a3a6a',
    borderRadius: 8,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    width: '90%',
    maxWidth: '1000px',
    height: '80vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'monospace',
  },
  toggleButton: {
    position: 'fixed',
    top: 10,
    left: 10,
    padding: '8px 12px',
    background: '#2a2a4a',
    border: '1px solid #3a3a6a',
    borderRadius: 4,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '0.8rem',
    zIndex: 2999,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#2a2a4a',
    borderBottom: '1px solid #3a3a6a',
  },
  title: {
    margin: 0,
    color: '#00ff88',
    fontSize: '1rem',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#ccc',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  clearButton: {
    padding: '4px 8px',
    background: '#e74c3c',
    border: '1px solid #c0392b',
    borderRadius: 4,
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.7rem',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#ccc',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '4px',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  logContainer: {
    height: '100%',
    overflowY: 'auto',
    padding: '8px',
    background: '#0f0f23',
  },
  logEntry: {
    display: 'flex',
    marginBottom: '2px',
    fontSize: '0.8rem',
    lineHeight: '1.4',
  },
  timestamp: {
    marginRight: '8px',
    minWidth: '80px',
  },
  message: {
    flex: 1,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  empty: {
    color: '#666',
    textAlign: 'center',
    padding: '20px',
    fontStyle: 'italic',
  },
  footer: {
    padding: '8px 16px',
    background: '#2a2a4a',
    borderTop: '1px solid #3a3a6a',
    textAlign: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: '0.7rem',
  },
};
