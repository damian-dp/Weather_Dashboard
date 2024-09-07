import { getGoogleMapsApiKey } from './config.js';

let googleMapsLoaded = false;

function loadGoogleMapsAPI() {
    if (googleMapsLoaded) {
        return googleMapsLoaded;
    }

    const apiKey = getGoogleMapsApiKey();
    if (apiKey === 'GOOGLE_MAPS_API_KEY_PLACEHOLDER') {
        console.error('Google Maps API key is not set');
        return Promise.reject(new Error('Google Maps API key is not set'));
    }

    googleMapsLoaded = new Promise((resolve, reject) => {
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
        script.src = `https://maps.googleapis.com/maps/api/js?key=${getGoogleMapsApiKey}&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        script.onerror = reject;
        document.head.appendChild(script);
    });

    return googleMapsLoaded;
}

export async function initMap(container, lat, lon) {
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

        // Add this check before any IntersectionObserver usage
        if (map && map.getDiv() && document.body.contains(map.getDiv())) {
            // Your IntersectionObserver code here
        } else {
            console.warn('Map container is not in the DOM, skipping IntersectionObserver');
        }
    } catch (error) {
        console.error('Error creating Google Map:', error);
    }
}

export function initializeMaps() {
    const mapContainers = document.querySelectorAll('.map-container');
    mapContainers.forEach(container => {
        const card = container.closest('.card');
        const lat = parseFloat(card.dataset.lat);
        const lon = parseFloat(card.dataset.lon);
        initMap(container, lat, lon);
    });
}