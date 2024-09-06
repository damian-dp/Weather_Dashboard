let cardsWrapper = document.getElementById("cards-wrapper");
let currentUnits = "metric";
let tempToggle = document.getElementById("temp-toggle");

// Add this line
let isAddingCard = false;

const lightModeToggle = document.getElementById('light-mode-toggle');
const darkModeToggle = document.getElementById('dark-mode-toggle');

console.log('Window env:', window.env);
const OPENWEATHER_API_KEY = window.env?.OPENWEATHER_API_KEY || '';
const GOOGLE_MAPS_API_KEY = window.env?.GOOGLE_MAPS_API_KEY || '';

console.log('OPENWEATHER_API_KEY:', OPENWEATHER_API_KEY);
console.log('GOOGLE_MAPS_API_KEY:', GOOGLE_MAPS_API_KEY);

// Add a check to ensure the keys are available
if (!OPENWEATHER_API_KEY || !GOOGLE_MAPS_API_KEY) {
  console.error('API keys are not set. Please check your environment variables or env.js file.');
}

function mapIconCode(code) {
    if (!code) {
        console.error('Invalid weather icon code:', code);
        return '01'; // Default to clear sky if code is invalid
    }
    const iconMap = {
        '01': '01', // Clear sky
        '02': '02', // Few clouds
        '03': '03', // Scattered clouds
        '04': '03', // Broken clouds (mapped to Cloudy)
        '09': '10', // Shower rain (mapped to Rain)
        '10': '10', // Rain
        '11': '11', // Thunderstorm
        '13': '13', // Snow
        '50': '50'  // Mist
    };
    return iconMap[code.slice(0, 2)] || '01'; // Default to clear sky if unknown
}

function toggleTheme() {
    const flexibleSpacers = document.querySelectorAll('.flexible-spacer');
    const mapContainers = document.querySelectorAll('.map-container');
    const mapGradients = document.querySelectorAll('.flexible-spacer::before');
    const transitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--transition-duration')) * 1000;
    
    // Immediately fade out flexible spacers, map containers, and map gradients
    flexibleSpacers.forEach(spacer => {
        spacer.style.opacity = '0';
    });
    mapContainers.forEach(container => {
        container.style.opacity = '0';
    });
    mapGradients.forEach(gradient => {
        gradient.style.opacity = '0';
    });

    // Delay the theme toggle and other changes
    setTimeout(() => {
        // Toggle theme
        const isDarkMode = document.documentElement.classList.toggle('dark-mode');
        document.documentElement.classList.toggle('light-mode', !isDarkMode);
        
        // Update localStorage
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

        // Toggle button visibility
        lightModeToggle.style.display = isDarkMode ? 'none' : 'flex';
        darkModeToggle.style.display = isDarkMode ? 'flex' : 'none';

        // Remove hover-ready class from both buttons
        lightModeToggle.classList.remove('hover-ready');
        darkModeToggle.classList.remove('hover-ready');

        // Update map background color
        document.documentElement.style.setProperty('--map-background-color', getComputedStyle(document.documentElement).getPropertyValue('--background-color'));
        document.documentElement.style.setProperty('--map-background-color-rgb', getComputedStyle(document.documentElement).getPropertyValue('--background-color-rgb'));

        // Update all maps
        mapContainers.forEach(container => {
            const lat = parseFloat(container.closest('.card').dataset.lat);
            const lon = parseFloat(container.closest('.card').dataset.lon);
            initMap(container, lat, lon);
        });

        // Fade in flexible spacers, map containers, and gradients
        setTimeout(() => {
            flexibleSpacers.forEach(spacer => {
                spacer.style.transition = `opacity var(--transition-duration) var(--transition-easing)`;
                spacer.style.opacity = '1';
            });
            mapContainers.forEach(container => {
                container.style.transition = `opacity var(--transition-duration) var(--transition-easing)`;
                container.style.opacity = '1';
            });
            mapGradients.forEach(gradient => {
                gradient.style.transition = `opacity var(--transition-duration) var(--transition-easing)`;
                gradient.style.opacity = '1';
            });
        }, 200); // Increased delay to 200ms
    }, 250);
}

function handleButtonMouseLeave(button) {
    button.classList.add('hover-ready');
}

lightModeToggle.addEventListener('click', toggleTheme);
darkModeToggle.addEventListener('click', toggleTheme);

lightModeToggle.addEventListener('mouseleave', () => handleButtonMouseLeave(lightModeToggle));
darkModeToggle.addEventListener('mouseleave', () => handleButtonMouseLeave(darkModeToggle));

// Set initial state on page load
document.addEventListener('DOMContentLoaded', (event) => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isDarkMode = savedTheme === 'dark';

    document.documentElement.classList.toggle('dark-mode', isDarkMode);
    document.documentElement.classList.toggle('light-mode', !isDarkMode);

    // Set initial button visibility
    lightModeToggle.style.display = isDarkMode ? 'none' : 'flex';
    darkModeToggle.style.display = isDarkMode ? 'flex' : 'none';

    // Add this line to set up the add-card button listener
    addAddCardEventListener();
});

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update the existing addNewCard function
async function addNewCard(location) {
    console.log(`Adding new card for ${location}`);
    if (isAddingCard) {
        console.log("Already adding a card, please wait.");
        return;
    }
    try {
        isAddingCard = true;
        const { weatherData, lat, lon } = await getWeatherDataByLocation(location, currentUnits);
        console.log(`Weather data received for ${location}`);
        const card = await createCard(weatherData, lat, lon, currentUnits);
        console.log(`Card created for ${location}`);
        if (card instanceof Node) {
            cardsWrapper.appendChild(card);
            updateCardsWrapperWidth(); // Add this line
            console.log(`Card appended to wrapper for ${location}`);
            await Promise.all([
                initMap(card.querySelector('.map-container'), lat, lon),
                getLocationName(lat, lon).then(locationName => {
                    card.querySelector('.card-location').innerText = locationName;
                }),
                loadAllSvgIcons(card)
            ]);
            console.log(`All promises resolved for ${location}`);
        } else {
            throw new Error("Failed to create card");
        }
    } catch (error) {
        console.error(`Error adding new card for ${location}:`, error);
        alert(`Failed to add card for ${location}: ${error.message}`);
    } finally {
        isAddingCard = false;
    }
}

// Function to fetch weather data by location
async function getWeatherDataByLocation(location, units) {
    const geocodingResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );

    if (!geocodingResponse.ok) {
        throw new Error(
            `Geocoding API call failed with status ${geocodingResponse.status}`
        );
    }

    const geocodingData = await geocodingResponse.json();
    if (geocodingData.length === 0) {
        throw new Error("Location not found");
    }

    const { lat, lon } = geocodingData[0];
    const weatherData = await getWeatherData(lat, lon, units);
    return { weatherData, lat, lon };
}

async function getWeatherData(lat, lon, units) {
    const url = `/.netlify/functions/weather-proxy?lat=${lat}&lon=${lon}&units=${units}&apiKey=${encodeURIComponent(OPENWEATHER_API_KEY)}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API call failed with status ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in getWeatherData:', error);
        throw error;
    }
}

async function getUserLocation() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    });
                },
                () => {
                    // Default to Melbourne, Australia if geolocation fails
                    resolve({
                        lat: -37.8136,
                        lon: 144.9631,
                    });
                }
            );
        } else {
            // Default to Melbourne, Australia if geolocation is not supported
            resolve({
                lat: -37.8136,
                lon: 144.9631,
            });
        }
    });
}

// At the top of the file, import the loading functions
import { showLoadingOverlay, hideLoadingOverlay, ensureMinimumLoadingTime } from './loading.js';

// Add this flag at the top of your script, with other global variables
let initialCardRendered = false;

// Modify the renderInitialCard function
async function renderInitialCard() {
    if (initialCardRendered) {
        console.log("Initial card already rendered, skipping");
        return;
    }

    console.log("Rendering initial card");
    showLoadingOverlay();
    try {
        await ensureMinimumLoadingTime(async () => {
            console.log("Getting user location");
            const { lat, lon } = await getUserLocation();
            console.log("Getting weather data");
            const weatherData = await getWeatherData(lat, lon, currentUnits);
            console.log("Creating card");
            const card = await createCard(weatherData, lat, lon, currentUnits, true);
            if (card instanceof Node) {
                cardsWrapper.innerHTML = '';
                cardsWrapper.appendChild(card);
                console.log("Card appended to wrapper");
                
                await Promise.all([
                    initMap(card.querySelector('.map-container'), lat, lon),
                    getLocationName(lat, lon).then(locationName => {
                        card.querySelector('.card-location').innerText = locationName;
                    }),
                    loadAllSvgIcons(card)
                ]);
                
                initialCardRendered = true;
                console.log("All data loaded for initial card");
            } else {
                console.error("createCard did not return a valid Node.");
            }
        });
    } catch (error) {
        console.error("Error rendering initial card:", error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = `An error occurred: ${error.message}. Please try again later.`;
        cardsWrapper.appendChild(errorMessage);
    } finally {
        console.log("Render initial card process completed");
        hideLoadingOverlay();
    }
}

// Add this helper function to load all SVG icons
async function loadAllSvgIcons(card) {
    const iconElements = card.querySelectorAll('.hour-icon, .card-hero-icon');
    const iconPromises = Array.from(iconElements).map(async (element) => {
        const iconCode = element.dataset.iconCode || '01';
        const svgContent = await getSvgContent(iconCode);
        element.innerHTML = svgContent;
    });
    await Promise.all(iconPromises);
}

// Modify the createCard function to set icon codes as data attributes
function createCard(weatherData, lat, lon, units, isInitialCard = false) {
    if (!weatherData || !weatherData.current) {
        console.error('Invalid weather data:', weatherData);
        // Return an error card instead of null
        return createErrorCard("Invalid weather data received");
    }

    console.log('Creating card with data:', weatherData);

    try {
        let card = document.createElement("div");
        card.classList.add("card");
        if (isInitialCard) {
            card.classList.add("initial-card");
        } else {
            card.classList.add("new-card");
        }
        card.dataset.lat = lat;
        card.dataset.lon = lon;
        card.dataset.units = units;

        let cardHead = document.createElement("div");
        cardHead.classList.add("card-head");
        card.appendChild(cardHead);

        let cardLocation = document.createElement("h2");
        cardLocation.classList.add("card-location");
        cardLocation.innerText = "Loading...";
        cardHead.appendChild(cardLocation);

        // Fetch the location name
        getLocationName(lat, lon).then(locationName => {
            cardLocation.innerText = locationName;
        }).catch(error => {
            console.error("Error fetching location name:", error);
            cardLocation.innerText = "Unknown Location";
        });

        let cardHeroSection = document.createElement("div");
        cardHeroSection.classList.add("card-hero-section");
        cardHead.appendChild(cardHeroSection);

        let cardHeroTemp = document.createElement("h1");
        cardHeroTemp.classList.add("currentTemp");
        cardHeroTemp.innerHTML = `${Math.round(weatherData.current.temp) || 'N/A'}<span class="temp-symbol">°</span>`;
        cardHeroSection.appendChild(cardHeroTemp);

        let cardHeroColumn = document.createElement("div");
        cardHeroColumn.classList.add("card-hero-column");
        cardHeroSection.appendChild(cardHeroColumn);

        let cardHeroIcon = document.createElement("div");
        cardHeroIcon.classList.add("card-hero-icon");
        let mainIconCode = weatherData.current.weather && weatherData.current.weather[0] ? mapIconCode(weatherData.current.weather[0].icon) : '01';
        cardHeroIcon.dataset.iconCode = mainIconCode;
        cardHeroColumn.appendChild(cardHeroIcon);

        let cardHeroDesc = document.createElement("h3");
        cardHeroDesc.classList.add("currentDesc");
        cardHeroDesc.textContent = capitalizeWords(weatherData.current.weather && weatherData.current.weather[0] ? weatherData.current.weather[0].description : 'No description available');
        cardHeroColumn.appendChild(cardHeroDesc);

        // Create flexible spacer with map container inside
        let flexibleSpacer = document.createElement("div");
        flexibleSpacer.classList.add("flexible-spacer");
        
        let mapContainer = document.createElement("div");
        mapContainer.classList.add("map-container");
        flexibleSpacer.appendChild(mapContainer);
        
        card.appendChild(flexibleSpacer);

        // Initialize the map after the card is added to the DOM
        setTimeout(() => {
            initMap(mapContainer, weatherData.lat, weatherData.lon);
            
            // Trigger the slide-in animation after a short delay
            if (!isInitialCard) {
                setTimeout(() => {
                    card.classList.add('slide-in');
                    // Remove the 'new-card' class after the animation
                    setTimeout(() => {
                        card.classList.remove('new-card');
                    }, 500); // This should match the transition duration
                }, 50);
            }
        }, 0);

        let tempRanges = document.createElement("div");
        tempRanges.classList.add("temp-ranges");
        card.appendChild(tempRanges);

        let feelsLikeTemp = document.createElement("div");
        feelsLikeTemp.classList.add("temp-range-item");
        tempRanges.appendChild(feelsLikeTemp);

        let feelsLikeTempLabel = document.createElement("p");
        feelsLikeTempLabel.classList.add("new-temp-label");
        feelsLikeTempLabel.innerText = "Feels like";
        feelsLikeTemp.appendChild(feelsLikeTempLabel);

        let feelsLikeTempValue = document.createElement("p");
        feelsLikeTempValue.classList.add("feelsLikeTemp");
        feelsLikeTempValue.innerHTML = `${Math.round(weatherData.current.feels_like) || 'N/A'}<span class="temp-symbol">°</span>`;
        feelsLikeTemp.appendChild(feelsLikeTempValue);

        let highTemp = document.createElement("div");
        highTemp.classList.add("temp-range-item");
        tempRanges.appendChild(highTemp);

        let highTempLabel = document.createElement("p");
        highTempLabel.classList.add("new-temp-label");
        highTempLabel.innerText = "↑";
        highTemp.appendChild(highTempLabel);

        let highTempValue = document.createElement("p");
        highTempValue.classList.add("highTemp");
        highTempValue.innerHTML = `${Math.round(weatherData.daily[0].temp.max) || 'N/A'}<span class="temp-symbol">°</span>`;
        highTemp.appendChild(highTempValue);

        let lowTemp = document.createElement("div");
        lowTemp.classList.add("temp-range-item");
        tempRanges.appendChild(lowTemp);

        let lowTempLabel = document.createElement("p");
        lowTempLabel.classList.add("new-temp-label");
        lowTempLabel.innerText = "↓";
        lowTemp.appendChild(lowTempLabel);

        let lowTempValue = document.createElement("p");
        lowTempValue.classList.add("lowTemp");
        lowTempValue.innerHTML = `${Math.round(weatherData.daily[0].temp.min) || 'N/A'}<span class="temp-symbol">°</span>`;
        lowTemp.appendChild(lowTempValue);

        let hourlyForecastContainer = document.createElement("div");
        hourlyForecastContainer.classList.add("hourly-forecast-container");
        card.appendChild(hourlyForecastContainer);

        let hourlyForecast = document.createElement("div");
        hourlyForecast.classList.add("hourly-forecast");
        hourlyForecastContainer.appendChild(hourlyForecast);

        weatherData.hourly.slice(0, 24).forEach((hour) => {
            let hourWrapper = document.createElement("div");
            hourWrapper.classList.add("hour-wrapper");

            let hourLabel = document.createElement("p");
            hourLabel.classList.add("hour-label");
            let date = new Date(hour.dt * 1000);
            let hours = date.getHours();
            let ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12;
            let formattedTime = `${hours}${ampm}`;
            hourLabel.textContent = formattedTime;
            hourWrapper.appendChild(hourLabel);

            let hourIcon = document.createElement("div");
            hourIcon.classList.add("hour-icon");
            let iconCode = hour.weather && hour.weather[0] && hour.weather[0].icon ? mapIconCode(hour.weather[0].icon) : '01';
            hourIcon.dataset.iconCode = iconCode;
            hourWrapper.appendChild(hourIcon);

            let hourTemp = document.createElement("p");
            hourTemp.classList.add("hour-temp");
            hourTemp.innerHTML = `${Math.round(hour.temp) || 'N/A'}<span class="temp-symbol">°</span>`;
            hourWrapper.appendChild(hourTemp);

            hourlyForecast.appendChild(hourWrapper);
        });

        let miscWeatherData = document.createElement("div");
        miscWeatherData.classList.add("misc-weather-data");
        card.appendChild(miscWeatherData);

        let miscWeatherDataColumnLeft = document.createElement("div");
        miscWeatherDataColumnLeft.classList.add("misc-weather-data-column");
        miscWeatherData.appendChild(miscWeatherDataColumnLeft);

        let humidityWrapper = document.createElement("div");
        humidityWrapper.classList.add("humidityWrapper");
        miscWeatherDataColumnLeft.appendChild(humidityWrapper);

        let humidityLabel = document.createElement("h4");
        humidityLabel.classList.add("misc-data-label");
        humidityLabel.innerText = "Humidity";
        humidityWrapper.appendChild(humidityLabel);

        let humidityValue = document.createElement("h4");
        humidityValue.classList.add("misc-data-value");
        humidityValue.innerHTML = `${weatherData.current.humidity || 'N/A'}<span class="unit">%</span>`;
        humidityWrapper.appendChild(humidityValue);

        let uvIndexWrapper = document.createElement("div");
        uvIndexWrapper.classList.add("uvIndexWrapper");
        miscWeatherDataColumnLeft.appendChild(uvIndexWrapper);

        let uvIndexLabel = document.createElement("h4");
        uvIndexLabel.classList.add("misc-data-label");
        uvIndexLabel.innerText = "UV Index";
        uvIndexWrapper.appendChild(uvIndexLabel);

        let uvIndexValue = document.createElement("h4");
        uvIndexValue.classList.add("misc-data-value");
        uvIndexValue.innerText = weatherData.current.uvi || 'N/A';
        uvIndexWrapper.appendChild(uvIndexValue);

        let miscWeatherDataColumnRight = document.createElement("div");
        miscWeatherDataColumnRight.classList.add("misc-weather-data-column");
        miscWeatherData.appendChild(miscWeatherDataColumnRight);

        let windWrapper = document.createElement("div");
        windWrapper.classList.add("windWrapper");
        miscWeatherDataColumnRight.appendChild(windWrapper);

        let windLabel = document.createElement("h4");
        windLabel.classList.add("misc-data-label");
        windLabel.innerText = "Wind";
        windWrapper.appendChild(windLabel);

        let windValue = document.createElement("h4");
        windValue.classList.add("misc-data-value");
        windValue.innerHTML = `${weatherData.current.wind_speed || 'N/A'} <span class="unit">${units === "metric" ? "m/s" : "mph"}</span>`;
        windWrapper.appendChild(windValue);

        let pressureWrapper = document.createElement("div");
        pressureWrapper.classList.add("pressureWrapper");
        miscWeatherDataColumnRight.appendChild(pressureWrapper);

        let pressureLabel = document.createElement("h4");
        pressureLabel.classList.add("misc-data-label");
        pressureLabel.innerText = "Pressure";
        pressureWrapper.appendChild(pressureLabel);

        let pressureValue = document.createElement("h4");
        pressureValue.classList.add("misc-data-value");
        pressureValue.innerHTML = `${weatherData.current.pressure || 'N/A'} <span class="unit">hPa</span>`;
        pressureWrapper.appendChild(pressureValue);

        console.log('Card created successfully:', card);
        return card;
    } catch (error) {
        console.error('Error in createCard:', error);
        // Return an error card instead of null
        return createErrorCard(`Error creating card: ${error.message}`);
    }
}

function createErrorCard(errorMessage) {
    let card = document.createElement("div");
    card.classList.add("card", "error-card");
    
    let errorText = document.createElement("p");
    errorText.textContent = errorMessage;
    card.appendChild(errorText);
    
    return card;
}

let googleMapsPromise = null;

function loadGoogleMapsAPI() {
    if (googleMapsPromise) {
        return googleMapsPromise;
    }

    googleMapsPromise = new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            resolve(window.google.maps);
            return;
        }

        window.initGoogleMaps = function() {
            console.log('Google Maps API loaded');
            if (window.google && window.google.maps) {
                resolve(window.google.maps);
            } else {
                reject(new Error('Google Maps API failed to load'));
            }
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        script.onerror = reject;
        document.head.appendChild(script);
    });

    return googleMapsPromise;
}

async function initMap(container, lat, lon) {
    if (!isFinite(lat) || !isFinite(lon)) {
        console.error('Invalid coordinates:', lat, lon);
        return;
    }
    try {
        const googleMaps = await loadGoogleMapsAPI();
        
        if (!googleMaps || !googleMaps.Map) {
            throw new Error('Google Maps API not loaded correctly');
        }

        // Wait for the container to be added to the DOM
        await new Promise(resolve => {
            const checkContainer = () => {
                if (document.body.contains(container)) {
                    resolve();
                } else {
                    setTimeout(checkContainer, 100);
                }
            };
            checkContainer();
        });

        const isDarkMode = document.documentElement.classList.contains('dark-mode');
        const mapBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--map-background-color').trim();
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
        const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();
        const tertiaryColor = getComputedStyle(document.documentElement).getPropertyValue('--tertiary-color').trim();

        // Set the background color of the container before the map loads
        container.style.backgroundColor = mapBackgroundColor;

        const lightModeStyles = [
            {"featureType":"all","elementType":"labels","stylers":[{"visibility":"off"}]},
            {"featureType":"administrative","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"administrative.country","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"administrative.province","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"administrative.locality","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"administrative.neighborhood","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"administrative.land_parcel","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"landscape","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"landscape","elementType":"labels","stylers":[{"visibility":"off"}]},
            {"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"landscape.natural","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"landscape.natural.landcover","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"landscape.natural.terrain","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},
            {"featureType":"poi","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"poi.attraction","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},
            {"featureType":"road.arterial","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"road.local","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},
            {"featureType":"transit","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"transit.line","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"transit.station","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"transit.station.airport","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"transit.station.bus","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"transit.station.rail","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"water","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},
            
            {"featureType":"landscape","elementType":"all","stylers":[{"visibility":"on"}]},
            {"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"visibility":"on"},{"color":mapBackgroundColor}]},
            {"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":mapBackgroundColor}]},
            {"featureType":"landscape.natural","elementType":"geometry","stylers":[{"visibility":"on"},{"color":mapBackgroundColor}]},
            {"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#292929"}]},
            {"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#888888"},{"visibility":"on"}]},
            {"featureType":"road.local","elementType":"geometry.fill","stylers":[{"color":"#7f7f7f"}]},
            {"featureType":"water","elementType":"geometry","stylers":[{"color":mapBackgroundColor}]},
            {"featureType":"water","elementType":"geometry.fill","stylers":[{"color":mapBackgroundColor}]},
            {"featureType":"road.local","elementType":"geometry.stroke","stylers":[{"color":secondaryColor}]},
            {"featureType":"road.local","elementType":"labels.text.fill","stylers":[{"color":secondaryColor}]},
            {"featureType":"road.local","elementType":"labels.text.stroke","stylers":[{"color":mapBackgroundColor}]}
        ];

        const darkModeStyles = [
            {"featureType":"all","elementType":"labels","stylers":[{"visibility":"off"}]},
            {"featureType":"administrative","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"administrative.country","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"administrative.province","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"administrative.locality","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"administrative.neighborhood","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"administrative.land_parcel","elementType":"geometry","stylers":[{"visibility":"off"}]},
            {"featureType":"landscape","elementType":"all","stylers":[{"color":mapBackgroundColor}]},
            {"featureType":"landscape.man_made","elementType":"geometry","stylers":[{"color":mapBackgroundColor}]},
            {"featureType":"landscape.natural","elementType":"geometry","stylers":[{"color":mapBackgroundColor}]},
            {"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},
            {"featureType":"road","elementType":"geometry.fill","stylers":[{"color":tertiaryColor}]},
            {"featureType":"road","elementType":"geometry.stroke","stylers":[{"visibility":"off"}]},
            {"featureType":"road.local","elementType":"geometry.stroke","stylers":[{"color":secondaryColor}]},
            {"featureType":"road.local","elementType":"labels.text.fill","stylers":[{"color":secondaryColor}]},
            {"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},
            {"featureType":"water","elementType":"geometry","stylers":[{"color":mapBackgroundColor}]}
        ];

        const mapOptions = {
            center: { lat: lat, lng: lon },
            zoom: 11,
            disableDefaultUI: true,
            styles: isDarkMode ? darkModeStyles : lightModeStyles,
            draggable: false,
            zoomControl: false,
            scrollwheel: false,
            disableDoubleClickZoom: true,
            clickableIcons: false,
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            backgroundColor: mapBackgroundColor,
        };

        const map = new googleMaps.Map(container, mapOptions);

        // Remove transitions from map elements
        const mapElement = container.querySelector('div');
        if (mapElement) {
            mapElement.style.transition = 'none';
        }

        // Disable all interactions
        map.setOptions({
            gestureHandling: 'none'
        });
    } catch (error) {
        console.error('Error creating Google Map:', error);
    }
}

// Event listeners for buttons
tempToggle.addEventListener("change", async () => {
    currentUnits = tempToggle.checked ? "imperial" : "metric";
    updateAllCards(currentUnits);
});

// Modify the updateCard function
async function updateCard(card, weatherData, tempFormat) {
    const cardLocation = card.querySelector(".card-location");
    if (cardLocation) {
        const lat = card.dataset.lat;
        const lon = card.dataset.lon;
        const locationName = await getLocationName(lat, lon);
        cardLocation.innerText = locationName;
    }

    const currentTempElement = card.querySelector(".currentTemp");
    if (currentTempElement) {
        currentTempElement.innerHTML = `${Math.round(weatherData.current.temp) || 'N/A'}<span class="temp-symbol">°</span>`;
    }

    const currentDescElement = card.querySelector(".currentDesc");
    if (currentDescElement) {
        currentDescElement.innerText = capitalizeWords(weatherData.current.weather && weatherData.current.weather[0] ? weatherData.current.weather[0].description : 'No description available');
    }

    const feelsLikeTempElement = card.querySelector(".feelsLikeTemp");
    if (feelsLikeTempElement) {
        feelsLikeTempElement.innerHTML = `${Math.round(weatherData.current.feels_like) || 'N/A'}<span class="temp-symbol">°</span>`;
    }

    const highTempElement = card.querySelector(".highTemp");
    if (highTempElement) {
        highTempElement.innerHTML = `${Math.round(weatherData.daily[0].temp.max) || 'N/A'}<span class="temp-symbol">°</span>`;
    }

    const lowTempElement = card.querySelector(".lowTemp");
    if (lowTempElement) {
        lowTempElement.innerHTML = `${Math.round(weatherData.daily[0].temp.min) || 'N/A'}<span class="temp-symbol">°</span>`;
    }

    // Update hourly forecast
    let hourlyForecast = card.querySelector('.hourly-forecast');
    hourlyForecast.innerHTML = ''; // Clear existing forecast

    weatherData.hourly.slice(0, 24).forEach((hour) => {
        let hourWrapper = document.createElement("div");
        hourWrapper.classList.add("hour-wrapper");

        let hourLabel = document.createElement("p");
        hourLabel.classList.add("hour-label");
        let date = new Date(hour.dt * 1000);
        let hours = date.getHours();
        let ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        let formattedTime = `${hours}${ampm}`;
        hourLabel.textContent = formattedTime;
        hourWrapper.appendChild(hourLabel);

        let hourIcon = document.createElement("div");
        hourIcon.classList.add("hour-icon");
        let iconCode = hour.weather && hour.weather[0] && hour.weather[0].icon ? mapIconCode(hour.weather[0].icon) : '01';
        hourIcon.dataset.iconCode = iconCode;
        hourWrapper.appendChild(hourIcon);

        let hourTemp = document.createElement("p");
        hourTemp.classList.add("hour-temp");
        hourTemp.innerHTML = `${Math.round(hour.temp) || 'N/A'}<span class="temp-symbol">°</span>`;
        hourWrapper.appendChild(hourTemp);

        hourlyForecast.appendChild(hourWrapper);
    });

    const humidityElement = card.querySelector(
        ".misc-weather-data .humidityWrapper .misc-data-value"
    );
    if (humidityElement) {
        humidityElement.innerHTML = `${weatherData.current.humidity || 'N/A'}<span class="unit">%</span>`;
    }

    const uvIndexElement = card.querySelector(
        ".misc-weather-data .uvIndexWrapper .misc-data-value"
    );
    if (uvIndexElement) {
        uvIndexElement.innerText = weatherData.current.uvi || 'N/A';
    }

    const windElement = card.querySelector(
        ".misc-weather-data .windWrapper .misc-data-value"
    );
    if (windElement) {
        windElement.innerHTML = `${weatherData.current.wind_speed || 'N/A'} <span class="unit">${tempFormat === "C" ? "m/s" : "mph"}</span>`;
    }

    const pressureElement = card.querySelector(
        ".misc-weather-data .pressureWrapper .misc-data-value"
    );
    if (pressureElement) {
        pressureElement.innerHTML = `${weatherData.current.pressure || 'N/A'} <span class="unit">hPa</span>`;
    }

    const cardHeroIcon = card.querySelector(".card-hero-icon");
    if (cardHeroIcon) {
        let mainIconCode = weatherData.current.weather && weatherData.current.weather[0] ? mapIconCode(weatherData.current.weather[0].icon) : '01';
        cardHeroIcon.dataset.iconCode = mainIconCode;
    }
}

// Modify the updateAllCards function
async function updateAllCards(units) {
    const cards = document.querySelectorAll(".card");
    for (const card of cards) {
        const lat = card.dataset.lat;
        const lon = card.dataset.lon;
        console.log(`Updating card with lat: ${lat}, lon: ${lon}, units: ${units}`);
        try {
            const weatherData = await getWeatherData(lat, lon, units);
            await updateCard(card, weatherData, units === "metric" ? "C" : "F");
        } catch (error) {
            console.error(`Error updating card with lat: ${lat}, lon: ${lon}`, error);
        }
    }
}

function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function getSvgContent(iconCode) {
    const url = `/img/weather-icons/${iconCode}.svg`;
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(svgText => {
            if (svgText.trim().startsWith('<svg')) {
                return svgText;
            } else if (svgText.includes('<html')) {
                return getFallbackSvg(iconCode);
            } else {
                return getFallbackSvg(iconCode);
            }
        })
        .catch(error => {
            return getFallbackSvg(iconCode);
        });
}

function getFallbackSvg(iconCode) {
    // Provide a simple fallback SVG based on the icon code
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12">${iconCode}</text>
    </svg>`;
}

// Add this helper function at the end of your script
function capitalizeWords(str) {
    if (!str) return ''; // Return an empty string if input is undefined or null
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Initial render
window.addEventListener('load', () => {
    renderInitialCard();
});

function initializeMaps() {
    const mapContainers = document.querySelectorAll('.map-container');
    mapContainers.forEach(container => {
        const card = container.closest('.card');
        const lat = parseFloat(card.dataset.lat);
        const lon = parseFloat(card.dataset.lon);
        initMap(container, lat, lon);
    });
}

// Make initMap available globally
window.initMap = initMap;
async function getLocationName(lat, lon) {
    try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].formatted_address;
        } else {
            return "Unknown Location";
        }
    } catch (error) {
        console.error("Error fetching location name:", error);
        return "Unknown Location";
    }
}

// Add this function near the top of your script, after other variable declarations
function updateCardsWrapperWidth() {
    const cardCount = cardsWrapper.children.length;
    const newWidth = Math.min(cardCount * 320, window.innerWidth - 40); // 320px per card, 20px padding on each side
    cardsWrapper.style.width = `${newWidth}px`;
}

// Modify the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', (event) => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isDarkMode = savedTheme === 'dark';

    document.documentElement.classList.toggle('dark-mode', isDarkMode);
    document.documentElement.classList.toggle('light-mode', !isDarkMode);

    // Set initial button visibility
    lightModeToggle.style.display = isDarkMode ? 'none' : 'flex';
    darkModeToggle.style.display = isDarkMode ? 'flex' : 'none';

    // Add this line to set up the add-card button listener
    addAddCardEventListener();

    // Add this line to set the initial width of the cards wrapper
    updateCardsWrapperWidth();
});

// Add a window resize event listener
window.addEventListener('resize', updateCardsWrapperWidth);


