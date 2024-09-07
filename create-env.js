const fs = require('fs');

const envContent = `
console.log('env.js loaded');
window.env = {
  OPENWEATHER_API_KEY: '${process.env.OPENWEATHER_API_KEY || ""}',
  GOOGLE_MAPS_API_KEY: '${process.env.GOOGLE_MAPS_API_KEY || ""}'
};
`;

fs.writeFileSync('src/env.js', envContent);
console.log('Created env.js with environment variables');