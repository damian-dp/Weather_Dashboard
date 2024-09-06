const axios = require('axios');

exports.handler = async function(event, context) {
  const { lat, lon, units } = event.queryStringParameters;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key is not set' })
    };
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;

  try {
    const response = await axios.get(url);
    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || 'No additional details'
      })
    };
  }
}