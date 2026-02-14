const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pedalAPI', {
  openSampleDialog: () => ipcRenderer.invoke('open-sample-dialog'),
  saveParam: (key, value) => ipcRenderer.invoke('save-param', key, value),
  getParam: (key) => ipcRenderer.invoke('get-param', key)
});
