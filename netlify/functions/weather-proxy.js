const axios = require('axios');

exports.handler = async function(event, context) {
  console.log('Function invoked with query parameters:', event.queryStringParameters);
  const { lat, lon, units } = event.queryStringParameters;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  console.log('API Key available:', !!apiKey);

  if (!apiKey) {
    console.error('API key is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key is not set' })
    };
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
  console.log('Requesting URL:', url);

  try {
    const response = await axios.get(url);
    console.log('Successful response from OpenWeather API');
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error from OpenWeather API:', error.message);
    console.error('Error details:', error.response?.data);
    return {
      statusCode: error.response?.status || 500,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || 'No additional details'
      })
    };
  }
}