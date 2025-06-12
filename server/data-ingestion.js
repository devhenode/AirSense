// server/data-ingestion.js
const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');
require('dotenv').config();

async function fetchEnvironmentalData() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('environmental_data');
    
    // Fetch AQ data (example using OpenAQ API)
    const aqResponse = await fetch('https://api.openaq.org/v2/locations?limit=100');
    const aqData = await aqResponse.json();
    
    // Fetch temperature data (example using OpenWeatherMap API)
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=YourCity&appid=${process.env.OPENWEATHER_API_KEY}`
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
      temperatureData: {
        location: weatherData.name,
        temperature: weatherData.main.temp,
        humidity: weatherData.main.humidity,
        conditions: weatherData.weather[0].description
      }
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
  fetchEnvironmentalData();
}

module.exports = { fetchEnvironmentalData };