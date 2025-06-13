const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');
require('dotenv').config();

async function fetchEnvironmentalData(lat, lon) {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('environmental_data');
    
    // Fetch AQ data (example using OpenAQ API)
    const aqResponse = await fetch('https://api.openaq.org/v2/locations?limit=100');
    const aqData = await aqResponse.json();
    
    // Fetch temperature data using provided lat/lon
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    const weatherData = await weatherResponse.json();
    
    // Process and store the data
    const processedData = {
      timestamp: new Date(),
      aqData: aqData.results.map(location => ({
        location: location.name,
        coordinates: {
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude
        },
        measurements: location.parameters.map(p => ({
          parameter: p.parameter,
          value: p.lastValue,
          unit: p.unit
        }))
      })),
      temperatureData: weatherData.current ? {
        location: `Lat: ${lat}, Lon: ${lon}`,
        temperature: weatherData.current.temp,
        humidity: weatherData.current.humidity,
        conditions: weatherData.current.weather[0].description
      } : {}
    };
    
    await collection.insertOne(processedData);
    console.log('Environmental data successfully stored');
    
    await client.close();
  } catch (error) {
    console.error('Error fetching environmental data:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  // Get lat/lon from command line arguments
  const [, , lat, lon] = process.argv;
  if (!lat || !lon) {
    console.error('Usage: node data-ingestion.js <latitude> <longitude>');
    process.exit(1);
  }
  fetchEnvironmentalData(lat, lon);
}

module.exports = { fetchEnvironmentalData };