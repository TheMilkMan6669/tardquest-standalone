import 'update-electron-app';
import { BrowserWindow, app, ipcMain, protocol, net } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'HttpData');

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
    protocol.handle('app', (request) => {
        const url = new URL(request.url);
        const decodedPath = decodeURIComponent(url.pathname);
        const filePath = path.normalize(path.join(publicDir, decodedPath));

        // Prevent directory traversal
        if (!filePath.startsWith(publicDir)) {
            return new Response('Forbidden', { status: 403 });
        }

        return net.fetch(pathToFileURL(filePath).toString());
    });

    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});