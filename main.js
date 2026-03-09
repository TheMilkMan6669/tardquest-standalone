import 'update-electron-app';
import { BrowserWindow, app, ipcMain, protocol } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'HttpData');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.cur':  'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.ttf':  'font/ttf',
    '.otf':  'font/otf',
    '.mp3':  'audio/mpeg',
    '.ogg':  'audio/ogg',
    '.wav':  'audio/wav',
    '.mp4':  'video/mp4',
    '.webm': 'video/webm',
};

function getMimeType(filePath) {
    return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

// Register custom scheme before app is ready
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'app',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
            stream: true,
            allowServiceWorkers: true,
            codeCache: true
        }
    }
]);

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

    win.loadURL('app://tard.quest/AppData/index.html');
};

app.whenReady().then(() => {
    // Handle app:// protocol by serving files from HttpData/
    protocol.handle('app', async (request) => {
        const url = new URL(request.url);
        const decodedPath = decodeURIComponent(url.pathname);
        const filePath = path.normalize(path.join(publicDir, decodedPath));

        // Prevent directory traversal
        if (!filePath.startsWith(publicDir)) {
            return new Response('Forbidden', { status: 403 });
        }

        try {
            const data = await readFile(filePath);
            return new Response(data, {
                headers: { 'Content-Type': getMimeType(filePath) }
            });
        } catch {
            return new Response('Not Found', { status: 404 });
        }
    });

    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});