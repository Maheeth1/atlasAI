import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('atlas', {
    version: "1.0.0"
});