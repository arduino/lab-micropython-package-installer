if (require('electron-squirrel-startup')) return;
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

// Handle events from windows squirrel installer
if (process.platform === "win32" && handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

const { updateElectronApp } = require('update-electron-app')
updateElectronApp()

let mainWindow;
let upyPackage;
const ARDUINO_VID = 0x2341;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    minWidth: 600,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Preload script for contextBridge
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
  });
}

app.on('ready', async() => {
  // Load the PackageManager class from the upy-package module
  upyPackage = await import('upy-package');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('get-packages', async () => {
  const packageManager = new upyPackage.PackageManager();
  try {
      const packages = await packageManager.getPackageList();
      return { success: true, data: packages };
  } catch (error) {
      console.error('Failed to fetch packages:', error);
      return { success: false, error: error.message };
  }
});

ipcMain.handle('get-boards', async () => {
  const boardManager = new upyPackage.DeviceManager();
  try {
      // Pass ARDUINO_VID to filter for Arduino boards
      return await boardManager.getConnectedDevices();
  } catch (error) {
      console.error('Failed to fetch boards:', error);
      return [];
  }
});

ipcMain.handle('install-package', async (event, aPackage, serialPort, compileFiles, overwriteExisting) => {
  const packageManager = new upyPackage.PackageManager(compileFiles, overwriteExisting);
  const boardManager = new upyPackage.DeviceManager();

  try {
      const selectedBoard = await boardManager.getConnectedBoardByPort(serialPort);
      if(!selectedBoard) {
        throw new Error(`No board found on port ${serialPort}`);
      }

      if(!aPackage.name && aPackage.url) {
        await packageManager.installPackageFromURL(aPackage.url, selectedBoard);
      } else {
        await packageManager.installPackage(aPackage, selectedBoard);
      }
      return { success: true };
  } catch (error) {
      let packageDesignator = aPackage.name || aPackage.url;
      console.error(`Failed to install package ${packageDesignator}:`, error);
      return { success: false, error: error.message };
  }
});