const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const { lat, lon, apiKey } = event.queryStringParameters;
  
  // Remove this check entirely as we're not using the OpenWeather API key here
  // if (apiKey !== process.env.OPENWEATHER_API_KEY) {
  //   return { statusCode: 403, body: 'Unauthorized' };
  // }

  if (!lat || !lon) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters: lat or lon' })
    };
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Google Geocoding API responded with status ${response.status}`);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Google Geocoding API responded with status ${response.status}` })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error in google-geocoding-proxy:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        error: 'Failed to fetch Google geocoding data',
        details: error.message
      })
    };
  }
};