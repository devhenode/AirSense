// test-data-sources.js
// A script to test and compare different environmental data sources

const { fetchEnvironmentalData } = require('./data-ingestion');
require('dotenv').config();

async function testDataSources() {
  console.log('===== Testing Environmental Data Sources =====\n');
  
  // Check for required API keys
  const missingKeys = [];
  
  if (!process.env.OPENWEATHER_API_KEY) {
    missingKeys.push('OPENWEATHER_API_KEY');
  }
  
  // Check optional API keys
  const optionalKeys = {
    WAQI_API_KEY: 'World Air Quality Index',
    VISUALCROSSING_API_KEY: 'Visual Crossing Weather',
    BIGDATACLOUD_API_KEY: 'BigDataCloud Geocoding'
  };
  
  const missingOptional = [];
  for (const [key, service] of Object.entries(optionalKeys)) {
    if (!process.env[key]) {
      missingOptional.push(`${key} (${service})`);
    }
  }
  
  if (missingKeys.length > 0) {
    console.error('\n⚠️ Required API keys missing:');
    missingKeys.forEach(key => console.error(`  - ${key}`));
    console.error('\nPlease add these to your .env file before testing.');
    process.exit(1);
  }
  
  if (missingOptional.length > 0) {
    console.warn('\n⚠️ Optional API keys missing:');
    missingOptional.forEach(key => console.warn(`  - ${key}`));
    console.warn('\nThese sources will be skipped during testing.');
  }
  
  // Test locations
  const testLocations = [
    { name: 'New York', coordinates: { lat: 40.7128, lon: -74.0060 } },
    { name: 'London', coordinates: { lat: 51.5074, lon: -0.1278 } },
    { name: 'Tokyo', coordinates: { lat: 35.6762, lon: 139.6503 } },
    { name: 'Sydney', coordinates: { lat: -33.8688, lon: 151.2093 } }
  ];
  
  for (const location of testLocations) {
    console.log(`\n----- Testing data retrieval for ${location.name} -----`);
    console.log(`Coordinates: ${location.coordinates.lat}, ${location.coordinates.lon}`);
    
    try {
      const startTime = Date.now();
      const data = await fetchEnvironmentalData(
        location.coordinates.lat, 
        location.coordinates.lon
      );
      const elapsedTime = Date.now() - startTime;
      
      console.log(`\n✅ Data retrieved in ${elapsedTime}ms`);
      console.log(`Location name: ${data.location}`);
      console.log(`Data quality score: ${data.dataQuality.score.toFixed(2) * 100}%`);
      console.log('Data sources used:');
      
      for (const [source, value] of Object.entries(data.dataQuality.sources)) {
        console.log(`  - ${source}: ${value || 'Not available'}`);
      }
      
      // Display weather data
      if (data.weather) {
        console.log('\nWeather data:');
        console.log(`  Temperature: ${data.weather.temperature}°C`);
        console.log(`  Conditions: ${data.weather.conditions}`);
      }
      
      // Display air quality data if available
      if (data.aqData && data.aqData.length > 0) {
        console.log('\nAir Quality data:');
        const measurements = data.aqData[0].measurements || [];
        
        if (measurements.length === 0) {
          console.log('  No measurements available');
        } else {
          measurements.forEach(m => {
            console.log(`  ${m.parameter}: ${m.value} ${m.unit}`);
          });
        }
      } else {
        console.log('\nNo Air Quality data available for this location');
      }
    } catch (error) {
      console.error(`\n❌ Error testing ${location.name}:`, error.message);
    }
  }
  
  console.log('\n===== Data Source Testing Complete =====');
}

testDataSources().catch(err => console.error('Test failed:', err));
