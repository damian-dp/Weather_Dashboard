const fs = require('fs');

const envContent = `
window.env = {
  REACT_APP_OPENWEATHER_API_KEY: '${process.env.REACT_APP_OPENWEATHER_API_KEY}',
  REACT_APP_GOOGLE_MAPS_API_KEY: '${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}'
};
`;

fs.writeFileSync('src/env.js', envContent);
console.log('Created env.js with environment variables');