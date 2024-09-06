import { ensureMinimumLoadingTime, hideLoadingOverlay, showLoadingOverlay } from './loading.js';

let cardsWrapper = document.getElementById("cards-wrapper");
let currentUnits = "metric";
let tempToggle = document.getElementById("temp-toggle");

const lightModeToggle = document.getElementById('light-mode-toggle');
const darkModeToggle = document.getElementById('dark-mode-toggle');

function mapIconCode(code) {
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
    return iconMap[code.slice(0, -1)] || '01'; // Default to clear sky if unknown
}

function toggleTheme() {
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
	// Prompt the user for a location
	const location = prompt("Please enter a location:");

	if (location) {
		try {
			// Fetch the weather data for the provided location
			const { weatherData, lat, lon } = await getWeatherDataByLocation(
				location,
				currentUnits
			);
			// Create a new card with the fetched weather data
			const card = createCard(weatherData, lat, lon, currentUnits);
			// Append the new card to the cards-wrapper div
			if (card instanceof Node) {
				cardsWrapper.appendChild(card);
			} else {
				console.error("createCard did not return a valid Node.");
			}
		} catch (error) {
			console.error(
				"Error fetching weather data for the provided location:",
				error
			);
		}
	}
});

// Function to fetch weather data by location
async function getWeatherDataByLocation(location, units) {
	const apiKey = "e928c0a0551ec38eb38eefd5e0f079c0";
	const geocodingResponse = await fetch(
		`http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${apiKey}`
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
	const apiKey = "e928c0a0551ec38eb38eefd5e0f079c0";

	let response = await fetch(
		`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`
	);

	if (!response.ok) {
		throw new Error(`API call failed with status ${response.status}`);
	}

	let data = await response.json();

	return {
		location: data.timezone,
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

// Modify the renderInitialCard function
async function renderInitialCard() {
    console.log("Rendering initial card");
    showLoadingOverlay(); // Ensure the overlay is shown
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
            } else {
                console.error("createCard did not return a valid Node.");
            }
        });
    } catch (error) {
        console.error("Error getting user location or weather data:", error);
    } finally {
        console.log("Render initial card process completed");
        hideLoadingOverlay();
    }
}

function createCard(weatherData, lat, lon, units) {
	console.log(`Creating card with lat: ${lat}, lon: ${lon}, units: ${units}`); // Debugging log
	let card = document.createElement("div");
	card.classList.add("card");
	card.dataset.lat = lat;
	card.dataset.lon = lon;
	card.dataset.units = units;

	let cardHead = document.createElement("div");
	cardHead.classList.add("card-head");
	card.appendChild(cardHead);

	let cardLocation = document.createElement("h2");
	cardLocation.innerText = weatherData.location;
	cardHead.appendChild(cardLocation);

	let cardHeroSection = document.createElement("div");
	cardHeroSection.classList.add("card-hero-section");
	cardHead.appendChild(cardHeroSection);

	let cardHeroTemp = document.createElement("h1");
	cardHeroTemp.classList.add("currentTemp");
	cardHeroTemp.innerText = weatherData.currentTemp;
	cardHeroSection.appendChild(cardHeroTemp);

	let cardHeroColumn = document.createElement("div");
	cardHeroColumn.classList.add("card-hero-column");
	cardHeroSection.appendChild(cardHeroColumn);

	let cardHeroIcon = document.createElement("img");
	cardHeroIcon.classList.add("card-hero-icon");
	let mainIconCode = mapIconCode(weatherData.currentIcon);
	cardHeroIcon.src = `./img/weather-icons/${mainIconCode}.svg`;
	cardHeroColumn.appendChild(cardHeroIcon);

	let cardHeroDesc = document.createElement("h3");
	cardHeroDesc.classList.add("currentDesc");
	cardHeroDesc.innerText = weatherData.currentDesc;
	cardHeroColumn.appendChild(cardHeroDesc);

	let tempRanges = document.createElement("div");
	tempRanges.classList.add("temp-ranges");
	card.appendChild(tempRanges);

	let feelsLikeTemp = document.createElement("div");
	tempRanges.appendChild(feelsLikeTemp);

	let feelsLikeTempLabel = document.createElement("h4");
	feelsLikeTempLabel.classList.add("temp-label");
	feelsLikeTempLabel.innerText = "Feels like";
	feelsLikeTemp.appendChild(feelsLikeTempLabel);

	let feelsLikeTempValue = document.createElement("h4");
	feelsLikeTempValue.classList.add("feelsLikeTemp");
	feelsLikeTempValue.innerText = weatherData.feelsLike;
	feelsLikeTemp.appendChild(feelsLikeTempValue);

	let highTemp = document.createElement("div");
	tempRanges.appendChild(highTemp);

	let highTempLabel = document.createElement("h4");
	highTempLabel.classList.add("temp-label");
	highTempLabel.innerText = "↑";
	highTemp.appendChild(highTempLabel);

	let highTempValue = document.createElement("h4");
	highTempValue.classList.add("highTemp");
	highTempValue.innerText = weatherData.highTemp;
	highTemp.appendChild(highTempValue);

	let lowTemp = document.createElement("div");
	tempRanges.appendChild(lowTemp);

	let lowTempLabel = document.createElement("h4");
	lowTempLabel.classList.add("temp-label");
	lowTempLabel.innerText = "↓";
	lowTemp.appendChild(lowTempLabel);

	let lowTempValue = document.createElement("h4");
	lowTempValue.classList.add("lowTemp");
	lowTempValue.innerText = weatherData.lowTemp;
	lowTemp.appendChild(lowTempValue);

	let hourlyForecast = document.createElement("div");
	hourlyForecast.classList.add("hourly-forecast");
	card.appendChild(hourlyForecast);

	weatherData.hourly.forEach((hour) => {
		let hourWrapper = document.createElement("div");
		hourWrapper.classList.add("hour-wrapper");
		hourlyForecast.appendChild(hourWrapper);

		let hourLabel = document.createElement("p");
		hourLabel.classList.add("hour-label");
		hourLabel.innerText = new Date(hour.dt * 1000).getHours() + ":00";
		hourWrapper.appendChild(hourLabel);

		let hourIcon = document.createElement("img");
		hourIcon.classList.add("hour-icon");
		let iconCode = mapIconCode(hour.weather[0].icon);
		hourIcon.src = `./img/weather-icons/${iconCode}.svg`;
		hourWrapper.appendChild(hourIcon);

		let hourTemp = document.createElement("p");
		hourTemp.classList.add("hour-temp");
		hourTemp.innerText = Math.round(hour.temp) + "°";
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
	humidityValue.innerText = weatherData.humidity + "%";
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
	windValue.innerText = weatherData.wind + " mph";
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
	pressureValue.innerText = weatherData.pressure + " hPa";
	pressureWrapper.appendChild(pressureValue);

	return card;
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
		currentTempElement.innerText = weatherData.currentTemp;
	} else {
		console.error("Current temperature element not found.");
	}

	const currentDescElement = card.querySelector(".currentDesc");
	if (currentDescElement) {
		currentDescElement.innerText = weatherData.currentDesc;
	} else {
		console.error("Current description element not found.");
	}

	const feelsLikeTempElement = card.querySelector(".feelsLikeTemp");
	if (feelsLikeTempElement) {
		feelsLikeTempElement.innerText = weatherData.feelsLike;
	} else {
		console.error("Feels like temperature element not found.");
	}

	const highTempElement = card.querySelector(".highTemp");
	if (highTempElement) {
		highTempElement.innerText = weatherData.highTemp;
	} else {
		console.error("High temperature element not found.");
	}

	const lowTempElement = card.querySelector(".lowTemp");
	if (lowTempElement) {
		lowTempElement.innerText = weatherData.lowTemp;
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
		hourLabel.innerText = new Date(hour.dt * 1000).getHours() + ":00";
		hourWrapper.appendChild(hourLabel);

		let hourIcon = document.createElement("img");
		hourIcon.classList.add("hour-icon");
		let iconCode = mapIconCode(hour.weather[0].icon);
		hourIcon.src = `./img/weather-icons/${iconCode}.svg`;
		hourWrapper.appendChild(hourIcon);

		let hourTemp = document.createElement("p");
		hourTemp.classList.add("hour-temp");
		hourTemp.innerText = Math.round(tempFormat === 'C' ? hour.temp : celsiusToFahrenheit(hour.temp)) + "°";
		hourWrapper.appendChild(hourTemp);
	});

	const humidityElement = card.querySelector(
		".misc-weather-data .humidityWrapper .misc-data-value"
	);
	if (humidityElement) {
		humidityElement.innerText = weatherData.humidity + "%";
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
		windElement.innerText = weatherData.wind + " mph";
	} else {
		console.error("Wind element not found.");
	}

	const pressureElement = card.querySelector(
		".misc-weather-data .pressureWrapper .misc-data-value"
	);
	if (pressureElement) {
		pressureElement.innerText = weatherData.pressure + " hPa";
	} else {
		console.error("Pressure element not found.");
	}

    // Update temperature unit display
    const tempUnit = currentUnits === "metric" ? "C" : "°F";
    const windUnit = currentUnits === "metric" ? "m/s" : "mph";

    if (currentTempElement) {
        currentTempElement.innerText = `${Math.round(weatherData.currentTemp)}${tempUnit}`;
    }
    if (feelsLikeTempElement) {
        feelsLikeTempElement.innerText = `${Math.round(weatherData.feelsLike)}${tempUnit}`;
    }
    if (highTempElement) {
        highTempElement.innerText = `${Math.round(weatherData.highTemp)}${tempUnit}`;
    }
    if (lowTempElement) {
        lowTempElement.innerText = `${Math.round(weatherData.lowTemp)}${tempUnit}`;
    }
    if (windElement) {
        windElement.innerText = `${Math.round(weatherData.wind)} ${windUnit}`;
    }

    const cardHeroIcon = card.querySelector(".card-hero-icon");
    if (cardHeroIcon) {
        let mainIconCode = mapIconCode(weatherData.currentIcon);
        cardHeroIcon.src = `./img/weather-icons/${mainIconCode}.svg`;
    } else {
        console.error("Card hero icon element not found.");
    }
}

function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

// Initial render
window.addEventListener('load', () => {
    console.log("Window loaded");
    renderInitialCard();
});
