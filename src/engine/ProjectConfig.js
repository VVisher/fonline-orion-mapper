/**
 * ProjectConfig — persists and validates client/server folder paths.
 *
 * Validation rules:
 *   Server: folder must contain FonlineServer.cfg with line "WindowName = FOnline Server"
 *   Client: folder must contain DataFiles.cfg (content manifest)
 *
 * Paths are stored in localStorage under 'orion_project_config'.
 */

const STORAGE_KEY = 'orion_project_config';

const DEFAULT_CONFIG = {
  serverPath: '',
  clientPath: '',
  serverValid: false,
  clientValid: false,
};

/**
 * Read a File object as text.
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Validate a server config file (FonlineServer.cfg).
 * @param {File} file - The file picked by the user
 * @returns {{ valid: boolean, reason: string, path?: string }}
 */
export async function validateServerFile(file) {
  if (!file) return { valid: false, reason: 'No file selected' };

  if (!file.name.toLowerCase().endsWith('.cfg')) {
    return { valid: false, reason: `Expected .cfg file, got "${file.name}"` };
  }

  const content = await readFileAsText(file);
  if (!content.includes('WindowName')) {
    return { valid: false, reason: 'File missing WindowName entry — is this FonlineServer.cfg?' };
  }

  // Derive server folder path from the file's webkitRelativePath or name
  const path = file.webkitRelativePath
    ? file.webkitRelativePath.replace(/\/[^/]+$/, '')
    : file.name;

  return { valid: true, reason: 'Server verified', path };
}

/**
 * Validate a client config file (DataFiles.cfg).
 * @param {File} file - The file picked by the user
 * @returns {{ valid: boolean, reason: string, path?: string, dataFiles?: string }}
 */
export async function validateClientFile(file) {
  if (!file) return { valid: false, reason: 'No file selected' };

  if (!file.name.toLowerCase().endsWith('.cfg')) {
    return { valid: false, reason: `Expected .cfg file, got "${file.name}"` };
  }

  const content = await readFileAsText(file);
  if (!content.trim()) {
    return { valid: false, reason: 'DataFiles.cfg is empty' };
  }

  const path = file.webkitRelativePath
    ? file.webkitRelativePath.replace(/\/[^/]+$/, '')
    : file.name;

  return { valid: true, reason: 'Client verified', path, dataFiles: content };
}

/**
 * Load saved config from localStorage (paths only — handles can't be persisted).
 */
export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save config to localStorage.
 */
export function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    serverPath: config.serverPath || '',
    clientPath: config.clientPath || '',
    serverValid: config.serverValid || false,
    clientValid: config.clientValid || false,
  }));
}

/**
 * Clear saved config.
 */
export function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
}
