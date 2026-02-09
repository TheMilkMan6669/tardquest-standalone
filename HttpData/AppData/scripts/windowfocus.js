let currentZIndex = 2000;
const windows = ['leaderboardWindow', 'tardtestWindow', 'apitestWindow'];

function bringWindowToFront(windowElement) {
    currentZIndex++;
    windowElement.style.zIndex = currentZIndex;
}

function setupWindowFocus(windowId) {
    const windowElement = document.getElementById(windowId);
    if (windowElement) {
        windowElement.addEventListener('pointerdown', () => {
            bringWindowToFront(windowElement);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    windows.forEach(windowId => {
        setupWindowFocus(windowId);
    });
});