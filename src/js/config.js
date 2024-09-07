console.log('Config.js: window.env =', window.env);
console.log('Config.js: OPENWEATHER_API_KEY =', window.env?.OPENWEATHER_API_KEY || 'not set');
console.log('Config.js: GOOGLE_MAPS_API_KEY =', window.env?.GOOGLE_MAPS_API_KEY || 'not set');

export const OPENWEATHER_API_KEY = window.env?.OPENWEATHER_API_KEY || '';
export const GOOGLE_MAPS_API_KEY = window.env?.GOOGLE_MAPS_API_KEY || '';