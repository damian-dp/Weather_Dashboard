import { cardsWrapper, isAddingCard, currentUnits } from './main.js';
import { getWeatherDataByLocation, getLocationName, getWeatherData, getUserLocation } from './weatherApi.js';
import { initMap } from './map.js';
import { loadAllSvgIcons, mapIconCode } from './iconManager.js';
import { capitalizeWords } from './utils.js';
import { showLoadingOverlay, hideLoadingOverlay, ensureMinimumLoadingTime } from './loading.js';

export async function addNewCard(location) {
    // ... (rest of the addNewCard function remains unchanged)
}

export function updateCardsWrapperWidth() {
    const cardCount = cardsWrapper.children.length;
    const newWidth = Math.min(cardCount * 320, window.innerWidth - 40);
    cardsWrapper.style.width = `${newWidth}px`;
}

export async function createCard(weatherData, lat, lon, units, isInitialCard = false) {
    if (!weatherData || !weatherData.current) {
        console.error('Invalid weather data:', weatherData);
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
            initMap(mapContainer, lat, lon);
            
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
        await loadAllSvgIcons(card);
        return card;
    } catch (error) {
        console.error('Error in createCard:', error);
        return createErrorCard(`Error creating card: ${error.message}`);
    }
}

export function createErrorCard(errorMessage) {
    const errorCard = document.createElement('div');
    errorCard.classList.add('card', 'error-card');
    errorCard.innerHTML = `<p>${errorMessage}</p>`;
    return errorCard;
}

export async function renderInitialCard() {
    if (cardsWrapper.children.length > 0) {
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

export async function updateAllCards(units) {
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