import { cardsWrapper, currentUnits } from './main.js';
import { getWeatherDataByLocation, getLocationName, getWeatherData, getUserLocation } from './weatherApi.js';
import { initMap } from './map.js';
import { loadAllSvgIcons, mapIconCode } from './iconManager.js';
import { capitalizeWords } from './utils.js';
import { showLoadingOverlay, hideLoadingOverlay, ensureMinimumLoadingTime } from './loading.js';

export async function addNewCard(location, isInitialCard = false) {
    let locationString;
    let lat, lon;

    if (typeof location === 'object' && location.lat && location.lon) {
        lat = location.lat;
        lon = location.lon;
        locationString = `${lat},${lon}`;
    } else if (typeof location === 'string') {
        locationString = location;
    } else {
        console.error('Invalid location format:', location);
        throw new Error("Invalid location format");
    }

    if (isInitialCard) {
        console.log(`Adding initial card for ${locationString}`);
    } else {
        console.log(`Adding new card for ${locationString}`);
    }
    let isAddingCard = false;
    if (isAddingCard && !isInitialCard) {
        console.log("Already adding a card, please wait.");
        return;
    }
    try {
        isAddingCard = true;
        let weatherData;
        if (lat !== undefined && lon !== undefined) {
            weatherData = await getWeatherData(lat, lon, currentUnits);
        } else {
            const weatherResponse = await getWeatherDataByLocation(locationString, currentUnits);
            weatherData = weatherResponse.weatherData;
            lat = weatherResponse.lat;
            lon = weatherResponse.lon;
        }
        
        if (!weatherData || !weatherData.current) {
            console.error('Invalid weather data received:', weatherData);
            throw new Error("Invalid weather data received");
        }
        
        const card = await createCardElement(weatherData, lat, lon, currentUnits, isInitialCard);
        
        if (isInitialCard) {
            cardsWrapper.innerHTML = '';
            cardsWrapper.appendChild(card);
            card.style.zIndex = '2';
        } else {
            // Set all existing cards to z-index 2
            Array.from(cardsWrapper.children).forEach(existingCard => {
                existingCard.style.zIndex = '2';
            });

            // Set initial position of the new card
            card.style.transform = 'translateX(-100%)';
            card.style.zIndex = '1';
            cardsWrapper.appendChild(card);
            
            // Update wrapper width immediately
            updateCardsWrapperWidth(true);

            // Force a reflow
            void card.offsetWidth;

            // Trigger the slide-in animation in the next frame
            requestAnimationFrame(() => {
                card.style.transition = 'transform 0.5s ease-out';
                card.style.transform = 'translateX(0)';
            });

            // After animation, reset z-index and scroll
            card.addEventListener('transitionend', () => {
                card.style.zIndex = '2';
                card.style.transition = 'none';
                
                // Scroll to the new card
                scrollToNewCard(card);
            }, { once: true });
        }

        console.log(`Card appended to wrapper for ${locationString}`);
        
        // Ensure all async operations are complete before resolving
        await Promise.all([
            initMap(card.querySelector('.map-container'), lat, lon),
            getLocationName(lat, lon).then(locationName => {
                card.querySelector('.card-location').innerText = locationName;
            }),
            loadAllSvgIcons(card)
        ]);

        console.log(`All promises resolved for ${locationString}`);
    } catch (error) {
        console.error(`Error adding card for ${locationString}:`, error);
        alert(`Failed to add card for ${locationString}: ${error.message}`);
    } finally {
        isAddingCard = false;
    }
}

async function createCardElement(weatherData, lat, lon, units, isInitialCard) {
    const weatherDataWithCurrent = weatherData.current ? weatherData : { current: weatherData, daily: weatherData.daily };
    
    let card = document.createElement("div");
    card.classList.add("card");
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

    let cardHeroSection = document.createElement("div");
    cardHeroSection.classList.add("card-hero-section");
    cardHead.appendChild(cardHeroSection);

    let cardHeroTemp = document.createElement("h1");
    cardHeroTemp.classList.add("currentTemp");
    cardHeroTemp.innerHTML = `${Math.round(weatherDataWithCurrent.current.temp) || 'N/A'}<span class="temp-symbol">°</span>`;
    cardHeroSection.appendChild(cardHeroTemp);

    let cardHeroColumn = document.createElement("div");
    cardHeroColumn.classList.add("card-hero-column");
    cardHeroSection.appendChild(cardHeroColumn);

    let cardHeroIcon = document.createElement("div");
    cardHeroIcon.classList.add("card-hero-icon");
    let mainIconCode = weatherDataWithCurrent.current.weather && weatherDataWithCurrent.current.weather[0] ? mapIconCode(weatherDataWithCurrent.current.weather[0].icon) : '01';
    cardHeroIcon.dataset.iconCode = mainIconCode;
    cardHeroColumn.appendChild(cardHeroIcon);

    let cardHeroDesc = document.createElement("h3");
    cardHeroDesc.classList.add("currentDesc");
    cardHeroDesc.textContent = capitalizeWords(weatherDataWithCurrent.current.weather && weatherDataWithCurrent.current.weather[0] ? weatherDataWithCurrent.current.weather[0].description : 'No description available');
    cardHeroColumn.appendChild(cardHeroDesc);

    let flexibleSpacer = document.createElement("div");
    flexibleSpacer.classList.add("flexible-spacer");
    
    let mapContainer = document.createElement("div");
    mapContainer.classList.add("map-container");
    flexibleSpacer.appendChild(mapContainer);
    
    card.appendChild(flexibleSpacer);

    setTimeout(() => {
        initMap(mapContainer, lat, lon);
        
        if (!isInitialCard) {
            setTimeout(() => {
                card.classList.add('slide-in');
                setTimeout(() => {
                    card.classList.remove('new-card');
                }, 500);
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
    feelsLikeTempValue.innerHTML = `${Math.round(weatherDataWithCurrent.current.feels_like) || 'N/A'}<span class="temp-symbol">°</span>`;
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
    highTempValue.innerHTML = `${Math.round(weatherDataWithCurrent.daily[0].temp.max) || 'N/A'}<span class="temp-symbol">°</span>`;
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
    lowTempValue.innerHTML = `${Math.round(weatherDataWithCurrent.daily[0].temp.min) || 'N/A'}<span class="temp-symbol">°</span>`;
    lowTemp.appendChild(lowTempValue);

    let hourlyForecastContainer = document.createElement("div");
    hourlyForecastContainer.classList.add("hourly-forecast-container");
    card.appendChild(hourlyForecastContainer);

    let hourlyForecast = document.createElement("div");
    hourlyForecast.classList.add("hourly-forecast");
    hourlyForecastContainer.appendChild(hourlyForecast);

    weatherDataWithCurrent.hourly.slice(0, 24).forEach((hour) => {
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
    humidityValue.innerHTML = `${weatherDataWithCurrent.current.humidity || 'N/A'}<span class="unit">%</span>`;
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
    uvIndexValue.innerText = weatherDataWithCurrent.current.uvi || 'N/A';
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
    windValue.innerHTML = `${weatherDataWithCurrent.current.wind_speed || 'N/A'} <span class="unit">${units === "metric" ? "m/s" : "mph"}</span>`;
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
    pressureValue.innerHTML = `${weatherDataWithCurrent.current.pressure || 'N/A'} <span class="unit">hPa</span>`;
    pressureWrapper.appendChild(pressureValue);

    console.log('Card created successfully:', card);
    await loadAllSvgIcons(card);
    return card;
}

export function createErrorCard(errorMessage) {
    const errorCard = document.createElement('div');
    errorCard.classList.add('card', 'error-card');
    errorCard.innerHTML = `<p>${errorMessage}</p>`;
    return errorCard;
}

export function updateCardsWrapperWidth(newCardAdded = false) {
    const cardCount = cardsWrapper.children.length;
    const cardWidth = 600; // Width of each card
    const newWidth = cardCount * cardWidth;

    // Reduce the transition duration from 0.5s to 0.3s
    cardsWrapper.style.transition = 'width 0.3s ease-out';

    // Set the new width
    cardsWrapper.style.width = `${newWidth}px`;

    // If a new card was added, schedule removal of transition
    if (newCardAdded) {
        setTimeout(() => {
            cardsWrapper.style.transition = 'none';
        }, 300); // This should match the new transition duration
    }
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
            const { lat, lon } = await getUserLocation();
            console.log("User location obtained:", { lat, lon });
            const weatherData = await getWeatherData(lat, lon, currentUnits);
            console.log("Weather data obtained:", weatherData);
            
            const card = await createCardElement(weatherData, lat, lon, currentUnits, true);
            console.log("Initial card created");
            
            cardsWrapper.innerHTML = '';
            cardsWrapper.appendChild(card);
            console.log("Initial card appended to wrapper");
            
            updateCardsWrapperWidth();
            
            // Initialize map and set location name
            await Promise.all([
                initMap(card.querySelector('.map-container'), lat, lon),
                getLocationName(lat, lon).then(locationName => {
                    card.querySelector('.card-location').innerText = locationName;
                }),
                loadAllSvgIcons(card)
            ]);
            
            console.log("Initial card fully rendered");
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

    let hourlyForecast = card.querySelector('.hourly-forecast');
    hourlyForecast.innerHTML = '';

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

function scrollToNewCard(card) {
    const weatherCards = document.querySelector('.weather-cards');
    const cardRect = card.getBoundingClientRect();
    const containerRect = weatherCards.getBoundingClientRect();

    // Scroll to the rightmost edge
    weatherCards.scrollTo({
        left: weatherCards.scrollWidth - weatherCards.clientWidth,
        behavior: 'smooth'
    });
}