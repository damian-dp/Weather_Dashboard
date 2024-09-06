const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log('Function invoked with query parameters:', event.queryStringParameters);
  const { lat, lon, units, apiKey } = event.queryStringParameters;
  const finalApiKey = apiKey || process.env.OPENWEATHER_API_KEY;

  console.log('API Key available:', !!finalApiKey);
  console.log('API Key (first 5 chars):', finalApiKey.slice(0, 5)); // Log only first 5 chars for security

  if (!finalApiKey) {
    console.error('API key is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key is not set' })
    };
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units}&appid=${finalApiKey}`;
  console.log('Full URL being requested:', url.replace(finalApiKey, 'API_KEY_HIDDEN'));

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('OpenWeather API response status:', response.status);
    console.log('OpenWeather API response body:', JSON.stringify(data));
    
    if (response.status !== 200) {
      throw new Error(`OpenWeather API responded with status ${response.status}`);
    }
    
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
        details: error.message,
        url: url.replace(finalApiKey, 'API_KEY_HIDDEN')
      })
    };
  }
};