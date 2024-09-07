const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const { lat, lon } = event.queryStringParameters;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`);
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch Google geocoding data' })
    };
  }
};