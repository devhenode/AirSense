const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const { fetchEnvironmentalData } = require('./data-ingestion');
const { analyzeEnvironmentalData } = require('./ai-analysis');
const { textSearch, findSimilarPatterns } = require('./search-service');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI || 'YOUR_MONGODB_CONNECTION_STRING';
const dbName = process.env.MONGODB_DB || 'yourDatabaseName';
const collectionName = process.env.MONGODB_COLLECTION || 'yourCollectionName';

let client;
let db;

async function connectToMongo() {
  if (!client || !client.topology || !client.topology.isConnected()) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
}

app.get('/datasets', async (req, res) => {
  try {
    await connectToMongo();
    const datasets = await db.collection(collectionName).find({}).toArray();
    res.json(datasets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/datasets/:id', async (req, res) => {
  try {
    await connectToMongo();
    const dataset = await db.collection(collectionName).findOne({ _id: new ObjectId(req.params.id) });
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(dataset);
  } catch (err) {
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
    await connectToMongo();
    const latestData = await db.collection('analysis_results')
      .find({})
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (latestData.length === 0) {
      return res.status(404).json({ error: 'No environmental data found' });
    }

    res.json(latestData[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/environmental/history', async (req, res) => {
  try {
    await connectToMongo();
    const days = parseInt(req.query.days) || 7;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const historyData = await db.collection('analysis_results')
      .find({ timestamp: { $gte: cutoffDate } })
      .sort({ timestamp: 1 })
      .toArray();

    res.json(historyData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/anomalies', async (req, res) => {
  try {
    await connectToMongo();
    const anomalies = await db.collection('anomaly_detection')
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    res.json(anomalies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search endpoints
app.get('/api/search', async (req, res) => {
  try {
    const { query, ...filters } = req.query;
    const results = await textSearch(query, filters);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/similar-patterns', async (req, res) => {
  try {
    const { pm25, pm10, temperature } = req.query;
    const results = await findSimilarPatterns(
      parseFloat(pm25), 
      parseFloat(pm10), 
      parseFloat(temperature)
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));