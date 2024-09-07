import { initTheme } from './theme.js';
import { updateCardsWrapperWidth, renderInitialCard } from './cardManager.js';
import { OPENWEATHER_API_KEY, GOOGLE_MAPS_API_KEY } from './config.js';
import { initializeEventListeners } from './eventListeners.js';
import { initMap } from './map.js';
import { showLoadingOverlay, hideLoadingOverlay, ensureMinimumLoadingTime } from './loading.js';

export let cardsWrapper = document.getElementById("cards-wrapper");
export let currentUnits = "metric";
export let tempToggle = document.getElementById("temp-toggle");
export let isAddingCard = false;

export let lightModeToggle, darkModeToggle;

// Remove or comment out these lines
// console.log('Window env:', window.env);
// console.log('OPENWEATHER_API_KEY:', OPENWEATHER_API_KEY);
// console.log('GOOGLE_MAPS_API_KEY:', GOOGLE_MAPS_API_KEY);

// Keep this error check, but don't log the actual keys
if (!OPENWEATHER_API_KEY || !GOOGLE_MAPS_API_KEY) {
  console.error('API keys are not set. Please check your environment variables or env.js file.');
}

async function initializeApp() {
  showLoadingOverlay();
  
  try {
    await ensureMinimumLoadingTime(async () => {
      lightModeToggle = document.getElementById('light-mode-toggle');
      darkModeToggle = document.getElementById('dark-mode-toggle');
      
      initTheme();
      initializeEventListeners();
      updateCardsWrapperWidth();
      await renderInitialCard(); // Make sure this line is present
    });
  } catch (error) {
    console.error('Error initializing app:', error);
  } finally {
    hideLoadingOverlay();
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);

window.addEventListener('resize', () => {
    updateCardsWrapperWidth();
});

// Make initMap available globally
window.initMap = initMap;