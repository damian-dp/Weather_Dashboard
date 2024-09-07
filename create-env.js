const fs = require('fs');

const envContent = `
console.log('env.js loaded');
window.env = {
  OPENWEATHER_API_KEY: 'OPENWEATHER_API_KEY_PLACEHOLDER',
  GOOGLE_MAPS_API_KEY: 'GOOGLE_MAPS_API_KEY_PLACEHOLDER'
};
`;

fs.writeFileSync('src/env.js', envContent);
console.log('Created env.js with placeholder environment variables');