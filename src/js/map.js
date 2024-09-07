import { getGoogleMapsApiKey } from './config.js';

export function initMap(mapContainer, lat, lon) {
    return new Promise((resolve, reject) => {
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.log('Google Maps API not loaded, loading now...');
            window.initMap = () => {
                console.log('Google Maps API loaded');
                createMap(mapContainer, lat, lon);
                resolve();
            };
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${getGoogleMapsApiKey()}&callback=initMap`;
            document.head.appendChild(script);
        } else {
            console.log('Google Maps API already loaded');
            createMap(mapContainer, lat, lon);
            resolve();
        }
    });
}

function createMap(mapContainer, lat, lon) {
    const map = new google.maps.Map(mapContainer, {
        center: { lat, lng: lon },
        zoom: 10,
        disableDefaultUI: true,
        styles: [
            {
                featureType: "all",
                elementType: "labels",
                stylers: [
                    { visibility: "off" }
                ]
            }
        ]
    });

    new google.maps.Marker({
        position: { lat, lng: lon },
        map: map,
    });
}