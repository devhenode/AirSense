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
    
    // Make sure the data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    console.log(`Fetching air quality data near lat: ${lat}, lon: ${lon}`);
    let aqData = { results: [] };
    try {
      // Fetch AQ data (OpenAQ API)
      const aqResponse = await fetch(`https://api.openaq.org/v2/locations?limit=10&coordinates=${lat},${lon}&radius=50000`);
      aqData = await aqResponse.json();
    } catch (aqErr) {
      console.error('Error fetching air quality data:', aqErr.message);
      // Continue with empty results
    }
    
    console.log(`Fetching weather data for lat: ${lat}, lon: ${lon}`);
    let weatherData = {};
    try {
      // Fetch detailed weather data using provided lat/lon
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${process.env.OPENWEATHER_API_KEY}`
      );
      weatherData = await weatherResponse.json();
    } catch (weatherErr) {
      console.error('Error fetching weather data:', weatherErr.message);
      // Continue with empty weather data
    }

    console.log(`Getting location name for lat: ${lat}, lon: ${lon}`);
    let locationName = `Location (${lat}, ${lon})`;
    try {
      // Get location name using reverse geocoding
      const geoResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`
      );
      const geoData = await geoResponse.json();
      if (geoData && geoData.length > 0) {
        locationName = `${geoData[0].name}, ${geoData[0].country}`;
      }
    } catch (geoErr) {
      console.error('Error fetching location name:', geoErr.message);
      // Continue with default location name
    }
    
    // Process and store the data
    const processedData = {
      timestamp: new Date().toISOString(),
      location: locationName,
      coordinates: { latitude: lat, longitude: lon },
      aqData: (aqData.results || []).map(location => ({
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
      weather: weatherData.current ? {
        temperature: weatherData.current.temp,
        feels_like: weatherData.current.feels_like,
        humidity: weatherData.current.humidity,
        uv_index: weatherData.current.uvi,
        wind_speed: weatherData.current.wind_speed,
        wind_direction: weatherData.current.wind_deg,
        pressure: weatherData.current.pressure,
        conditions: weatherData.current.weather?.[0]?.description || 'Unknown',
        icon: weatherData.current.weather?.[0]?.icon
      } : {
        temperature: 25, // Default values if API call fails
        feels_like: 26,
        humidity: 60,
        conditions: 'Unknown'
      },
      hourly: weatherData.hourly ? weatherData.hourly.slice(0, 24).map(hour => ({
        timestamp: new Date(hour.dt * 1000).toISOString(),
        temperature: hour.temp,
        humidity: hour.humidity,
        conditions: hour.weather[0]?.description || 'Unknown',
        icon: hour.weather[0]?.icon
      })) : [],
      daily: weatherData.daily ? weatherData.daily.map(day => ({
        timestamp: new Date(day.dt * 1000).toISOString(),
        temperature_min: day.temp.min,
        temperature_max: day.temp.max,
        humidity: day.humidity,
        conditions: day.weather[0]?.description || 'Unknown',
        icon: day.weather[0]?.icon
      })) : []
    };
      if (usingFileStorage) {
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
    } else if (collection) {
      // Store in MongoDB
      await collection.insertOne(processedData);
      console.log('Environmental data successfully stored in MongoDB');
      if (client) await client.close();
    }
    
    // Return the processed data so it can be used by the API endpoint
    return processedData;
  } catch (error) {
    console.error('Error fetching environmental data:', error);
    // Return a fallback data structure to avoid undefined errors
    return {
      timestamp: new Date().toISOString(),
      location: "Error fetching data",
      coordinates: { latitude: lat, longitude: lon },
      weather: {
        temperature: 25,
        humidity: 60,
        conditions: "Data unavailable"
      },
      hourly: [],
      daily: []
    };
  }
}

/**
 * Search for locations using the OpenWeather geocoding API
 * @param {string} query - The location to search for
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} Array of location results
 */
async function searchLocations(query, limit = 5) {
  try {
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid search query');
    }
    
    console.log(`Searching for locations matching: "${query}"`);
    
    // Fetch location data using OpenWeather Geocoding API
    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=${limit}&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    
    if (!geoResponse.ok) {
      throw new Error(`OpenWeather API error: ${geoResponse.status} ${geoResponse.statusText}`);
    }
    
    const locations = await geoResponse.json();
    
    // Format the results
    return locations.map(location => ({
      name: location.name,
      country: location.country,
      state: location.state || '',
      coordinates: {
        latitude: location.lat,
        longitude: location.lon
      },
      displayName: `${location.name}${location.state ? `, ${location.state}` : ''}, ${location.country}`
    }));
  } catch (error) {
    console.error('Error searching for locations:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  fetchEnvironmentalData().then(() => console.log('Data fetch complete'));
}

module.exports = { fetchEnvironmentalData, searchLocations };