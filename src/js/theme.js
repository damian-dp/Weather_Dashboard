import { initializeMaps } from './map.js';

export function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.add(`${savedTheme}-mode`);
    updateThemeToggleVisibility(savedTheme);
}

export function toggleTheme() {
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    const flexibleSpacers = document.querySelectorAll('.flexible-spacer');
    const mapContainers = document.querySelectorAll('.map-container');
    const mapGradients = document.querySelectorAll('.map-gradient');

    // Fade out flexible spacers, map containers, and gradients
    flexibleSpacers.forEach(spacer => {
        spacer.style.transition = 'opacity 0.3s ease-in-out';
        spacer.style.opacity = '0';
    });
    mapContainers.forEach(container => {
        container.style.transition = 'opacity 0.3s ease-in-out';
        container.style.opacity = '0';
    });
    mapGradients.forEach(gradient => {
        gradient.style.transition = 'opacity 0.3s ease-in-out';
        gradient.style.opacity = '0';
    });

    // Delay the theme toggle to allow fade out
    setTimeout(() => {
        // Toggle theme
        document.documentElement.classList.toggle('dark-mode');
        document.documentElement.classList.toggle('light-mode');
        
        // Update localStorage
        localStorage.setItem('theme', isDarkMode ? 'light' : 'dark');

        // Toggle button visibility
        updateThemeToggleVisibility(isDarkMode ? 'light' : 'dark');

        // Update map background color
        document.documentElement.style.setProperty('--map-background-color', getComputedStyle(document.documentElement).getPropertyValue('--background-color'));
        document.documentElement.style.setProperty('--map-background-color-rgb', getComputedStyle(document.documentElement).getPropertyValue('--background-color-rgb'));

        // Reinitialize maps with new theme
        initializeMaps();

        // Fade in flexible spacers, map containers, and gradients
        setTimeout(() => {
            flexibleSpacers.forEach(spacer => {
                spacer.style.opacity = '1';
            });
            mapContainers.forEach(container => {
                container.style.opacity = '1';
            });
            mapGradients.forEach(gradient => {
                gradient.style.opacity = '1';
            });
        }, 50);
    }, 300);
}

function updateThemeToggleVisibility(theme) {
    const lightModeToggle = document.getElementById('light-mode-toggle');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    if (theme === 'dark') {
        lightModeToggle.style.display = 'flex';
        darkModeToggle.style.display = 'none';
    } else {
        lightModeToggle.style.display = 'none';
        darkModeToggle.style.display = 'flex';
    }
}

export function handleButtonMouseLeave(button) {
    button.classList.remove('hover-ready');
}