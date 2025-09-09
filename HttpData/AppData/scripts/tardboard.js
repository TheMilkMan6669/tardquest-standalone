const onlineSelect = document.getElementById('onlineSelect');
const leaderboardWindow = document.getElementById('leaderboardWindow');
const leaderboardContent = document.getElementById('leaderboardContent');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const leaderboardTitlebar = document.getElementById('leaderboardTitlebar');
let leaderboardLoaded = false;

// Dropdown toggle logic
onlineSelect.addEventListener('change', function() {
    if (this.value === 'tardboard') {
        if (leaderboardWindow.style.display === 'none') {
            leaderboardWindow.style.display = 'flex';
            if (!leaderboardLoaded) {
                const iframe = document.createElement('iframe');
                iframe.src = '../GameData/leaderboard.html';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                iframe.id = 'leaderboardIframe';
                leaderboardContent.appendChild(iframe);
                leaderboardLoaded = true;
            }
            // Clamp position when showing the window
            clampTardboardPosition();
        } else {
            leaderboardWindow.style.display = 'none';
            leaderboardContent.innerHTML = '';
            leaderboardLoaded = false;
        }
        // Reset dropdown to placeholder
        this.selectedIndex = 0;
    }
});

// Close button logic
closeLeaderboardBtn.addEventListener('click', () => {
    leaderboardWindow.style.display = 'none';
    leaderboardContent.innerHTML = '';
    leaderboardLoaded = false;
});

// Drag logic
let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;

leaderboardTitlebar.addEventListener('pointerdown', (e) => {
    if (e.target === closeLeaderboardBtn) return;
    isDragging = true;
    const rect = leaderboardWindow.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    document.body.style.userSelect = 'none';

    leaderboardTitlebar.setPointerCapture(e.pointerId);

    window.addEventListener('pointermove', dragMove);
    window.addEventListener('pointerup', dragEnd);
});

function dragMove(e) {
    if (isDragging) {
        let left = e.clientX - dragOffsetX;
        let top = e.clientY - dragOffsetY;

        const border = 4;
        const titlebarHeight = 20;
        const toolbarHeight = 25;
        const topOffset = titlebarHeight + toolbarHeight;
        const rect = leaderboardWindow.getBoundingClientRect();
        const parentW = window.innerWidth;
        const parentH = window.innerHeight;
        const maxLeft = parentW - rect.width - border;
        const maxTop = parentH - rect.height - border;

        left = Math.max(border, Math.min(left, maxLeft));
        top = Math.max(topOffset + border, Math.min(top, maxTop));

        leaderboardWindow.style.left = left + "px";
        leaderboardWindow.style.top = top + "px";
    }
}

function dragEnd(e) {
    isDragging = false;
    document.body.style.userSelect = '';
    leaderboardTitlebar.releasePointerCapture(e.pointerId);
    window.removeEventListener('pointermove', dragMove);
    window.removeEventListener('pointerup', dragEnd);
}

function clampTardboardPosition() {
    const win = leaderboardWindow;
    const rect = win.getBoundingClientRect();
    const parentW = window.innerWidth;
    const parentH = window.innerHeight;
    const border = 4;
    const titlebarHeight = 20;
    const toolbarHeight = 25;
    const topOffset = titlebarHeight + toolbarHeight;

    let left = parseInt(win.style.left, 10) || rect.left;
    let top = parseInt(win.style.top, 10) || rect.top;

    const maxLeft = parentW - rect.width - border;
    const maxTop = parentH - rect.height - border;

    left = Math.max(border, Math.min(left, maxLeft));
    top = Math.max(topOffset + border, Math.min(top, maxTop));

    win.style.left = left + "px";
    win.style.top = top + "px";
}

// Keep leaderboard window within bounds when main window is resized
window.addEventListener('resize', () => {
    if (leaderboardWindow.style.display !== 'none') {
        clampTardboardPosition();
    }
});