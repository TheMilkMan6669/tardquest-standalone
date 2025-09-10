document.addEventListener('DOMContentLoaded', function() {
    const crtFilter = document.getElementById('crtFilter');
    const dither = document.getElementById('ditherOverlay');
    const filterSelect = document.getElementById('filterSelect');
    const savedFilter = localStorage.getItem('/AppData/scripts/retroFilter') || 'off';

    filterSelect.selectedIndex = 0;

    applyRetroFilter(savedFilter);

    filterSelect.addEventListener('change', function() {
        const value = filterSelect.value;
        localStorage.setItem('/AppData/scripts/retroFilter', value);
        applyRetroFilter(value);
        filterSelect.selectedIndex = 0;
    });
});

function applyRetroFilter(value) {
    const crt = document.getElementById('crtFilter');
    const dither = document.getElementById('ditherOverlay');
    crt.classList.remove('active');
    dither.style.display = 'none';

    if (value === 'on') {
        crt.classList.add('active');
    } else if (value === 'both') {
        crt.classList.add('active');
        dither.style.display = 'block';
    }
}