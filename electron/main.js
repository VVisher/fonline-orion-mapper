import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
});

function registerIpcHandlers() {
  ipcMain.handle('read-file', async (_event, filePath) => {
    return fs.readFileSync(filePath, 'utf-8');
  });

  ipcMain.handle('write-file', async (_event, filePath, content) => {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  });

  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'FOnline Maps', extensions: ['fomap'] }],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('save-file-dialog', async () => {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'FOnline Maps', extensions: ['fomap'] }],
    });
    if (result.canceled) return null;
    return result.filePath;
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
