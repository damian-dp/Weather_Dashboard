let cardsWrapper = document.getElementById("cards-wrapper");
let currentUnits = "metric";
let celsiusButton = document.getElementById("celsius");
let fahrenheitButton = document.getElementById("fahrenheit");

document.getElementById('theme-toggle').addEventListener('click', function() {
    document.documentElement.classList.toggle('dark-mode');
    document.documentElement.classList.toggle('light-mode');
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

function getUserLocation() {
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
					reject(error);
				}
			);
		} else {
			reject(new Error("Geolocation is not supported by this browser."));
		}
	});
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

async function renderInitialCard() {
	try {
		const { lat, lon } = await getUserLocation();
		const weatherData = await getWeatherData(lat, lon, currentUnits);
		const card = createCard(weatherData, lat, lon, currentUnits); // Pass lat, lon, and units
		if (card instanceof Node) {
			cardsWrapper.appendChild(card);
		} else {
			console.error("createCard did not return a valid Node.");
		}
	} catch (error) {
		console.error("Error getting user location or weather data:", error);
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
		hourWrapper.appendChild(hourIcon);

		let hourTemp = document.createElement("p");
		hourTemp.classList.add("hour-temp");
		hourTemp.innerText = hour.temp;
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
celsiusButton.addEventListener("click", async () => {
	currentUnits = "metric";
	updateAllCards(currentUnits);
});

fahrenheitButton.addEventListener("click", async () => {
	currentUnits = "imperial";
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
			updateCard(card, weatherData);
		} catch (error) {
			console.error(`Error updating card with lat: ${lat}, lon: ${lon}`, error);
		}
	}
}

// Function to update a single card
function updateCard(card, weatherData) {
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

	const hourlyForecast = card.querySelector(".hourly-forecast");
	if (hourlyForecast) {
		hourlyForecast.innerHTML = ""; // Clear existing hourly forecast

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
			hourWrapper.appendChild(hourIcon);

			let hourTemp = document.createElement("p");
			hourTemp.classList.add("hour-temp");
			hourTemp.innerText = hour.temp;
			hourWrapper.appendChild(hourTemp);
		});
	} else {
		console.error("Hourly forecast element not found.");
	}

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
}

// Initial render
renderInitialCard();
