import { initializeMaps } from './map.js';

export function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.add(`${savedTheme}-mode`);
    updateThemeToggleVisibility(savedTheme);
}

export function toggleTheme() {
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    const newTheme = isDarkMode ? 'light' : 'dark';

    // Remove transition class if it exists
    document.documentElement.classList.remove('theme-transition');

    // Hide map containers and flex-spacers
    const mapContainers = document.querySelectorAll('.map-container');
    const flexSpacers = document.querySelectorAll('.flexible-spacer');
    mapContainers.forEach(container => container.style.opacity = '0');
    flexSpacers.forEach(spacer => spacer.style.opacity = '0');

    // Force a reflow
    void document.documentElement.offsetWidth;

    // Add transition class
    document.documentElement.classList.add('theme-transition');

    // Toggle theme
    document.documentElement.classList.toggle('dark-mode');
    document.documentElement.classList.toggle('light-mode');

    // Update localStorage
    localStorage.setItem('theme', newTheme);

    // Toggle button visibility
    updateThemeToggleVisibility(newTheme);

    // Update map background color
    document.documentElement.style.setProperty('--map-background-color', getComputedStyle(document.documentElement).getPropertyValue('--background-color'));
    document.documentElement.style.setProperty('--map-background-color-rgb', getComputedStyle(document.documentElement).getPropertyValue('--background-color-rgb'));

    // Reinitialize maps with new theme and show map containers and flex-spacers
    setTimeout(() => {
        initializeMaps();
        mapContainers.forEach(container => container.style.opacity = '1');
        flexSpacers.forEach(spacer => spacer.style.opacity = '1');
        // Remove transition class after animation is complete
        document.documentElement.classList.remove('theme-transition');
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