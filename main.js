const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
// const { PackageManager } = require('upy-package');  // Import the PackageManager class

let mainWindow;
let upyPackage;
const ARDUINO_VID = 0x2341;

app.on('ready', async() => {
  // Load the PackageManager class from the upy-package module
  upyPackage = await import('upy-package');
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
      return packages;
  } catch (error) {
      console.error('Failed to fetch packages:', error);
      return [];
  }
});

ipcMain.handle('get-boards', async () => {
  const boardManager = new upyPackage.DeviceManager();
  try {
      return await boardManager.getConnectedDevices(ARDUINO_VID);
  } catch (error) {
      console.error('Failed to fetch boards:', error);
      return [];
  }
});

ipcMain.handle('install-package', async (event, aPackage) => {
  const packageManager = new upyPackage.PackageManager();
  const boardManager = new upyPackage.DeviceManager();  

  try {
      // TODO select the board from the frontend
      const selectedBoard = (await boardManager.getConnectedDevices(ARDUINO_VID))[0];
      if(!aPackage.name && aPackage.url) {
        await packageManager.installPackageFromURL(aPackage.url, selectedBoard);
      } else {
        // Consider getting the package by name from the package manager
        // in case there is not the full package info available in the frontend:
        // const package = await packageManager.getPackage(aPackage.name);
        await packageManager.installPackage(aPackage, selectedBoard);
      }
      return { success: true };
  } catch (error) {
      let packageDesignator = aPackage.name || aPackage.url;
      console.error(`Failed to install package ${packageDesignator}:`, error);
      return { success: false, error: error.message };
  }
});