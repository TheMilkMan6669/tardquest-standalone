const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
    closeWindow: () => ipcRenderer.invoke('window-close'),
    toggleFullscreen: () => ipcRenderer.invoke('window-fullscreen'),
    onFullscreenChange: (callback) => ipcRenderer.on('fullscreen-changed', callback)
});