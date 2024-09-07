import { initTheme } from './theme.js';
import { updateCardsWrapperWidth, renderInitialCard } from './cardManager.js';
import { getOpenWeatherApiKey, getGoogleMapsApiKey } from './config.js'; // Update this line
import { initializeEventListeners } from './eventListeners.js';
import { initMap } from './map.js';
import { showLoadingOverlay, hideLoadingOverlay, ensureMinimumLoadingTime } from './loading.js';

export let cardsWrapper = document.getElementById("cards-wrapper");
export let currentUnits = "metric";
export let tempToggle = document.getElementById("temp-toggle");
export let isAddingCard = false;

export let lightModeToggle, darkModeToggle;

console.log('Main.js loaded');

const OPENWEATHER_API_KEY = getOpenWeatherApiKey();
const GOOGLE_MAPS_API_KEY = getGoogleMapsApiKey();

if (!OPENWEATHER_API_KEY || !GOOGLE_MAPS_API_KEY) {
  console.error('API keys are not set. Please check your environment variables or env.js file.');
}

if (!window.env || !window.env.OPENWEATHER_API_KEY || !window.env.GOOGLE_MAPS_API_KEY) {
  console.error('Environment variables are not set correctly');
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
      await renderInitialCard();
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