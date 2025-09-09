import 'update-electron-app';
import { BrowserWindow, app, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Start built-in HTTP server ---
const serverPort = 9599;
const publicDir = path.join(__dirname, 'GameData');

const mimeTypes = {
    '.html': 'text/html',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.ico':  'image/x-icon',
    '.json': 'application/json',
    '.svg':  'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf':  'font/ttf',
    '.map':  'application/json'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(publicDir, reqPath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(serverPort, () => {
    console.log(`Local server running at http://localhost:${serverPort}`);
});
// --- End HTTP server ---

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

    win.loadFile("AppData/index.html");
};

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});