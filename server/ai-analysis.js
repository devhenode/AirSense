const { MongoClient } = require('mongodb');
const { generateEmbeddings } = require('./search-service');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// For simple anomaly detection without a full AI platform
function detectAnomalies(data, threshold = 2) {
  // Calculate mean and standard deviation
  const values = data.map(item => item.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Mark anomalies
  return data.map(item => ({
    ...item,
    isAnomaly: Math.abs(item.value - mean) > threshold * stdDev,
    zScore: (item.value - mean) / stdDev
  }));
}

function calculateRiskLevel(pm25, pm10, temperature) {
  // Basic risk calculation logic
  let riskScore = 0;
  
  // PM2.5 contribution (EPA standards)
  if (pm25 <= 12) riskScore += 1;
  else if (pm25 <= 35.4) riskScore += 2;
  else if (pm25 <= 55.4) riskScore += 3;
  else riskScore += 4;
  
  // PM10 contribution
  if (pm10 <= 54) riskScore += 1;
  else if (pm10 <= 154) riskScore += 2;
  else if (pm10 <= 254) riskScore += 3;
  else riskScore += 4;
  
  // Temperature contribution (simplified)
  if (temperature > 35 || temperature < -10) riskScore += 2;
  else if (temperature > 30 || temperature < 0) riskScore += 1;
  
  // Map to risk level
  if (riskScore <= 3) return "Low";
  if (riskScore <= 5) return "Moderate";
  if (riskScore <= 7) return "High";
  return "Very High";
}

async function analyzeEnvironmentalData() {
  try {
    let recentData = [];
    let usingFileStorage = false;
    let client = null;
    
    // Check if we're using file-based storage
    const flagPath = path.join(__dirname, 'data', 'using-file-storage.flag');
    if (fs.existsSync(flagPath)) {
      console.log('Using file-based storage for analysis');
      usingFileStorage = true;
      
      // Read environmental data from file
      const envDataPath = path.join(__dirname, 'data', 'environmental_data.json');
      if (fs.existsSync(envDataPath)) {
        try {
          const allData = JSON.parse(fs.readFileSync(envDataPath, 'utf8'));
          // Sort and get the most recent data (up to 24 entries)
          recentData = allData
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 24);
        } catch (err) {
          console.error('Error reading environmental data file:', err);
          recentData = [];
        }
      }
    } else {
      // Try connecting to MongoDB
      try {
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db(process.env.MONGODB_DB);
        const collection = db.collection('environmental_data');
        
        // Get the most recent data
        recentData = await collection
          .find({})
          .sort({ timestamp: -1 })
          .limit(24) // Last 24 hours if hourly data
          .toArray();
      } catch (dbErr) {
        console.error('MongoDB connection failed, using file storage:', dbErr.message);
        usingFileStorage = true;
        
        // Create flag file to indicate we're using file storage
        fs.writeFileSync(flagPath, 'true');
        
        // Try to read from file as fallback
        const envDataPath = path.join(__dirname, 'data', 'environmental_data.json');
        if (fs.existsSync(envDataPath)) {
          try {
            const allData = JSON.parse(fs.readFileSync(envDataPath, 'utf8'));
            recentData = allData
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 24);
          } catch (err) {
            console.error('Error reading environmental data file:', err);
            recentData = [];
          }
        }
      }
    }
    
    // Process each location
    const results = [];
    
    for (const entry of recentData) {
      for (const location of entry.aqData) {
        const pm25Value = location.measurements.find(m => m.parameter === 'pm25')?.value || 0;
        const pm10Value = location.measurements.find(m => m.parameter === 'pm10')?.value || 0;
        const temperature = entry.temperatureData.temperature;
        
        const riskLevel = calculateRiskLevel(pm25Value, pm10Value, temperature);
        
        // Generate vector embeddings for search
        const environmentalVector = await generateEmbeddings({
          pm25: pm25Value,
          pm10: pm10Value,
          temperature
        });
        
        results.push({
          timestamp: entry.timestamp,
          location: location.location,
          coordinates: location.coordinates,
          pm25: pm25Value,
          pm10: pm10Value,
          temperature,
          riskLevel,
          environmentalVector,
          description: `Environmental analysis for ${location.location} with PM2.5: ${pm25Value}μg/m³, PM10: ${pm10Value}μg/m³, Temperature: ${temperature}°C`
        });
      }
    }
      // Store analysis results
    if (usingFileStorage) {
      // Ensure data directory exists
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Path for analysis results
      const analysisPath = path.join(dataDir, 'analysis_results.json');
      
      // Read existing results or create new array
      let existingResults = [];
      if (fs.existsSync(analysisPath)) {
        try {
          existingResults = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
          if (!Array.isArray(existingResults)) existingResults = [];
        } catch (err) {
          console.warn('Could not parse existing analysis results file, creating new one');
        }
      }
      
      // Add new results and write back to file
      existingResults = [...existingResults, ...results];
      fs.writeFileSync(analysisPath, JSON.stringify(existingResults, null, 2));
      console.log(`Analysis completed for ${results.length} location data points, stored in file`);
    } else {
      // Store in MongoDB
      await db.collection('analysis_results').insertMany(results);
      console.log(`Analysis completed for ${results.length} location data points, stored in MongoDB`);
    }
    
    // For anomaly detection, we need time series data
    let timeSeriesData = [];
    
    if (usingFileStorage) {
      // Read from file
      const envDataPath = path.join(__dirname, 'data', 'environmental_data.json');
      if (fs.existsSync(envDataPath)) {
        try {
          const allData = JSON.parse(fs.readFileSync(envDataPath, 'utf8'));
          timeSeriesData = allData
            .filter(entry => entry.aqData.some(loc => loc.location === 'SomeSpecificLocation'))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(0, 100);
        } catch (err) {
          console.error('Error reading environmental data file for time series:', err);
        }
      }
    } else {
      // Get from MongoDB
      timeSeriesData = await collection
        .find({ 'aqData.location': 'SomeSpecificLocation' })
        .sort({ timestamp: 1 })
        .limit(100)
        .toArray();
    }
    
    const pm25Series = timeSeriesData.map(entry => ({
      timestamp: entry.timestamp,
      value: entry.aqData.find(loc => loc.location === 'SomeSpecificLocation')
              ?.measurements.find(m => m.parameter === 'pm25')?.value || 0
    }));
    
    const anomalyResults = detectAnomalies(pm25Series);
      const anomalyEntry = {
      timestamp: new Date(),
      location: 'SomeSpecificLocation',
      parameter: 'pm25',
      anomalies: anomalyResults.filter(item => item.isAnomaly)
    };
    
    if (usingFileStorage) {
      // Store anomaly results to file
      const anomalyPath = path.join(__dirname, 'data', 'anomaly_detection.json');
      
      // Read existing anomalies or create new array
      let existingAnomalies = [];
      if (fs.existsSync(anomalyPath)) {
        try {
          existingAnomalies = JSON.parse(fs.readFileSync(anomalyPath, 'utf8'));
          if (!Array.isArray(existingAnomalies)) existingAnomalies = [];
        } catch (err) {
          console.warn('Could not parse existing anomalies file, creating new one');
        }
      }
      
      // Add new anomaly and write back to file
      existingAnomalies.push(anomalyEntry);
      fs.writeFileSync(anomalyPath, JSON.stringify(existingAnomalies, null, 2));
      console.log('Anomaly detection results stored in file');
    } else {
      // Store in MongoDB
      await db.collection('anomaly_detection').insertOne(anomalyEntry);
      console.log('Anomaly detection results stored in MongoDB');
      await client.close();
    }
  } catch (error) {
    console.error('Error analyzing environmental data:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  analyzeEnvironmentalData();
}

module.exports = { analyzeEnvironmentalData, calculateRiskLevel, detectAnomalies };