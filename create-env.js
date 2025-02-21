const fs = require('fs');

const openWeatherApiKey = process.env.OPENWEATHER_API_KEY || "NOT_SET";
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "NOT_SET";

if (openWeatherApiKey === "NOT_SET" || googleMapsApiKey === "NOT_SET") {
  console.error("Warning: One or more API keys are not set or are empty!");
}

const envContent = `
window.env = {
  OPENWEATHER_API_KEY: '${openWeatherApiKey}',
  GOOGLE_MAPS_API_KEY: '${googleMapsApiKey}'
};
`;

fs.writeFileSync('src/env.js', envContent);
console.log('Created env.js with environment variables');
console.log('OPENWEATHER_API_KEY:', openWeatherApiKey === "NOT_SET" ? 'Not Set' : 'Set');
console.log('GOOGLE_MAPS_API_KEY:', googleMapsApiKey === "NOT_SET" ? 'Not Set' : 'Set');