const { BrowserWindow, app } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1500,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadURL('http://localhost:5173/');
}

app.whenReady().then(createWindow);