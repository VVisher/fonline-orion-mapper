import React, { useState, useEffect } from 'react';

/**
 * Debug window showing performance statistics
 * Toggleable panel with FPS, memory, CPU, and map information
 */
export default function DebugWindow({ mapState, performanceMonitor }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDocked, setIsDocked] = useState(true); // Docked by default
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (!performanceMonitor) return;

    const updateInterval = setInterval(() => {
      setStats(performanceMonitor.stats);
    }, 100);

    return () => clearInterval(updateInterval);
  }, [performanceMonitor]);

  if (!isVisible) {
    return (
      <button
        style={styles.toggleButton}
        onClick={() => setIsVisible(true)}
        title="Show Debug Window (F12)"
      >
        🐛 Debug
      </button>
    );
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getFPSColor = (fps) => {
    if (fps >= 55) return '#00ff88'; // Green
    if (fps >= 30) return '#ffaa00'; // Yellow
    return '#ff4444'; // Red
  };

  const getMemoryColor = (percentage) => {
    if (percentage < 70) return '#00ff88'; // Green
    if (percentage < 90) return '#ffaa00'; // Yellow
    return '#ff4444'; // Red
  };

  const getCPUColor = (cpu) => {
    if (cpu < 50) return '#00ff88'; // Green
    if (cpu < 80) return '#ffaa00'; // Yellow
    return '#ff4444'; // Red
  };

  return (
    <>
      {/* Docked mode - small panel in top-left */}
      {isDocked && (
        <div style={styles.dockedContainer}>
          <div style={styles.dockedHeader}>
            <span style={styles.dockedTitle}>🐛 Perf</span>
            <div style={styles.dockedControls}>
              <button
                style={styles.dockedButton}
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? '📊' : '📉'}
              </button>
              <button
                style={styles.dockedButton}
                onClick={() => setIsDocked(false)}
                title="Undock"
              >
                🔲
              </button>
              <button
                style={styles.dockedButton}
                onClick={() => setIsVisible(false)}
                title="Close (F12)"
              >
                ✕
              </button>
            </div>
          </div>
          {!isMinimized && (
            <div style={styles.dockedContent}>
              <div style={styles.dockedStats}>
                <div style={styles.dockedStat}>
                  <span style={{ ...styles.dockedLabel, color: getFPSColor(stats.fps) }}>FPS:</span>
                  <span style={styles.dockedValue}>{stats.fps}</span>
                </div>
                <div style={styles.dockedStat}>
                  <span style={{ ...styles.dockedLabel, color: getMemoryColor(stats.memoryPercentage || 0) }}>MEM:</span>
                  <span style={styles.dockedValue}>{formatBytes(stats.memoryUsage * 1024 * 1024)}</span>
                </div>
                <div style={styles.dockedStat}>
                  <span style={{ ...styles.dockedLabel, color: getCPUColor(stats.cpuUsage) }}>CPU:</span>
                  <span style={styles.dockedValue}>{stats.cpuUsage}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Floating mode - full window */}
      {!isDocked && (
        <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>🐛 Performance Debug</span>
        <div style={styles.headerControls}>
          <button
            style={styles.headerButton}
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? '📊' : '📉'}
          </button>
          <button
            style={styles.headerButton}
            onClick={() => setIsVisible(false)}
            title="Close (F12)"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
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
              <span style={{ ...styles.value, color: getFPSColor(performanceMonitor?.getAverageFPS() || 0) }}>
                {performanceMonitor?.getAverageFPS() || 0}
              </span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Render Time:</span>
              <span style={styles.value}>{stats.renderTime}ms</span>
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
            <div style={styles.row}>
              <span style={styles.label}>Percentage:</span>
              <span style={{ ...styles.value, color: getMemoryColor(stats.memoryPercentage || 0) }}>
                {stats.memoryPercentage || 0}%
              </span>
            </div>
          </div>

          {/* Map Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Map Information</div>
            <div style={styles.row}>
              <span style={styles.label}>Path:</span>
              <span style={styles.value} title={stats.mapPath}>
                {stats.mapPath ? stats.mapPath.split('/').pop() : 'Untitled'}
              </span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Load Time:</span>
              <span style={styles.value}>
                {stats.mapLoadTime ? `${(stats.mapLoadTime / 1000).toFixed(2)}s` : 'N/A'}
              </span>
            </div>
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

          {/* Controls Section */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Controls</div>
            <button
              style={styles.controlButton}
              onClick={() => {
                performanceMonitor?.updateMapStats();
                console.log('🔄 Map stats updated');
              }}
            >
              🔄 Refresh Stats
            </button>
            <button
              style={styles.controlButton}
              onClick={() => {
                console.log('🐛 Debug Information:');
                console.log('Stats:', stats);
                console.log('Performance Monitor:', performanceMonitor);
                console.log('Map State:', mapState);
              }}
            >
              📋 Log to Console
            </button>
          </div>
        </div>
      )}
      </>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 10,
    right: 10,
    width: 280,
    background: '#1a1a2e',
    border: '1px solid #3a3a6a',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: '#ccc',
    zIndex: 2000,
  },
  // Docked mode styles
  dockedContainer: {
    position: 'fixed',
    top: 10,
    left: 10,
    background: '#1a1a2e',
    border: '1px solid #3a3a6a',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    fontFamily: 'monospace',
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
  dockedLabel: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
  dockedValue: {
    fontSize: '0.7rem',
    color: '#ccc',
  },
  toggleButton: {
    position: 'fixed',
    top: 10,
    right: 10,
    padding: '8px 12px',
    background: '#2a2a4a',
    border: '1px solid #3a3a6a',
    borderRadius: 4,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '0.8rem',
    zIndex: 1999,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#2a2a4a',
    borderBottom: '1px solid #3a3a6a',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#00ff88',
  },
  headerControls: {
    display: 'flex',
    gap: '4px',
  },
  headerButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '2px 4px',
  },
  content: {
    padding: '12px',
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#88aaff',
    marginBottom: '8px',
    borderBottom: '1px solid #3a3a6a',
    paddingBottom: '4px',
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
    fontWeight: 'bold',
  },
  controlButton: {
    display: 'block',
    width: '100%',
    padding: '6px 8px',
    margin: '4px 0',
    background: '#2a2a4a',
    border: '1px solid #3a3a6a',
    borderRadius: 4,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
};
