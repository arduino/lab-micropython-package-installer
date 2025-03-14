if (require('electron-squirrel-startup')) return;
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

const APP_SCHEME_NAME = 'micropython-package-installer';
const ARDUINO_VID = 0x2341;

// Handle events from windows squirrel installer
if (process.platform === "win32" && handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

// On macOS the scheme is already registered through the app bundle metadata
// but on Windows and Linux we need to register it manually
if (process.platform !== "darwin" && !app.isDefaultProtocolClient(APP_SCHEME_NAME)) {
  if(!app.setAsDefaultProtocolClient(APP_SCHEME_NAME)) {
    console.error('Failed to register custom URL scheme', APP_SCHEME_NAME);
  }
}

const { updateElectronApp } = require('update-electron-app')
updateElectronApp()

let mainWindow;
let upyPackage;
let packageManager;
let deviceManager;

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
  packageManager = new upyPackage.PackageManager();
  deviceManager = new upyPackage.DeviceManager();
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('get-packages', async (event, searchTerm) => {
  try {
      let packages = await packageManager.findPackages(searchTerm);
      return { success: true, data: packages };
  } catch (error) {
      console.error('Failed to fetch packages:', error);
      return { success: false, error: error.message };
  }
});

ipcMain.handle('get-boards', async (event) => {
  try {
      // Pass ARDUINO_VID to filter for Arduino boards
      return await deviceManager.getConnectedDevices();
  } catch (error) {
      console.error('Failed to fetch boards:', error);
      return [];
  }
});

ipcMain.handle('install-package', async (event, aPackage, serialPort, compileFiles, overwriteExisting) => {
  // Update the package manager settings based on the user input
  packageManager.compileFiles = compileFiles;
  packageManager.overwriteExisting = overwriteExisting;

  try {
      const selectedBoard = await deviceManager.getConnectedBoardByPort(serialPort);
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
      console.error(`Failed to install package ${packageDesignator}:`, error.message);
      
      // Check if error contains "Resource busy" and return a more user-friendly message
      if(error.message.includes('Resource busy') || error.message.includes('Access denied')) {
        return { success: false, error: "Couldn't connect to the board. Close any other program using it and try again." };
      }
      return { success: false, error: error.message };
  }
});

// Handle auto updater events
function handleSquirrelEvent() {
  if (process.argv.length === 1) {
      return false;
  }

  const ChildProcess = require('child_process');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function (command, args) {
      let spawnedProcess, error;

      try {
          spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
      } catch (error) { }

      return spawnedProcess;
  };

  const spawnUpdate = function (args) {
      return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
      case '--squirrel-install':
      case '--squirrel-updated':
          // Install desktop and start menu shortcuts
          spawnUpdate(['--createShortcut', exeName]);
          setTimeout(app.quit, 1000);
          return true;
      case '--squirrel-uninstall':
          // Remove desktop and start menu shortcuts
          spawnUpdate(['--removeShortcut', exeName]);
          setTimeout(app.quit, 1000);
          return true;

      case '--squirrel-obsolete':
          // This is called on the outgoing version of your app before
          // we update to the new version - it's the opposite of
          // --squirrel-updated
          app.quit();
          return true;
  }
};