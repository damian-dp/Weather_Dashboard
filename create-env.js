const fs = require('fs');

const envContent = `
window.env = {
  OPENWEATHER_API_KEY: '${process.env.OPENWEATHER_API_KEY || "NOT_SET"}',
  GOOGLE_MAPS_API_KEY: '${process.env.GOOGLE_MAPS_API_KEY || "NOT_SET"}'
};
`;

fs.writeFileSync('src/env.js', envContent);
console.log('Created env.js with environment variables');
console.log('OPENWEATHER_API_KEY:', process.env.OPENWEATHER_API_KEY ? 'Set' : 'Not Set');
console.log('GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? 'Set' : 'Not Set');