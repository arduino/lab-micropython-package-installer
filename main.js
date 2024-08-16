const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
// const { PackageManager } = require('upy-package');  // Import the PackageManager class

let mainWindow;
let upyPackage;

app.on('ready', async() => {
  // Load the PackageManager class from the upy-package module
  upyPackage = await import('upy-package');
  mainWindow = new BrowserWindow({
      webPreferences: {
          preload: path.join(__dirname, 'preload.js'), // Preload script for contextBridge
          nodeIntegration: false,
          contextIsolation: true
      }
  });

  mainWindow.loadFile('index.html');
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

ipcMain.handle('install-package', async (event, packageName) => {
  const packageManager = new upyPackage.PackageManager();
  try {
      await packageManager.installPackage(packageName);
      return { success: true };
  } catch (error) {
      console.error(`Failed to install package ${packageName}:`, error);
      return { success: false, error: error.message };
  }
});