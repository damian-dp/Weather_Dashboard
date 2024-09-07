const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const { location } = event.queryStringParameters;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!location) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Location parameter is required' })
    };
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`OpenWeatherMap API responded with status ${response.status}`);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `OpenWeatherMap API responded with status ${response.status}` })
      };
    }

    const data = await response.json();
    
    if (data.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Location not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error in geocoding-proxy:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch geocoding data', details: error.message })
    };
  }
};