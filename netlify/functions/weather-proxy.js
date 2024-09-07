const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const { lat, lon, units, apiKey } = event.queryStringParameters;
  
  console.log('Received API Key:', apiKey);
  console.log('Environment API Key:', process.env.OPENWEATHER_API_KEY);

  if (apiKey !== process.env.OPENWEATHER_API_KEY) {
    return { 
      statusCode: 403, 
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: 'Unauthorized', receivedKey: apiKey, envKey: process.env.OPENWEATHER_API_KEY })
    };
  }

  if (!lat || !lon || !units) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: 'Missing required parameters: lat, lon, or units' })
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=${units}&appid=${process.env.OPENWEATHER_API_KEY}`;
  console.log('OpenWeatherMap API URL:', url);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`OpenWeatherMap API responded with status ${response.status}`);
      const errorText = await response.text();
      console.error('OpenWeatherMap API error response:', errorText);
      return {
        statusCode: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ error: `OpenWeatherMap API responded with status ${response.status}`, details: errorText })
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