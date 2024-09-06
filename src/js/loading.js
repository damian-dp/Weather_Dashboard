// Function to hide the loading overlay
export function hideLoadingOverlay() {
    console.log("Hiding loading overlay");
    const overlay = document.getElementById('global-loading-overlay');
    overlay.classList.add('fade-out');
    // We don't need to set display: none anymore, as visibility: hidden will do the job
}

// Function to show the loading overlay
export function showLoadingOverlay() {
    console.log("Showing loading overlay");
    const overlay = document.getElementById('global-loading-overlay');
    overlay.classList.remove('fade-out');
}

// Function to ensure minimum loading time
export function ensureMinimumLoadingTime(callback, minTime = 1000) {
    console.log("Ensuring minimum loading time");
    const startTime = Date.now();
    return new Promise((resolve) => {
        const runCallback = callback ? callback() : Promise.resolve();
        
        Promise.resolve(runCallback).then(() => {
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