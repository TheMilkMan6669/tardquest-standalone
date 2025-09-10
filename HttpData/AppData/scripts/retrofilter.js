document.addEventListener('DOMContentLoaded', function() {
    const savedFilter = localStorage.getItem('/AppData/scripts/retroFilter');
    const crtFilter = document.getElementById('crtFilter');
    
    if (savedFilter === 'on') {
        crtFilter.classList.add('active');
    }
});

function toggleRetroFilter() {
    const filterSelect = document.getElementById('filterSelect');
    const crtFilter = document.getElementById('crtFilter');
    
    if (filterSelect.value === 'on') {
        crtFilter.classList.add('active');
        localStorage.setItem('/AppData/scripts/retroFilter', 'on');
    } else {
        crtFilter.classList.remove('active');
        localStorage.setItem('/AppData/scripts/retroFilter', 'off');
    }

    filterSelect.selectedIndex = 0;
}