const devSelect = document.getElementById('devSelect');
const passwordModal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');
const passwordSubmit = document.getElementById('passwordSubmit');
const passwordCancel = document.getElementById('passwordCancel');

const DEV_PASSWORD = "0451";
let pendingAction = null;

// Dropdown toggle logic
devSelect.addEventListener('change', function() {
    if (this.value === 'tardtest') {
        pendingAction = 'tardtest';
        showPasswordModal();
        this.selectedIndex = 0;
    } else if (this.value === 'apitest') {
        pendingAction = 'apitest';
        showPasswordModal();
        this.selectedIndex = 0;
    }
});

function showPasswordModal() {
    passwordModal.style.display = 'flex';
    passwordInput.value = '';
    passwordInput.focus();
}

function hidePasswordModal() {
    passwordModal.style.display = 'none';
    pendingAction = null;
}

function checkPassword() {
    const enteredPassword = passwordInput.value;
    
    if (enteredPassword === DEV_PASSWORD) {
        const actionToTake = pendingAction;
        hidePasswordModal();
        
        if (actionToTake === 'tardtest') {
            const tardtestWindow = document.getElementById('tardtestWindow');
            const tardtestContent = document.getElementById('tardtestContent');
            if (tardtestWindow) {
                tardtestWindow.style.display = 'flex';
                tardtestWindow.style.position = 'fixed';
                tardtestWindow.style.left = '100px';
                tardtestWindow.style.top = '100px';
                tardtestWindow.style.zIndex = '2001';
                
                if (tardtestContent && !tardtestContent.querySelector('iframe')) {
                    const iframe = document.createElement('iframe');
                    iframe.src = '../GameData/tests/TardTest.html';
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = 'none';
                    iframe.id = 'tardtestIframe';
                    tardtestContent.appendChild(iframe);
                }
            }
            
        } else if (actionToTake === 'apitest') {
            const apitestWindow = document.getElementById('apitestWindow');
            const apitestContent = document.getElementById('apitestContent');
            if (apitestWindow) {
                apitestWindow.style.display = 'flex';
                apitestWindow.style.position = 'fixed';
                apitestWindow.style.left = '150px';
                apitestWindow.style.top = '150px';
                apitestWindow.style.zIndex = '2001';
                
                if (apitestContent && !apitestContent.querySelector('iframe')) {
                    const iframe = document.createElement('iframe');
                    iframe.src = '../GameData/tests/APITest.html';
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = 'none';
                    iframe.id = 'apitestIframe';
                    apitestContent.appendChild(iframe);
                }
            }
        }
    } else {
        alert('Incorrect password!');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// Password modal event listeners
passwordSubmit.addEventListener('click', checkPassword);
passwordCancel.addEventListener('click', () => {
    hidePasswordModal();
});

passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkPassword();
    } else if (e.key === 'Escape') {
        hidePasswordModal();
    }
});

// Close modal when clicking outside of it
passwordModal.addEventListener('click', function(e) {
    if (e.target === passwordModal) {
        hidePasswordModal();
    }
});