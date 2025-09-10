import 'update-electron-app';
import { BrowserWindow, app, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Start Express HTTP server ---
const serverPort = 9599;
const publicDir = path.join(__dirname, 'HttpData');

const webApp = express();

// Serve static assets from GameData (serves index.html for / by default)
webApp.use(express.static(publicDir));

// 404 handler to mirror previous behavior
webApp.use((req, res) => {
    res.status(404).send('Not found');
});

const server = webApp.listen(serverPort, () => {
    console.log(`Local server running at http://localhost:${serverPort}`);
});

server.on('error', (err) => {
    console.error('Local server error:', err);
});
// --- End Express HTTP server ---

app.commandLine.appendSwitch('no-sandbox');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 604,
        minHeight: 600,
        autoHideMenuBar: true,
        frame: false,
        roundedCorners: false,
        fullscreen: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
            sandbox: false
        }
    });

    // Handle window controls from renderer
    ipcMain.handle('window-minimize', () => win.minimize());
    ipcMain.handle('window-maximize', () => {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    });
    ipcMain.handle('window-close', () => win.close());
    ipcMain.handle('window-fullscreen', () => {
        if (win.isFullScreen()) {
            win.setFullScreen(false);
        } else {
            win.setFullScreen(true);
        }
    });

    // Handle fullscreen events
    win.on('enter-full-screen', () => {
        win.webContents.send('fullscreen-changed', true);
    });
    win.on('leave-full-screen', () => {
        win.webContents.send('fullscreen-changed', false);
    });

    win.loadURL(`http://localhost:${serverPort}/AppData/index.html`);
};

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Ensure the local server is closed on app quit
app.on('before-quit', () => {
    try {
        server.close();
    } catch (e) {
        // ignore
    }
});