const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const { lat, lon, units, apiKey } = event.queryStringParameters;
  
  if (apiKey !== 'OPENWEATHER_API_KEY_PLACEHOLDER') {
    return { statusCode: 403, body: 'Unauthorized' };
  }

  const realApiKey = process.env.OPENWEATHER_API_KEY;

  if (!lat || !lon || !units) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters: lat, lon, or units' })
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=${units}&appid=${realApiKey}`;

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
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error in weather-proxy:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        error: 'Failed to fetch weather data',
        details: error.message
      })
    };
  }
};