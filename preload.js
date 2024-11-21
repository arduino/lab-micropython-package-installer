const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getBoards: () => ipcRenderer.invoke('get-boards'),
    getPackages: () => ipcRenderer.invoke('get-packages'),
    installPackage: (packageName, serialPort, compileFiles, overwriteExisting) => ipcRenderer.invoke('install-package', packageName, serialPort, compileFiles, overwriteExisting)
});