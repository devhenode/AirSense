const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fetchEnvironmentalData(lat = 40.7128, lon = -74.0060) {
  try {
    let usingFileStorage = false;
    let client = null;
    let db = null;
    let collection = null;
    
    // Check if we're using file-based storage
    const flagPath = path.join(__dirname, 'data', 'using-file-storage.flag');
    if (fs.existsSync(flagPath)) {
      console.log('Using file-based storage for data ingestion');
      usingFileStorage = true;
    } else {
      // Try connecting to MongoDB
      try {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        db = client.db(process.env.MONGODB_DB);
        collection = db.collection('environmental_data');
      } catch (dbErr) {
        console.error('MongoDB connection failed, using file storage:', dbErr.message);
        usingFileStorage = true;
      }
    }
    
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
          latitude: location.coordinates?.latitude,
          longitude: location.coordinates?.longitude
        },
        measurements: location.parameters?.map(p => ({
          parameter: p.parameter,
          value: p.lastValue,
          unit: p.unit
        })) || []
      })),
      temperatureData: weatherData.current ? {
        location: `Lat: ${lat}, Lon: ${lon}`,
        temperature: weatherData.current.temp,
        humidity: weatherData.current.humidity,
        conditions: weatherData.current.weather?.[0]?.description || 'Unknown'
      } : {}
    };
    
    if (usingFileStorage) {
      // Ensure data directory exists
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Path for environmental data
      const envDataPath = path.join(dataDir, 'environmental_data.json');
      
      // Read existing data or create new array
      let existingData = [];
      if (fs.existsSync(envDataPath)) {
        try {
          existingData = JSON.parse(fs.readFileSync(envDataPath, 'utf8'));
          if (!Array.isArray(existingData)) existingData = [];
        } catch (err) {
          console.warn('Could not parse existing environmental data file, creating new one');
        }
      }
      
      // Add new data and write back to file
      existingData.push(processedData);
      fs.writeFileSync(envDataPath, JSON.stringify(existingData, null, 2));
      console.log('Environmental data successfully stored in file');
    } else {
      // Store in MongoDB
      await collection.insertOne(processedData);
      console.log('Environmental data successfully stored in MongoDB');
      await client.close();
    }
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