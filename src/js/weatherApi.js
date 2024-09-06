import { OPENWEATHER_API_KEY, GOOGLE_MAPS_API_KEY } from './config.js';

export async function getWeatherDataByLocation(location, units) {
    // ... (existing getWeatherDataByLocation function)
}

export async function getWeatherData(lat, lon, units) {
    const url = `/.netlify/functions/weather-proxy?lat=${lat}&lon=${lon}&units=${units}&apiKey=${encodeURIComponent(OPENWEATHER_API_KEY)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API call failed with status ${response.status}`);
        }
        const data = await response.json();
        if (!data || !data.current) {
            throw new Error('Invalid weather data received from API');
        }
        return data;
    } catch (error) {
        console.error('Error in getWeatherData:', error);
        throw error;
    }
}

export async function getLocationName(lat, lon) {
    // ... (existing getLocationName function)
}

export async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    });
                },
                (error) => {
                    console.warn("Geolocation error:", error);
                    // Default to Melbourne, Australia if geolocation fails
                    resolve({
                        lat: -37.8136,
                        lon: 144.9631,
                    });
                }
            );
        } else {
            console.warn("Geolocation is not supported by this browser.");
            // Default to Melbourne, Australia if geolocation is not supported
            resolve({
                lat: -37.8136,
                lon: 144.9631,
            });
        }
    });
}