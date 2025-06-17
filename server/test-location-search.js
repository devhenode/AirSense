// test-location-search.js
// A simple script to test the location search and analysis endpoints

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000'; // Update with your server URL

async function testLocationSearch() {
  console.log('----- Testing Location Search -----');
  try {
    // Test searching for a location
    const query = 'London';
    console.log(`Searching for: ${query}`);
    
    const searchResponse = await fetch(`${API_BASE_URL}/api/locations/search?query=${encodeURIComponent(query)}`);
    const searchResults = await searchResponse.json();
    
    console.log('Search results:');
    console.log(JSON.stringify(searchResults, null, 2));
    
    // Test location analysis if we got results
    if (searchResults.results && searchResults.results.length > 0) {
      const location = searchResults.results[0];
      console.log(`\n----- Testing Location Analysis for ${location.displayName} -----`);
      
      const analysisResponse = await fetch(`${API_BASE_URL}/api/environmental/analyze-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: location.displayName,
          coordinates: location.coordinates
        })
      });
      
      const analysisResults = await analysisResponse.json();
      console.log('Analysis results:');
      console.log(JSON.stringify({
        location: analysisResults.location,
        timestamp: analysisResults.timestamp,
        hasRealData: analysisResults.hasRealData,
        source: analysisResults.source,
        analysis: analysisResults.analysis?.substring(0, 500) + '...' // Truncate for readability
      }, null, 2));
      
      // If we have weather data, show it
      if (analysisResults.environmentalData) {
        console.log('\nEnvironmental data:');
        console.log(JSON.stringify(analysisResults.environmentalData, null, 2));
      }
    }
  } catch (error) {
    console.error('Error testing location search:', error);
  }
}

testLocationSearch();
