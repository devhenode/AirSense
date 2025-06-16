// Add sample datasets to MongoDB
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function addSampleDatasets() {
  let client;
  try {
    // Try to connect to the configured MongoDB
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    const collectionName = process.env.MONGODB_COLLECTION;
    
    console.log('Initializing sample data...');
    console.log('Connecting to MongoDB at:', uri);
    
    let useFileStorage = false;
    
    try {
      // First try the main connection string
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
        ssl: uri.includes('mongodb+srv'),
        tls: uri.includes('mongodb+srv')
      });
      
      await client.connect();
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('Error connecting to main MongoDB:', err.message);
      
      // If Atlas connection fails, try local MongoDB
      if (uri.includes('mongodb+srv')) {
        try {
          console.log('Trying local MongoDB connection...');
          client = new MongoClient('mongodb://localhost:27017', {
            serverSelectionTimeoutMS: 2000
          });
          await client.connect();
          console.log('Connected to local MongoDB');
        } catch (localErr) {
          console.error('Failed to connect to local MongoDB:', localErr.message);
          console.log('Falling back to file-based storage...');
          useFileStorage = true;
        }
      } else {
        console.log('Falling back to file-based storage...');
        useFileStorage = true;
      }
    }
    
    // Sample datasets
    const sampleDatasets = [
      {
        name: "Global Air Quality Index",
        description: "Historical air quality data from major cities around the world",
        category: "Environmental",
        source: "OpenAQ",
        sourceUrl: "https://openaq.org",
        format: "CSV",
        license: "Open Data License",
        lastUpdated: new Date().toISOString(),
        records: 15000,
        hasGeospatialData: true,
        schema: [
          { name: "timestamp", type: "string", description: "Measurement time" },
          { name: "location", type: "string", description: "City name" },
          { name: "parameter", type: "string", description: "Measured parameter (PM2.5, PM10, etc)" },
          { name: "value", type: "number", description: "Measured value" },
          { name: "unit", type: "string", description: "Measurement unit" },
          { name: "latitude", type: "number", description: "Measurement latitude" },
          { name: "longitude", type: "number", description: "Measurement longitude" }
        ],
        sampleData: Array(10).fill(0).map((_, i) => ({
          timestamp: new Date(Date.now() - i * 86400000).toISOString(),
          location: "New York",
          parameter: "PM2.5",
          value: Math.round(10 + Math.random() * 20),
          unit: "µg/m³",
          latitude: 40.7128,
          longitude: -74.006
        }))
      },
      {
        name: "Global Temperature Trends",
        description: "Average temperatures from cities worldwide",
        category: "Environmental",
        source: "OpenWeatherMap",
        sourceUrl: "https://openweathermap.org",
        format: "JSON",
        license: "Open Data License",
        lastUpdated: new Date().toISOString(),
        records: 8500,
        hasGeospatialData: true,
        schema: [
          { name: "date", type: "string", description: "Measurement date" },
          { name: "city", type: "string", description: "City name" },
          { name: "country", type: "string", description: "Country code" },
          { name: "temperature", type: "number", description: "Average temperature" },
          { name: "humidity", type: "number", description: "Average humidity" },
          { name: "latitude", type: "number", description: "City latitude" },
          { name: "longitude", type: "number", description: "City longitude" }
        ],
        sampleData: Array(10).fill(0).map((_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          city: "London",
          country: "GB",
          temperature: Math.round(15 + Math.random() * 10),
          humidity: Math.round(60 + Math.random() * 20),
          latitude: 51.5074,
          longitude: -0.1278
        }))
      },
      {
        name: "Environmental Risk Assessments",
        description: "Risk levels based on combined environmental factors",
        category: "Analysis",
        source: "Internal Analysis",
        sourceUrl: "",
        format: "JSON",
        license: "Private",
        lastUpdated: new Date().toISOString(),
        records: 5200,
        hasGeospatialData: true,
        schema: [
          { name: "date", type: "string", description: "Assessment date" },
          { name: "location", type: "string", description: "Location name" },
          { name: "pm25", type: "number", description: "PM2.5 level" },
          { name: "pm10", type: "number", description: "PM10 level" },
          { name: "temperature", type: "number", description: "Temperature" },
          { name: "riskLevel", type: "string", description: "Assessed risk level" },
          { name: "latitude", type: "number", description: "Location latitude" },
          { name: "longitude", type: "number", description: "Location longitude" }
        ],
        sampleData: Array(10).fill(0).map((_, i) => {
          const pm25 = Math.round(10 + Math.random() * 30);
          const pm10 = Math.round(20 + Math.random() * 40);
          const temp = Math.round(15 + Math.random() * 15);
          
          let riskLevel = "Low";
          if (pm25 > 35 || pm10 > 150 || temp > 35) {
            riskLevel = "High";
          } else if (pm25 > 20 || pm10 > 75 || temp > 30) {
            riskLevel = "Moderate";
          }
          
          return {
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            location: "Singapore",
            pm25: pm25,
            pm10: pm10,
            temperature: temp,
            riskLevel: riskLevel,
            latitude: 1.3521,
            longitude: 103.8198
          };
        })
      }
    ];

    if (useFileStorage) {
      // Create a data directory if it doesn't exist
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Write the sample datasets to a JSON file
      const datasetsPath = path.join(dataDir, 'datasets.json');
      fs.writeFileSync(datasetsPath, JSON.stringify(sampleDatasets, null, 2));
      console.log(`Added ${sampleDatasets.length} sample datasets to file: ${datasetsPath}`);
      
      // Signal that we're using file-based storage
      const flagPath = path.join(dataDir, 'using-file-storage.flag');
      fs.writeFileSync(flagPath, 'true');
      
      return;
    }
    
    // If we're here, we're using MongoDB
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Check if datasets already exist
    const count = await collection.countDocuments();
    if (count > 0) {
      console.log(`${count} datasets already in database, skipping sample data creation`);
      await client.close();
      return;
    }

    // Insert sample datasets
    await collection.insertMany(sampleDatasets);
    console.log(`Added ${sampleDatasets.length} sample datasets to the database`);

    await client.close();
  } catch (error) {
    console.error('Error adding sample datasets:', error);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  addSampleDatasets();
}

module.exports = { addSampleDatasets };
