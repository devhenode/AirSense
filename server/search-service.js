// server/search-service.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function textSearch(query, filters = {}) {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    const searchQuery = {
      $search: {
        index: "environmental_text_index",
        text: {
          query: query,
          path: ["location", "description"]
        }
      }
    };
    
    if (Object.keys(filters).length > 0) {
      searchQuery.$search.filter = {
        compound: {
          must: Object.entries(filters).map(([key, value]) => ({
            equals: { path: key, value }
          }))
        }
      };
    }
    
    const results = await db.collection('analysis_results')
      .aggregate([searchQuery, { $limit: 20 }])
      .toArray();
      
    await client.close();
    return results;
  } catch (error) {
    console.error('Error performing text search:', error);
    throw error;
  }
}

async function findSimilarPatterns(pm25, pm10, temperature) {
  try {
    // Create a simple embedding (for production, use a proper embedding model)
    const simpleVector = [
      pm25 / 100,  // Normalize to 0-1 range
      pm10 / 200,  // Normalize to 0-1 range
      (temperature + 20) / 60  // Normalize from -20 to 40 range to 0-1
    ];
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    const results = await db.collection('analysis_results')
      .aggregate([
        {
          $vectorSearch: {
            index: "environmental_vector_index",
            path: "environmentalVector",
            queryVector: simpleVector,
            numCandidates: 100,
            limit: 10
          }
        }
      ])
      .toArray();
    
    await client.close();
    return results;
  } catch (error) {
    console.error('Error finding similar patterns:', error);
    throw error;
  }
}

// Function to generate vector embeddings for environmental data
async function generateEmbeddings(data) {
  // Simple vector embedding generation
  // In a production app, you'd use a proper embedding model
  return [
    data.pm25 / 100,
    data.pm10 / 200,
    (data.temperature + 20) / 60
  ];
}

module.exports = { textSearch, findSimilarPatterns, generateEmbeddings };
