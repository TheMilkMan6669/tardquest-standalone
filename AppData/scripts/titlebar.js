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
    const titlebarHeight = 20;
    const toolbarHeight = 23;
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

// Load saved border on page load
window.addEventListener('load', function() {
    loadSavedBorder();
    resizeFrame();
});

resizeFrame();

let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeFrame, 50);
});