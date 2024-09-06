export function mapIconCode(code) {
    if (!code) {
        console.error('Invalid weather icon code:', code);
        return '01'; // Default to clear sky if code is invalid
    }
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
    return iconMap[code.slice(0, 2)] || '01'; // Default to clear sky if unknown
}

export async function loadAllSvgIcons(card) {
    const iconElements = card.querySelectorAll('.hour-icon, .card-hero-icon');
    const iconPromises = Array.from(iconElements).map(async (element) => {
        const iconCode = element.dataset.iconCode || '01';
        const svgContent = await getSvgContent(iconCode);
        element.innerHTML = svgContent;
    });
    await Promise.all(iconPromises);
}

export async function getSvgContent(iconCode) {
    const url = `/img/weather-icons/${iconCode}.svg`;
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(svgText => {
            if (svgText.trim().startsWith('<svg')) {
                return svgText;
            } else if (svgText.includes('<html')) {
                return getFallbackSvg(iconCode);
            } else {
                return getFallbackSvg(iconCode);
            }
        })
        .catch(error => {
            return getFallbackSvg(iconCode);
        });
}

function getFallbackSvg(iconCode) {
    // Provide a simple fallback SVG based on the icon code
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12">${iconCode}</text>
    </svg>`;
}