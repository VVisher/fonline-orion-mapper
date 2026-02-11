/**
 * LagMonitorBaseWindow - Performance monitoring using BaseWindow
 * Follows golden standard design from History window
 */

import React, { useState, useEffect, useRef } from 'react';
import BaseWindow from '../ui/BaseWindow';

export default function LagMonitorBaseWindow({ mapState, history, docked = false, onToggleDock = () => {} }) {
  const [isExpanded, setIsExpanded] = useState(false);
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
        if (fpsHistory.current.length === 0) return 60;
        const sum = fpsHistory.current.reduce((a, b) => a + b, 0);
        return Math.round(sum / fpsHistory.current.length);
      },
      getFrameCount: () => frameCountRef.current,
      resetStats: () => {
        frameCountRef.current = 0;
        fpsHistory.current = [];
        fpsRef.current = 60;
      }
    };

    performanceMonitor.current.startMonitor();

    const updateInterval = setInterval(() => {
      performanceMonitor.current.endMonitor();
      performanceMonitor.current.startMonitor();
      
      setStats({
        fps: performanceMonitor.current.getFPS(),
        averageFPS: performanceMonitor.current.getAverageFPS(),
        frameCount: performanceMonitor.current.getFrameCount(),
        objects: mapState.objects?.length || 0,
        tiles: mapState.tiles?.length || 0
      });
    }, 100);

    // Cleanup
    return () => clearInterval(updateInterval);
  }, [mapState]);

  const countText = `${stats.fps || 60} FPS`;

  const actions = (
    <>
      <button
        style={styles.actionBtn}
        onClick={() => performanceMonitor.current?.resetStats()}
      >
        Reset
      </button>
      <button
        style={styles.actionBtn}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>
    </>
  );

  return (
    <BaseWindow
      title="Lag Monitor"
      docked={docked}
      onToggleDock={onToggleDock}
      count={countText}
      showActions={true}
      actions={actions}
      defaultSize={{ width: 320, height: 250 }}
      defaultPosition={{ x: 450, y: 50 }}
    >
      {/* Performance Stats */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Performance</div>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>FPS:</span>
            <span style={{ 
              ...styles.statValue, 
              color: (stats.fps || 60) >= 55 ? '#00ff88' : (stats.fps || 60) >= 30 ? '#ffaa00' : '#ff4444' 
            }}>
              {stats.fps || 60}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Avg:</span>
            <span style={{ 
              ...styles.statValue, 
              color: (stats.averageFPS || 60) >= 55 ? '#00ff88' : (stats.averageFPS || 60) >= 30 ? '#ffaa00' : '#ff4444' 
            }}>
              {stats.averageFPS || 60}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Objects:</span>
            <span style={styles.statValue}>{stats.objects || 0}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Tiles:</span>
            <span style={styles.statValue}>{stats.tiles || 0}</span>
          </div>
        </div>
      </div>

      {/* Map Stats */}
      {isExpanded && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>Map Statistics</div>
          <div style={styles.mapStats}>
            <div style={styles.mapStat}>
              <span style={styles.mapStatLabel}>Map Size:</span>
              <span style={styles.mapStatValue}>
                {mapState?.header?.MaxHexX || 0}x{mapState?.header?.MaxHexY || 0}
              </span>
            </div>
            <div style={styles.mapStat}>
              <span style={styles.mapStatLabel}>Work Area:</span>
              <span style={styles.mapStatValue}>
                {mapState?.header?.WorkHexX || 0}x{mapState?.header?.WorkHexY || 0}
              </span>
            </div>
            <div style={styles.mapStat}>
              <span style={styles.mapStatLabel}>History:</span>
              <span style={styles.mapStatValue}>
                {history?.undoCount || 0}u / {history?.redoCount || 0}r
              </span>
            </div>
          </div>
        </div>
      )}
    </BaseWindow>
  );
}

const styles = {
  section: {
    padding: '8px',
    borderBottom: '1px solid #2a2a4a',
  },
  sectionHeader: {
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: '0.7rem',
    marginBottom: '4px',
    textTransform: 'uppercase',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px',
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2px 4px',
    background: '#1a1a3e',
    borderRadius: '2px',
  },
  statLabel: {
    color: '#88ccaa',
    fontSize: '0.65rem',
    fontWeight: 'bold',
  },
  statValue: {
    color: '#ccc',
    fontSize: '0.65rem',
    fontFamily: 'monospace',
  },
  mapStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  mapStat: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 4px',
    background: '#1a1a3e',
    borderRadius: '2px',
  },
  mapStatLabel: {
    color: '#88ccaa',
    fontSize: '0.6rem',
  },
  mapStatValue: {
    color: '#ccc',
    fontSize: '0.6rem',
    fontFamily: 'monospace',
  },
  actionBtn: {
    flex: 1,
    padding: '3px 0',
    background: '#1a1a3e',
    color: '#aaa',
    border: '1px solid #333',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: '0.68rem',
  },
};
