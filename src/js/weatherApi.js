import { OPENWEATHER_API_KEY, GOOGLE_MAPS_API_KEY } from './config.js';

export async function getWeatherDataByLocation(location, units) {
    const url = `/.netlify/functions/geocoding-proxy?location=${encodeURIComponent(location)}`;
    const geocodingResponse = await fetch(url);

    if (!geocodingResponse.ok) {
        throw new Error(`Geocoding API call failed with status ${geocodingResponse.status}`);
    }

    const geocodingData = await geocodingResponse.json();
    if (geocodingData.length === 0) {
        throw new Error("Location not found");
    }

    const lat = geocodingData[0].lat;
    const lon = geocodingData[0].lon;
    const weatherData = await getWeatherData(lat, lon, units);
    return { weatherData, lat, lon };
}

export async function getWeatherData(lat, lon, units) {
    const url = `/.netlify/functions/weather-proxy?lat=${lat}&lon=${lon}&units=${units}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
    }
    const data = await response.json();
    if (!data || !data.current) {
        throw new Error('Invalid weather data received from API');
    }
    return data;
}

export async function getLocationName(lat, lon) {
    try {
        const response = await fetch(`/.netlify/functions/google-geocoding-proxy?lat=${lat}&lon=${lon}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON:", text);
            throw new Error("Invalid JSON response");
        }
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            let city = '';
            let country = '';

            for (let component of result.address_components) {
                if (component.types.includes('locality') || component.types.includes('postal_town')) {
                    city = component.long_name;
                } else if (component.types.includes('country')) {
                    country = component.long_name;
                }
            }

            if (city && country) {
                return `${city}, ${country}`;
            } else if (city) {
                return city;
            } else if (country) {
                return country;
            } else {
                return "Unknown Location";
            }
        } else {
            return "Unknown Location";
        }
    } catch (error) {
        console.error("Error fetching location name:", error);
        return "Unknown Location";
    }
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