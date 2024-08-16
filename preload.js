const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getPackages: () => ipcRenderer.invoke('get-packages'),
    installPackage: (packageName) => ipcRenderer.invoke('install-package', packageName)
});