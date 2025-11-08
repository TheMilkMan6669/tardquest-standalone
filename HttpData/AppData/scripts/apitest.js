const apitestWindow = document.getElementById('apitestWindow');
const apitestContent = document.getElementById('apitestContent');
const closeApitestBtn = document.getElementById('closeApitestBtn');
const apitestTitlebar = document.getElementById('apitestTitlebar');

let apitestLoaded = false;
let apitestDragState = { isDragging: false, dragOffsetX: 0, dragOffsetY: 0 };

// Listen for password-protected open event
window.addEventListener('openAPITest', toggleAPITest);

// Function to show/hide APITest window
function toggleAPITest() {
    console.log('APITest toggle called');
    if (apitestWindow.style.display === 'none' || apitestWindow.style.display === '') {
        apitestWindow.style.display = 'flex';
        apitestWindow.style.position = 'fixed';
        apitestWindow.style.left = '150px';
        apitestWindow.style.top = '150px';
        apitestWindow.style.zIndex = '2000';
        
        if (!apitestLoaded) {
            const iframe = document.createElement('iframe');
            iframe.src = '../GameData/tests/APITest.html';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.id = 'apitestIframe';
            apitestContent.appendChild(iframe);
            apitestLoaded = true;
        }
        clampAPITestPosition();
    } else {
        apitestWindow.style.display = 'none';
        apitestContent.innerHTML = '';
        apitestLoaded = false;
    }
}

// Close button logic
closeApitestBtn.addEventListener('click', () => {
    apitestWindow.style.display = 'none';
    apitestContent.innerHTML = '';
    apitestLoaded = false;
});

// Drag logic for APITest window
apitestTitlebar.addEventListener('pointerdown', (e) => {
    if (e.target === closeApitestBtn) return;
    
    // Bring window to front
    if (typeof bringWindowToFront === 'function') {
        bringWindowToFront(apitestWindow);
    }
    
    apitestDragState.isDragging = true;
    const rect = apitestWindow.getBoundingClientRect();
    apitestDragState.dragOffsetX = e.clientX - rect.left;
    apitestDragState.dragOffsetY = e.clientY - rect.top;
    document.body.style.userSelect = 'none';

    apitestTitlebar.setPointerCapture(e.pointerId);

    window.addEventListener('pointermove', apitestDragMove);
    window.addEventListener('pointerup', apitestDragEnd);
});

// Also bring to front when clicking anywhere on the window
apitestWindow.addEventListener('pointerdown', () => {
    if (typeof bringWindowToFront === 'function') {
        bringWindowToFront(apitestWindow);
    }
});

function apitestDragMove(e) {
    if (apitestDragState.isDragging) {
        let left = e.clientX - apitestDragState.dragOffsetX;
        let top = e.clientY - apitestDragState.dragOffsetY;

        const border = 4;
        const titlebarHeight = 20;
        const toolbarHeight = 25;
        const topOffset = titlebarHeight + toolbarHeight;
        const rect = apitestWindow.getBoundingClientRect();
        const parentW = window.innerWidth;
        const parentH = window.innerHeight;
        const maxLeft = parentW - rect.width - border;
        const maxTop = parentH - rect.height - border;

        left = Math.max(border, Math.min(left, maxLeft));
        top = Math.max(topOffset + border, Math.min(top, maxTop));

        apitestWindow.style.left = left + "px";
        apitestWindow.style.top = top + "px";
    }
}

function apitestDragEnd(e) {
    apitestDragState.isDragging = false;
    document.body.style.userSelect = '';
    apitestTitlebar.releasePointerCapture(e.pointerId);
    window.removeEventListener('pointermove', apitestDragMove);
    window.removeEventListener('pointerup', apitestDragEnd);
}

function clampAPITestPosition() {
    const rect = apitestWindow.getBoundingClientRect();
    const parentW = window.innerWidth;
    const parentH = window.innerHeight;
    const border = 4;
    const titlebarHeight = 20;
    const toolbarHeight = 25;
    const topOffset = titlebarHeight + toolbarHeight;

    let left = parseInt(apitestWindow.style.left, 10) || 150;
    let top = parseInt(apitestWindow.style.top, 10) || 150;

    const maxLeft = parentW - rect.width - border;
    const maxTop = parentH - rect.height - border;

    left = Math.max(border, Math.min(left, maxLeft));
    top = Math.max(topOffset + border, Math.min(top, maxTop));

    apitestWindow.style.left = left + "px";
    apitestWindow.style.top = top + "px";
}

// Keep window within bounds when main window is resized
window.addEventListener('resize', () => {
    if (apitestWindow.style.display !== 'none') {
        clampAPITestPosition();
    }
});