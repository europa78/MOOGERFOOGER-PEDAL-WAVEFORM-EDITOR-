const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 660,
    height: 1460,
    minWidth: 580,
    minHeight: 1000,
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

// ── File Dialog for Sample Loading ──
ipcMain.handle('open-sample-dialog', async () => {
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
  const buffer = fs.readFileSync(filePath);

  return {
    name: fileName,
    path: filePath,
    base64: buffer.toString('base64')
  };
});

// ── Parameter State ──
let paramState = {};

ipcMain.handle('save-param', (event, key, value) => {
  paramState[key] = value;
  return true;
});

ipcMain.handle('get-param', (event, key) => {
  return paramState[key] ?? null;
});
