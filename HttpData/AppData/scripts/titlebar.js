function changeBorder() {
    const select = document.getElementById('borderSelect');
    const selectedBorder = select.value;
    const bodyStyle = document.body.style;
    const htmlStyle = document.documentElement.style;
    
    if (selectedBorder === '') {
        bodyStyle.backgroundImage = 'none';
        htmlStyle.backgroundImage = 'none';
        localStorage.setItem('selectedBorder', '');
        select.selectedIndex = 0;
        return;
    }
    
    // Set the background image
    bodyStyle.backgroundImage = `url("borders/${selectedBorder}")`;
    htmlStyle.backgroundImage = `url("borders/${selectedBorder}")`;

    // Apply specific styles for tile1
    if (selectedBorder === 'tile1.gif') {
        bodyStyle.backgroundSize = 'auto 40px';
        bodyStyle.backgroundRepeat = 'repeat';
        htmlStyle.backgroundSize = 'auto 40px';
        htmlStyle.backgroundRepeat = 'repeat';
    } else {
        // Default styles for other borders
        bodyStyle.backgroundSize = 'cover';
        bodyStyle.backgroundRepeat = 'no-repeat';
        htmlStyle.backgroundSize = 'cover';
        htmlStyle.backgroundRepeat = 'no-repeat';
    }
    
    // Save to localStorage
    localStorage.setItem('selectedBorder', selectedBorder);
    select.selectedIndex = 0;
}

function loadSavedBorder() {
    const savedBorder = localStorage.getItem('selectedBorder');
    if (savedBorder !== null) {
        const bodyStyle = document.body.style;
        const htmlStyle = document.documentElement.style;
        
        if (savedBorder === '') {
            bodyStyle.backgroundImage = 'none';
            htmlStyle.backgroundImage = 'none';
        } else {
            bodyStyle.backgroundImage = `url("borders/${savedBorder}")`;
            htmlStyle.backgroundImage = `url("borders/${savedBorder}")`;

            if (savedBorder === 'tile1.gif') {
                bodyStyle.backgroundSize = 'auto 40px';
                bodyStyle.backgroundRepeat = 'repeat';
                htmlStyle.backgroundSize = 'auto 40px';
                htmlStyle.backgroundRepeat = 'repeat';
            } else {
                bodyStyle.backgroundSize = 'cover';
                bodyStyle.backgroundRepeat = 'no-repeat';
                htmlStyle.backgroundSize = 'cover';
                htmlStyle.backgroundRepeat = 'no-repeat';
            }
        }
    }
}

function resizeFrame() {
    const iframe = document.getElementById('gameFrame');
    const originalWidth = 696;
    const originalHeight = 646;
    const aspectRatio = originalWidth / originalHeight;
    
    // Calculate available space
    const controlsHidden = document.body.classList.contains('fullscreen-controls-hidden');
    const titlebarHeight = controlsHidden ? 0 : 20;
    const toolbarHeight = controlsHidden ? 0 : 23;
    const borderWidth = 4; // Your body border
    
    const availableWidth = window.innerWidth - (borderWidth * 2);
    const availableHeight = window.innerHeight - titlebarHeight - toolbarHeight - (borderWidth * 2);
    
    const windowAspectRatio = availableWidth / availableHeight;
    
    let scale;
    if (windowAspectRatio > aspectRatio) {
        // Height-constrained: scale to fit height
        scale = availableHeight / originalHeight;
    } else {
        // Width-constrained: scale to fit width
        scale = availableWidth / originalWidth;
    }
    
    iframe.style.transform = `scale(${scale})`;
    iframe.style.transformOrigin = 'top center';
}

let controlsHideTimeout;

function setFullscreenMode(isFullscreen) {
    document.body.classList.toggle('fullscreen-mode', isFullscreen);
    document.body.classList.toggle('fullscreen-controls-hidden', isFullscreen);
    resizeFrame();
}

function showFullscreenControls() {
    clearTimeout(controlsHideTimeout);
    document.body.classList.remove('fullscreen-controls-hidden');
    resizeFrame();
}

function hideFullscreenControls() {
    if (document.body.classList.contains('fullscreen-mode')) {
        document.body.classList.add('fullscreen-controls-hidden');
        resizeFrame();
    }
}

function setupFullscreenControls() {
    window.electronAPI.onFullscreenChange((_event, isFullscreen) => {
        setFullscreenMode(isFullscreen);
    });

    window.electronAPI.isFullscreen().then(setFullscreenMode);

    document.addEventListener('mousemove', (event) => {
        if (!document.body.classList.contains('fullscreen-mode')) {
            return;
        }

        if (event.clientY <= 12) {
            showFullscreenControls();
        } else if (!document.body.classList.contains('fullscreen-controls-hidden')) {
            clearTimeout(controlsHideTimeout);
            controlsHideTimeout = setTimeout(hideFullscreenControls, 630);
        }
    });
}

// Load saved border on page load
window.addEventListener('load', function() {
    loadSavedBorder();
    setupFullscreenControls();
    resizeFrame();
});

resizeFrame();

let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeFrame, 50);
});