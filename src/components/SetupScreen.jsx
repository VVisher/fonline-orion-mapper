import React, { useState, useRef } from 'react';
import {
  loadConfig, saveConfig, clearConfig,
  validateServerFile, validateClientFile,
} from '../engine/ProjectConfig.js';

/**
 * Utility functions for auto-detecting nearby folders
 */

function getSuggestedClientPath(serverPath) {
  if (!serverPath) return null;
  
  // If we only have the filename (no directory), provide generic guidance
  if (!serverPath.includes('/') && !serverPath.includes('\\')) {
    return 'Look for client folder near your server folder';
  }
  
  // Remove the server filename and get directory
  const serverDir = serverPath.replace(/[^/\\]*$/, '');
  
  // Common client folder locations relative to server
  const suggestions = [
    `${serverDir}client`,
    `${serverDir}../client`,
    `${serverDir}../Client`,
    `${serverDir}../../client`,
    `${serverDir}../../Client`,
  ];
  
  return suggestions[0]; // Return the most likely suggestion
}

function getSuggestedMapPaths(serverPath) {
  if (!serverPath) return [];
  
  // If we only have the filename (no directory), provide generic guidance
  if (!serverPath.includes('/') && !serverPath.includes('\\')) {
    return ['Look for maps folder near your server folder'];
  }
  
  // Remove the server filename and get directory
  const serverDir = serverPath.replace(/[^/\\]*$/, '');
  
  // Common map folder locations relative to server
  const suggestions = [
    `${serverDir}maps`,
    `${serverDir}../maps`,
    `${serverDir}../Maps`,
    `${serverDir}../../maps`,
    `${serverDir}../../Maps`,
    `${serverDir}data/maps`,
    `${serverDir}../data/maps`,
  ];
  
  return suggestions;
}

/**
 * SetupScreen — first-launch configuration gate.
 * User must pick valid FonlineServer.cfg and DataFiles.cfg before accessing the mapper.
 *
 * Props:
 *   onConfigured(config) — called when both files are validated and user clicks Enter.
 */
export default function SetupScreen({ onConfigured }) {
  const [config, setConfig] = useState(loadConfig);
  
  console.log('🔧 SetupScreen rendering - config:', config);

  const [serverStatus, setServerStatus] = useState(null);
  const [clientStatus, setClientStatus] = useState(null);
  const [suggestedClientPath, setSuggestedClientPath] = useState(null);
  const [suggestedMapPaths, setSuggestedMapPaths] = useState([]);

  const serverInputRef = useRef(null);
  const clientInputRef = useRef(null);
  const serverFolderInputRef = useRef(null);

  const bothValid = config.serverValid && config.clientValid;

  async function onServerFilePicked(e) {
    const file = e.target.files[0];
    if (!file) return;
    const result = await validateServerFile(file);
    setServerStatus(result);

    const updated = {
      ...config,
      serverPath: result.path || file.name,
      serverValid: result.valid,
    };
    setConfig(updated);
    saveConfig(updated);

    // Generate suggestions based on server path
    if (result.path) {
      const clientSuggestion = getSuggestedClientPath(result.path);
      const mapSuggestions = getSuggestedMapPaths(result.path);
      
      setSuggestedClientPath(clientSuggestion);
      setSuggestedMapPaths(mapSuggestions);
      
      // Save suggestions to config for later use
      const configWithSuggestions = {
        ...updated,
        mapPaths: mapSuggestions,
      };
      setConfig(configWithSuggestions);
      saveConfig(configWithSuggestions);
    }
  }

  async function onClientFilePicked(e) {
    const file = e.target.files[0];
    if (!file) return;
    const result = await validateClientFile(file);
    setClientStatus(result);

    const updated = {
      ...config,
      clientPath: result.path || file.name,
      clientValid: result.valid,
    };
    setConfig(updated);
    saveConfig(updated);
  }

  async function onServerFolderPicked(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Look for FonlineServer.cfg in the selected folder
    const serverFile = files.find(f => f.name.toLowerCase() === 'fonlineserver.cfg');
    if (!serverFile) {
      setServerStatus({ valid: false, reason: 'FonlineServer.cfg not found in selected folder' });
      return;
    }
    
    const result = await validateServerFile(serverFile);
    setServerStatus(result);

    // Get the folder path from the first file's webkitRelativePath
    const folderPath = files[0].webkitRelativePath?.split('/')[0] || 'Selected folder';
    
    const updated = {
      ...config,
      serverPath: folderPath,
      serverValid: result.valid,
    };
    setConfig(updated);
    saveConfig(updated);

    // Generate suggestions based on folder path
    if (folderPath && folderPath !== 'Selected folder') {
      const clientSuggestion = getSuggestedClientPath(folderPath);
      const mapSuggestions = getSuggestedMapPaths(folderPath);
      
      setSuggestedClientPath(clientSuggestion);
      setSuggestedMapPaths(mapSuggestions);
      
      // Save suggestions to config for later use
      const configWithSuggestions = {
        ...updated,
        mapPaths: mapSuggestions,
      };
      setConfig(configWithSuggestions);
      saveConfig(configWithSuggestions);
    }
  }

  function handleUseSuggestedClient() {
    if (suggestedClientPath && clientInputRef.current) {
      // Trigger file picker with suggested path (not directly possible, so we show the suggestion)
      const updated = {
        ...config,
        clientPath: suggestedClientPath,
      };
      setConfig(updated);
      // Note: User still needs to pick the actual file, but we guide them
    }
  }

  function handleReset() {
    clearConfig();
    setConfig(loadConfig());
    setServerStatus(null);
    setClientStatus(null);
    setSuggestedClientPath(null);
    setSuggestedMapPaths([]);
    if (serverInputRef.current) serverInputRef.current.value = '';
    if (clientInputRef.current) clientInputRef.current.value = '';
  }

  function handleEnter() {
    if (bothValid) {
      onConfigured({ ...config });
    }
  }

  console.log('🔧 SetupScreen render - bothValid:', bothValid, 'serverStatus:', serverStatus, 'clientStatus:', clientStatus);

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <h1 style={styles.logo}>ORION</h1>
        <p style={styles.subtitle}>Map Architect — Project Setup</p>
        <p style={styles.hint}>
          Pick your FOnline <b>FonlineServer.cfg</b> and <b>DataFiles.cfg</b> to link the project.
        </p>

        {/* Server config */}
        <div style={styles.section}>
          <div style={styles.row}>
            <input
              ref={serverInputRef}
              type="file"
              accept=".cfg"
              style={{ display: 'none' }}
              onChange={onServerFilePicked}
            />
            <button style={styles.btn} onClick={() => serverInputRef.current?.click()}>
              Pick FonlineServer.cfg
            </button>
            <span style={styles.path}>
              {config.serverPath || '(not set)'}
            </span>
            <StatusDot valid={config.serverValid} />
          </div>
          {serverStatus && (
            <p style={serverStatus.valid ? styles.ok : styles.err}>
              {serverStatus.reason}
            </p>
          )}
          <p style={styles.detail}>
            Located in your <code>server/</code> folder. Must contain <code>WindowName</code>.
          </p>
          
          {/* Alternative: Folder selection for better path detection */}
          <div style={styles.row}>
            <input
              ref={serverFolderInputRef}
              type="file"
              accept=".cfg"
              webkitdirectory=""
              style={{ display: 'none' }}
              onChange={onServerFolderPicked}
            />
            <button 
              style={{...styles.btn, background: '#2a2a4e', fontSize: '0.75rem'}} 
              onClick={() => serverFolderInputRef.current?.click()}
            >
              📁 Select Server Folder (Better)
            </button>
            <span style={{...styles.path, fontSize: '0.7rem', color: '#666'}}>
              Enables auto-detection of nearby folders
            </span>
          </div>
          
          {/* Auto-suggestions */}
          {suggestedClientPath && (
            <div style={styles.suggestionBox}>
              <p style={styles.suggestionTitle}>💡 Suggested client path:</p>
              <p style={styles.suggestionPath}>{suggestedClientPath}</p>
              {!suggestedClientPath.includes('Look for') && (
                <button 
                  style={styles.suggestionBtn} 
                  onClick={handleUseSuggestedClient}
                >
                  Use this suggestion
                </button>
              )}
              <p style={styles.suggestionNote}>
                {suggestedClientPath.includes('Look for') 
                  ? 'Browse to your server folder and look for the client directory nearby'
                  : 'Look for DataFiles.cfg in this location'
                }
              </p>
            </div>
          )}
          
          {suggestedMapPaths.length > 0 && (
            <div style={styles.suggestionBox}>
              <p style={styles.suggestionTitle}>🗺️ Suggested map folders:</p>
              {suggestedMapPaths.slice(0, 3).map((path, i) => (
                <p key={i} style={styles.suggestionPath}>{path}</p>
              ))}
              <p style={styles.suggestionNote}>
                {suggestedMapPaths[0].includes('Look for')
                  ? 'Browse to your server folder and look for maps directories nearby'
                  : 'These folders will be searched for .fomap files'
                }
              </p>
            </div>
          )}
        </div>

        {/* Client config */}
        <div style={styles.section}>
          <div style={styles.row}>
            <input
              ref={clientInputRef}
              type="file"
              accept=".cfg"
              style={{ display: 'none' }}
              onChange={onClientFilePicked}
            />
            <button style={styles.btn} onClick={() => clientInputRef.current?.click()}>
              Pick DataFiles.cfg
            </button>
            <span style={styles.path}>
              {config.clientPath || '(not set)'}
            </span>
            <StatusDot valid={config.clientValid} />
          </div>
          {clientStatus && (
            <p style={clientStatus.valid ? styles.ok : styles.err}>
              {clientStatus.reason}
            </p>
          )}
          <p style={styles.detail}>
            Located in your <code>client/</code> folder. Content manifest for data files.
          </p>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button
            style={{
              ...styles.enterBtn,
              opacity: bothValid ? 1 : 0.35,
              cursor: bothValid ? 'pointer' : 'not-allowed',
            }}
            disabled={!bothValid}
            onClick={handleEnter}
          >
            Enter Mapper
          </button>
          <button style={styles.resetBtn} onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ valid }) {
  if (valid === null || valid === undefined) return null;
  return (
    <span style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: valid ? '#00ff88' : '#ff4444',
      marginLeft: 8,
      flexShrink: 0,
    }} />
  );
}

const styles = {
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#0a0a1a',
    fontFamily: 'sans-serif',
    color: '#e0e0e0',
  },
  card: {
    background: '#12122a',
    border: '1px solid #2a2a4a',
    borderRadius: 12,
    padding: '2.5rem 3rem',
    maxWidth: 520,
    width: '100%',
  },
  logo: {
    margin: 0,
    fontSize: '2rem',
    color: '#00ff88',
    letterSpacing: '0.2em',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#888',
    fontSize: '0.9rem',
    marginTop: 4,
    marginBottom: 24,
  },
  hint: {
    fontSize: '0.85rem',
    color: '#aaa',
    marginBottom: 20,
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 20,
    padding: '12px 14px',
    background: '#0f0f23',
    borderRadius: 8,
    border: '1px solid #222244',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  btn: {
    padding: '0.4rem 0.9rem',
    background: '#1a1a3e',
    color: '#e0e0e0',
    border: '1px solid #444',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.82rem',
    whiteSpace: 'nowrap',
  },
  path: {
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: '#aaa',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  ok: {
    color: '#00ff88',
    fontSize: '0.78rem',
    margin: '6px 0 0',
  },
  err: {
    color: '#ff4444',
    fontSize: '0.78rem',
    margin: '6px 0 0',
  },
  detail: {
    color: '#555',
    fontSize: '0.72rem',
    margin: '6px 0 0',
  },
  suggestionBox: {
    marginTop: 16,
    padding: '12px',
    background: '#1a1a3e',
    border: '1px solid #3a3a6a',
    borderRadius: 6,
  },
  suggestionTitle: {
    color: '#00ff88',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  suggestionPath: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#aaa',
    margin: '4px 0',
    wordBreak: 'break-all',
  },
  suggestionBtn: {
    marginTop: 8,
    padding: '6px 12px',
    background: '#00aa55',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  suggestionNote: {
    color: '#666',
    fontSize: '0.7rem',
    margin: '8px 0 0 0',
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 24,
    justifyContent: 'center',
  },
  enterBtn: {
    padding: '0.6rem 2rem',
    background: '#00aa55',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: '0.95rem',
    fontWeight: 'bold',
    letterSpacing: '0.05em',
  },
  resetBtn: {
    padding: '0.5rem 1.2rem',
    background: 'transparent',
    color: '#666',
    border: '1px solid #333',
    borderRadius: 6,
    fontSize: '0.82rem',
    cursor: 'pointer',
  },
};
