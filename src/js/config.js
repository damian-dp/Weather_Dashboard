// This file should not contain actual API keys

export const getOpenWeatherApiKey = () => {
  return 'OPENWEATHER_API_KEY_PLACEHOLDER';
};

export const getGoogleMapsApiKey = () => {
  return 'GOOGLE_MAPS_API_KEY_PLACEHOLDER';
};

// Helper function to get the base URL for API calls
export const getApiBaseUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // For browser environment
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:8888/.netlify/functions'
      : '/.netlify/functions';
  } else {
    // For Node.js environment (should not be reached in browser)
    return process.env.NODE_ENV === 'development'
      ? 'http://localhost:8888/.netlify/functions'
      : '/.netlify/functions';
  }
};