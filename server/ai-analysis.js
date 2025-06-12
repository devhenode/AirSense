const { MongoClient } = require('mongodb');
const { generateEmbeddings } = require('./search-service');
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
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('environmental_data');
    
    // Get the most recent data
    const recentData = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(24) // Last 24 hours if hourly data
      .toArray();
    
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
    await db.collection('analysis_results').insertMany(results);
    console.log(`Analysis completed for ${results.length} location data points`);
    
    // For anomaly detection, we need time series data
    const timeSeriesData = await collection
      .find({ 'aqData.location': 'SomeSpecificLocation' })
      .sort({ timestamp: 1 })
      .limit(100)
      .toArray();
    
    const pm25Series = timeSeriesData.map(entry => ({
      timestamp: entry.timestamp,
      value: entry.aqData.find(loc => loc.location === 'SomeSpecificLocation')
              ?.measurements.find(m => m.parameter === 'pm25')?.value || 0
    }));
    
    const anomalyResults = detectAnomalies(pm25Series);
    
    await db.collection('anomaly_detection').insertOne({
      timestamp: new Date(),
      location: 'SomeSpecificLocation',
      parameter: 'pm25',
      anomalies: anomalyResults.filter(item => item.isAnomaly)
    });
    
    await client.close();
  } catch (error) {
    console.error('Error analyzing environmental data:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  analyzeEnvironmentalData();
}

module.exports = { analyzeEnvironmentalData, calculateRiskLevel, detectAnomalies };