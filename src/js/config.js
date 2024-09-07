// This file should not contain actual API keys

export const getOpenWeatherApiKey = () => {
  const key = window.env?.OPENWEATHER_API_KEY || 'OPENWEATHER_API_KEY_PLACEHOLDER';
  console.log('OpenWeather API Key:', key === 'OPENWEATHER_API_KEY_PLACEHOLDER' ? 'Not Set' : 'Set');
  return key;
};

export const getGoogleMapsApiKey = () => {
  const key = window.env?.GOOGLE_MAPS_API_KEY || 'GOOGLE_MAPS_API_KEY_PLACEHOLDER';
  console.log('Google Maps API Key:', key === 'GOOGLE_MAPS_API_KEY_PLACEHOLDER' ? 'Not Set' : 'Set');
  return key;
};

// Helper function to get the base URL for API calls
export const getApiBaseUrl = () => {
  const baseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:8888/.netlify/functions'
    : '/.netlify/functions';
  console.log('API Base URL:', baseUrl);
  return baseUrl;
};