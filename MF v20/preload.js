const { contextBridge, ipcRenderer } = require('electron');

const isValidKey = (key) => typeof key === 'string' && /^[a-zA-Z0-9._-]{1,64}$/.test(key);

contextBridge.exposeInMainWorld('pedalAPI', {
  openSampleDialog: () => ipcRenderer.invoke('open-sample-dialog'),
  saveParam: (key, value) => {
    if (!isValidKey(key)) return Promise.resolve(false);
    return ipcRenderer.invoke('save-param', key, value);
  },
  getParam: (key) => {
    if (!isValidKey(key)) return Promise.resolve(null);
    return ipcRenderer.invoke('get-param', key);
  }
});
