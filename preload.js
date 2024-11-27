const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getBoards: () => ipcRenderer.invoke('get-boards'),
    getPackages: (searchTerm = null) => ipcRenderer.invoke('get-packages', searchTerm),
    installPackage: (packageName, serialPort, compileFiles, overwriteExisting) => ipcRenderer.invoke('install-package', packageName, serialPort, compileFiles, overwriteExisting),
});