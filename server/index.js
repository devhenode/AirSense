const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const { fetchEnvironmentalData } = require('./data-ingestion');
const { analyzeEnvironmentalData } = require('./ai-analysis');
const { textSearch, findSimilarPatterns } = require('./search-service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: [
    'https://frontend-dot-mongodb-analyzer.ew.r.appspot.com',
    'https://mongodb-analyzer.ew.r.appspot.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

// Health check endpoint for App Engine
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Use fallback to local MongoDB if Atlas connection fails
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'environmental_data';
const collectionName = process.env.MONGODB_COLLECTION || 'datasets';

let client;
let db;
let usingFileStorage = false;

// File storage paths
const dataDir = path.join(__dirname, 'data');
const datasetsPath = path.join(dataDir, 'datasets.json');
const flagPath = path.join(dataDir, 'using-file-storage.flag');

// Check if we're using file storage
if (fs.existsSync(flagPath)) {
  console.log('Using file-based storage instead of MongoDB');
  usingFileStorage = true;
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Create empty datasets file if it doesn't exist
  if (!fs.existsSync(datasetsPath)) {
    fs.writeFileSync(datasetsPath, '[]');
  }
}

async function connectToMongo() {
  // If we're using file storage, don't try to connect
  if (usingFileStorage) {
    return null;
  }

  if (!client || !client.topology || !client.topology.isConnected()) {
    console.log('Connecting to MongoDB...');
    
    try {
      // Try the main connection (Atlas or configured URI)
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4,
        ssl: uri.includes('mongodb+srv'),
        tls: uri.includes('mongodb+srv'),
        retryWrites: true,
        w: 'majority'
      });
      
      await client.connect();
      db = client.db(dbName);
      console.log('MongoDB connected successfully to:', uri);
    } catch (err) {
      console.error('Failed to connect to primary MongoDB:', err);
      
      // If we failed and it was trying to connect to Atlas, try local MongoDB
      if (uri.includes('mongodb+srv')) {
        try {
          console.log('Attempting to connect to local MongoDB...');
          const localUri = 'mongodb://localhost:27017';
          client = new MongoClient(localUri, { serverSelectionTimeoutMS: 2000 });
          await client.connect();
          db = client.db(dbName);
          console.log('Connected to local MongoDB as fallback');
        } catch (localErr) {
          console.error('Failed to connect to local MongoDB:', localErr);
          console.log('Switching to file-based storage...');
          usingFileStorage = true;
          
          // Create flag file to indicate we're using file storage
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
          }
          fs.writeFileSync(flagPath, 'true');
          
          // Create empty datasets file if it doesn't exist
          if (!fs.existsSync(datasetsPath)) {
            fs.writeFileSync(datasetsPath, '[]');
          }
          
          return null;
        }
      } else {
        // If it wasn't Atlas, try file-based fallback
        console.log('Switching to file-based storage...');
        usingFileStorage = true;
        
        // Create flag file to indicate we're using file storage
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(flagPath, 'true');
        
        // Create empty datasets file if it doesn't exist
        if (!fs.existsSync(datasetsPath)) {
          fs.writeFileSync(datasetsPath, '[]');
        }
        
        return null;
      }
    }
  }
  // Only return db if we're not using file storage
  return usingFileStorage ? null : db;
}

app.get('/datasets', async (req, res) => {
  try {
    if (usingFileStorage) {
      // Read datasets from file
      if (fs.existsSync(datasetsPath)) {
        const fileContent = fs.readFileSync(datasetsPath, 'utf8');
        const datasets = JSON.parse(fileContent);
        return res.json(datasets);
      }
      return res.json([]);
    } else {
      // Get from MongoDB
      await connectToMongo();
      
      // Check if we switched to file storage during connection attempt
      if (usingFileStorage) {
        if (fs.existsSync(datasetsPath)) {
          const fileContent = fs.readFileSync(datasetsPath, 'utf8');
          const datasets = JSON.parse(fileContent);
          return res.json(datasets);
        }
        return res.json([]);
      }
      
      // Ensure we have a valid db connection
      if (!db) {
        throw new Error('Failed to connect to database. Please try again later.');
      }
      
      const datasets = await db.collection(collectionName).find({}).toArray();
      
      // Ensure all datasets have a consistent id property
      const processedDatasets = datasets.map(dataset => {
        if (!dataset.id && dataset._id) {
          return {
            ...dataset,
            id: dataset._id.toString()
          };
        }
        return dataset;
      });
      
      res.json(processedDatasets);
    }
  } catch (err) {
    console.error('Error fetching datasets:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/datasets/:id', async (req, res) => {
  try {
    if (usingFileStorage) {
      // Read datasets from file
      if (fs.existsSync(datasetsPath)) {
        const fileContent = fs.readFileSync(datasetsPath, 'utf8');
        const datasets = JSON.parse(fileContent);
        const dataset = datasets.find(d => d.id === req.params.id);
        if (!dataset) {
          return res.status(404).json({ error: 'Dataset not found' });
        }
        return res.json(dataset);
      }
      return res.status(404).json({ error: 'Dataset not found' });
    } else {
      // Get from MongoDB
      await connectToMongo();
      
      // Check if we switched to file storage during connection attempt
      if (usingFileStorage) {
        if (fs.existsSync(datasetsPath)) {
          const fileContent = fs.readFileSync(datasetsPath, 'utf8');
          const datasets = JSON.parse(fileContent);
          const dataset = datasets.find(d => d.id === req.params.id);
          if (!dataset) {
            return res.status(404).json({ error: 'Dataset not found' });
          }
          return res.json(dataset);
        }
        return res.status(404).json({ error: 'Dataset not found' });
      }
      
      // Ensure we have a valid db connection
      if (!db) {
        throw new Error('Failed to connect to database. Please try again later.');
      }
      
      let dataset;
      try {
        // First try to find by ObjectId
        dataset = await db.collection(collectionName).findOne({ _id: new ObjectId(req.params.id) });
      } catch (err) {
        // If that fails, try to find by string id field
        dataset = await db.collection(collectionName).findOne({ id: req.params.id });
      }
      
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' });
      }
      
      // Ensure the dataset has an id property even if coming from MongoDB
      if (!dataset.id && dataset._id) {
        dataset.id = dataset._id.toString();
      }
      
      res.json(dataset);
    }
  } catch (err) {
    console.error('Error fetching dataset:', err);
    res.status(500).json({ error: err.message });
  }
});

// Environmental data endpoints
app.post('/api/fetch-environmental-data', async (req, res) => {
  try {
    await fetchEnvironmentalData();
    res.json({ message: 'Environmental data fetched and stored successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analyze-environmental-data', async (req, res) => {
  try {
    await analyzeEnvironmentalData();
    res.json({ message: 'Environmental data analyzed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/environmental/current', async (req, res) => {
  try {
    if (usingFileStorage) {
      // Use file-based storage
      const analysisPath = path.join(__dirname, 'data', 'analysis_results.json');
      if (fs.existsSync(analysisPath)) {
        try {
          const allResults = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
          if (!Array.isArray(allResults) || allResults.length === 0) {
            return res.status(404).json({ error: 'No environmental data found' });
          }
          
          // Get the latest result
          const latestData = allResults.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          
          return res.json(latestData);
        } catch (err) {
          console.error('Error reading analysis results file:', err);
          return res.status(500).json({ error: 'Error reading environmental data' });
        }
      } else {
        return res.status(404).json({ error: 'No environmental data found' });
      }
    } else {
      // Use MongoDB
      await connectToMongo();
      if (!db) {
        return res.status(503).json({ 
          error: 'Database connection unavailable', 
          message: 'The database is currently unavailable. Please try again later.'
        });
      }
      
      const latestData = await db.collection('analysis_results')
        .find({})
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();

      if (latestData.length === 0) {
        return res.status(404).json({ error: 'No environmental data found' });
      }

      res.json(latestData[0]);
    }
  } catch (err) {
    console.error('Error fetching current environmental data:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/environmental/history', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    if (usingFileStorage) {
      // Use file-based storage
      const analysisPath = path.join(__dirname, 'data', 'analysis_results.json');
      if (fs.existsSync(analysisPath)) {
        try {
          const allResults = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
          if (!Array.isArray(allResults)) {
            return res.json([]);
          }
          
          // Filter by cutoff date and sort
          const historyData = allResults
            .filter(item => new Date(item.timestamp) >= cutoffDate)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          return res.json(historyData);
        } catch (err) {
          console.error('Error reading analysis results file for history:', err);
          return res.json([]);
        }
      } else {
        return res.json([]);
      }
    } else {
      // Use MongoDB
      await connectToMongo();
      if (!db) {
        return res.status(503).json({ 
          error: 'Database connection unavailable', 
          message: 'The database is currently unavailable. Please try again later.'
        });
      }

      const historyData = await db.collection('analysis_results')
        .find({ timestamp: { $gte: cutoffDate } })
        .sort({ timestamp: 1 })
        .toArray();

      res.json(historyData);
    }
  } catch (err) {
    console.error('Error fetching environmental history:', err);
    res.status(500).json({ error: err.message });
  }
});

// Set up file storage for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedExtensions = ['.csv', '.json', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, JSON, and Excel files are allowed'));
    }
  }
});

// File upload endpoint
app.post('/upload-dataset', upload.single('dataset'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let data = [];

    // Parse the file based on its type
    try {
      if (fileExt === '.csv') {
        // Parse CSV
        const csv = require('csv-parser');
        data = await new Promise((resolve, reject) => {
          const results = [];
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => results.push(row))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
        });
      } else if (fileExt === '.json') {
        // Parse JSON
        const fileContent = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(fileContent);
        if (!Array.isArray(data)) {
          data = [data]; // Convert to array if it's a single object
        }
      } else if (fileExt === '.xlsx') {
        // Parse Excel
        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      }
    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      return res.status(400).json({ error: `Could not parse file: ${parseError.message}` });
    }

    // Extract schema from the first row
    let schema = [];
    if (data.length > 0) {
      schema = Object.keys(data[0] || {}).map(key => ({
        name: key,
        type: typeof data[0][key],
        description: `Field ${key}`
      }));
    } else {
      schema = [{ name: "example_field", type: "string", description: "Example field" }];
    }    // Create a dataset document
    const dataset = {
      id: Date.now().toString(), // Generate a unique ID for both MongoDB and file-based storage
      name: req.file.originalname.replace(/\.[^/.]+$/, ""),
      description: `Uploaded dataset with ${data.length} records`,
      category: 'User Uploaded',
      source: 'User Upload',
      sourceUrl: '',
      format: fileExt.replace('.', '').toUpperCase(),
      license: 'Private',
      lastUpdated: new Date().toISOString(),
      records: data.length,
      hasGeospatialData: false, // This could be detected more intelligently
      schema: schema,
      sampleData: data.slice(0, 10) // Store first 10 records as sample
    };

    let result;
    
    // Check if we're using file-based storage
    if (usingFileStorage) {
      // Read existing datasets
      let datasets = [];
      if (fs.existsSync(datasetsPath)) {
        try {
          datasets = JSON.parse(fs.readFileSync(datasetsPath, 'utf8'));
          if (!Array.isArray(datasets)) datasets = [];
        } catch (err) {
          console.warn('Could not parse existing datasets file, creating new one');
        }
      }
      
      // Add the new dataset
      datasets.push(dataset);
      
      // Write back to file
      fs.writeFileSync(datasetsPath, JSON.stringify(datasets, null, 2));
      
      result = { insertedId: dataset.id };
      console.log(`Dataset uploaded and saved to file with ID: ${dataset.id}`);
    } else {
      // Store in MongoDB
      await connectToMongo();
      
      // If we switched to file storage during connection attempt, handle accordingly
      if (usingFileStorage) {
        // Read existing datasets
        let datasets = [];
        if (fs.existsSync(datasetsPath)) {
          try {
            datasets = JSON.parse(fs.readFileSync(datasetsPath, 'utf8'));
            if (!Array.isArray(datasets)) datasets = [];
          } catch (err) {
            console.warn('Could not parse existing datasets file, creating new one');
          }
        }
        
        // Add the new dataset
        datasets.push(dataset);
        
        // Write back to file
        fs.writeFileSync(datasetsPath, JSON.stringify(datasets, null, 2));
        
        result = { insertedId: dataset.id };
        console.log(`Dataset uploaded and saved to file with ID: ${dataset.id}`);
      } else {
        // Ensure we have a valid db connection
        if (!db) {
          throw new Error('Failed to connect to database. Please try again later.');
        }
        
        result = await db.collection(collectionName).insertOne(dataset);
      }
    }

    res.json({
      success: true,
      message: 'Dataset uploaded successfully',
      id: usingFileStorage ? dataset.id : result.insertedId.toString()
    });
  } catch (error) {
    console.error('Error processing uploaded file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get anomalies endpoint
app.get('/api/anomalies', async (req, res) => {
  try {
    if (usingFileStorage) {
      // Use file-based storage
      const anomalyPath = path.join(__dirname, 'data', 'anomaly_detection.json');
      if (fs.existsSync(anomalyPath)) {
        try {
          const anomalies = JSON.parse(fs.readFileSync(anomalyPath, 'utf8'));
          // Sort by timestamp and limit to 10 results
          const sortedAnomalies = Array.isArray(anomalies) ? 
            anomalies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10) : 
            [];
          return res.json(sortedAnomalies);
        } catch (err) {
          console.error('Error reading anomalies file:', err);
          return res.json([]);
        }
      } else {
        return res.json([]);
      }
    } else {
      // Use MongoDB
      await connectToMongo();
      if (!db) {
        return res.status(503).json({ 
          error: 'Database connection unavailable', 
          message: 'The database is currently unavailable. Please try again later.'
        });
      }
      
      const anomalies = await db.collection('anomaly_detection')
        .find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();
  
      res.json(anomalies);
    }
  } catch (err) {
    console.error('Error fetching anomalies:', err);
    res.status(500).json({ error: err.message });
  }
});

// Search endpoints
app.get('/api/search', async (req, res) => {
  try {
    const { query, ...filters } = req.query;
    // Pass usingFileStorage flag to textSearch function
    const results = await textSearch(query, filters, usingFileStorage);
    res.json(results);
  } catch (err) {
    console.error('Error in text search:', err);
    res.status(500).json({ 
      error: err.message,
      suggestion: 'Try a simpler search query or check if the search service is available.'
    });
  }
});

app.get('/api/similar-patterns', async (req, res) => {
  try {
    const { pm25, pm10, temperature } = req.query;
    
    if (!pm25 || !pm10 || !temperature) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        message: 'Please provide PM2.5, PM10, and temperature values' 
      });
    }
    
    // Pass usingFileStorage flag to findSimilarPatterns function
    const results = await findSimilarPatterns(
      parseFloat(pm25), 
      parseFloat(pm10), 
      parseFloat(temperature),
      usingFileStorage
    );
    
    res.json(results);
  } catch (err) {
    console.error('Error finding similar patterns:', err);
    res.status(500).json({ 
      error: err.message,
      suggestion: 'Try different parameter values or check if the search service is available.'
    });
  }
});

// Import sample data function
const { addSampleDatasets } = require('./sample-data');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Try to connect to MongoDB first
    console.log('Testing MongoDB connection before starting server...');
    await connectToMongo();
    console.log('MongoDB connection successful');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// New endpoint to fetch environmental data for a specific location
app.get('/api/environmental/location', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 40.7128;  // Default to New York
    const lon = parseFloat(req.query.lon) || -74.0060;
    
    console.log(`Fetching environmental data for lat: ${lat}, lon: ${lon}`);
    
    // Use the data ingestion service to fetch data
    const { fetchEnvironmentalData } = require('./data-ingestion');
    const data = await fetchEnvironmentalData(lat, lon);
    
    if (!data) {
      throw new Error('Failed to fetch environmental data');
    }
    
    // Process the data for the frontend
    const { calculateRiskLevel } = require('./ai-analysis');
    
    // Extract AQ measurements (if any)
    let pm25 = 10; // Default values if not found in AQ data
    let pm10 = 20;
    
    // Try to get real air quality measurements if available
    if (data?.aqData && data.aqData.length > 0) {
      for (const location of data.aqData) {
        if (location.measurements && location.measurements.length > 0) {
          for (const measurement of location.measurements) {
            if (measurement.parameter === 'pm25') {
              pm25 = measurement.value;
            }
            if (measurement.parameter === 'pm10') {
              pm10 = measurement.value;
            }
          }
        }
      }
    }
    
    // Make sure weather data exists
    const weather = data.weather || {
      temperature: 25,
      humidity: 60,
      conditions: "Unknown"
    };
    
    // Calculate risk level
    const riskLevel = calculateRiskLevel ? 
      calculateRiskLevel(pm25, pm10, weather.temperature) :
      "Moderate"; // Fallback if function not available
    
    // Format response for frontend
    const response = {
      location: data.location || "Unknown location",
      timestamp: data.timestamp || new Date().toISOString(),
      coordinates: data.coordinates || { latitude: lat, longitude: lon },
      temperature: weather.temperature,
      feels_like: weather.feels_like || weather.temperature,
      humidity: weather.humidity || 60,
      wind_speed: weather.wind_speed || 5,
      wind_direction: weather.wind_direction || 0,
      pressure: weather.pressure || 1013,
      uv_index: weather.uv_index || 5,
      pm25: pm25,
      pm10: pm10,
      conditions: weather.conditions || "Unknown",
      icon: weather.icon || "01d", // Default to clear sky if no icon
      riskLevel: riskLevel,
      hourlyForecast: data.hourly || [],
      dailyForecast: data.daily || []
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching location-specific environmental data:', err);
    // Return a fallback response with error message
    res.status(500).json({
      error: err.message,
      location: "Error fetching data",
      timestamp: new Date().toISOString(),
      coordinates: { 
        latitude: parseFloat(req.query.lat) || 40.7128, 
        longitude: parseFloat(req.query.lon) || -74.0060 
      },
      temperature: 25,
      humidity: 60,
      pm25: 10,
      pm10: 20,
      conditions: "Data unavailable",
      riskLevel: "Moderate"
    });
  }
});

// Add this near your other route handlers
app.get('/', (req, res) => {
  res.json({
    message: 'AirSense API is running',
    version: '1.0.0',
  endpoints: [
      '/datasets',
      '/datasets/:id',
      '/api/environmental/current',
      '/api/environmental/location',
      '/api/environmental/history',
      '/api/locations/search',
      '/api/environmental/analyze-location',
      '/api/query',
      '/api/fetch-environmental-data',
      '/api/analyze-environmental-data',
      '/upload-dataset'
    ]
  });
});

// Natural language query endpoint using Gemini AI
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid query',
        message: 'Please provide a valid query string'
      });
    }
    
    // Import the processNaturalLanguageQuery function
    const { processNaturalLanguageQuery } = require('./gemini-service');
    
    // Get recent data for context
    let recentData = [];
    let datasets = [];
    
    if (usingFileStorage) {
      // Get datasets from file
      if (fs.existsSync(datasetsPath)) {
        try {
          datasets = JSON.parse(fs.readFileSync(datasetsPath, 'utf8'));
        } catch (err) {
          console.error('Error reading datasets file:', err);
        }
      }
      
      // Get recent environmental analysis
      const analysisPath = path.join(dataDir, 'analysis_results.json');
      if (fs.existsSync(analysisPath)) {
        try {
          const allResults = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
          recentData = allResults
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
        } catch (err) {
          console.error('Error reading analysis results:', err);
        }
      }
    } else {
      try {
        await connectToMongo();
        
        // Get the most recent datasets
        datasets = await db.collection(collectionName)
          .find({})
          .limit(10)
          .toArray();
          
        // Get recent analysis results
        recentData = await db.collection('analysis_results')
          .find({})
          .sort({ timestamp: -1 })
          .limit(5)
          .toArray();
      } catch (err) {
        console.error('Error fetching context data from MongoDB:', err);
      }
    }
    
    const contextData = {
      datasets: datasets.map(d => ({ 
        name: d.name || 'Unnamed dataset',
        id: d.id || d._id?.toString(),
        description: d.description || '',
        tags: d.tags || []
      })),
      recentReadings: recentData.map(r => ({
        location: r.location,
        pm25: r.pm25,
        pm10: r.pm10,
        temperature: r.temperature,
        timestamp: r.timestamp
      }))
    };
    
    // Process the query using Gemini
    const result = await processNaturalLanguageQuery(query, contextData);
    
    res.json({
      query: result.query,
      response: result.response,
      timestamp: result.timestamp,
      source: result.source
    });
  } catch (err) {
    console.error('Error processing natural language query:', err);
    res.status(500).json({ 
      error: err.message,
      suggestion: 'Try a different query or check if the AI service is available.'
    });
  }
});

// Location search endpoint using OpenWeather API
app.get('/api/locations/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid query',
        message: 'Please provide a valid location search query'
      });
    }
    
    // Get the searchLocations function from data-ingestion
    const { searchLocations } = require('./data-ingestion');
    
    // Search for locations
    const locations = await searchLocations(query);
    
    res.json({
      query,
      results: locations
    });
  } catch (err) {
    console.error('Error searching for locations:', err);
    res.status(500).json({ 
      error: err.message,
      suggestion: 'Try a different search query or check if the weather API is available.'
    });
  }
});

// AI-powered location environmental analysis endpoint
app.post('/api/environmental/analyze-location', async (req, res) => {
  try {
    const { location, coordinates } = req.body;
    
    if (!location && !coordinates) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Please provide either a location name or coordinates'
      });
    }
    
    // Import the required functions
    const { fetchEnvironmentalData } = require('./data-ingestion');
    const { analyzeLocationWithGemini } = require('./gemini-service');
    
    let environmentalData = null;
    let locationName = location;
    
    // If coordinates are provided, fetch real environmental data
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      try {
        const lat = parseFloat(coordinates.latitude);
        const lon = parseFloat(coordinates.longitude);
        
        // Fetch real-time environmental data for this location
        const data = await fetchEnvironmentalData(lat, lon);
        
        // Format the environmental data for analysis
        environmentalData = {
          location: data.location,
          coordinates: data.coordinates,
          temperature: data.weather?.temperature || null,
          humidity: data.weather?.humidity || null,
          wind_speed: data.weather?.wind_speed || null,
          pm25: data.aqData?.[0]?.measurements?.find(m => m.parameter === 'pm25')?.value || null,
          pm10: data.aqData?.[0]?.measurements?.find(m => m.parameter === 'pm10')?.value || null,
          conditions: data.weather?.conditions || null
        };
        
        // If no location name was provided but we got it from the data, use that
        if (!locationName && data.location) {
          locationName = data.location;
        }
      } catch (fetchError) {
        console.error('Error fetching environmental data:', fetchError);
        // Continue without real data
      }
    }
    
    // If we still don't have a location name, use a placeholder
    if (!locationName) {
      locationName = coordinates ? 
        `Location at ${coordinates.latitude}, ${coordinates.longitude}` : 
        'Unspecified location';
    }
      // Perform Gemini analysis
    try {
      const analysis = await analyzeLocationWithGemini(locationName, environmentalData);
      
      res.json({
        location: locationName,
        coordinates: coordinates || null,
        timestamp: new Date().toISOString(),
        analysis: analysis.analysis,
        source: analysis.source,
        hasRealData: analysis.hasRealData,
        environmentalData: environmentalData
      });
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      
      // Provide a fallback analysis when AI service fails
      let fallbackAnalysis = 'Unable to generate AI analysis due to service limitations. ';
      
      if (environmentalData) {
        fallbackAnalysis += `\n\nEnvironmental data for ${locationName}:\n`;
        fallbackAnalysis += `Temperature: ${environmentalData.temperature}°C\n`;
        fallbackAnalysis += `Humidity: ${environmentalData.humidity}%\n`;
        if (environmentalData.wind_speed) fallbackAnalysis += `Wind Speed: ${environmentalData.wind_speed} m/s\n`;
        if (environmentalData.pm25) fallbackAnalysis += `PM2.5: ${environmentalData.pm25} μg/m³\n`;
        if (environmentalData.pm10) fallbackAnalysis += `PM10: ${environmentalData.pm10} μg/m³\n`;
        if (environmentalData.conditions) fallbackAnalysis += `Conditions: ${environmentalData.conditions}\n`;
        
        fallbackAnalysis += '\nFor environmental analysis, please try again later when the AI service is available.';
      } else {
        fallbackAnalysis += `\n\nNo environmental data is available for ${locationName}. Please try another location or check back later.`;
      }
      
      // Return the data we have with a fallback analysis
      res.json({
        location: locationName,
        coordinates: coordinates || null,
        timestamp: new Date().toISOString(),
        analysis: fallbackAnalysis,
        source: 'System Fallback (AI Unavailable)',
        hasRealData: !!environmentalData,
        environmentalData: environmentalData,
        aiError: aiError.message
      });
    }
  } catch (err) {
    console.error('Error analyzing location:', err);
    res.status(500).json({ 
      error: err.message,
      suggestion: 'Try a different location or check if the service is available.'
    });
  }
});

// Start the server
startServer();