const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// API retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // ms

/**
 * Fetch data with retry mechanism
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - The fetched data
 */
async function fetchWithRetry(url, options = {}) {
  let retries = 0;
  let lastError = null;

  while (retries <= MAX_RETRIES) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      console.warn(`Fetch attempt ${retries + 1}/${MAX_RETRIES + 1} failed: ${error.message}`);
      
      if (retries < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retries);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        break;
      }
    }
  }
  
  throw lastError;
}

/**
 * Fetch environmental data from multiple sources with improved reliability
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Object} options - Options for data fetching
 * @returns {Promise<Object>} - Processed environmental data
 */
async function fetchEnvironmentalData(lat = 40.7128, lon = -74.0060, options = {}) {
  try {
    // Initialize storage mechanism
    let usingFileStorage = false;
    let client = null;
    let db = null;
    let collection = null;
    
    // Track data sources that were successfully used
    const dataSources = {
      weather: null,
      airQuality: null,
      locationName: null
    };
    
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
    
    // Air quality data - try multiple sources
    console.log(`Fetching air quality data near lat: ${lat}, lon: ${lon}`);
    let aqData = { results: [] };
    
    // Try OpenAQ API first
    try {
      console.log('Attempting to fetch air quality data from OpenAQ...');
      aqData = await fetchWithRetry(
        `https://api.openaq.org/v2/locations?limit=10&coordinates=${lat},${lon}&radius=50000`
      );
      dataSources.airQuality = 'OpenAQ';
      console.log('Successfully fetched air quality data from OpenAQ');
    } catch (aqErr) {
      console.error('Error fetching air quality data from OpenAQ:', aqErr.message);
      
      // Try alternative source - WAQI API if available
      if (process.env.WAQI_API_KEY) {
        try {
          console.log('Attempting to fetch air quality data from WAQI (alternative source)...');
          const waqiResponse = await fetchWithRetry(
            `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${process.env.WAQI_API_KEY}`
          );
          
          if (waqiResponse && waqiResponse.status === 'ok' && waqiResponse.data) {
            // Format WAQI data to match our expected structure
            aqData = {
              results: [{
                name: waqiResponse.data.city?.name || `Location (${lat}, ${lon})`,
                coordinates: { latitude: lat, longitude: lon },
                parameters: [
                  { parameter: 'pm25', lastValue: waqiResponse.data.iaqi?.pm25?.v, unit: 'µg/m³' },
                  { parameter: 'pm10', lastValue: waqiResponse.data.iaqi?.pm10?.v, unit: 'µg/m³' },
                  { parameter: 'o3', lastValue: waqiResponse.data.iaqi?.o3?.v, unit: 'µg/m³' },
                  { parameter: 'no2', lastValue: waqiResponse.data.iaqi?.no2?.v, unit: 'µg/m³' }
                ].filter(p => p.lastValue !== undefined)
              }]
            };
            dataSources.airQuality = 'WAQI';
            console.log('Successfully fetched air quality data from WAQI');
          }
        } catch (waqiErr) {
          console.error('Error fetching air quality data from WAQI:', waqiErr.message);
          // Continue with empty results
        }
      }
    }
    
    // Weather data - with retry and alternative sources
    console.log(`Fetching weather data for lat: ${lat}, lon: ${lon}`);
    let weatherData = {};
    try {
      // Fetch detailed weather data using provided lat/lon with retry
      console.log('Attempting to fetch weather data from OpenWeather API...');
      weatherData = await fetchWithRetry(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${process.env.OPENWEATHER_API_KEY}`
      );
      dataSources.weather = 'OpenWeather';
      console.log('Successfully fetched weather data from OpenWeather');
    } catch (weatherErr) {
      console.error('Error fetching weather data from OpenWeather:', weatherErr.message);
      
      // Try alternate source - Visual Crossing if available
      if (process.env.VISUALCROSSING_API_KEY) {
        try {
          console.log('Attempting to fetch weather data from Visual Crossing (alternative source)...');
          const vcResponse = await fetchWithRetry(
            `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/today?unitGroup=metric&key=${process.env.VISUALCROSSING_API_KEY}&contentType=json`
          );
          
          if (vcResponse && vcResponse.currentConditions) {
            // Format Visual Crossing data to match our expected structure
            weatherData = {
              current: {
                temp: vcResponse.currentConditions.temp,
                feels_like: vcResponse.currentConditions.feelslike,
                humidity: vcResponse.currentConditions.humidity,
                uvi: vcResponse.currentConditions.uvindex,
                wind_speed: vcResponse.currentConditions.windspeed,
                wind_deg: vcResponse.currentConditions.winddir,
                pressure: vcResponse.currentConditions.pressure,
                weather: [{
                  description: vcResponse.currentConditions.conditions,
                  icon: vcResponse.currentConditions.icon
                }]
              },
              hourly: vcResponse.days?.[0]?.hours?.map(hour => ({
                dt: new Date(hour.datetime).getTime() / 1000,
                temp: hour.temp,
                humidity: hour.humidity,
                weather: [{
                  description: hour.conditions,
                  icon: hour.icon
                }]
              })),
              daily: vcResponse.days?.map(day => ({
                dt: new Date(day.datetime).getTime() / 1000,
                temp: {
                  min: day.tempmin,
                  max: day.tempmax
                },
                humidity: day.humidity,
                weather: [{
                  description: day.conditions,
                  icon: day.icon
                }]
              }))
            };
            dataSources.weather = 'Visual Crossing';
            console.log('Successfully fetched weather data from Visual Crossing');
          }
        } catch (vcErr) {
          console.error('Error fetching weather data from Visual Crossing:', vcErr.message);
          // Continue with empty or default data
        }
      }
    }    // Get location name using reverse geocoding - with retry and alternative sources
    console.log(`Getting location name for lat: ${lat}, lon: ${lon}`);
    let locationName = `Location (${lat}, ${lon})`;
    try {
      // Get location name using OpenWeather reverse geocoding
      console.log('Attempting to get location name from OpenWeather Geocoding API...');
      const geoData = await fetchWithRetry(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`
      );
      
      if (geoData && geoData.length > 0) {
        locationName = `${geoData[0].name}, ${geoData[0].country}`;
        dataSources.locationName = 'OpenWeather Geocoding';
        console.log('Successfully retrieved location name from OpenWeather');
      }
    } catch (geoErr) {
      console.error('Error fetching location name from OpenWeather:', geoErr.message);
      
      // Try alternative source - BigDataCloud Reverse Geocoding if available
      if (process.env.BIGDATACLOUD_API_KEY) {
        try {
          console.log('Attempting to get location name from BigDataCloud (alternative source)...');
          const bdcResponse = await fetchWithRetry(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en&key=${process.env.BIGDATACLOUD_API_KEY}`
          );
          
          if (bdcResponse && bdcResponse.city) {
            locationName = `${bdcResponse.city}, ${bdcResponse.countryName}`;
            dataSources.locationName = 'BigDataCloud';
            console.log('Successfully retrieved location name from BigDataCloud');
          }
        } catch (bdcErr) {
          console.error('Error fetching location name from BigDataCloud:', bdcErr.message);
          // Continue with default location name
        }
      }
    }
    
    // Process and store the data with enhanced metadata
    const processedData = {
      timestamp: new Date().toISOString(),
      location: locationName,
      coordinates: { latitude: lat, longitude: lon },
      dataSources: dataSources, // Track which sources were successfully used
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
    };      // Add a quality score based on how many data sources were successfully used
      const dataQuality = {
        score: Object.values(dataSources).filter(Boolean).length / Object.keys(dataSources).length,
        sources: dataSources,
        hasRealWeather: !!weatherData.current,
        hasRealAirQuality: aqData.results && aqData.results.length > 0
      };
      
      processedData.dataQuality = dataQuality;
      
      // Store the data
      if (usingFileStorage) {
        // Path for environmental data
        const envDataPath = path.join(dataDir, 'environmental_data.json');
        
        // Read existing data or create new array
        let existingData = [];
        if (fs.existsSync(envDataPath)) {
          try {
            const fileData = fs.readFileSync(envDataPath, 'utf8');
            existingData = JSON.parse(fileData);
            if (!Array.isArray(existingData)) existingData = [];
          } catch (err) {
            console.warn('Could not parse existing environmental data file, creating new one:', err.message);
          }
        }
        
        // Limit the size of the data file to prevent it from growing too large
        const MAX_ENTRIES = 1000;
        if (existingData.length >= MAX_ENTRIES) {
          existingData = existingData.slice(-MAX_ENTRIES + 1);
        }
        
        // Add new data and write back to file
        existingData.push(processedData);
        
        try {
          fs.writeFileSync(envDataPath, JSON.stringify(existingData, null, 2));
          console.log('Environmental data successfully stored in file');
        } catch (writeErr) {
          console.error('Error writing environmental data to file:', writeErr.message);
        }
      } else if (collection) {
        // Store in MongoDB
        try {
          await collection.insertOne(processedData);
          console.log('Environmental data successfully stored in MongoDB');
        } catch (dbErr) {
          console.error('Error storing data in MongoDB:', dbErr.message);
          
          // Fallback to file storage if MongoDB insert fails
          try {
            const envDataPath = path.join(dataDir, 'environmental_data.json');
            let existingData = [];
            
            if (fs.existsSync(envDataPath)) {
              try {
                existingData = JSON.parse(fs.readFileSync(envDataPath, 'utf8'));
                if (!Array.isArray(existingData)) existingData = [];
              } catch (err) {
                console.warn('Could not parse existing environmental data file, creating new one');
              }
            }
            
            existingData.push(processedData);
            fs.writeFileSync(envDataPath, JSON.stringify(existingData, null, 2));
            console.log('Fallback: Environmental data stored in file after MongoDB failure');
          } catch (fileErr) {
            console.error('Error also occurred when trying file storage fallback:', fileErr.message);
          }
        } finally {
          if (client) {
            try {
              await client.close();
            } catch (closeErr) {
              console.error('Error closing MongoDB connection:', closeErr.message);
            }
          }
        }
      }
      
      // Return the processed data so it can be used by the API endpoint
      return processedData;
  } catch (error) {
    console.error('Error fetching environmental data:', error);
    
    // Return a more informative fallback data structure
    return {
      timestamp: new Date().toISOString(),
      location: `Location near (${lat}, ${lon})`,
      coordinates: { latitude: lat, longitude: lon },
      dataQuality: {
        score: 0,
        sources: {
          weather: null,
          airQuality: null,
          locationName: null
        },
        hasRealWeather: false,
        hasRealAirQuality: false,
        error: error.message
      },
      weather: {
        temperature: 25,
        humidity: 60,
        conditions: "Data unavailable",
        note: "This is fallback data. Real-time data retrieval failed."
      },
      aqData: [],
      hourly: [],
      daily: [],
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
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