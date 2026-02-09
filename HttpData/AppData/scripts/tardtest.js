const tardtestWindow = document.getElementById('tardtestWindow');
const tardtestContent = document.getElementById('tardtestContent');
const closeTardtestBtn = document.getElementById('closeTardtestBtn');
const tardtestTitlebar = document.getElementById('tardtestTitlebar');

let tardtestLoaded = false;
let tardtestDragState = { isDragging: false, dragOffsetX: 0, dragOffsetY: 0 };

// Listen for password-protected open event
window.addEventListener('openTardTest', toggleTardTest);

// Function to show/hide TardTest window
function toggleTardTest() {
    console.log('TardTest toggle called'); // Debug
    if (tardtestWindow.style.display === 'none' || tardtestWindow.style.display === '') {
        tardtestWindow.style.display = 'flex';
        tardtestWindow.style.position = 'fixed';
        tardtestWindow.style.left = '100px';
        tardtestWindow.style.top = '100px';
        tardtestWindow.style.zIndex = '2000';
        
        // Bring to front when opened
        if (typeof bringWindowToFront === 'function') {
            bringWindowToFront(tardtestWindow);
        }
        
        if (!tardtestLoaded) {
            const iframe = document.createElement('iframe');
            iframe.src = '../GameData/tests/TardTest.html';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.id = 'tardtestIframe';
            tardtestContent.appendChild(iframe);
            tardtestLoaded = true;
        }
        clampTardTestPosition();
    } else {
        tardtestWindow.style.display = 'none';
        tardtestContent.innerHTML = '';
        tardtestLoaded = false;
    }
}

// Close button logic
closeTardtestBtn.addEventListener('click', () => {
    tardtestWindow.style.display = 'none';
    tardtestContent.innerHTML = '';
    tardtestLoaded = false;
});

// Drag logic for TardTest window
tardtestTitlebar.addEventListener('pointerdown', (e) => {
    if (e.target === closeTardtestBtn) return;
    
    // Bring window to front
    if (typeof bringWindowToFront === 'function') {
        bringWindowToFront(tardtestWindow);
    }
    
    tardtestDragState.isDragging = true;
    const rect = tardtestWindow.getBoundingClientRect();
    tardtestDragState.dragOffsetX = e.clientX - rect.left;
    tardtestDragState.dragOffsetY = e.clientY - rect.top;
    document.body.style.userSelect = 'none';

    tardtestTitlebar.setPointerCapture(e.pointerId);

    window.addEventListener('pointermove', tardtestDragMove);
    window.addEventListener('pointerup', tardtestDragEnd);
});

// Also bring to front when clicking anywhere on the window
tardtestWindow.addEventListener('pointerdown', () => {
    if (typeof bringWindowToFront === 'function') {
        bringWindowToFront(tardtestWindow);
    }
});

function tardtestDragMove(e) {
    if (tardtestDragState.isDragging) {
        let left = e.clientX - tardtestDragState.dragOffsetX;
        let top = e.clientY - tardtestDragState.dragOffsetY;

        const border = 4;
        const titlebarHeight = 20;
        const toolbarHeight = 25;
        const topOffset = titlebarHeight + toolbarHeight;
        const rect = tardtestWindow.getBoundingClientRect();
        const parentW = window.innerWidth;
        const parentH = window.innerHeight;
        const maxLeft = parentW - rect.width - border;
        const maxTop = parentH - rect.height - border;

        left = Math.max(border, Math.min(left, maxLeft));
        top = Math.max(topOffset + border, Math.min(top, maxTop));

        tardtestWindow.style.left = left + "px";
        tardtestWindow.style.top = top + "px";
    }
}

function tardtestDragEnd(e) {
    tardtestDragState.isDragging = false;
    document.body.style.userSelect = '';
    tardtestTitlebar.releasePointerCapture(e.pointerId);
    window.removeEventListener('pointermove', tardtestDragMove);
    window.removeEventListener('pointerup', tardtestDragEnd);
}

function clampTardTestPosition() {
    const rect = tardtestWindow.getBoundingClientRect();
    const parentW = window.innerWidth;
    const parentH = window.innerHeight;
    const border = 4;
    const titlebarHeight = 20;
    const toolbarHeight = 25;
    const topOffset = titlebarHeight + toolbarHeight;

    let left = parseInt(tardtestWindow.style.left, 10) || 100;
    let top = parseInt(tardtestWindow.style.top, 10) || 100;

    const maxLeft = parentW - rect.width - border;
    const maxTop = parentH - rect.height - border;

    left = Math.max(border, Math.min(left, maxLeft));
    top = Math.max(topOffset + border, Math.min(top, maxTop));

    tardtestWindow.style.left = left + "px";
    tardtestWindow.style.top = top + "px";
}

// Keep window within bounds when main window is resized
window.addEventListener('resize', () => {
    if (tardtestWindow.style.display !== 'none') {
        clampTardTestPosition();
    }
});