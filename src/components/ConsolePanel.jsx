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

export default function ConsolePanel() {
  const [lines, setLines] = useState(() => logger.lines);
  const [input, setInput] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef(null);

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
    const cmd = input.trim();
    if (!cmd) return;
    logger.cmd(`> ${cmd}`);
    // Future: parse and execute commands here
    logger.info(`Unknown command: ${cmd}`);
    setInput('');
  }, [input]);

  if (collapsed) {
    return (
      <div style={styles.collapsedBar}>
        <button style={styles.toggleBtn} onClick={() => setCollapsed(false)}>
          ▲ Console ({lines.length})
        </button>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Console</span>
        <button style={styles.clearBtn} onClick={() => logger.clear()}>Clear</button>
        <button style={styles.toggleBtn} onClick={() => setCollapsed(true)}>▼</button>
      </div>
      <div ref={scrollRef} style={styles.logArea}>
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
    borderTop: '1px solid #2a2a4a',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#ccc',
    flexShrink: 0,
  },
  collapsedBar: {
    display: 'flex',
    alignItems: 'center',
    background: '#0a0a18',
    borderTop: '1px solid #2a2a4a',
    padding: '2px 8px',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '3px 8px',
    background: '#10102a',
    borderBottom: '1px solid #1a1a3a',
  },
  headerTitle: {
    flex: 1,
    color: '#888',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  clearBtn: {
    background: 'none',
    border: '1px solid #333',
    color: '#666',
    borderRadius: 3,
    padding: '1px 6px',
    cursor: 'pointer',
    fontSize: '0.65rem',
  },
  toggleBtn: {
    background: 'none',
    border: '1px solid #333',
    color: '#666',
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
    borderTop: '1px solid #1a1a3a',
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
};
