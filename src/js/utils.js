export function debounce(func, wait) {
    // ... (existing debounce function)
}

export function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

export function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}