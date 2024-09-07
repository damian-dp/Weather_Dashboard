const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const { lat, lon, units } = event.queryStringParameters;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!lat || !lon || !units) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters: lat, lon, or units' })
    };
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`OpenWeather API responded with status ${response.status}`);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `OpenWeather API responded with status ${response.status}` })
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
    console.error('Error fetching weather data:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        error: 'Failed fetching weather data',
        details: error.message
      })
    };
  }
};