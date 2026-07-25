const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('atlas', {
    version: "1.0.0"
});