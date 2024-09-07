// This file should not contain actual API keys

export const getOpenWeatherApiKey = () => {
  return window.env?.REACT_APP_OPENWEATHER_API_KEY || 'OPENWEATHER_API_KEY_PLACEHOLDER';
};

export const getGoogleMapsApiKey = () => {
  return window.env?.REACT_APP_GOOGLE_MAPS_API_KEY || 'GOOGLE_MAPS_API_KEY_PLACEHOLDER';
};

// Helper function to get the base URL for API calls
export const getApiBaseUrl = () => {
  return window.location.hostname === 'localhost' 
    ? 'http://localhost:8888/.netlify/functions'
    : '/.netlify/functions';
};