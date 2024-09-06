let cardsWrapper = document.getElementById("cards-wrapper");
let currentUnits = "metric";
let tempToggle = document.getElementById("temp-toggle");

const lightModeToggle = document.getElementById('light-mode-toggle');
const darkModeToggle = document.getElementById('dark-mode-toggle');

const OPENWEATHER_API_KEY = '${process.env.OPENWEATHER_API_KEY}';
const GOOGLE_MAPS_API_KEY = '${process.env.GOOGLE_MAPS_API_KEY}';

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
});

// Add event listener to the "add-card" button
document.getElementById("add-card").addEventListener("click", async () => {
    const location = prompt("Please enter a location:");
    if (location) {
        try {
            const { weatherData, lat, lon } = await getWeatherDataByLocation(location, currentUnits);
            const card = createCard(weatherData, lat, lon, currentUnits);
            if (card instanceof Node) {
                // Get the current width of the wrapper
                const currentWidth = cardsWrapper.scrollWidth;

                // Temporarily set all existing cards to a higher z-index
                document.querySelectorAll('.card').forEach(existingCard => {
                    existingCard.style.zIndex = '2';
                });

                // Add the new card
                cardsWrapper.appendChild(card);

                // Get the new width after adding the card
                const newWidth = cardsWrapper.scrollWidth;

                // Set the wrapper width to the current width
                cardsWrapper.style.width = `${currentWidth}px`;

                // Force a reflow
                cardsWrapper.offsetHeight;

                // Animate to the new width
                cardsWrapper.style.width = `${newWidth}px`;

                // Trigger the slide-in animation after a short delay
                setTimeout(() => {
                    card.classList.add('slide-in');
                }, 50);

                // Reset z-index of existing cards and remove the explicit width after the animation
                setTimeout(() => {
                    document.querySelectorAll('.card').forEach(existingCard => {
                        existingCard.style.zIndex = '';
                    });
                    cardsWrapper.style.width = '';
                }, 550); // This should match the transition duration + 50ms

                // Scroll to the new card
                setTimeout(() => {
                    const weatherCardsContainer = document.querySelector('.weather-cards');
                    weatherCardsContainer.scrollLeft = weatherCardsContainer.scrollWidth;
                }, 600); // Delay scrolling until after the animation

                await loadGoogleMapsAPI();
                await initMap(card.querySelector('.map-container'), lat, lon);
            } else {
                console.error("createCard did not return a valid Node.");
            }
        } catch (error) {
            console.error("Error fetching weather data for the provided location:", error);
        }
    }
});

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
    try {
        let response = await fetch(
            `/.netlify/functions/weather-proxy?lat=${lat}&lon=${lon}&units=${units}`,
            {
                credentials: 'same-origin',
                mode: 'cors'
            }
        );

        let text = await response.text();
        console.log('Raw API response:', text);

        if (!response.ok) {
            console.error(`API call failed with status ${response.status}`);
            console.error('Response body:', text);
            throw new Error(`API call failed with status ${response.status}`);
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            console.error('Problematic response:', text);
            if (text.trim().startsWith('<')) {
                throw new Error('API returned HTML instead of JSON. There might be a server-side error.');
            } else {
                throw new Error('Invalid JSON response from API');
            }
        }

        // Fetch city and country information
        let geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`
        );
        let geoData = await geoResponse.json();
        
        let cityCountry;
        if (geoData[0]) {
            const countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(geoData[0].country);
            cityCountry = `${geoData[0].name}, ${countryName}`;
        } else {
            cityCountry = data.timezone;
        }

        return {
            location: cityCountry,
            lat: lat,
            lon: lon,
            currentTemp: data.current.temp,
            currentDesc: data.current.weather[0].description,
            currentIcon: data.current.weather[0].icon,
            feelsLike: data.current.feels_like,
            highTemp: data.daily[0].temp.max,
            lowTemp: data.daily[0].temp.min,
            humidity: data.current.humidity,
            uvIndex: data.current.uvi,
            wind: data.current.wind_speed,
            pressure: data.current.pressure,
            hourly: data.hourly.slice(0, 12), // Get next 12 hours forecast
        };
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

// Modify the renderInitialCard function
async function renderInitialCard() {
    console.log("Rendering initial card");
    showLoadingOverlay();
    try {
        await ensureMinimumLoadingTime(async () => {
            console.log("Getting user location");
            const { lat, lon } = await getUserLocation();
            console.log("Getting weather data");
            const weatherData = await getWeatherData(lat, lon, currentUnits);
            console.log("Creating card");
            const card = createCard(weatherData, lat, lon, currentUnits);
            if (card instanceof Node) {
                cardsWrapper.appendChild(card);
                console.log("Card appended to wrapper");
                await initMap(card.querySelector('.map-container'), lat, lon);
            } else {
                console.error("createCard did not return a valid Node.");
            }
        });
    } catch (error) {
        console.error("Error getting user location or weather data:", error);
        // Display error message to the user
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = `An error occurred: ${error.message}. Please try again later.`;
        cardsWrapper.appendChild(errorMessage);
    } finally {
        console.log("Render initial card process completed");
        hideLoadingOverlay();
    }
}

// Modify the function that adds new cards (if you have one) to use the global loading overlay
async function addNewCard(location) {
    showLoadingOverlay();
    try {
        const { weatherData, lat, lon } = await getWeatherDataByLocation(location, currentUnits);
        const card = createCard(weatherData, lat, lon, currentUnits);
        if (card instanceof Node) {
            cardsWrapper.appendChild(card);
            await initMap(card.querySelector('.map-container'), lat, lon);
        } else {
            console.error("createCard did not return a valid Node.");
        }
    } catch (error) {
        console.error("Error adding new card:", error);
        // Handle error (e.g., show an error message to the user)
    } finally {
        hideLoadingOverlay();
    }
}

function createCard(weatherData, lat, lon, units) {
    console.log(`Creating card with lat: ${lat}, lon: ${lon}, units: ${units}`);
    let card = document.createElement("div");
    card.classList.add("card", "new-card"); // Add 'new-card' class
    card.dataset.lat = lat;
    card.dataset.lon = lon;
    card.dataset.units = units;

    let cardHead = document.createElement("div");
    cardHead.classList.add("card-head");
    card.appendChild(cardHead);

    let cardLocation = document.createElement("h2");
    cardLocation.classList.add("card-location");
    cardLocation.innerText = weatherData.location; // This will now be "City, Country"
    cardHead.appendChild(cardLocation);

    let cardHeroSection = document.createElement("div");
    cardHeroSection.classList.add("card-hero-section");
    cardHead.appendChild(cardHeroSection);

    let cardHeroTemp = document.createElement("h1");
    cardHeroTemp.classList.add("currentTemp");
    cardHeroTemp.innerHTML = `${Math.round(weatherData.currentTemp)}<span class="temp-symbol">°</span>`;
    cardHeroSection.appendChild(cardHeroTemp);

    let cardHeroColumn = document.createElement("div");
    cardHeroColumn.classList.add("card-hero-column");
    cardHeroSection.appendChild(cardHeroColumn);

    let cardHeroIcon = document.createElement("div");
    cardHeroIcon.classList.add("card-hero-icon");
    let mainIconCode = weatherData.currentIcon ? mapIconCode(weatherData.currentIcon) : '01';
    getSvgContent(mainIconCode).then(svgContent => {
        cardHeroIcon.innerHTML = svgContent;
    });
    cardHeroColumn.appendChild(cardHeroIcon);

    let cardHeroDesc = document.createElement("h3");
    cardHeroDesc.classList.add("currentDesc");
    cardHeroDesc.innerText = capitalizeWords(weatherData.currentDesc);
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
        setTimeout(() => {
            card.classList.add('slide-in');
            // Remove the 'new-card' class after the animation
            setTimeout(() => {
                card.classList.remove('new-card');
            }, 500); // This should match the transition duration
        }, 50);
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
    feelsLikeTempValue.innerHTML = `${Math.round(weatherData.feelsLike)}<span class="temp-symbol">°</span>`;
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
    highTempValue.innerHTML = `${Math.round(weatherData.highTemp)}<span class="temp-symbol">°</span>`;
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
    lowTempValue.innerHTML = `${Math.round(weatherData.lowTemp)}<span class="temp-symbol">°</span>`;
    lowTemp.appendChild(lowTempValue);

    let hourlyForecastContainer = document.createElement("div");
    hourlyForecastContainer.classList.add("hourly-forecast-container");
    card.appendChild(hourlyForecastContainer);

    let hourlyForecast = document.createElement("div");
    hourlyForecast.classList.add("hourly-forecast");
    hourlyForecastContainer.appendChild(hourlyForecast);

    weatherData.hourly.forEach((hour) => {
        let hourWrapper = document.createElement("div");
        hourWrapper.classList.add("hour-wrapper");
        hourlyForecast.appendChild(hourWrapper);

        let hourLabel = document.createElement("p");
        hourLabel.classList.add("hour-label");
        // Convert the hour to 12-hour format with lowercase am/pm without space
        let date = new Date(hour.dt * 1000);
        let hours = date.getHours();
        let ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        let formattedTime = `${hours}${ampm}`;
        hourLabel.innerText = formattedTime;
        hourWrapper.appendChild(hourLabel);

        let hourIcon = document.createElement("div");
        hourIcon.classList.add("hour-icon");
        let iconCode = hour.weather && hour.weather[0] && hour.weather[0].icon ? mapIconCode(hour.weather[0].icon) : '01';
        getSvgContent(iconCode).then(svgContent => {
            hourIcon.innerHTML = svgContent;
        });
        hourWrapper.appendChild(hourIcon);

        let hourTemp = document.createElement("p");
        hourTemp.classList.add("hour-temp");
        hourTemp.innerHTML = `${Math.round(hour.temp)}<span class="temp-symbol">°</span>`;
        hourWrapper.appendChild(hourTemp);
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
    humidityValue.innerHTML = `${weatherData.humidity}<span class="unit">%</span>`;
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
    uvIndexValue.innerText = weatherData.uvIndex;
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
    windValue.innerHTML = `${weatherData.wind} <span class="unit">${units === "metric" ? "m/s" : "mph"}</span>`;
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
    pressureValue.innerHTML = `${weatherData.pressure} <span class="unit">hPa</span>`;
    pressureWrapper.appendChild(pressureValue);

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
    try {
        const googleMaps = await loadGoogleMapsAPI();
        
        if (!googleMaps || !googleMaps.Map) {
            throw new Error('Google Maps API not loaded correctly');
        }

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

// Function to update all cards
async function updateAllCards(units) {
	const cards = document.querySelectorAll(".card");
	for (const card of cards) {
		const lat = card.dataset.lat;
		const lon = card.dataset.lon;
		console.log(`Updating card with lat: ${lat}, lon: ${lon}, units: ${units}`); // Debugging log
		try {
			const weatherData = await getWeatherData(lat, lon, units);
			updateCard(card, weatherData, units === "metric" ? "C" : "F");
		} catch (error) {
			console.error(`Error updating card with lat: ${lat}, lon: ${lon}`, error);
		}
	}
}

// Function to update a single card
function updateCard(card, weatherData, tempFormat) {
    const currentTempElement = card.querySelector(".currentTemp");
    if (currentTempElement) {
        currentTempElement.innerHTML = `${Math.round(weatherData.currentTemp)}<span class="temp-symbol">°</span>`;
    } else {
        console.error("Current temperature element not found.");
    }

    const currentDescElement = card.querySelector(".currentDesc");
    if (currentDescElement) {
        currentDescElement.innerText = capitalizeWords(weatherData.currentDesc);
    } else {
        console.error("Current description element not found.");
    }

    const feelsLikeTempElement = card.querySelector(".feelsLikeTemp");
    if (feelsLikeTempElement) {
        feelsLikeTempElement.innerHTML = `${Math.round(weatherData.feelsLike)}<span class="temp-symbol">°</span>`;
    } else {
        console.error("Feels like temperature element not found.");
    }

    const highTempElement = card.querySelector(".highTemp");
    if (highTempElement) {
        highTempElement.innerHTML = `${Math.round(weatherData.highTemp)}<span class="temp-symbol">°</span>`;
    } else {
        console.error("High temperature element not found.");
    }

    const lowTempElement = card.querySelector(".lowTemp");
    if (lowTempElement) {
        lowTempElement.innerHTML = `${Math.round(weatherData.lowTemp)}<span class="temp-symbol">°</span>`;
    } else {
        console.error("Low temperature element not found.");
    }

    // Update hourly forecast
    let hourlyForecast = card.querySelector('.hourly-forecast');
    hourlyForecast.innerHTML = ''; // Clear existing forecast

    weatherData.hourly.forEach((hour) => {
        let hourWrapper = document.createElement("div");
        hourWrapper.classList.add("hour-wrapper");
        hourlyForecast.appendChild(hourWrapper);

        let hourLabel = document.createElement("p");
        hourLabel.classList.add("hour-label");
        // Convert the hour to 12-hour format with lowercase am/pm without space
        let date = new Date(hour.dt * 1000);
        let hours = date.getHours();
        let ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        let formattedTime = `${hours}${ampm}`;
        hourLabel.innerText = formattedTime;
        hourWrapper.appendChild(hourLabel);

        let hourIcon = document.createElement("div");
        hourIcon.classList.add("hour-icon");
        let iconCode = hour.weather && hour.weather[0] && hour.weather[0].icon ? mapIconCode(hour.weather[0].icon) : '01';
        getSvgContent(iconCode).then(svgContent => {
            hourIcon.innerHTML = svgContent;
        });
        hourWrapper.appendChild(hourIcon);

        let hourTemp = document.createElement("p");
        hourTemp.classList.add("hour-temp");
        hourTemp.innerHTML = `${Math.round(tempFormat === 'C' ? hour.temp : celsiusToFahrenheit(hour.temp))}<span class="temp-symbol">°</span>`;
        hourWrapper.appendChild(hourTemp);
    });

    const humidityElement = card.querySelector(
        ".misc-weather-data .humidityWrapper .misc-data-value"
    );
    if (humidityElement) {
        humidityElement.innerHTML = `${weatherData.humidity}<span class="unit">%</span>`;
    } else {
        console.error("Humidity element not found.");
    }

    const uvIndexElement = card.querySelector(
        ".misc-weather-data .uvIndexWrapper .misc-data-value"
    );
    if (uvIndexElement) {
        uvIndexElement.innerText = weatherData.uvIndex;
    } else {
        console.error("UV index element not found.");
    }

    const windElement = card.querySelector(
        ".misc-weather-data .windWrapper .misc-data-value"
    );
    if (windElement) {
        windElement.innerHTML = `${weatherData.wind} <span class="unit">${tempFormat === "C" ? "m/s" : "mph"}</span>`;
    } else {
        console.error("Wind element not found.");
    }

    const pressureElement = card.querySelector(
        ".misc-weather-data .pressureWrapper .misc-data-value"
    );
    if (pressureElement) {
        pressureElement.innerHTML = `${weatherData.pressure} <span class="unit">hPa</span>`;
    } else {
        console.error("Pressure element not found.");
    }

    const cardHeroIcon = card.querySelector(".card-hero-icon");
    if (cardHeroIcon) {
        let mainIconCode = weatherData.currentIcon ? mapIconCode(weatherData.currentIcon) : '01';
        getSvgContent(mainIconCode).then(svgContent => {
            cardHeroIcon.innerHTML = svgContent;
        });
    } else {
        console.error("Card hero icon element not found.");
    }
}

function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function getSvgContent(iconCode) {
    const url = `/src/img/weather-icons/${iconCode}.svg`;
    console.log('Fetching SVG from:', url);
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .catch(error => {
            console.error('Error fetching SVG:', error);
            return '';
        });
}

// Add this helper function at the end of your script
function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Initial render
window.addEventListener('load', () => {
    console.log("Window loaded");
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

