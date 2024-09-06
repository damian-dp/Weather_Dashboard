const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const { lat, lon, units } = event.queryStringParameters;
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching weather data' })
    };
  }
};