import { lightModeToggle, darkModeToggle } from './main.js';
import { initMap } from './map.js';

export function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isDarkMode = savedTheme === 'dark';

    document.documentElement.classList.toggle('dark-mode', isDarkMode);
    document.documentElement.classList.toggle('light-mode', !isDarkMode);

    lightModeToggle.style.display = isDarkMode ? 'none' : 'flex';
    darkModeToggle.style.display = isDarkMode ? 'flex' : 'none';
}

export function toggleTheme() {
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
        }, 200);
    }, 250);
}

export function handleButtonMouseLeave(button) {
    button.classList.add('hover-ready');
}