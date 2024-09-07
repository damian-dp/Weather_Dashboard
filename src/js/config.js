// This file should not contain actual API keys

export const getOpenWeatherApiKey = () => {
  return 'OPENWEATHER_API_KEY_PLACEHOLDER';
};

export const getGoogleMapsApiKey = () => {
  return 'GOOGLE_MAPS_API_KEY_PLACEHOLDER';
};

// Helper function to get the base URL for API calls
export const getApiBaseUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8888/.netlify/functions'
    : '/.netlify/functions';
};