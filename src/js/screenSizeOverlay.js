console.log('Screen size overlay script started'); // Debug log

const screenSizeOverlay = document.getElementById('screen-size-overlay');

if (!screenSizeOverlay) {
    console.error('Screen size overlay element not found!');
}

function checkScreenSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    console.log('Window dimensions:', width, 'x', height); // Debug log

    if (width < 1000 || height < 890) {
        console.log('Showing overlay'); // Debug log
        screenSizeOverlay.classList.remove('hidden');
    } else {
        console.log('Hiding overlay'); // Debug log
        screenSizeOverlay.classList.add('hidden');
    }
}

// Check on load
window.addEventListener('load', () => {
    console.log('Window loaded');
    checkScreenSize();
});

// Check on resize
window.addEventListener('resize', checkScreenSize);

// Initial check
checkScreenSize();

console.log('Screen size overlay script finished loading'); // Debug log