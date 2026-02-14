const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { fileURLToPath } = require('url');

const MAX_SAMPLE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_PARAM_ENTRIES = 128;
const VALID_PARAM_KEY = /^[a-zA-Z0-9._-]{1,64}$/;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1092,
    height: 1898,
    minWidth: 910,
    minHeight: 1300,
    resizable: true,
    backgroundColor: '#111111',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const htmlEntry = fs.existsSync(path.join(__dirname, 'index.html'))
    ? 'index.html'
    : 'mf104m-preview.html';
  mainWindow.loadFile(htmlEntry);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

function isTrustedSender(event) {
  try {
    const senderUrl = event?.senderFrame?.url;
    if (!senderUrl || !senderUrl.startsWith('file://')) return false;
    const senderPath = path.resolve(fileURLToPath(senderUrl));
    const appDir = path.resolve(__dirname) + path.sep;
    return senderPath.startsWith(appDir);
  } catch {
    return false;
  }
}

// ── File Dialog for Sample Loading ──
ipcMain.handle('open-sample-dialog', async (event) => {
  if (!isTrustedSender(event)) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Load Audio Sample',
    filters: [
      { name: 'Audio Files', extensions: ['wav', 'mp3', 'ogg', 'flac', 'aif', 'aiff', 'm4a'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const fileName = path.basename(filePath);

  const stat = await fs.promises.stat(filePath);
  if (!stat.isFile() || stat.size <= 0 || stat.size > MAX_SAMPLE_SIZE_BYTES) {
    throw new Error('Selected file is invalid or exceeds 50MB limit');
  }

  const buffer = await fs.promises.readFile(filePath);

  return {
    name: fileName,
    base64: buffer.toString('base64')
  };
});

// ── Parameter State ──
let paramState = {};

ipcMain.handle('save-param', (event, key, value) => {
  if (!isTrustedSender(event)) return false;
  if (typeof key !== 'string' || !VALID_PARAM_KEY.test(key)) return false;
  if (!(key in paramState) && Object.keys(paramState).length >= MAX_PARAM_ENTRIES) return false;
  paramState[key] = value;
  return true;
});

ipcMain.handle('get-param', (event, key) => {
  if (!isTrustedSender(event)) return null;
  if (typeof key !== 'string' || !VALID_PARAM_KEY.test(key)) return null;
  return paramState[key] ?? null;
});
