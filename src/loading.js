// Function to hide the loading overlay
function hideLoadingOverlay() {
    console.log("Hiding loading overlay");
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('fade-out');
    setTimeout(() => {
        overlay.style.display = 'none';
        console.log("Loading overlay hidden");
    }, 500); // Match this to the CSS transition duration
}

// Function to show the loading overlay
function showLoadingOverlay() {
    console.log("Showing loading overlay");
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'flex';
    overlay.classList.remove('fade-out');
}

// Function to ensure minimum loading time
function ensureMinimumLoadingTime(callback, minTime = 3000) {
    console.log("Ensuring minimum loading time");
    const startTime = Date.now();
    return new Promise((resolve) => {
        callback().then(() => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minTime - elapsedTime);
            console.log(`Elapsed time: ${elapsedTime}ms, Remaining time: ${remainingTime}ms`);
            setTimeout(() => {
                hideLoadingOverlay();
                resolve();
            }, remainingTime);
        }).catch((error) => {
            console.error("Error in callback:", error);
            hideLoadingOverlay();
            resolve();
        });
    });
}

// Export the functions
export { hideLoadingOverlay, showLoadingOverlay, ensureMinimumLoadingTime };